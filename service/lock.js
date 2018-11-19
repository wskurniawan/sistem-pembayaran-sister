const jsonfile = require('jsonfile');

const PENDING_TRANSACTION = require('./../transaction/pending-transaction');
const realtime_db = require('firebase-admin').database();

//wallet ref
const wallet_ref = realtime_db.ref('wallet');

//model
const WalletModel = require('./../model/wallet');

module.exports.is_locked = function(id_wallet){
   return new Promise((resolve, reject) => {
      WalletModel.findById(id_wallet, {lock: 1}).then(result => {
         if(!result){
            throw new Error('not-found');
         }

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
         if(!result){
            throw new Error('not-found');
         }

         if(result.lock){
            throw new Error('resource-locked');
         }

         return WalletModel.findByIdAndUpdate(id_wallet, { $set: update_lock });
      }).then((result) => {
         //visualisasi
         update_wallet_lock(id_wallet, true, key);

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
         if(!result){
            throw new Error('not-found');
         }
         
         if(result.key != key){
            throw new Error('key-forbidden');
         }

         return WalletModel.findByIdAndUpdate(id_wallet, { $set: update_lock });
      }).then(result => {
         //update realtime db
         update_wallet_lock(id_wallet, false, '');
         
         //setelah unlock, broadcast pending transaction disini
         PENDING_TRANSACTION.broadcast_free_lock(id_wallet);

         resolve(result);
      }).catch(error => {
         //write_log({ error: error.message });
         reject(error);
      });
   });
}

//khusus untuk transfer
module.exports.unlock_by_key = function(first_id_wallet, second_id_wallet, key){
   return new Promise((resolve, reject) => {
      var update_lock = {
         lock: false,
         key: ''
      };

      WalletModel.updateMany({key: key}, { $set: update_lock }).then(result => {
         console.log(result);
         return this.is_locked(first_id_wallet);
      }).then(lock_status => {
         if(!lock_status){
            update_wallet_lock(first_id_wallet, false, '');
            PENDING_TRANSACTION.broadcast_free_lock(first_id_wallet);
         }

         return this.is_locked(second_id_wallet);
      }).then(lock_status => {
         if(!lock_status){
            update_wallet_lock(second_id_wallet, false, '');
            PENDING_TRANSACTION.broadcast_free_lock(second_id_wallet);
         }

         //selesai
         resolve(true);
      }).catch(error => {
         reject(error);
      });
   });
};

//untuk realtime db
function update_wallet_lock(id_wallet, lock_status, key){
   wallet_ref.child(id_wallet).update({
      lock: lock_status,
      key: key
   }).then(() => {
      console.log('update realtime db berhasil');
   }).catch(error => {
      console.log(error);
   });
}

//writelog
function write_log(data){
   var path = __dirname  + '/log/error' + Date.now() + '.json';
   jsonfile.writeFile(path, data, function(err){
      if(err){
         console.log(err);
      }
   });
}