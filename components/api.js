const express = require('express')
const router = express.Router()
const mongoDB = 'mongodb://127.0.0.1/my_database'
const mongoose = require('mongoose')
const Word = require('../models/word');

// ---------------------------------------------------------------------------
// Express API
// ---------------------------------------------------------------------------

mongoose.connect(mongoDB);
mongoose.Promise = global.Promise;
const db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB connection error:'));

module.exports = (io) => {

  router.use((req, res, next) => {
    const time = new Date().toTimeString()
    const {method, url} = req
    const {statusCode} = res

    console.log(`[ api.js - ${statusCode} ] ${method} ${url} : ${time}`)
    next()
  })

  router.get('/test', (req, res) => {
    res.status(200).send('OK')
  })

  router.post('/word', (req, res) => {

    var word = new Word();
    word.name = req.body.name;

    // save the word and check for errors
    word.save(function(err) {
        if (err)
            res.send(err);

        res.json({ message: 'Word created!' });
    });

  })

  router.get('/word', (req, res) => {
    Word.find({}, function(err, words) {
      res.send(words);
    })
  })

  return router
}