const jwt = require('jsonwebtoken');

/**
 * Initialize Socket.IO handlers with JWT authentication
 */
function initializeSocket(io) {
  // Authenticate socket connections
  io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) return next(new Error('Authentication required'));

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId = decoded.userId;
      next();
    } catch (err) {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`🔌 User connected: ${socket.userId}`);

    // Join personal room for notifications
    socket.join(`user_${socket.userId}`);

    // Join staff room for agents/admins
    socket.on('join:staff', () => {
      socket.join('staff');
    });

    // Join ticket room for live updates
    socket.on('join:ticket', (ticketId) => {
      socket.join(`ticket_${ticketId}`);
    });

    socket.on('leave:ticket', (ticketId) => {
      socket.leave(`ticket_${ticketId}`);
    });

    socket.on('disconnect', () => {
      console.log(`🔌 User disconnected: ${socket.userId}`);
    });
  });

  console.log('✅ Socket.IO initialized');
}

module.exports = { initializeSocket };
