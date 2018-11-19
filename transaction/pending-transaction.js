const pending_model = require('./../model/pending');

//transaction
const DEPOSIT = require('./deposit');
const WITHDRAW = require('./withdraw');
const TRANSFER = require('./transfer');

const realtime_db = require('firebase-admin').database();

//ref
const pending_ref = realtime_db.ref('pending');

//operasi pending dibiarkan di loop tersendiri
module.exports.pending_deposit = function(id_wallet, amount){
   var pending_data = {
      type: 'deposit',
      requesting_user_id: id_wallet,
      first_wallet_id: id_wallet,
      second_wallet_id: '',
      amount: amount,
      timestamp: new Date()
   };

   pending_model.create(pending_data).then(result => {
      realtime_db_insert_pending(result._id.toString(), pending_data.type, pending_data.requesting_user_id, pending_data.first_wallet_id, pending_data.second_wallet_id, pending_data.amount, pending_data.timestamp);
      console.log('Transaksi pending ditambahkan');
   }).catch(error => {
      console.error(error);
   });
}

module.exports.pending_withdraw = function(id_wallet, amount){
   var pending_data = {
      type: 'withdraw',
      requesting_user_id: id_wallet,
      first_wallet_id: id_wallet,
      second_wallet_id: '',
      amount: amount,
      timestamp: new Date()
   };

   pending_model.create(pending_data).then(result => {
      realtime_db_insert_pending(result._id.toString(), pending_data.type, pending_data.requesting_user_id, pending_data.first_wallet_id, pending_data.second_wallet_id, pending_data.amount, pending_data.timestamp);
      console.log('Transaksi pending ditambahkan');
   }).catch(error => {
      console.error(error);
   });
}

module.exports.pending_transfer = function(first_wallet_id, second_wallet_id, amount, key){
   if(first_wallet_id === second_wallet_id){
      return; 
   }
   
   var pending_data = {
      type: 'transfer',
      requesting_user_id: first_wallet_id,
      first_wallet_id: first_wallet_id,
      second_wallet_id: second_wallet_id,
      amount: amount,
      timestamp: new Date()
   };

   pending_model.create(pending_data).then(result => {
      realtime_db_insert_pending(result._id.toString(), pending_data.type, pending_data.requesting_user_id, pending_data.first_wallet_id, pending_data.second_wallet_id, pending_data.amount, pending_data.timestamp, key);
      console.log('Transaksi pending ditambahkan');
   }).catch(error => {
      console.error(error);
   });
}

module.exports.broadcast_free_lock = function(id_wallet){
   process_pending_transaction(id_wallet);
}


//proses loop untuk transaksi pending
function process_pending_transaction(id_wallet){
   pending_model.findOne({ $or: [{ first_wallet_id: id_wallet }, { second_wallet_id: id_wallet }]}).sort({ timestamp: 1 }).then(result => {
      if(!result){
         return;
      }

      console.log(result);

      //proses transaksi
      var transaction = result;
      pending_model.findByIdAndRemove(transaction._id).then(result => {
         //delete dari realtime db juga
         realtime_db_delete_pending(transaction._id.toString());

         if(transaction.type === 'deposit'){
            DEPOSIT.deposit(transaction.first_wallet_id, transaction.amount).then(result => {
               console.log('Pending transaction berhasil dikerjakan');
            }).catch(error => {
               console.error(error);
            });
         }else if(transaction.type === 'withdraw'){
            WITHDRAW.withdraw(transaction.first_wallet_id, transaction.amount).then(result => {
               console.log('Pending transaction berhasil dikerjakan');
            }).catch(error => {
               console.error(error);
            });
         }else if(transaction.type === 'transfer'){
            TRANSFER.transfer(transaction.first_wallet_id, transaction.second_wallet_id, transaction.amount).then(result => {
               console.log('Pending transaction berhasil dikerjakan');
            }).catch(error => {
               console.error(error);
            });
         }
      }).catch(error => {
         console.log(error);
      });
   }).catch(error => {
      console.log(error);
   });
}

//insert ke realtime db
function realtime_db_insert_pending(id, type, requesting_user_id, first_wallet_id, second_wallet_id, amount, timestamp, key){
   pending_ref.child(id).set({ id, type, requesting_user_id, first_wallet_id, second_wallet_id, amount, timestamp, key}).then(() => {
      console.log('insert realtime db berhasil');
   }).catch(error => {
      console.error(error);
   });
}

//remove dari realtime db
function realtime_db_delete_pending(id){
   pending_ref.child(id).remove().then(() => {
      console.log('data pending dihapus dari realtime db');
   }).catch(error => {
      console.log(error);
   });
}