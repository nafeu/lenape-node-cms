const express = require('express')
const router = express.Router()

// ---------------------------------------------------------------------------
// Express API
// ---------------------------------------------------------------------------

router.use(function(req, res, next) {
  const time = new Date().toTimeString()
  const {method, url} = req
  const {statusCode} = res

  console.log(`[ api.js - ${statusCode} ] ${method} ${url} : ${time}`)
  next()
})

router.get('/test', function (req, res) {
  res.status(200).send('OK')
})

module.exports = router