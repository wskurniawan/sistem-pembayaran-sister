const Wallet = require('express').Router();
const JOI = require('joi');

//instance realtime database
const firebase = require('firebase-admin');
const realtime_db = firebase.database();

//ref wallet db
const wallet_ref = realtime_db.ref('wallet');

//model
const WalletModel = require('./../model/wallet');
const LogModel = require('./../model/log');

//transaction
const DEPOSIT = require('./../transaction/deposit');
const BALANCE_MANAGER = require('./../transaction/balance-manager');
const WITHDRAW = require('./../transaction/withdraw');
const TRANSFER = require('./../transaction/transfer');

//base: /wallet
Wallet.post('/create', function(req, res, next){
   const Schema = JOI.object().keys({
      name: JOI.string().required()
   });

   JOI.validate(req.body, Schema).then(result => {
      next();
   }).catch(error => {
      next(error);
   });
}, function(req, res, next){
   var data = {
      name: req.body.name,
      balance: 0,
      created: new Date(Date.now()),
      lock: false,
      key: ''
   };

   WalletModel.create(data).then(result => {
      var id = result._id.toString();

      var data = {
         id: id,
         name: result.name,
         balance: result.balance,
         lock: result.lock,
         key: result.key
      };

      //buat salinan di realtime database
      return wallet_ref.child(id).set(data);
   }).then(result => {
      res.send({
         succes: true
      });
   }).catch(error => {
      next(error);
   });
});

Wallet.get('/', function(req, res, next){
   WalletModel.find({}).then(result => {
      res.send({
         succes: true,
         data: result
      });
   }).catch(error => {
      next(error);
   });
});

Wallet.get('/list-wallet', function(req, res, next){
   wallet_ref.once('value').then(result => {
      var list_document = [];
      var list_data = result.val();
      for(key in list_data){
         list_document.push(list_data[key]);
      }

      res.send({
         succes: true,
         data: list_document
      });
   }).catch(error => {
      next(error);
   })
});

Wallet.post('/deposit', function(req, res, next){
   const Schema = JOI.object().keys({
      id_wallet: JOI.string().required(),
      amount: JOI.number().required()
   });

   JOI.validate(req.body, Schema).then(result => {
      next();
   }).catch(error => {
      next(error);
   });
}, function(req, res, next){
   var id_wallet = req.body.id_wallet;
   var amount = parseInt(req.body.amount);
   var id_transaction = 'deposit-' + Date.now();

   DEPOSIT.deposit(id_wallet, amount, id_transaction).then(result => {
      res.send({
         succes: true
      });
   }).catch(error => {
      next(error);
   });
});

Wallet.get('/:id_wallet/balance', function(req, res, next){
   BALANCE_MANAGER.get_balance(req.params.id_wallet, 'default').then(balance => {
      res.send({
         succes: true,
         data: balance
      });
   }).catch(error => {
      next(error);
   })
});

Wallet.get('/all/detail-balance', function(req, res, next){
   WalletModel.find({}).then(async result => {
      var list_wallet = result;
      var final_list = [];

      for(index in list_wallet){
         var wallet = list_wallet[index];
         var id_wallet = list_wallet[index]._id;
         
         var list_log = await LogModel.find({ id_wallet: id_wallet});
         var balance_from_log = 0;

         for(j in list_log){
            var log_item = list_log[j];
            if(log_item.type === 'in'){
               balance_from_log += log_item.amount;
            }else if(log_item.type === 'out'){
               balance_from_log -= log_item.amount;
            }
         }

         final_list.push({
            name: wallet.name,
            id: wallet._id,
            balance: wallet.balance,
            balance_from_log: balance_from_log
         });
      }

      return Promise.resolve(final_list);
   }).then(list_wallet => {
      res.send(list_wallet);
   }).catch(error => {
      next(error);
   });
});

Wallet.get('/:id_wallet/withdraw/:amount', function(req, res, next){
   var id_wallet = req.params.id_wallet;
   var amount = parseInt(req.params.amount);
   var id_transaction = 'withdraw-' + Date.now();

   WITHDRAW.withdraw(id_wallet, amount, id_transaction).then(result => {
      res.send({
         succes: true
      });
   }).catch(error => {
      next(error);
   })
});

Wallet.post('/transfer', function(req, res, next){
   const Schema = JOI.object().keys({
      from: JOI.string().required(),
      to: JOI.string().required(),
      amount: JOI.number().required()
   });

   JOI.validate(req.body, Schema).then(result => {
      next();
   }).catch(error => {
      next(error);
   });
}, function(req, res, next){
   var from_wallet_id = req.body.from;
   var to_wallet_id = req.body.to;
   var amount = parseInt(req.body.amount);
   var id_transaction = 'transfer-' + Date.now();

   if(from_wallet_id === to_wallet_id){
      return res.send({
         succes: false,
         message: 'tidak bisa transfer ke diri sendiri'
      });
   }

   TRANSFER.transfer(from_wallet_id, to_wallet_id, amount, id_transaction).then(result => {
      res.send({
         succes: true
      });
   }).catch(error => {
      next(error);
   });
});

module.exports = Wallet;