const http = require('http');
const app = require('./app');
const { Server } = require('socket.io');
const { startTriggerEngine } = require('./services/triggerEngine');

const PORT = process.env.PORT || 4000;

// Create HTTP server and attach Socket.IO
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*', methods: ['GET', 'POST'] },
});

// Make io accessible to routes via app
app.set('io', io);

// Socket.IO connection handler
io.on('connection', (socket) => {
  console.log(`[Socket.IO] Client connected: ${socket.id}`);
  socket.on('disconnect', () => {
    console.log(`[Socket.IO] Client disconnected: ${socket.id}`);
  });
});

// Start the automated trigger engine
startTriggerEngine(io);

server.listen(PORT, () => {
  console.log(`\n🛡️  GigSecure Backend running on http://localhost:${PORT}`);
  console.log(`   Socket.IO ready for real-time push`);
  console.log('   Press Ctrl+C to stop\n');
});
