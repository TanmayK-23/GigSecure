import { createContext, useContext, useReducer, useEffect } from 'react';
import { MOCK_USER } from '../utils/mockData';

const AuthContext = createContext(null);

const initialState = {
  user: null,
  token: null,
  isAuthenticated: false,
  isAdmin: false,
};

function authReducer(state, action) {
  switch (action.type) {
    case 'LOGIN':
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token,
        isAuthenticated: true,
        isAdmin: action.payload.isAdmin || false,
      };
    case 'UPDATE_USER':
      return { ...state, user: { ...state.user, ...action.payload } };
    case 'LOGOUT':
      return initialState;
    default:
      return state;
  }
}

export function AuthProvider({ children }) {
  const [state, dispatch] = useReducer(authReducer, initialState, () => {
    const saved = sessionStorage.getItem('gs_auth');
    if (saved) {
      try { return JSON.parse(saved); }
      catch { return initialState; }
    }
    return initialState;
  });

  useEffect(() => {
    sessionStorage.setItem('gs_auth', JSON.stringify(state));
  }, [state]);

  const login = (phone, isAdmin = false) => {
    const user = isAdmin
      ? { id: 'admin_001', name: 'Admin', phone, role: 'admin' }
      : { ...MOCK_USER, phone };
    dispatch({
      type: 'LOGIN',
      payload: { user, token: 'mock_jwt_' + Date.now(), isAdmin },
    });
  };

  const updateUser = (data) => dispatch({ type: 'UPDATE_USER', payload: data });
  const logout = () => { sessionStorage.removeItem('gs_auth'); dispatch({ type: 'LOGOUT' }); };

  return (
    <AuthContext.Provider value={{ ...state, login, updateUser, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
};
