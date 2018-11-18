const express = require('express');
const body_parser = require('body-parser');
const mongoose = require('mongoose');

//init app
const app = express();

//init midleware
app.use(body_parser.json());

app.get('/', function(req, res, next){
   res.send('ok');
});


app.listen(process.env.PORT || 5003, function(){
   console.log('app ready');
});