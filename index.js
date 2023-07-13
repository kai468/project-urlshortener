require('dotenv').config();
const express = require('express');
const cors = require('cors');
const dns = require('dns');
const bodyparser = require('body-parser');
const app = express();

// Basic Configuration
const port = process.env.PORT || 3000;

// mongoose connection: 
const mongoose = require('mongoose');
mongoose.connect(process.env.MONGODB, { useNewUrlParser: true, useUnifiedTopology: true })

const urlSchema = new mongoose.Schema({
  originalUrl: {
    type: String, 
    required: true
  },
  shortUrl: {
    type: Number,
    required: true
  }
});

let Url = mongoose.model('Url', urlSchema);

const findOneUrl = async (originalUrl) => {
  try {
    return await Url.findOne({ originalUrl: originalUrl });
  } catch (err) {
    throw err;
  }
};

const findOneShort = async (shortUrl) => {
  try {
    return await Url.findOne({ shortUrl: shortUrl });
  } catch (err) {
    throw err;
  }
};

const findMaxShort = async () => {
  try {
    return await Url.findOne({}).sort('-shortUrl').exec();
  } catch (err) {
    throw err;
  }
};

const createUrl = async (url) => {
  try {
    return await url.save();
  } catch (err) {
    throw err;
  }
};

const urlRegex = /^https?:\/\/(?:www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b(?:[-a-zA-Z0-9()@:%_\+.~#?&\/=]*)$/;

app.use(cors());

app.use('/public', express.static(`${process.cwd()}/public`));

app.get('/', function(req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

// Your first API endpoint
app.post('/api/shorturl', bodyparser.urlencoded({ extended: true}), async (req, res) => {


  try {
    if (!urlRegex.test(req.body.url)) {
      res.json({ error: 'invalid url'});
    } else {
      // valid url 
      // check if exists -> if yes: show shorturl; if no: create new and show 
      const existingDoc = await findOneUrl(req.body.url);

      if (existingDoc) {
        // exists -> respond shortUrl:
        res.json({
          original_url: existingDoc.originalUrl,
          short_url: existingDoc.shortUrl
        });
      } else {
        // create shortUrl: 
        const maxShort = await findMaxShort();
        const newShort = maxShort ? maxShort.shortUrl + 1 : 1; 

        const newDoc = await createUrl(new Url({
          originalUrl: req.body.url,
          shortUrl: newShort
        })); 

        res.json({
          original_url: newDoc.originalUrl,
          short_url: newDoc.shortUrl
        });

      }
    }
  } catch (err) {
    res.status(500).json({ error: 'internal server error'});
  }
    
});

app.get('/api/shorturl/:short', async (req, res) => {

  const doc = await findOneShort(req.params.short)

  if (doc) {
    res.redirect(301, doc.originalUrl)
  } else {
    res.json({ error: 'No short URL found for the given input'}); 
  }
});


app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});
