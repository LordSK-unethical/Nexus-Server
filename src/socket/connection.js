const registerSocketHandlers = (io) => {
  const validRoles = ['waiters', 'kitchen', 'cashier'];

  io.on('connection', (socket) => {
    console.log(`[Socket] New connection: ${socket.id}`);

    let currentRole = null;
    let currentName = null;

    socket.on('register', (data, callback) => {
      try {
        if (!data || typeof data !== 'object') {
          const response = { success: false, error: 'Invalid registration data' };
          if (callback) callback(response);
          socket.emit('error', response);
          return;
        }

        const { role, name } = data;

        if (!role || !validRoles.includes(role)) {
          const response = { 
            success: false, 
            error: `Invalid role. Valid roles: ${validRoles.join(', ')}` 
          };
          if (callback) callback(response);
          socket.emit('error', response);
          return;
        }

        if (!name || typeof name !== 'string' || name.trim().length === 0) {
          const response = { success: false, error: 'Name is required' };
          if (callback) callback(response);
          socket.emit('error', response);
          return;
        }

        currentRole = role;
        currentName = name.trim();
        socket.role = currentRole;
        socket.name = currentName;

        socket.join(role);

        console.log(`[Socket] ${currentName} (${currentRole}) registered: ${socket.id}`);

        const response = { 
          success: true, 
          message: `Registered as ${currentRole}`,
          role: currentRole,
          name: currentName
        };

        if (callback) callback(response);
        socket.emit('registered', response);

        io.to('kitchen').emit('notification', {
          type: 'staff_joined',
          message: `${currentName} joined as ${currentRole}`,
          timestamp: new Date().toISOString()
        });

      } catch (error) {
        console.error('[Socket] Registration error:', error);
        const response = { success: false, error: 'Registration failed' };
        if (callback) callback(response);
        socket.emit('error', response);
      }
    });

    socket.on('disconnect', (reason) => {
      console.log(`[Socket] Disconnected: ${socket.id}, reason: ${reason}`);
      if (currentRole && currentName) {
        io.to('kitchen').emit('notification', {
          type: 'staff_left',
          message: `${currentName} (${currentRole}) disconnected`,
          timestamp: new Date().toISOString()
        });
      }
    });

    socket.on('reconnect', (attemptNumber) => {
      console.log(`[Socket] Reconnected: ${socket.id}, attempt: ${attemptNumber}`);
      socket.emit('reconnected', {
        message: 'Reconnected successfully',
        timestamp: new Date().toISOString()
      });
    });

    socket.on('ping', (callback) => {
      if (callback) {
        callback({ pong: true, timestamp: Date.now() });
      }
    });

    socket.on('error', (error) => {
      console.error('[Socket] Socket error:', error);
    });
  });

  console.log('[Socket] Connection handlers registered');
};

module.exports = { registerSocketHandlers };
