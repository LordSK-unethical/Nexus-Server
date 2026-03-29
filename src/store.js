const { v4: uuidv4 } = require('uuid');

class DataStore {
  constructor() {
    this.orders = new Map();
    this.tables = new Map();
    this.initializeDefaultTables();
  }

  initializeDefaultTables() {
    for (let i = 1; i <= 20; i++) {
      this.tables.set(i.toString(), {
        tableNo: i.toString(),
        status: 'available',
        capacity: i <= 10 ? 4 : 8,
        currentOrder: null
      });
    }
    console.log('[Store] Initialized 20 default tables');
  }

  generateOrderId() {
    return `ORD-${uuidv4().substring(0, 8).toUpperCase()}`;
  }

  createOrder(orderData) {
    const orderId = orderData.orderId || this.generateOrderId();
    const order = {
      orderId,
      tableNo: orderData.tableNo,
      people: orderData.people || 1,
      items: orderData.items || [],
      status: 'pending',
      notes: orderData.notes || '',
      timestamp: new Date().toISOString(),
      createdAt: Date.now()
    };
    this.orders.set(orderId, order);

    if (this.tables.has(orderData.tableNo)) {
      const table = this.tables.get(orderData.tableNo);
      table.status = 'occupied';
      table.currentOrder = orderId;
      this.tables.set(orderData.tableNo, table);
    }

    console.log(`[Store] Order created: ${orderId} for table ${orderData.tableNo}`);
    return order;
  }

  getOrder(orderId) {
    return this.orders.get(orderId);
  }

  getAllOrders() {
    return Array.from(this.orders.values()).sort((a, b) => b.createdAt - a.createdAt);
  }

  updateOrderStatus(orderId, status) {
    const order = this.orders.get(orderId);
    if (!order) {
      return null;
    }

    const validStatuses = ['pending', 'preparing', 'ready', 'served', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return { error: `Invalid status. Valid statuses: ${validStatuses.join(', ')}` };
    }

    order.status = status;
    order.updatedAt = Date.now();
    order.updatedAtTimestamp = new Date().toISOString();
    this.orders.set(orderId, order);

    if (status === 'served' || status === 'cancelled') {
      const table = this.tables.get(order.tableNo);
      if (table && table.currentOrder === orderId) {
        table.status = 'available';
        table.currentOrder = null;
        this.tables.set(order.tableNo, table);
      }
    }

    console.log(`[Store] Order ${orderId} status updated to: ${status}`);
    return order;
  }

  cancelOrder(orderId) {
    const order = this.orders.get(orderId);
    if (!order) {
      return null;
    }

    order.status = 'cancelled';
    order.cancelledAt = Date.now();
    order.cancelledAtTimestamp = new Date().toISOString();
    this.orders.set(orderId, order);

    const table = this.tables.get(order.tableNo);
    if (table && table.currentOrder === orderId) {
      table.status = 'available';
      table.currentOrder = null;
      this.tables.set(order.tableNo, table);
    }

    console.log(`[Store] Order cancelled: ${orderId}`);
    return order;
  }

  updateTable(tableNo, data) {
    if (!this.tables.has(tableNo)) {
      return null;
    }

    const table = this.tables.get(tableNo);
    const validStatuses = ['available', 'occupied', 'reserved'];

    if (data.status && validStatuses.includes(data.status)) {
      table.status = data.status;
    }

    if (data.capacity) {
      table.capacity = data.capacity;
    }

    table.updatedAt = new Date().toISOString();
    this.tables.set(tableNo, table);

    console.log(`[Store] Table ${tableNo} updated:`, table);
    return table;
  }

  getTable(tableNo) {
    return this.tables.get(tableNo);
  }

  getAllTables() {
    return Array.from(this.tables.values());
  }

  getOrdersByStatus(status) {
    return this.getAllOrders().filter(order => order.status === status);
  }

  getOrdersByTable(tableNo) {
    return this.getAllOrders().filter(order => order.tableNo === tableNo);
  }

  clear() {
    this.orders.clear();
    this.initializeDefaultTables();
    console.log('[Store] Data cleared and reinitialized');
  }
}

module.exports = new DataStore();
