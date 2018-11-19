const LOCK = require('./../service/lock');
const randomatic = require('randomatic');
const balance_manager = require('./balance-manager');
const pending_transaction = require('./pending-transaction');
const rollback = require('./rollback');

module.exports.deposit = function (id_wallet, amount) {
   return new Promise((resolve, reject) => {
      var key = randomatic('A0AAAAAAAAA0') + '-' + Date.now() + '-DEPOSIT';
      var wallet_balance_initial_state = 0;

      LOCK.is_locked(id_wallet).then(result => {
         //jika di lock
         if (result) {
            throw new Error('resource-locked');
         }

         //lock resource
         return LOCK.lock(id_wallet, key);
      }).then(lock_result => {
         //get initial state dari wallet
         return balance_manager.get_balance(id_wallet, key);
      }).then(wallet_balance => {
         wallet_balance_initial_state = wallet_balance;

         //menambahkan saldo
         return balance_manager.add_balance(id_wallet, amount, key);
      }).then(result => {
         //operasi berhasil, lepaskan lock
         return LOCK.unlock(id_wallet, key);
      }).then(result => {
         //resolve
         resolve(true);
      }).catch(error => {
         var message = error.message;

         if (message === 'resource-locked') {
            //add ke pending state
            pending_transaction.pending_deposit(id_wallet, amount);
         } else if (message === 'key-forbidden') {
            //add ke pending state
            pending_transaction.pending_deposit(id_wallet, amount);
         } else{
            //error lainnya, transaksi tidak di pending, langsung fail, harus rollback
            rollback.rollback_deposit(id_wallet, wallet_balance_initial_state).then(result => {
               console.log('rolback succes');
            }).catch(error => {
               console.log(error);
            });
         }

         reject(error);
      });
   });
}