import { createContext, useContext, useReducer, useEffect, useCallback, useRef } from 'react';
import { io } from 'socket.io-client';
import { MOCK_POLICY, MOCK_CLAIMS } from '../utils/mockData';

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
  liveToast: null, // For real-time claim animation
};

function policyReducer(state, action) {
  switch (action.type) {
    case 'SET_POLICY':
      return { ...state, active: action.payload };
    case 'ADD_CLAIM':
      return { ...state, claims: [action.payload, ...state.claims] };
    case 'TRIGGER_STARTED':
      return { ...state, triggerInProgress: action.payload };
    case 'TRIGGER_RESOLVED':
      return { ...state, triggerInProgress: null };
    case 'ADD_NOTIFICATION':
      return {
        ...state,
        notifications: [{ ...action.payload, read: false, id: Date.now() }, ...state.notifications],
      };
    case 'MARK_READ':
      return {
        ...state,
        notifications: state.notifications.map(n => ({ ...n, read: true })),
      };
    case 'SHOW_TOAST':
      return { ...state, liveToast: action.payload };
    case 'HIDE_TOAST':
      return { ...state, liveToast: null };
    default:
      return state;
  }
}

export function PolicyProvider({ children }) {
  const [state, dispatch] = useReducer(policyReducer, initialState);
  const socketRef = useRef(null);

  // Initialize Socket.IO connection
  useEffect(() => {
    const socket = io(BACKEND_URL, {
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 5,
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('[Socket.IO] Connected to backend');
    });

    // Listen for real-time claims from trigger engine
    socket.on('new_claim', (claim) => {
      console.log('[Socket.IO] New claim received:', claim);
      dispatch({ type: 'ADD_CLAIM', payload: claim });
      dispatch({
        type: 'ADD_NOTIFICATION',
        payload: { text: `Claim ₹${claim.lost_income_amount} auto-processed – ${claim.reason || claim.trigger_type}` },
      });
      // Show toast animation
      dispatch({ type: 'SHOW_TOAST', payload: claim });
      setTimeout(() => dispatch({ type: 'HIDE_TOAST' }), 5000);
    });

    socket.on('trigger_alert', ({ trigger }) => {
      console.log('[Socket.IO] Trigger alert:', trigger);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const purchasePolicy = useCallback((policyData) => {
    dispatch({ type: 'SET_POLICY', payload: { ...MOCK_POLICY, ...policyData, id: 'POL-' + Date.now() } });
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
        // Claims will arrive via Socket.IO, but add them here too as fallback
        for (const claim of data.claims) {
          dispatch({ type: 'ADD_CLAIM', payload: { ...claim, reason: data.trigger?.reason } });
          dispatch({
            type: 'ADD_NOTIFICATION',
            payload: { text: `Claim ₹${claim.lost_income_amount} processed – ${data.trigger?.reason || type}` },
          });
        }
      }
    } catch (err) {
      console.warn('[simulateTrigger] Backend unreachable, using local fallback');
      // Fallback to local simulation
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
        dispatch({ type: 'ADD_NOTIFICATION', payload: { text: `Claim ₹${t.amount} processed – ${t.reason}` } });
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
