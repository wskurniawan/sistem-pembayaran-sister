const pending_model = require('./../model/pending');

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
      console.log('Transaksi pending ditambahkan');
   }).catch(error => {
      console.error(error);
   });
}