const randomatic = require('randomatic');

//transaction
const LOCK = require('./../service/lock');
const BALANCE_MANAGER = require('./balance-manager');
const ROLLBACK = require('./rollback');
const PENDING_TRANSACTION = require('./pending-transaction');

module.exports.transfer = function(from_wallet_id, to_wallet_id, amount){
   return new Promise((resolve, reject) => {
      var key = randomatic('A0AAAAAAAAA0') + '-' + Date.now() + '-TRANSFER';
      var from_wallet_initial_balance = 0;
      var to_wallet_initial_balance = 0;

      if(from_wallet_id === to_wallet_id){
         throw new Error('same-id');
      }

      //cek lock
      LOCK.is_locked(from_wallet_id).then(result => {
         if(result){
            throw new Error('resource-locked');
         }

         return LOCK.is_locked(to_wallet_id);
      }).then(result => {
         if(result){
            throw new Error('resource-locked');
         }

         //minta akses kunci wallet pertama
         LOCK.lock(from_wallet_id, key);
      }).then(result => {
         //minta akses kunci wallet kedua
         LOCK.lock(to_wallet_id, key);
      }).then(result => {
         //get from initial balance
         return BALANCE_MANAGER.get_balance(from_wallet_id, key);
      }).then(from_initial_balance => {
         from_wallet_initial_balance = from_initial_balance;

         return BALANCE_MANAGER.get_balance(to_wallet_id, key);
      }).then(to_initial_balance => {
         to_wallet_initial_balance = to_initial_balance;

         //withdraw pengirim
         return BALANCE_MANAGER.withdraw_balance(from_wallet_id, amount, key);
      }).then(result => {
         //deposit penerima
         return BALANCE_MANAGER.add_balance(to_wallet_id, amount, key);
      }).then(result => {
         //operasi selesai,lepas lock wallet pertama
         return LOCK.unlock(from_wallet_id, key);
      }).then(result => {
         //lepas lock wallet kedua
         return LOCK.unlock(to_wallet_id, key);
      }).then(result => {
         //resolve

         resolve(true);
      }).catch(error => {
         var message = error.message;

         if (message === 'resource-locked') {
            //lepaskan lock yang mungkin sudah didapat
            ROLLBACK.transfer.release_lock(from_wallet_id, key);
            ROLLBACK.transfer.release_lock(to_wallet_id, key);
            //add ke pending state
            
            PENDING_TRANSACTION.pending_transfer(from_wallet_id, to_wallet_id, amount, key, message);
         } else if (message === 'key-forbidden') {
            console.log(key);
            //lepaskan lock yang mungkin sudah didapat
            ROLLBACK.transfer.release_lock(from_wallet_id, key);
            ROLLBACK.transfer.release_lock(to_wallet_id, key);
            //add ke pending state
            
            PENDING_TRANSACTION.pending_transfer(from_wallet_id, to_wallet_id, amount, key, message);
         } else if (message === 'insufficient-balance') {
            //lepaskan lock
            ROLLBACK.transfer.release_lock(from_wallet_id, key);
            ROLLBACK.transfer.release_lock(to_wallet_id, key);
         }else if (message === 'same-id'){
            //tidak melakukan apa2
            ROLLBACK.transfer.release_lock(from_wallet_id, key);
         } else{
            //error lainnya, transaksi tidak di pending, langsung fail, harus rollback
            ROLLBACK.transfer.reset(from_wallet_id, from_wallet_initial_balance, to_wallet_id, to_wallet_initial_balance);
         }

         reject(error);
      });
   });
}