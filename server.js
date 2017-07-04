const express = require('express')
const path = require('path')
const app = express()
const server = require('http').Server(app)
const bodyParser = require('body-parser')
const io = require('socket.io')(server)
const fs = require('fs')
const api = require('./components/api')

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

// Express server configs
app.use(bodyParser.urlencoded({extended: true}))
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')))
app.set('view engine', 'ejs')
app.use('/api', api)

// ---------------------------------------------------------------------------
// Socket Event Listeners
// ---------------------------------------------------------------------------

io.on('connection', (socket) => {

  socket.emit('new connection', {id: socket.id, connected: socket.connected})
  console.log(`[ server.js ] ${socket.id} connected...`)

  socket.on('disconnect', () => {
    console.log(`[ server.js ] ${socket.id} disconnected...`)
  });

});

// ---------------------------------------------------------------------------
// Config Page
// ---------------------------------------------------------------------------

if (env === 'dev') {
  console.log('[ server.js ] Serving config page at /config')
  app.get('/config', (req, res) => {
    console.log('[ server.js ] Accessing configs')
    res.render('config', {config: config});
  })
  app.post('/config', (req, res) => {
    Object.keys(req.body).forEach(function(item){
      req.body[item] = parseInt(req.body[item], 10) || req.body[item]
    })
    const configBody = `module.exports = ${JSON.stringify(req.body, null, 2)}`

    fs.writeFile('config.js', configBody, (err) => {
      if (err) {
        res.render('config', {message: err.message});
        throw err
      }
    })
    res.render('config', {message: "Changes saved."});
  })
}

module.exports = server