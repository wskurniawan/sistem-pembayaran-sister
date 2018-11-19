const express = require('express');
const body_parser = require('body-parser');
const mongoose = require('mongoose');
const firebase = require('firebase-admin');

//config
const config = require('./config.json');
var serviceAccount = require('./firebase.json');

//init firebase admin
firebase.initializeApp({
   credential: firebase.credential.cert(serviceAccount),
   databaseURL: "https://sistem-pembayaran-3c398.firebaseio.com"
});

//init db
mongoose.connect(config.db_uri, function(err){
   if(err){
      return console.log(err);
   }

   console.log('DB connected');
});

//init app
const app = express();

//init midleware
app.use(body_parser.json());

app.get('/', function(req, res, next){
   res.send('ok');
});

//routes
app.use('/wallet', require('./routes/wallet'));

app.use(function(err, req, res, next){
   console.error(err);

   var message = err.message;

   if (message === 'resource-locked') {
      //pending
      res.send({
         succes: true,
         status: 'pending'
      });
   } else if (message === 'key-forbidden') {
      //pending
      res.send({
         succes: true,
         status: 'pending'
      });
   } else if (message === 'insufficient-balance') {
      //balance tidak cukup
      res.send({
         succes: false,
         message: 'saldo tidak cukup'
      });
   }else{
      //error lainnya, transaksi tidak di pending, langsung fail, harus rollback
      res.status(500).send({
         succes: false,
         error: err
      });  
   }
});

app.listen(process.env.PORT || 5003, function(){
   var port = process.env.PORT || 5003;
   console.log('app ready di port ' + port);
});