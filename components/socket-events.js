var lastCanvasState = "";

// ---------------------------------------------------------------------------
// Socket Events
// ---------------------------------------------------------------------------

module.exports = {

  "use": (io) => {
    io.on('connection', (socket) => {

      socket.emit('new connection', {id: socket.id, connected: socket.connected})
      socket.emit('getLastCanvasState', lastCanvasState);
      console.log(`[ socket-events.js ] ${socket.id} connected...`)

      socket.on('disconnect', () => {
        console.log(`[ socket-events.js ] ${socket.id} disconnected...`)
      });

      socket.on('drawing', (data) => socket.broadcast.emit('drawing', data));

      socket.on('setLastCanvasState', (data) => {
        lastCanvasState = data;
        console.log("setting last canvas state.")
      });

    });
  }

};