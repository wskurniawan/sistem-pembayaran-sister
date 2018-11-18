const mongoose = require('mongoose');

const Schema = mongoose.Schema({
   id_wallet: String,
   type: String, //in out
   amount: Number,
   date: Date,
   trans_id: String
});

module.exports = mongoose.model('log', Schema);