// ---------------------------------------------------------------------------
// Socket Events
// ---------------------------------------------------------------------------

module.exports = {

  "use": (io) => {
    io.on('connection', (socket) => {

      socket.emit('new connection', {id: socket.id, connected: socket.connected})
      console.log(`[ socket-events.js ] ${socket.id} connected...`)

      socket.on('disconnect', () => {
        console.log(`[ socket-events.js ] ${socket.id} disconnected...`)
      });

      socket.on('drawing', (data) => socket.broadcast.emit('drawing', data));

    });
  }

};