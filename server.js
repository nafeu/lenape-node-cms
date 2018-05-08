const express = require('express')
const path = require('path')
const app = express()
const server = require('http').Server(app)
const bodyParser = require('body-parser')
const io = require('socket.io')(server)
const fs = require('fs')
const api = require('./components/api')(io)
const socketEvents = require('./components/socket-events')

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

let config

try {
  config = require('./config');
} catch (err) {
  console.log('[ server.js ] Missing config file')
  config = {};
}

// Environment configs
const env = process.env.NODE_ENV || 'dev';

console.log(`[ server.js ] Running app in ${env} environment`)

// Server configs
let serverPort

// Avoid EADDRINUSE in chai-http tests
if (process.env.TEST_MODE) {
  serverPort = 8080
} else {
  serverPort = config.SERVER_PORT || 8000
}

server.listen(process.env.PORT || serverPort, () => {
  console.log(`[ server.js ] Listening on port ${server.address().port}`)
});

// Socket.io configs
io.set('heartbeat timeout', 4000)
io.set('heartbeat interval', 2000)
socketEvents.use(io)

// Express server configs
app.use(bodyParser.urlencoded({extended: true}))
app.use(bodyParser.json());
app.use('/api', api)

app.get('/', function (req, res) {
  res.status(200).send('OK')
})

// ---------------------------------------------------------------------------
// Config Page
// ---------------------------------------------------------------------------


module.exports = server