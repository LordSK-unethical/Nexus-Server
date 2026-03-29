const store = require('../../store');

const registerTableHandlers = (io) => {
  
  io.on('connection', (socket) => {
    
    socket.on('tableUpdate', (data, callback) => {
      try {
        if (!data || !data.tableNo) {
          const response = { success: false, error: 'tableNo is required' };
          if (callback) callback(response);
          socket.emit('error', { code: 'VALIDATION_ERROR', message: 'tableNo is required' });
          return;
        }

        const existingTable = store.getTable(data.tableNo);
        if (!existingTable) {
          const response = { success: false, error: 'Table not found' };
          if (callback) callback(response);
          socket.emit('error', { code: 'NOT_FOUND', message: 'Table not found' });
          return;
        }

        const validStatuses = ['available', 'occupied', 'reserved'];
        if (data.status && !validStatuses.includes(data.status)) {
          const response = { 
            success: false, 
            error: `Invalid status. Valid statuses: ${validStatuses.join(', ')}` 
          };
          if (callback) callback(response);
          socket.emit('error', { code: 'INVALID_STATUS', message: response.error });
          return;
        }

        const updatedTable = store.updateTable(data.tableNo, {
          status: data.status,
          capacity: data.capacity
        });

        console.log(`[Table] Updated table ${data.tableNo}:`, updatedTable);

        const response = { success: true, table: updatedTable };
        if (callback) callback(response);

        io.emit('tableStatusChanged', {
          tableNo: data.tableNo,
          table: updatedTable,
          timestamp: new Date().toISOString()
        });

        io.to('waiters').emit('notification', {
          type: 'table_updated',
          message: `Table ${data.tableNo} is now ${updatedTable.status}`,
          tableNo: data.tableNo,
          status: updatedTable.status,
          timestamp: new Date().toISOString()
        });

      } catch (error) {
        console.error('[Table] Error updating table:', error);
        const response = { success: false, error: 'Failed to update table' };
        if (callback) callback(response);
        socket.emit('error', { code: 'UPDATE_ERROR', message: 'Failed to update table' });
      }
    });

    
    socket.on('requestTableData', (data, callback) => {
      try {
        let tables;

        if (data && data.tableNo) {
          const table = store.getTable(data.tableNo);
          tables = table ? [table] : [];
        } else {
          tables = store.getAllTables();
        }

        console.log(`[Table] Table data requested: ${tables.length} tables`);

        const response = { 
          success: true, 
          tables,
          timestamp: new Date().toISOString()
        };

        if (callback) {
          callback(response);
        } else {
          socket.emit('tableData', response);
        }

      } catch (error) {
        console.error('[Table] Error fetching table data:', error);
        const response = { success: false, error: 'Failed to fetch table data' };
        if (callback) callback(response);
        socket.emit('error', { code: 'FETCH_ERROR', message: 'Failed to fetch table data' });
      }
    });

  });

  console.log('[Table] Table handlers registered');
};

module.exports = { registerTableHandlers };
