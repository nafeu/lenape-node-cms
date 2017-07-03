const express = require('express')
const path = require('path')
const app = express()
const server = require('http').Server(app)
const bodyParser = require('body-parser')
const io = require('socket.io')(server)
const fs = require('fs')

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

let config

// Server configs
try {
  config = require('./config');
} catch (err) {
  config = {};
}

const env = process.env.NODE_ENV || 'dev'
const serverPort = process.env.SERVER_PORT || config.SERVER_PORT || 8000

server.listen(serverPort, () => {
  console.log(`[ server.js ] Listening on port ${server.address().port}`)
});

console.log(`[ server.js ] Running app in ${env} environment`)

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

io.on('connection', (socket) => {

  console.log(`[ server.js ] ${socket.id} connected...`)

  socket.on('disconnect', () => {
    console.log(`[ server.js ] ${socket.id} disconnected...`)
  });

});

// ---------------------------------------------------------------------------
// Express API
// ---------------------------------------------------------------------------

app.get('/api/test', (req, res) => {
  res.status(200).send('OK')
});

if (env === 'dev') {
  app.set('view engine', 'ejs')
  app.get('/config', (req, res) => {
    console.log('[ server.js ] Accessing configs')
    res.render('config', {config: config});
  })
  app.post('/config', (req, res) => {
    console.log(req.body);
    Object.keys(req.body).forEach(function(item){
      req.body[item] = parseInt(req.body[item]) || req.body[item]
    })
    fs.writeFile('config.js', `module.exports = ${JSON.stringify(req.body, null, 2)}`, (err) => {
      if (err) {
        res.render('config', {message: err.message});
        throw err
      }
    })
    res.render('config', {message: "Changes saved."});
  })
}

// ---------------------------------------------------------------------------
// Application Logic
// ---------------------------------------------------------------------------
// ...

// ---------------------------------------------------------------------------
// Instantiate Server
// ---------------------------------------------------------------------------

module.exports = server