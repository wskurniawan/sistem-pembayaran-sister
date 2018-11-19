const randomatic = require('randomatic');

//transaction
const LOCK = require('./../service/lock');
const BALANCE_MANAGER = require('./balance-manager');
const PENDING_TRANSACTION = require('./pending-transaction');
const ROLLBACK = require('./rollback');

module.exports.withdraw = function(id_wallet, amount){
   return new Promise((resolve, reject) => {
      var key = randomatic('A0AAAAAAAAA0') + '-' + Date.now() + '-WITHDRAW';
      var wallet_balance_initial_state = 0;

      //cek status lock
      LOCK.is_locked(id_wallet).then(lock_status => {
         //jika di lock
         if(lock_status){
            throw new Error('resource-locked');
         }

         //minta akses lock
         return LOCK.lock(id_wallet, key);
      }).then(result => {
         //do transaction
         //get initial state
         return BALANCE_MANAGER.get_balance(id_wallet, key);
      }).then(current_balance => {
         wallet_balance_initial_state = current_balance;

         //withdraw balance
         return BALANCE_MANAGER.withdraw_balance(id_wallet, amount, key);
      }).then(result => {
         //operasi berhasil

         //lepas lock
         return LOCK.unlock(id_wallet, key);
      }).then(result => {
         //last chain
         resolve(true);
      }).catch(error => {
         var message = error.message;

         if (message === 'resource-locked') {
            //add ke pending state
            PENDING_TRANSACTION.pending_withdraw(id_wallet, amount);
         } else if (message === 'key-forbidden') {
            //add ke pending state
            PENDING_TRANSACTION.pending_withdraw(id_wallet, amount);
         } else if (message === 'insufficient-balance') {
            //balance tidak cukup, fail tidak perlu lakukan apa2
         } else{
            //error lainnya, transaksi tidak di pending, langsung fail, harus rollback
            ROLLBACK.rollback_withdraw(id_wallet, wallet_balance_initial_state, key).then(result => {
               console.log('rollback succes');
            }).catch(error => {
               console.error(error);
            });
         }

         reject(error);
      })
   });
}