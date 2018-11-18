const mongoose = require('mongoose');

const Schema = mongoose.Schema({
   name: String,
   balance: Number,
   createdAt: Date,
   lock: Boolean,
   key: String
});

module.exports = mongoose.model('wallet', Schema);