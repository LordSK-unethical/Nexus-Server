const express = require('express');
const { createServer } = require('http');
const { Server } = require('socket.io');

const { registerSocketHandlers } = require('./src/socket/connection');
const { registerOrderHandlers } = require('./src/socket/handlers/orderHandlers');
const { registerTableHandlers } = require('./src/socket/handlers/tableHandlers');
const { registerSyncHandlers, registerNotificationHandlers } = require('./src/socket/handlers/syncHandlers');

const PORT = process.env.PORT || 3000;

const app = express();

app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

app.get('/api/status', (req, res) => {
  res.json({
    server: 'Restaurant Real-Time Server',
    version: '1.0.0',
    status: 'running',
    timestamp: new Date().toISOString()
  });
});

const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  },
  pingTimeout: 60000,
  pingInterval: 25000
});

io.on('connection', (socket) => {
  console.log(`[Server] Client connected: ${socket.id}`);

  socket.on('error', (error) => {
    console.error(`[Server] Socket error for ${socket.id}:`, error);
  });
});

registerSocketHandlers(io);
registerOrderHandlers(io);
registerTableHandlers(io);
registerSyncHandlers(io);
registerNotificationHandlers(io);

io.on('error', (error) => {
  console.error('[Server] IO error:', error);
});

process.on('uncaughtException', (error) => {
  console.error('[Server] Uncaught exception:', error);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('[Server] Unhandled rejection at:', promise, 'reason:', reason);
});

httpServer.listen(PORT, () => {
  console.log('========================================');
  console.log('  Restaurant Real-Time Server Started');
  console.log('========================================');
  console.log(`  Port: ${PORT}`);
  console.log(`  Health: http://localhost:${PORT}/health`);
  console.log(`  Socket.IO: ws://localhost:${PORT}`);
  console.log('========================================');
  console.log('\nAvailable roles:');
  console.log('  - waiters');
  console.log('  - kitchen');
  console.log('  - cashier');
  console.log('\nEvents:');
  console.log('  - newOrder, updateOrderStatus, cancelOrder');
  console.log('  - tableUpdate, requestTableData');
  console.log('  - syncData, notification');
  console.log('========================================\n');
});

module.exports = { app, io, httpServer };
