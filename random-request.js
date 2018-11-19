const axios = require('axios').default;

const HOST = 'http://127.0.0.1:5003';

var list_account = [];
var list_transaction = ['deposit', 'get-balance', 'withdraw', 'transfer'];

axios.get(HOST + '/wallet/list-wallet').then(result => {
   list_account = result.data.data;
   console.log(list_account);
   
   random_request();
}).catch(error => {
   console.log(error);
});



function random_request(){
   /*do{

   }while(true);*/

   for(var i = 0; i < 100; i++){
      var index_transaction = Math.floor(Math.random() * list_transaction.length);
      var transaction = list_transaction[index_transaction];
      
      if(transaction === 'deposit'){
         var user_index = Math.floor(Math.random() * list_account.length);
         var id_wallet = list_account[user_index].id;
         var amount = Math.floor(Math.random() * 500);

         deposit(id_wallet, amount);
      }else if(transaction === 'withdraw'){
         var user_index = Math.floor(Math.random() * list_account.length);
         var id_wallet = list_account[user_index].id;
         var amount = Math.floor(Math.random() * 500);

         withdraw(id_wallet, amount);
      }else if(transaction === 'get-balance'){
         var user_index = Math.floor(Math.random() * list_account.length);
         var id_wallet = list_account[user_index].id;

         get_balance(id_wallet);
      }else if(transaction === 'transfer'){
         var user_index = Math.floor(Math.random() * list_account.length);
         var from = list_account[user_index].id;

         user_index = Math.floor(Math.random() * list_account.length);
         var to = list_account[user_index].id;
         var amount = Math.floor(Math.random() * 500);

         transfer(from, to, amount);
      }else{
         console.log(transaction);
      }
   }
}

function deposit(id_wallet, amount){
   var body = {
      id_wallet: id_wallet,
      amount: amount
   };

   axios.post(HOST + '/wallet/deposit', body).then(result => {
      console.log(result.data);
   }).catch(error => {
      console.log(error);
   });
}

function withdraw(id_wallet, amount){
   var uri = HOST + '/wallet/' + id_wallet + '/withdraw/' + amount;

   axios.get(uri).then(result => {
      console.log(result.data);
   }).catch(error => {
      console.log(error);
   });
}

function get_balance(id_wallet){
   var uri = HOST + '/wallet/' + id_wallet + '/balance';

   axios.get(uri).then(result => {
      console.log(result.data);
   }).catch(error => {
      console.log(error);
   });
}

function transfer(from, to, amount){
   if(from === to){
      console.log(from + ' to ' + to);
      return;
   }else{
      var body = {
         from: from,
         to: to,
         amount: amount
      };
   
      axios.post(HOST + '/wallet/transfer', body).then(result => {
         console.log(result.data);
      }).catch(error => {
         console.log(error);
      });
   }
}