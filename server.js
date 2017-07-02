const express = require('express')
const path = require('path')
const app = express()
const server = require('http').Server(app)
const bodyParser = require('body-parser')
const io = require('socket.io')(server)

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

// Server
server.listen(process.env.PORT || 8000, function(){
  console.log(`[ server.js ] Listening on port ${server.address().port}`)
});

// Socket.io configs
io.set('heartbeat timeout', 4000)
io.set('heartbeat interval', 2000)

// Express server configs
app.use(bodyParser.urlencoded({extended: true}))
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')))

// ---------------------------------------------------------------------------
// Socket Event Listeners
// ---------------------------------------------------------------------------

io.on('connection', function(socket){

  console.log(`[ server.js ] ${socket.id} connected...`)

  socket.on('disconnect', function(){
    console.log(`[ server.js ] ${socket.id} disconnected...`)
  });

});

// ---------------------------------------------------------------------------
// Express API
// ---------------------------------------------------------------------------

app.get('/api/test', function(req, res){
  res.status(200).send('OK')
});

// ---------------------------------------------------------------------------
// Application Logic
// ---------------------------------------------------------------------------
// ...

module.exports = server