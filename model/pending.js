const mongoose = require('mongoose');

const Schema = mongoose.Schema({
   type: String, //deposit, withdraw, transfer, get_saldo
   requesting_user_id: String,
   first_wallet_id: String,
   second_wallet_id: String,
   amount: Number,
   timestamp: Date,
   id_transaction: String
});

module.exports = mongoose.model('pending', Schema);