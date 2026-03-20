import { useState } from 'react';
import { Search, Filter } from 'lucide-react';
import { usePolicy } from '../../contexts/PolicyContext';
import { useI18n } from '../../contexts/I18nContext';
import { TRIGGER_ICONS } from '../../utils/mockData';

const STATUS_FILTERS = ['all', 'paid', 'suspicious', 'auto_rejected'];
const TYPE_FILTERS = ['all', 'heavy_rain', 'platform_outage', 'curfew'];

export default function Claims() {
  const { claims } = usePolicy();
  const { t } = useI18n();
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');

  const filtered = claims.filter(c =>
    (statusFilter === 'all' || c.payout_status === statusFilter) &&
    (typeFilter === 'all' || c.trigger_type === typeFilter)
  );

  const totalPaid = claims.filter(c => c.payout_status === 'paid').reduce((s, c) => s + c.lost_income_amount, 0);

  return (
    <div className="page-content">
      <h2 className="mb-2">{t('claims_history')}</h2>
      <p className="text-muted mb-6" style={{ fontSize: '0.875rem' }}>
        All claim events are auto-triggered — no user action required.
      </p>

      {/* Summary banner */}
      <div className="card mb-6" style={{ background: 'linear-gradient(135deg,rgba(108,71,255,.1),rgba(16,185,129,.08))', borderColor: 'rgba(108,71,255,.2)' }}>
        <div className="flex justify-between" style={{ flexWrap: 'wrap', gap: 16 }}>
          <div>
            <div className="text-muted text-sm mb-1">Total Income Protected</div>
            <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--success-light)' }}>₹{totalPaid.toLocaleString('en-IN')}</div>
          </div>
          <div>
            <div className="text-muted text-sm mb-1">Claims Processed</div>
            <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--primary-light)' }}>
              {claims.filter(c => c.payout_status === 'paid').length}
            </div>
          </div>
          <div>
            <div className="text-muted text-sm mb-1">Avg Processing</div>
            <div style={{ fontSize: '2rem', fontWeight: 800 }}>2 min</div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-4" style={{ flexWrap: 'wrap' }}>
        <div className="flex gap-1" style={{ flexWrap: 'wrap' }}>
          {STATUS_FILTERS.map(f => (
            <button
              key={f}
              className={`btn btn-sm ${statusFilter === f ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => setStatusFilter(f)}
              style={{ fontSize: '0.75rem', padding: '6px 12px' }}
            >
              {f.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>
      <div className="flex gap-1 mb-6" style={{ flexWrap: 'wrap' }}>
        {TYPE_FILTERS.map(f => (
          <button
            key={f}
            className={`btn btn-sm ${typeFilter === f ? 'btn-secondary' : 'btn-ghost'}`}
            onClick={() => setTypeFilter(f)}
            style={{ fontSize: '0.72rem', padding: '5px 10px' }}
          >
            {f === 'all' ? 'All Types' : f.replace('_', ' ')}
          </button>
        ))}
      </div>

      {/* Claim list */}
      <div className="flex flex-col gap-3">
        {filtered.length === 0 && (
          <div className="text-center" style={{ padding: '48px 0', color: 'var(--text-muted)' }}>
            No claims match the filters
          </div>
        )}
        {filtered.map(claim => (
          <div key={claim.id} className="card" style={{ padding: 20 }}>
            <div className="flex items-center gap-3">
              <div className="claim-icon" style={{
                background: claim.fraud_flag ? 'var(--danger-bg)' : 'var(--success-bg)',
                width: 48, height: 48, borderRadius: 12,
              }}>
                <span style={{ fontSize: 22 }}>{TRIGGER_ICONS[claim.trigger_type]}</span>
              </div>

              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, marginBottom: 2 }}>{claim.reason}</div>
                <div className="flex gap-2 flex-wrap" style={{ alignItems: 'center', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                  <span>{new Date(claim.trigger_time).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                  <span>·</span>
                  <span>{claim.zone}</span>
                  <span>·</span>
                  <span>{claim.trigger_duration}</span>
                </div>
              </div>

              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <div style={{
                  fontWeight: 800,
                  fontSize: '1.1rem',
                  color: claim.fraud_flag ? 'var(--danger-light)' : 'var(--success-light)',
                  marginBottom: 4
                }}>
                  {claim.fraud_flag ? 'Flagged' : `+₹${claim.lost_income_amount}`}
                </div>
                <span className={`badge text-xs ${
                  claim.payout_status === 'paid' ? 'badge-success' :
                  claim.payout_status === 'suspicious' ? 'badge-warning' : 'badge-muted'
                }`}>
                  {claim.payout_status}
                </span>
              </div>
            </div>

            {claim.tx_id && (
              <div style={{ marginTop: 10, paddingTop: 10, borderTop: '1px solid var(--border)', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Transaction ID: <span style={{ color: 'var(--primary-light)', fontFamily: 'monospace' }}>{claim.tx_id}</span>
              </div>
            )}
            {claim.fraud_flag && (
              <div style={{ marginTop: 10, paddingTop: 10, borderTop: '1px solid var(--border)', fontSize: '0.8rem', color: 'var(--danger-light)', background: 'var(--danger-bg)', borderRadius: 8, padding: '8px 12px', marginTop: 10 }}>
                ⚠️ This claim is under review by our fraud detection system.
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
