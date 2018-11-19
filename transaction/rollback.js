const WalletModel = require('./../model/wallet');
const LOCK = require('./../service/lock');
const LOG = require('./../model/log');

/*
Digunakan untuk mengembalikan state ke kondisi semula
Rollback masih menggunakan chain promise, kecuali untuk pelepasan lock
*/

module.exports.rollback_deposit = function(id_wallet, wallet_initial_balance, key){
   return new Promise((resolve, reject) => {
      reset_wallet(id_wallet, wallet_initial_balance, key).then(result => {
         resolve(result);
      }).catch(error => {
         reject(error);
      });
   });
};


module.exports.rollback_withdraw = function(id_wallet, balance_state, key){
   return new Promise((resolve, reject) => {
      reset_wallet(id_wallet, balance_state, key).then(result => {
         resolve(result);
      }).reject(error => {
         reject(error);
      });
   });
};

module.exports.transfer = {
   release_lock: function(id_wallet, key){
      LOCK.unlock(id_wallet, key).then(result => {
         console.log('release lock sukses');
      }).catch(error => {
         console.error(error);
      });
   },
   reset: function(from_id_wallet, from_initial_balance, for_id_wallet, for_initial_balance, key){
      reset_wallet(from_id_wallet, from_initial_balance).then(result => {

         return reset_wallet(for_id_wallet, for_initial_balance);
      }).then(result => {
         return LOCK.unlock_by_key(from_id_wallet, for_id_wallet, key);
      }).then(result => {
         console.log('berhasil reset balance');
      }).catch(error => {
         //jika error lock harus dilepas
         LOCK.unlock_by_key(from_id_wallet, for_id_wallet, key).then(result => {
            console.log('release lock succes');
         })
         console.log(error);
      })
   }
}


//lock dilepas disini juga
function reset_wallet(id_wallet, wallet_initial_balance, key){
   return new Promise((resolve, reject) => {
      var reset_update = {
         balance: wallet_initial_balance
      };
   
      WalletModel.findById(id_wallet, { key: 1}).then(result => {
         if(!result){
            throw new Error('not-found');
         }

         if(result.key != key){
            throw new Error('key-forbidden')
         }

         WalletModel.findByIdAndUpdate(id_wallet, { $set: reset_update });
      }).then(result => {
         //bersihkan log dengan trans id tersebut
         return LOG.deleteMany({ trans_id: key });
      }).then(result => {
         //lepaskan lock
         return LOCK.unlock(id_wallet, key);
      }).then(result => {
         //selesai
         resolve(true);
      }).catch(error => {
         reject(error);
      });
   });
}
