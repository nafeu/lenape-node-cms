const express = require('express')
const router = express.Router()
const multer = require('multer');
const mongoose = require('mongoose')
const Word = require('../models/word');
const mongodb = require('mongodb')
const MongoClient = require('mongodb').MongoClient;
const ObjectID = require('mongodb').ObjectID;
const { Readable } = require('stream');

let config

try {
  config = require('../config');
} catch (err) {
  console.log('[ server.js ] Missing config file')
  config = {};
}

const mongoDBURI = process.env.DB_URI || config.DB_URI

mongoose.connect(mongoDBURI);
mongoose.Promise = global.Promise;
const mongooseConnection = mongoose.connection;
mongooseConnection.on('error', console.error.bind(console, 'MongoDB connection error:'));

let db;
MongoClient.connect(process.env.DB_HOST || config.DB_HOST, (err, client) => {
  if (err) {
    console.log('MongoDB Connection Error. Please make sure that MongoDB is running.');
    process.exit(1);
  }
  db = client.db(process.env.DB_NAME || config.DB_NAME);
});

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

  router.post('/upload', (req, res) => {
    const storage = multer.memoryStorage()
    const upload = multer({ storage: storage, limits: { fields: 1, fileSize: 6000000, files: 1, parts: 2 }});
    upload.single('track')(req, res, (err) => {
      if (err) {
        return res.status(400).json({ message: "Upload Request Validation Failed" });
      } else if(!req.body.name) {
        return res.status(400).json({ message: "No track name in request body" });
      }

      let trackName = req.body.name;

      // Covert buffer to Readable Stream
      const readableTrackStream = new Readable();
      readableTrackStream.push(req.file.buffer);
      readableTrackStream.push(null);

      let bucket = new mongodb.GridFSBucket(db, {
        bucketName: 'tracks'
      });

      let uploadStream = bucket.openUploadStream(trackName);
      let id = uploadStream.id;
      readableTrackStream.pipe(uploadStream);

      uploadStream.on('error', () => {
        return res.status(500).json({ message: "Error uploading file" });
      });

      uploadStream.on('finish', () => {
        return res.status(201).json({ message: "File uploaded successfully, stored under Mongo ObjectID: " + id });
      });
    });
  });

  router.get('/play/:trackID', (req, res) => {
    try {
      var trackID = new ObjectID(req.params.trackID);
    } catch(err) {
      return res.status(400).json({ message: "Invalid trackID in URL parameter. Must be a single String of 12 bytes or a string of 24 hex characters" });
    }
    res.set('content-type', 'audio/mp3');
    res.set('accept-ranges', 'bytes');

    let bucket = new mongodb.GridFSBucket(db, {
      bucketName: 'tracks'
    });

    let downloadStream = bucket.openDownloadStream(trackID);

    downloadStream.on('data', (chunk) => {
      res.write(chunk);
    });

    downloadStream.on('error', () => {
      res.sendStatus(404);
    });

    downloadStream.on('end', () => {
      res.end();
    });
  });

  return router
}