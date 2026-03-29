# Restaurant Real-Time Server

Production-ready real-time server for restaurant management system using Socket.IO.

## Tech Stack

- Node.js (latest LTS)
- Socket.IO for real-time communication
- Express.js for health check endpoints

## Installation

```bash
npm install
```

## Run

```bash
npm start
```

Server runs on port 3000.

## API Endpoints

- `GET /health` - Health check
- `GET /api/status` - Server status

## Socket Events

### Register
Connect and register with a role:
```javascript
socket.emit('register', { role: 'waiters', name: 'John' });
```

Roles: `waiters`, `kitchen`, `cashier`

### Order Events

| Event | Description |
|-------|-------------|
| `newOrder` | Create new order |
| `updateOrderStatus` | Update order status |
| `cancelOrder` | Cancel an order |

### Table Events

| Event | Description |
|-------|-------------|
| `tableUpdate` | Update table status |
| `requestTableData` | Get all tables |

### Sync Events

| Event | Description |
|-------|-------------|
| `syncData` | Sync all data |
| `notification` | Send notification |

## Order Status Flow

```
pending → preparing → ready → served
              ↓
          cancelled
```

## Table Status

- `available`
- `occupied`
- `reserved`
