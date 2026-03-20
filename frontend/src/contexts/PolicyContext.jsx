import { createContext, useContext, useReducer, useEffect, useCallback } from 'react';
import { MOCK_POLICY, MOCK_CLAIMS } from '../utils/mockData';

const PolicyContext = createContext(null);

const initialState = {
  active: MOCK_POLICY,
  claims: MOCK_CLAIMS,
  notifications: [
    { id: 1, text: 'Claim ₹246 processed – Heavy Rain', read: false, time: '2h ago' },
    { id: 2, text: 'Policy renewed successfully', read: true, time: '3d ago' },
  ],
  triggerInProgress: null,
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
    default:
      return state;
  }
}

export function PolicyProvider({ children }) {
  const [state, dispatch] = useReducer(policyReducer, initialState);

  const purchasePolicy = useCallback((policyData) => {
    dispatch({ type: 'SET_POLICY', payload: { ...MOCK_POLICY, ...policyData, id: 'POL-' + Date.now() } });
  }, []);

  const simulateTrigger = useCallback((type) => {
    const triggers = {
      heavy_rain: { reason: 'Heavy Rain > 25mm/h', amount: 246, zone: 'Andheri West' },
      platform_outage: { reason: 'Platform Outage Detected', amount: 123, zone: 'Pan-Mumbai' },
      curfew: { reason: 'Zone Curfew Active', amount: 328, zone: 'Kurla' },
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
    dispatch({ type: 'TRIGGER_STARTED', payload: { type, ...t } });
    setTimeout(() => {
      dispatch({ type: 'ADD_CLAIM', payload: claim });
      dispatch({ type: 'TRIGGER_RESOLVED' });
      dispatch({ type: 'ADD_NOTIFICATION', payload: { text: `Claim ₹${t.amount} processed – ${t.reason}` } });
    }, 2000);
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
