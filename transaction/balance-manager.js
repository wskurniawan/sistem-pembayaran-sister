const WalletModel = require('../model/wallet');
const LOG = require('./../model/log');

const realtime_db = require('firebase-admin').database();

//ref
const wallet_ref = realtime_db.ref('wallet');

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
   var final_balance = 0;

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

         final_balance = update.balance;

         return WalletModel.findByIdAndUpdate(id_wallet, { $set: update });
      }).then(result => {
         //operasi berhasil

         //update realtime db
         update_balance_realtime_db(id_wallet, final_balance);

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

module.exports.withdraw_balance = function(id_wallet, amount, key){
   var final_balance = 0;

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
         final_balance = current_balance - amount;

         if(final_balance < 0){
            throw new Error('insufficient-balance');
         }

         var update_balance = {
            balance: final_balance
         };

         return WalletModel.findByIdAndUpdate(id_wallet, { $set: update_balance });
      }).then(result => {
         //update realtime db
         update_balance_realtime_db(id_wallet, final_balance);

         //add log
         var log = {
            id_wallet: id_wallet,
            type: 'out',
            amount: amount,
            date: new Date(),
            trans_id: key
         };

         return LOG.create(log);
      }).then(result => {
         //last chain
         resolve(true);
      }).catch(error => {
         reject(error);
      });
   });
}

function update_balance_realtime_db(id_wallet, balance){
   wallet_ref.child(id_wallet).update({ balance: balance }).then(result => {
      console.log('update realtime db berhasil');
   }).catch(error => {
      console.log(error);
   });
}