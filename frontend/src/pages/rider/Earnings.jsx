import { useEffect, useRef } from 'react';
import {
  Chart as ChartJS,
  CategoryScale, LinearScale, BarElement, LineElement,
  PointElement, Title, Tooltip, Legend, Filler
} from 'chart.js';
import { Bar, Line } from 'react-chartjs-2';
import { useI18n } from '../../contexts/I18nContext';
import { usePolicy } from '../../contexts/PolicyContext';
import { MOCK_EARNINGS_CHART } from '../../utils/mockData';

ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, Title, Tooltip, Legend, Filler);

const chartDefaults = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { labels: { color: '#94A3B8', font: { size: 12 } } } },
  scales: {
    x: { ticks: { color: '#94A3B8' }, grid: { color: 'rgba(255,255,255,.05)' } },
    y: { ticks: { color: '#94A3B8' }, grid: { color: 'rgba(255,255,255,.05)' } },
  },
};

export default function Earnings() {
  const { t } = useI18n();
  const { claims } = usePolicy();

  // Build chart from actual claims
  const weeks = ['Week 1', 'Week 2', 'Week 3', 'Week 4', 'Week 5', 'Week 6'];
  const payouts = MOCK_EARNINGS_CHART.payouts;
  const premiums = MOCK_EARNINGS_CHART.premiums;
  const totalProtected = payouts.reduce((s, v) => s + v, 0);
  const totalPremiums = premiums.reduce((s, v) => s + v, 0);
  const roiPercent = Math.round(((totalProtected - totalPremiums) / totalPremiums) * 100);

  const earningsData = {
    labels: weeks,
    datasets: [
      {
        label: '₹ Payouts Received',
        data: payouts,
        backgroundColor: 'rgba(16, 185, 129, 0.7)',
        borderRadius: 6,
      },
      {
        label: '₹ Premiums Paid',
        data: premiums,
        backgroundColor: 'rgba(108, 71, 255, 0.5)',
        borderRadius: 6,
      },
    ],
  };

  const weeklyRisk = {
    labels: weeks,
    datasets: [{
      label: 'Risk Score',
      data: [55, 60, 48, 72, 65, 62],
      borderColor: '#F59E0B',
      backgroundColor: 'rgba(245,158,11,.1)',
      fill: true,
      tension: 0.4,
      pointBackgroundColor: '#F59E0B',
    }],
  };

  return (
    <div className="page-content">
      <h2 className="mb-2">{t('earnings_protected')}</h2>
      <p className="text-muted mb-6" style={{ fontSize: '0.875rem' }}>Your income protection performance over the last 6 weeks.</p>

      {/* Summary Stats */}
      <div className="grid grid-3 mb-6" style={{ gap: 12 }}>
        {[
          { label: 'Total Protected', value: `₹${totalProtected.toLocaleString('en-IN')}`, color: 'var(--success-light)', emoji: '✅' },
          { label: 'Premiums Paid', value: `₹${totalPremiums.toLocaleString('en-IN')}`, color: 'var(--primary-light)', emoji: '💳' },
          { label: 'Net ROI', value: `${roiPercent > 0 ? '+' : ''}${roiPercent}%`, color: roiPercent >= 0 ? 'var(--success-light)' : 'var(--danger-light)', emoji: roiPercent >= 0 ? '📈' : '📉' },
        ].map(({ label, value, color, emoji }) => (
          <div key={label} className="stat-card text-center">
            <div style={{ fontSize: 24, marginBottom: 6 }}>{emoji}</div>
            <div className="stat-value" style={{ color, fontSize: '1.4rem' }}>{value}</div>
            <div className="stat-label">{label}</div>
          </div>
        ))}
      </div>

      {/* Earnings Chart */}
      <div className="card mb-6">
        <h4 className="mb-4">Payouts vs Premiums</h4>
        <div style={{ height: 250 }}>
          <Bar data={earningsData} options={{
            ...chartDefaults,
            plugins: {
              ...chartDefaults.plugins,
              tooltip: {
                callbacks: {
                  label: ctx => `₹${ctx.raw}`,
                }
              }
            }
          }} />
        </div>
      </div>

      {/* Risk Score Trend */}
      <div className="card mb-6">
        <h4 className="mb-4">Weekly Risk Score Trend</h4>
        <div style={{ height: 200 }}>
          <Line data={weeklyRisk} options={chartDefaults} />
        </div>
      </div>

      {/* Risk Insight Card */}
      <div className="card" style={{ background: 'rgba(245,158,11,.06)', borderColor: 'rgba(245,158,11,.2)' }}>
        <h4 className="mb-3">💡 {t('risk_insights')}</h4>
        <div className="flex flex-col gap-3">
          {[
            { icon: '🌧️', text: 'Andheri West had 2 high-rain events this month — your premium is well justified.' },
            { icon: '⚡', text: 'Your peak-hour booster saved you ₹246 on Tuesday\'s rain event.' },
            { icon: '📊', text: 'You\'re in the top 15% of protected riders in your zone.' },
          ].map(({ icon, text }, i) => (
            <div key={i} className="flex gap-3 items-start">
              <span style={{ fontSize: 18, flexShrink: 0 }}>{icon}</span>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>{text}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
