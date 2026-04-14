const store = require('../mocks/store');

/**
 * Payout Engine
 * Simulates integration with Razorpay Payouts / Stripe Connect
 */
function initiatePayout(claim, io) {
  // 1. Initial State: Processing
  claim.payout_status = 'processing';
  claim.tx_id = 'pout_' + Math.random().toString(36).substring(2, 12).toLowerCase();
  claim.payout_method = 'IMPS';

  console.log(`[PayoutEngine] Payout initiated for Claim ${claim.id} (TX: ${claim.tx_id})`);

  // Update claim in store
  const idx = store.claims.findIndex(c => c.id === claim.id);
  if (idx !== -1) {
    store.claims[idx] = claim;
  }

  // 2. Simulate bank processing delay (2 seconds)
  setTimeout(() => {
    claim.payout_status = 'paid';
    claim.utr_number = 'UTR' + Math.floor(Math.random() * 90000000000 + 10000000000);
    claim.payout_time = new Date().toISOString();

    // Generate simulated bank receipt
    const receipt = {
      payout_id: claim.tx_id,
      claim_id: claim.id,
      user_id: claim.user_id,
      amount: claim.lost_income_amount,
      utr: claim.utr_number,
      method: claim.payout_method,
      bank_account: 'XXXX-XXXX-XXXX-4092',
      timestamp: claim.payout_time,
      status: 'success'
    };
    
    // Store receipt (initialize array if doesn't exist)
    if (!store.payouts) store.payouts = [];
    store.payouts.push(receipt);

    // Update claim locally again
    if (idx !== -1) {
      store.claims[idx] = claim;
    }

    console.log(`[PayoutEngine] Payout successful for Claim ${claim.id} (UTR: ${claim.utr_number})`);

    // 3. Emit success event to frontend
    if (io) {
      io.emit('payout_credited', { claim, receipt });
    }
  }, 2000);
}

module.exports = { initiatePayout };
