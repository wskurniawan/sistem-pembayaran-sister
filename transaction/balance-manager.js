const WalletModel = require('../model/wallet');
const LOG = require('./../model/log');

module.exports.get_balance = function(id_wallet, key){
   return new Promise((resolve, reject) => {
      WalletModel.findById(id_wallet, { key: 1, balance: 1, lock: 1}).then(result => {
         if(!result){
            throw new Error('not-found');
         }

         /*
         get balance dapat langsung dilakukan tanpa melakukan locking, 
         tetapi jika di lock maka permintaan harus datang dari proses yang meminta lock 
         */
         if(result.lock && result.key != key){
            throw new Error('key-forbidden');
         }

         resolve(result.balance);
      }).catch(error => {
         reject(error);
      });
   });
};

module.exports.add_balance = function(id_wallet, amount, key){
   return new Promise((resolve, reject) => {
      WalletModel.findById(id_wallet, { key: 1, balance: 1 }).then(result_wallet => {
         if(!result_wallet){
            throw new Error('not-found');
         }

         if(result_wallet.key != key){
            throw new Error('key-forbidden');
         }

         //do transaction
         var current_balance = result_wallet.balance;
         var update = {
            balance: current_balance + amount
         };

         return WalletModel.findByIdAndUpdate(id_wallet, { $set: update });
      }).then(result => {
         //operasi berhasil
         //add log
         var log = {
            id_wallet: id_wallet,
            type: 'in',
            amount: amount,
            date: new Date(),
            trans_id: key
         };

         return LOG.create(log);
      }).then(result => {
         resolve(true);
      }).catch(error => {
         reject(error);
      });
   });
};