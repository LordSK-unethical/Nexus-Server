const store = require('../../store');

const validateOrderData = (data) => {
  const errors = [];

  if (!data.tableNo) {
    errors.push('tableNo is required');
  } else if (!store.getTable(data.tableNo)) {
    errors.push('Invalid tableNo - table does not exist');
  }

  if (!data.items || !Array.isArray(data.items) || data.items.length === 0) {
    errors.push('items array is required and must not be empty');
  } else {
    data.items.forEach((item, index) => {
      if (!item.name || typeof item.name !== 'string') {
        errors.push(`Item at index ${index}: name is required`);
      }
      if (!item.qty || typeof item.qty !== 'number' || item.qty <= 0) {
        errors.push(`Item at index ${index}: qty must be a positive number`);
      }
    });
  }

  if (data.people !== undefined) {
    if (typeof data.people !== 'number' || data.people < 1) {
      errors.push('people must be a positive number');
    }
  }

  return errors;
};

const registerOrderHandlers = (io) => {
  
  io.on('connection', (socket) => {
    
    socket.on('newOrder', (data, callback) => {
      try {
        const errors = validateOrderData(data);
        if (errors.length > 0) {
          const response = { success: false, errors };
          if (callback) callback(response);
          socket.emit('error', { code: 'VALIDATION_ERROR', message: errors.join(', ') });
          return;
        }

        const order = store.createOrder(data);

        console.log(`[Order] New order created: ${order.orderId}`);

        const response = { success: true, order };
        if (callback) callback(response);

        io.to('kitchen').emit('orderCreated', {
          order,
          message: `New order received for table ${order.tableNo}`
        });

        io.to('cashier').emit('orderCreated', {
          order,
          message: `New order added: ${order.orderId}`
        });

        io.to('waiters').emit('notification', {
          type: 'new_order',
          message: `New order for table ${order.tableNo}`,
          orderId: order.orderId,
          timestamp: new Date().toISOString()
        });

      } catch (error) {
        console.error('[Order] Error creating order:', error);
        const response = { success: false, error: 'Failed to create order' };
        if (callback) callback(response);
        socket.emit('error', { code: 'CREATE_ERROR', message: 'Failed to create order' });
      }
    });

    
    socket.on('updateOrderStatus', (data, callback) => {
      try {
        if (!data || !data.orderId || !data.status) {
          const response = { success: false, error: 'orderId and status are required' };
          if (callback) callback(response);
          socket.emit('error', { code: 'VALIDATION_ERROR', message: 'orderId and status are required' });
          return;
        }

        const result = store.updateOrderStatus(data.orderId, data.status);

        if (!result) {
          const response = { success: false, error: 'Order not found' };
          if (callback) callback(response);
          socket.emit('error', { code: 'NOT_FOUND', message: 'Order not found' });
          return;
        }

        if (result.error) {
          const response = { success: false, error: result.error };
          if (callback) callback(response);
          socket.emit('error', { code: 'INVALID_STATUS', message: result.error });
          return;
        }

        console.log(`[Order] Status updated: ${data.orderId} -> ${data.status}`);

        const response = { success: true, order: result };
        if (callback) callback(response);

        io.emit('orderStatusUpdated', {
          orderId: data.orderId,
          status: data.status,
          order: result,
          timestamp: new Date().toISOString()
        });

        if (data.status === 'ready') {
          io.to('waiters').emit('notification', {
            type: 'order_ready',
            message: `Order ${data.orderId} is ready for table ${result.tableNo}`,
            orderId: data.orderId,
            tableNo: result.tableNo,
            timestamp: new Date().toISOString()
          });
        }

      } catch (error) {
        console.error('[Order] Error updating order status:', error);
        const response = { success: false, error: 'Failed to update order status' };
        if (callback) callback(response);
        socket.emit('error', { code: 'UPDATE_ERROR', message: 'Failed to update order status' });
      }
    });

    
    socket.on('cancelOrder', (data, callback) => {
      try {
        if (!data || !data.orderId) {
          const response = { success: false, error: 'orderId is required' };
          if (callback) callback(response);
          socket.emit('error', { code: 'VALIDATION_ERROR', message: 'orderId is required' });
          return;
        }

        const order = store.cancelOrder(data.orderId);

        if (!order) {
          const response = { success: false, error: 'Order not found' };
          if (callback) callback(response);
          socket.emit('error', { code: 'NOT_FOUND', message: 'Order not found' });
          return;
        }

        console.log(`[Order] Cancelled: ${data.orderId}`);

        const response = { success: true, order };
        if (callback) callback(response);

        io.emit('orderCancelled', {
          orderId: data.orderId,
          order,
          timestamp: new Date().toISOString()
        });

        io.to('waiters').emit('notification', {
          type: 'order_cancelled',
          message: `Order ${data.orderId} for table ${order.tableNo} has been cancelled`,
          orderId: data.orderId,
          tableNo: order.tableNo,
          timestamp: new Date().toISOString()
        });

      } catch (error) {
        console.error('[Order] Error cancelling order:', error);
        const response = { success: false, error: 'Failed to cancel order' };
        if (callback) callback(response);
        socket.emit('error', { code: 'CANCEL_ERROR', message: 'Failed to cancel order' });
      }
    });

  });

  console.log('[Order] Order handlers registered');
};

module.exports = { registerOrderHandlers };
