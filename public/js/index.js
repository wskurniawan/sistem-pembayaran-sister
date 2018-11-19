//const database = require('firebase-admin').database();
var database;

$(document).ready(function(){
   var list_id = [];
   $('.item-wallet').each(function () {
      list_id.push(this.id);
   });

   // Initialize Firebase
   var config = {
      apiKey: "AIzaSyAouw5gIm9VkBI3QTeVi2XbBnzuHjmgpZY",
      authDomain: "sistem-pembayaran-3c398.firebaseapp.com",
      databaseURL: "https://sistem-pembayaran-3c398.firebaseio.com",
      projectId: "sistem-pembayaran-3c398",
      storageBucket: "sistem-pembayaran-3c398.appspot.com",
      messagingSenderId: "391168825273"
   };
   firebase.initializeApp(config);

   database = firebase.database();

   for(i in list_id){
      initListener(list_id[i]);
   }
});

function initListener(id_wallet){
   var ref = database.ref('wallet/' + id_wallet);

   //listen balance
   ref.child('balance').on('value', function(snapshot){
      renderBalance(id_wallet, snapshot.val());
   });

   ref.child('lock').on('value', function(snapshot){
      renderLockStatus(id_wallet, snapshot.val());
   });

   ref.child('key').on('value', function(snapshot){
      renderKey(id_wallet, snapshot.val());
   });
}

function renderBalance(id_wallet, balance){
   $('#balance-' + id_wallet).text(balance);
}

function renderKey(id_wallet, key){
   $('#key-' + id_wallet).text(key);
}

function renderLockStatus(id_wallet, lock){
   if(lock){
      $('#' + id_wallet).css('background', '#B71C1C');
   }else{
      $('#' + id_wallet).css('background', '#009688');
   }
}