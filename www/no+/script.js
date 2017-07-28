var app = angular.module('myApp', []);
app.controller('myCtrl', function ($scope) {


var config = {
    apiKey: "AIzaSyDdAuSPsNL1S5GdVaHPdAHkd_UhW3vt0FI",
    authDomain: "miefectivocliente-ios.firebaseapp.com",
    databaseURL: "https://miefectivocliente-ios.firebaseio.com",
    projectId: "miefectivocliente-ios",
    storageBucket: "miefectivocliente-ios.appspot.com",
    messagingSenderId: "758139914797"
  };
  firebase.initializeApp(config);



  const messaging = firebase.messaging();
  
  messaging.requestPermission()
  .then(function() {
      console.log("tienes permiso");
  })
  .catch(function(err){
      console.log("Error");
  })
  




        //consumo de servicio de memo
     /*   fetch("http://10.51.145.97:8080/YakanaAuthServer/webresources/monitor", {
            method: "POST",
            headers: {
                "Content-type": "application/x-www-form-urlencoded"
            },
            body: "pa_FchInicio=" + data.pa_FchInicio + "&pa_FchFin=" + data.pa_FchFin + "&destinatario=" + data.destinatario
        }).then(function (res) {
            return res.text()
        }).then(function (data) {
            $scope.logs = []
            var logs = []
            try {
                var codigos = JSON.parse(data)
                console.log("********************");
                console.log(codigos);
                console.log("********************");

                //se envia con pusher al telefono ********************

                fetch("http://10.51.146.165:8083/service/sendToPhone", {
                    method: "POST",
                    headers: {
                        "Content-type": "application/x-www-form-urlencoded"
                    },
                    body: "data=" + data
                }).then(function (res) {
                    return res.text()
                }).then(function (data) {
                    
                    
                    try {
                    
                        console.log(" enviado al telefono");
                        console.log(data);
                        console.log("********************");

                    } catch (error) {
                        console.log(error + " Object: " + JSON.stringify(data))
                        return
                    }

                });
                //********************************************** */


        /*    } catch (error) {
                console.log(error + " Object: " + JSON.stringify(codigos))
                return
            }

        });

        //********************** */



    


});
