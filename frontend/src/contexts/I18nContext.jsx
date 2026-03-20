import { createContext, useContext, useState } from 'react';

const I18nContext = createContext(null);

const translations = {
  en: {
    hero_title: 'Protect Your Daily Income',
    hero_sub: 'Parametric income protection for gig riders. Starting at ₹49/week.',
    activate_cover: 'Activate Weekly Cover',
    active_policy: 'Active Policy',
    earnings_protected: 'Earnings Protected',
    claims_history: 'Claims History',
    risk_insights: 'Risk Insights',
    renew: 'Renew',
    days_left: 'Days Left',
    claim_processed: 'Claim Processed',
    premium_breakdown: 'Premium Breakdown',
    admin_dashboard: 'Admin Dashboard',
    fraud_alerts: 'Fraud Alerts',
  },
  hi: {
    hero_title: 'रोज़ की कमाई सुरक्षित करें',
    hero_sub: 'गिग राइडर्स के लिए पैरामेट्रिक इनकम प्रोटेक्शन। ₹49/सप्ताह से शुरू।',
    activate_cover: 'साप्ताहिक बीमा सक्रिय करें',
    active_policy: 'सक्रिय पॉलिसी',
    earnings_protected: 'सुरक्षित कमाई',
    claims_history: 'दावा इतिहास',
    risk_insights: 'जोखिम जानकारी',
    renew: 'नवीनीकरण',
    days_left: 'दिन शेष',
    claim_processed: 'दावा पूर्ण हुआ',
    premium_breakdown: 'प्रीमियम विवरण',
    admin_dashboard: 'एडमिन डैशबोर्ड',
    fraud_alerts: 'धोखाधड़ी अलर्ट',
  },
};

export function I18nProvider({ children }) {
  const [lang, setLang] = useState('en');
  const t = (key) => translations[lang]?.[key] || translations.en[key] || key;
  const toggleLang = () => setLang(l => l === 'en' ? 'hi' : 'en');

  return (
    <I18nContext.Provider value={{ lang, t, toggleLang }}>
      {children}
    </I18nContext.Provider>
  );
}

export const useI18n = () => useContext(I18nContext);
