

//model
const WalletModel = require('./../model/wallet');

module.exports.is_locked = function(id_wallet){
   return new Promise((resolve, reject) => {
      WalletModel.findById(id_wallet, {lock: 1}).then(result => {
         if(result.lock){
            resolve(true);
         }else{
            resolve(false);
         }
      }).catch(error => {
         reject(error);
      });
   });
}

module.exports.lock = function(id_wallet, key){
   var update_lock = {
      lock: true,
      key: key
   };

   return new Promise((resolve, reject) => {
      WalletModel.findById(id_wallet, { lock: 1} ).then(result => {
         if(result.lock){
            throw new Error('resource-locked');
         }

         return WalletModel.findByIdAndUpdate(id_wallet, { $set: update_lock });
      }).then((result) => {
         resolve(true);
      }).catch(error => {
         reject(error);
      });
   });
}

module.exports.unlock = function(id_wallet, key){
   var update_lock = {
      lock: false,
      key: ''
   };

   return new Promise((resolve, reject) => {
      WalletModel.findById(id_wallet, { key: 1}).then(result => {
         if(result.key != key){
            throw new Error('key-forbidden');
         }

         return WalletModel.findByIdAndUpdate(id_wallet, { $set: update_lock });
      }).then(result => {
         //setelah unlock, broadcast pending transaction disini


         resolve(result);
      }).catch(error => {
         reject(error);
      });
   });
}