const app = require('./app');

const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
  console.log(`\n🛡️  GigSecure Backend running on http://localhost:${PORT}`);
  console.log('   Press Ctrl+C to stop\n');
});
