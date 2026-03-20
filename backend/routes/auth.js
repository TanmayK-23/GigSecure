const router = require('express').Router();
const store = require('../mocks/store');

// POST /api/auth/register
router.post('/register', (req, res) => {
  const { phone, otp } = req.body;
  if (!phone) return res.status(400).json({ error: 'Phone required' });
  // Mock OTP: always accept '123456'
  if (otp && otp !== '123456') return res.status(401).json({ error: 'Invalid OTP' });

  let user = store.users.find(u => u.phone === phone);
  if (!user) {
    user = {
      id: 'usr_' + Date.now(), phone,
      name: '', vehicle_type: '', avg_daily_earnings: 0,
      risk_score: 50, zone: '', created_at: new Date().toISOString(),
    };
    store.users.push(user);
  }

  const token = Buffer.from(JSON.stringify({ id: user.id, phone, iat: Date.now() })).toString('base64');
  res.json({ token, user });
});

module.exports = router;
