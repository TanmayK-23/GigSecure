const router = require('express').Router();
const store = require('../mocks/store');

// GET /api/users/profile
router.get('/profile', (req, res) => {
  const user = store.users[0]; // Demo: return first user
  res.json(user);
});

// PUT /api/users/profile
router.put('/profile', (req, res) => {
  const { name, vehicle_type, avg_daily_earnings, zone } = req.body;
  const user = store.users[0];
  if (name) user.name = name;
  if (vehicle_type) user.vehicle_type = vehicle_type;
  if (avg_daily_earnings) user.avg_daily_earnings = Number(avg_daily_earnings);
  if (zone) user.zone = zone;
  res.json(user);
});

module.exports = router;
