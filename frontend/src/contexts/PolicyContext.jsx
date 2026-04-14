import { createContext, useContext, useReducer, useEffect, useCallback, useRef } from 'react';
import { MOCK_POLICY, MOCK_CLAIMS } from '../utils/mockData';
import { useAuth } from './AuthContext';

const PolicyContext = createContext(null);

const BACKEND_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

const initialState = {
  active: MOCK_POLICY,
  claims: MOCK_CLAIMS,
  notifications: [
    { id: 1, text: 'Claim ₹246 processed – Heavy Rain', read: false, time: '2h ago' },
    { id: 2, text: 'Policy renewed successfully', read: true, time: '3d ago' },
  ],
  triggerInProgress: null,
  liveToast: null,
};

function policyReducer(state, action) {
  switch (action.type) {
    case 'SET_POLICY':
      return { ...state, active: action.payload };
    case 'ADD_CLAIM':
      if (state.claims.some(c => c.id === action.payload.id)) return state;
      return { ...state, claims: [action.payload, ...state.claims] };
    case 'TRIGGER_STARTED':
      return { ...state, triggerInProgress: action.payload };
    case 'TRIGGER_RESOLVED':
      return { ...state, triggerInProgress: null };
    case 'ADD_NOTIFICATION': {
      let isDuplicate = false;
      if (action.payload.claim_id) {
        isDuplicate = state.notifications.some(n => n.claim_id === action.payload.claim_id);
      } else {
        isDuplicate = state.notifications.some(n => n.text === action.payload.text && (Date.now() - n.id) < 10000);
      }
      if (isDuplicate) return state;

      return {
        ...state,
        notifications: [{ ...action.payload, read: false, id: Date.now() }, ...state.notifications],
      };
    }
    case 'MARK_READ':
      return {
        ...state,
        notifications: state.notifications.map(n => ({ ...n, read: true })),
      };
    case 'SHOW_TOAST':
      return { ...state, liveToast: action.payload };
    case 'HIDE_TOAST':
      return { ...state, liveToast: null };
    case 'UPDATE_CLAIM':
      return { ...state, claims: state.claims.map(c => c.id === action.payload.id ? action.payload : c) };
    default:
      return state;
  }
}

