var app = angular.module('myApp', []);
app.controller('myCtrl', function ($scope, $interval, $window) {



     $scope.reinicio = function() {
        setTimeout(function() {
          $scope.$apply(function() {
            //wrapped this within $apply
            console.log('reinicio de la pagina');
            $window.location.reload();
          });
        }, 60000); 
      }


	$scope.reinicio();


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

  const tokenDivId = 'token_div';
  const permissionDivId = 'permission_div';

  messaging.onTokenRefresh(function () {
    messaging.getToken()
      .then(function (refreshedToken) {
        console.log('Token refreshed.');
        setTokenSentToServer(false);
        sendTokenToServer(refreshedToken);
        resetUI();
      })
      .catch(function (err) {
        console.log('Unable to retrieve refreshed token ', err);
        showToken('Unable to retrieve refreshed token ', err);
      });
  });

  messaging.onMessage(function (payload) {
    console.log("Message received. ", payload);
    //se recibe mensaje desde la nube, donde el celular solicita codigo
    //$scope.solicitarCodigo(payload)
    $scope.solicitarCodigosV2(payload)
  });


  $scope.solicitarCodigosV2 = function (playload) {
    var datos = playload.data;
    fetch("http://localhost:8085/service/obtenerCodigosSMSyVoz", {
      method: "POST",
      timeout: 5000,
      headers: {
        "Content-type": "application/x-www-form-urlencoded"
      },
      body: "pa_FchInicio=" + datos.pa_FchInicio + "&pa_FchFin=" + datos.pa_FchFin + "&destinatario=" + datos.destinatario + "&to=" + datos.to + "&telefono=" + datos.telefono
    }).then(function (res) {            
      return res.json()
    }).then(function (objeto) {
      console.log("--- Respuesta del servicio que trae codigos de SMS y llamada de voz ---");
      console.log('SMS');
      console.log(objeto.salida.SMS);
      console.log('VOZ');
      console.log(objeto.salida.VOZ);
    }).catch(function (e) {
      console.log("*********** ERROR ************", e)
      $scope.mandarError("No hay conexion con el servicio de envio de codigos :( Hay que ir a levantarlo manualmente",datos.to);
    });
  }
  $scope.mandarError = function (error,to) {

    var jsnoErrorEnvio = {
      "notification": {
        "title": "Error :(",
        "body": error,
        "sound": "default"
      },
      "to":to,
      "time_to_live": 15,
      "priority": "high"
    }

    fetch("https://fcm.googleapis.com/fcm/send", {
      method: "POST",
      headers: {
        'Authorization': 'key=AAAAsISpCi0:APA91bG6Orm8wZmCDCgRMKLlkZSQgF5RjVJc0gLx6wDXCekzuXgM1QXurRinNIn0sotQhxMkpJByX5A5E201d87fYpr91vAh5qY8p_nWf9kCeh583JJPBxiGtjUDWcxOtjtCyW6_gmRu',
        'content-type': 'application/json'
      },
      body: JSON.stringify(jsnoErrorEnvio)
    }).then(function (res) {
      console.log("Error de retorno en enviar error");
      return res.json()
    }).then(function (objeto) {
      console.log('Respuesta de mandar error a los celulares');
      console.log(objeto);
      
    }).catch(function (e) {
      console.log("*********** ERROR AL MANDAR EL ERROR************", e)
    });
  }


  /*
    $scope.solicitarCodigo = function (playload) {
  
      $scope.datos = playload.data;
  
      fetch("http://10.51.145.97:8080/YakanaAuthServer/webresources/monitor", {
        method: "POST",
        headers: {
          "Content-type": "application/x-www-form-urlencoded"
        },
        body: "pa_FchInicio=" + $scope.datos.pa_FchInicio + "&pa_FchFin=" + $scope.datos.pa_FchFin + "&destinatario=" + $scope.datos.destinatario
      }).then(function (res) {
        return res.text()
      }).then(function (data) {
        //TO-DO
        console.log("**** Respuesta de servicio de MEMO ****");
        console.log(data)
        console.log("---------------------------------------");
  
        //Se procede a mandar los codigos solicitados a la nube para que los envie al celular correspondiente
        try {
          var codigos = JSON.parse(data);
  
  
  
          //se envian codigos al servidor de la nube para que las envíe al telefono especificado en to ********************
  
          fetch("https://learning-mongo-and-node-omarfuzzer.c9users.io/service/enviaralTelefonoV2", {
            method: "POST",
            headers: {
              "Content-type": "application/x-www-form-urlencoded"
            },
            body: "data=" + data + "&to=" + $scope.datos.to
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
  /*
        } catch (error) {
          console.log(error + " Object: " + JSON.stringify(codigos))
          return
        }
        //****** se termina de enviar codigos a la nube */
  /*
      });
    }
  
    */

  function resetUI() {

    showToken('loading...');
    messaging.getToken()
      .then(function (currentToken) {
        if (currentToken) {
          sendTokenToServer(currentToken);
          //updateUIForPushEnabled(currentToken);
        } else {
          console.log('No Instance ID token available. Request permission to generate one.');
          //updateUIForPushPermissionRequired();
          setTokenSentToServer(false);
        }
      })
      .catch(function (err) {
        console.log('An error occurred while retrieving token. ', err);
        showToken('Error retrieving Instance ID token. ', err);
        setTokenSentToServer(false);
      });
  }

  function showToken(currentToken) {
    // Show token in console and UI.
    //var tokenElement = document.querySelector('#token');
    //tokenElement.textContent = currentToken;

    console.log("****  currentToken  *******");
    console.log(currentToken);
    console.log("***********");
  }


  function sendTokenToServer(currentToken) {
    if (!isTokenSentToServer()) {
      console.log('Sending token to server...');
      // TODO(developer): Send the current token to your server.
      setTokenSentToServer(true);
    } else {
      console.log('Token already sent to server so won\'t send it again ' +
        'unless it changes');
    }

  }

  function isTokenSentToServer() {
    return window.localStorage.getItem('sentToServer') == 1;
  }

  function setTokenSentToServer(sent) {
    window.localStorage.setItem('sentToServer', sent ? 1 : 0);
  }

  function showHideDiv(divId, show) {
    const div = document.querySelector('#' + divId);
    if (show) {
      div.style = "display: visible";
    } else {
      div.style = "display: none";
    }
  }



  function requestPermission() {
    console.log('Requesting permission...');
    messaging.requestPermission()
      .then(function () {
        console.log('Notification permission granted.');
        resetUI();
      })
      .catch(function (err) {
        console.log('Unable to get permission to notify.', err);
      });
  }

  function deleteToken() {
    messaging.getToken()
      .then(function (currentToken) {
        messaging.deleteToken(currentToken)
          .then(function () {
            console.log('Token deleted.');
            setTokenSentToServer(false);
            resetUI();
          })
          .catch(function (err) {
            console.log('Unable to delete token. ', err);
          });
      })
      .catch(function (err) {
        console.log('Error retrieving Instance ID token. ', err);
        showToken('Error retrieving Instance ID token. ', err);
      });
  }
  resetUI();
});
