const WalletModel = require('./../model/wallet');
const LOCK = require('./../service/lock');
const LOG = require('./../model/log');

/*
Digunakan untuk mengembalikan state ke kondisi semula
Rollback masih menggunakan chain promise, kecuali untuk pelepasan lock
*/

module.exports.rollback_deposit = function(id_wallet, wallet_initial_balance, key){
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
};