export function PolicyProvider({ children }) {
  const { user, isAdmin } = useAuth();
  const userRef = useRef(user);
  const adminRef = useRef(isAdmin);

  useEffect(() => {
    userRef.current = user;
    adminRef.current = isAdmin;
  }, [user, isAdmin]);

  const [state, dispatch] = useReducer(policyReducer, initialState, (initial) => {
    try {
      const saved = localStorage.getItem('gs_policy_state');
      if (saved) {
        const parsed = JSON.parse(saved);
        // Refresh active policy end date if it is outdated, just to ensure good UX
        return parsed;
      }
    } catch (e) {}
    return initial;
  });

  useEffect(() => {
    localStorage.setItem('gs_policy_state', JSON.stringify(state));
  }, [state]);

  const socketRef = useRef(null);

  // Initialize Socket.IO connection via lazy dynamic import
  useEffect(() => {
    let socket = null;

    import('socket.io-client')
      .then(({ io }) => {
        socket = io(BACKEND_URL, {
          transports: ['websocket', 'polling'],
          reconnectionAttempts: 5,
        });
        socketRef.current = socket;

        socket.on('connect', () => {
          console.log('[Socket.IO] Connected to backend');
        });

        const checkRiderZoneMatch = (zoneStr) => {
          if (adminRef.current || !userRef.current) return false;
          const uZone = (userRef.current?.zone?.split('–')[1]?.trim() || 'Andheri West').toLowerCase().replace(' west', '');
          const cZone = (zoneStr || '').toLowerCase();
          return cZone === uZone || cZone.includes(uZone) || uZone.includes(cZone);
        };

        socket.on('new_claim', (claim) => {
          console.log('[Socket.IO] New claim received:', claim);
          dispatch({ type: 'ADD_CLAIM', payload: claim });
          
          if (checkRiderZoneMatch(claim.zone)) {
            if (!claim.fraud_flag && claim.payout_status === 'processing') {
              dispatch({ type: 'SHOW_TOAST', payload: claim });
            } else if (claim.fraud_flag) {
              dispatch({
                type: 'ADD_NOTIFICATION',
                payload: { text: `Claim ₹${claim.lost_income_amount} flagged for review – ${claim.reason}`, claim_id: claim.id },
              });
            }
          }
        });

        socket.on('payout_credited', ({ claim, receipt }) => {
          console.log('[Socket.IO] Payout Credited:', receipt.utr);
          dispatch({ type: 'UPDATE_CLAIM', payload: claim });
          
          if (checkRiderZoneMatch(claim.zone)) {
            dispatch({ type: 'SHOW_TOAST', payload: claim });
            dispatch({
              type: 'ADD_NOTIFICATION',
              payload: { text: `Payout ₹${claim.lost_income_amount} credited (UTR: ${receipt.utr})`, claim_id: claim.id + '_payout' },
            });
            setTimeout(() => dispatch({ type: 'HIDE_TOAST' }), 5000);
          }
        });

        socket.on('claim_rejected', (claim) => {
          console.log('[Socket.IO] Claim rejected:', claim.id);
          dispatch({ type: 'UPDATE_CLAIM', payload: claim });
          
          if (checkRiderZoneMatch(claim.zone)) {
            dispatch({
              type: 'ADD_NOTIFICATION',
              payload: { text: `Claim ₹${claim.lost_income_amount} was rejected after review.`, claim_id: claim.id + '_reject' },
            });
          }
        });

        socket.on('fraud_alert', (claim) => {
          console.log('[Socket.IO] Fraud alert received:', claim);
        });

        socket.on('trigger_alert', ({ trigger }) => {
          console.log('[Socket.IO] Trigger alert:', trigger);
        });
      })
      .catch(() => {
        console.warn('[Socket.IO] socket.io-client not available, running in offline mode');
      });

    return () => {
      if (socket) socket.disconnect();
    };
  }, []);

  const purchasePolicy = useCallback((policyData) => {
    const now = new Date();
    const end = new Date(now.getTime() + 7 * 86400000);
    dispatch({
      type: 'SET_POLICY',
      payload: {
        ...MOCK_POLICY,
        ...policyData,
        id: 'POL-' + Date.now(),
        start_date: now.toISOString().slice(0, 10),
        end_date: end.toISOString().slice(0, 10),
        status: 'active',
      },
    });
  }, []);

  // Route trigger simulation through the backend API
  const simulateTrigger = useCallback(async (type) => {
    dispatch({ type: 'TRIGGER_STARTED', payload: { type } });

    try {
      const res = await fetch(`${BACKEND_URL}/api/triggers/simulate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, zone: 'Andheri West', severity: 'high' }),
      });
      const data = await res.json();
      if (data.triggered && data.claims?.length > 0) {
        for (const claim of data.claims) {
          dispatch({ type: 'ADD_CLAIM', payload: { ...claim, reason: data.trigger?.reason } });
          dispatch({
            type: 'ADD_NOTIFICATION',
            payload: { text: `Claim ₹${claim.lost_income_amount} processed – ${data.trigger?.reason || type}`, claim_id: claim.id },
          });
        }
        dispatch({ type: 'SHOW_TOAST', payload: data.claims[0] });
        setTimeout(() => dispatch({ type: 'HIDE_TOAST' }), 5000);
      } else if (data.message) {
        // Idempotent guard — trigger already processed
        console.log('[Trigger] Already processed:', data.message);
      }
    } catch (err) {
      console.warn('[simulateTrigger] Backend unreachable, using local fallback');
      const triggers = {
        heavy_rain: { reason: 'Heavy Rain > 25mm/h', amount: 246, zone: 'Andheri West' },
        platform_outage: { reason: 'Platform Outage Detected', amount: 123, zone: 'Pan-Mumbai' },
        curfew: { reason: 'Zone Curfew Active', amount: 328, zone: 'Kurla' },
        extreme_heat: { reason: 'Extreme Heat (44°C)', amount: 180, zone: 'Pan-Mumbai' },
        flood_alert: { reason: 'Flood Alert: 55cm water', amount: 290, zone: 'Dharavi' },
      };
      const t = triggers[type] || triggers.heavy_rain;
      const claim = {
        id: 'CLM-' + Date.now(),
        trigger_type: type,
        trigger_time: new Date().toISOString(),
        lost_income_amount: t.amount,
        payout_status: 'paid',
        fraud_flag: false,
        reason: t.reason,
        zone: t.zone,
        trigger_duration: '2 hrs',
        tx_id: 'pay_TX' + Math.random().toString(36).substring(2, 10).toUpperCase(),
      };
      setTimeout(() => {
        dispatch({ type: 'ADD_CLAIM', payload: claim });
        dispatch({ type: 'ADD_NOTIFICATION', payload: { text: `Claim ₹${t.amount} processed – ${t.reason}`, claim_id: claim.id } });
        dispatch({ type: 'SHOW_TOAST', payload: claim });
        setTimeout(() => dispatch({ type: 'HIDE_TOAST' }), 5000);
      }, 2000);
    } finally {
      setTimeout(() => dispatch({ type: 'TRIGGER_RESOLVED' }), 2500);
    }
  }, []);

  const unreadCount = state.notifications.filter(n => !n.read).length;

  return (
    <PolicyContext.Provider value={{ ...state, unreadCount, purchasePolicy, simulateTrigger, dispatch }}>
      {children}
    </PolicyContext.Provider>
  );
}

export const usePolicy = () => {
  const ctx = useContext(PolicyContext);
  if (!ctx) throw new Error('usePolicy must be used inside PolicyProvider');
  return ctx;
};
