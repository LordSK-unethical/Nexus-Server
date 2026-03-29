const store = require('../../store');

const registerSyncHandlers = (io) => {
  
  io.on('connection', (socket) => {
    
    socket.on('syncData', (data, callback) => {
      try {
        const orders = store.getAllOrders();
        const tables = store.getAllTables();

        console.log(`[Sync] Data sync requested by ${socket.id}: ${orders.length} orders, ${tables.length} tables`);

        const response = {
          success: true,
          data: {
            orders,
            tables,
            serverInfo: {
              version: '1.0.0',
              timestamp: new Date().toISOString()
            }
          }
        };

        if (callback) {
          callback(response);
        } else {
          socket.emit('syncResponse', response);
        }

        socket.emit('syncComplete', {
          message: 'Data sync completed',
          timestamp: new Date().toISOString()
        });

      } catch (error) {
        console.error('[Sync] Error syncing data:', error);
        const response = { success: false, error: 'Failed to sync data' };
        if (callback) callback(response);
        socket.emit('error', { code: 'SYNC_ERROR', message: 'Failed to sync data' });
      }
    });

  });

  console.log('[Sync] Sync handlers registered');
};

const registerNotificationHandlers = (io) => {
  
  io.on('connection', (socket) => {
    
    socket.on('notification', (data, callback) => {
      try {
        if (!data || !data.message) {
          const response = { success: false, error: 'message is required' };
          if (callback) callback(response);
          return;
        }

        const notification = {
          id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          message: data.message,
          type: data.type || 'general',
          priority: data.priority || 'normal',
          sender: {
            role: socket.role || 'unknown',
            name: socket.name || 'Unknown'
          },
          timestamp: new Date().toISOString()
        };

        console.log(`[Notification] From ${notification.sender.role}: ${notification.message}`);

        if (data.targetRole) {
          const validRoles = ['waiters', 'kitchen', 'cashier'];
          if (validRoles.includes(data.targetRole)) {
            io.to(data.targetRole).emit('notification', notification);
          } else {
            const response = { success: false, error: 'Invalid target role' };
            if (callback) callback(response);
            return;
          }
        } else {
          io.emit('notification', notification);
        }

        const response = { success: true, notification };
        if (callback) callback(response);

      } catch (error) {
        console.error('[Notification] Error sending notification:', error);
        const response = { success: false, error: 'Failed to send notification' };
        if (callback) callback(response);
      }
    });

    
    socket.on('broadcastToRole', (data, callback) => {
      try {
        const validRoles = ['waiters', 'kitchen', 'cashier'];

        if (!data || !data.role || !validRoles.includes(data.role)) {
          const response = { 
            success: false, 
            error: `Valid role is required. Valid roles: ${validRoles.join(', ')}` 
          };
          if (callback) callback(response);
          return;
        }

        if (!data.event || !data.data) {
          const response = { success: false, error: 'event and data are required' };
          if (callback) callback(response);
          return;
        }

        console.log(`[Broadcast] To ${data.role}: ${data.event}`);

        io.to(data.role).emit(data.event, data.data);

        const response = { success: true };
        if (callback) callback(response);

      } catch (error) {
        console.error('[Broadcast] Error broadcasting:', error);
        const response = { success: false, error: 'Failed to broadcast' };
        if (callback) callback(response);
      }
    });

  });

  console.log('[Notification] Notification handlers registered');
};

module.exports = { registerSyncHandlers, registerNotificationHandlers };
