var request = require('request');
var express = require('express');
var fs = require('fs');
var request2 = require('sync-request');
var compression = require('compression')

var shell = require('shelljs/global');



var app = express();

//__ CORS __
app.use(function (req, res, next) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');
    res.setHeader('Access-Control-Allow-Credentials', true);
    next();
});

app.use(compression());

var server = require('http').Server(app);
var bodyParser = require('body-parser');

app.use(bodyParser.urlencoded({
    extended: true
}));

server.listen(8085, function () {
    console.log('ServerGuardias running on 8085 port');
});

var chrome = exec('google-chrome-stable --app=http://localhost:8085/guardia.html --ignore-certificate-errors', {async:true});
chrome.stdout.on('data', function(data){
//TODO CHROME LOG
	console.log("***** LOG CHOMR ******")
	console.log(data);
});


// __ Express Server __
app.use('/', express.static(__dirname + '/www'));

var log_file = fs.createWriteStream(__dirname + '/debug.log', { flags: 'w' });
var log_stdout = process.stdout;

app.post('/service/obtenerCodigosSMSyVoz', function (req, res) {
    console.log("Servicio consumido POST");
    console.log("/service/obtenerCodigosSMSyVoz");
    console.log(req.body);

    var datos = req.body;
    var salida = {};

    request.post({
        headers: {
            'content-type': 'application/x-www-form-urlencoded'
        },
        url: "http://10.51.145.97:8080/Kloud/webresources/monitor",
        body: "fchInicio=" + datos.pa_FchInicio + "&fchFin=" + datos.pa_FchFin + "&filtro=numero" + "&valorFiltro="+datos.destinatario+"&pagina=1"
    }, function (error, response, body) {
        console.log("body response monitor SMS");


        var respuesta = []
        try {
            respuesta = JSON.parse(body);
           // console.log(respuesta);
        } catch (e) {
            console.log(e);
        }

        console.log(respuesta.length);

        var RSMS = [];
        if (respuesta.length > 10) {
            for (var i = 0; i < 5; i++) {
                RSMS.push(respuesta[i]);
            }

        } else {
            RSMS = respuesta;
        }

        salida.SMS = RSMS;







        //se tiene la primera respuesta de codigos de SMS vamos por lode de VOZ
        //body: "targetContext=http://10.63.11.173:8080/BAZDigitalVoiceServices/webresources/getLogs" + "&pa_FchInicio=" + datos.pa_FchInicio + "&pa_FchFin=" + datos.pa_FchFin
        request.post({
            headers: {
                'content-type': 'application/x-www-form-urlencoded'
            },
            url: "http://10.51.145.97:8080/Kloud/webresources/superPoweredRequest",
            body: "targetContext=http://10.63.11.173:8080/BAZDigitalVoiceServices/webresources/GetInfoByFilter" +"&fchInicio=" + datos.pa_FchInicio + "&fchFin=" + datos.pa_FchFin + "&filtro=numero" + "&valorFiltro="+datos.destinatario+"&pagina=1"
        }, function (error, response, body) {
            console.log("body response monitor VOZ");
            console.log(body);

            var codigos = [];
            var _body = [];
            log = [];
            try {
                _body = JSON.parse(body);
                log = _body.Log || [];
            } catch (e) {
                console.log(" Error al parsear el objeto de codigos de Voz >> " + e);
            }

            for (var i = log.length - 1; i >= 0; i--)
                if (log[i].destinatarios.indexOf(datos.destinatario) != -1) {



                    var r = /\d+/g;
                    var codigoLimpio = (log[i].parametros).replace(/1s/g, "");
                    codigoLimpio = (codigoLimpio).match(r);

                    codigoLimpio = codigoLimpio.join("");




                    codigos.push({
                        "fecha": log[i].fecha,
                        "codigo": codigoLimpio,
                        "tipo": log[i].idFuncionalidad,
                        "logId": log[i].logId,
                        "destinatario": log[i].destinatarios
                    });
                }





            console.log(codigos.length);

            var RVOZ = [];
            if (codigos.length > 10) {
                for (var j = 0; j < 5; j++) {
                    RVOZ.push(codigos[j]);
                }
            } else {
                RVOZ = codigos;
            }



            salida.VOZ = RVOZ;



            console.log(salida);


            //***************mandar a firebase para el telefono*************
            var jsnoEnvio = {
                "data": {
                    "SMS": salida.SMS,
                    "VOZ": salida.VOZ
                },
                "to": datos.to,
                "time_to_live": 15,
                "priority": "high"
            }

            request.post({
                headers: {
                    'Authorization': 'key=AAAAsISpCi0:APA91bG6Orm8wZmCDCgRMKLlkZSQgF5RjVJc0gLx6wDXCekzuXgM1QXurRinNIn0sotQhxMkpJByX5A5E201d87fYpr91vAh5qY8p_nWf9kCeh583JJPBxiGtjUDWcxOtjtCyW6_gmRu',
                    'content-type': 'application/json'
                },
                url: "https://fcm.googleapis.com/fcm/send",
                body: JSON.stringify(jsnoEnvio)
            }, function (error, response, body) {
                console.log("Respuesta FIREBASE");
                console.log(body);

            });
            // ---- mandar a firebase para el telefono -----------------

            res.send({
                salida
            });

        });
        //******************************************************************* */



    });
});



var QueryPhoneVoice = {

    potingList: {},
    metaList: {},
    metaCounter: 0,
    autocomplete: {},

    clearIndex: function () {
        this.potingList = {};
        this.metaList = {};
        this.metaCounter = 0;
        this.autocomplete = {};
    },

    index: function (obj, text) {
        var idMeta = '#' + this.metaCounter++;
        var tkn = this.tokenizer(text);

        this.metaList[idMeta] = obj;

        for (var i = tkn.length - 1; i >= 0; i--) {

            // Index to Posting List
            var _tkn = tkn[i];

            if (!(_tkn in this.potingList))
                this.potingList[_tkn] = {};

            this.potingList[_tkn][idMeta] = true;

            // Index to Autocomplete
            var trigram = this.getTrigrams(_tkn);
            var k = trigram.length;

            while (k--) {

                if (!(trigram[k] in this.autocomplete))
                    this.autocomplete[trigram[k]] = {};

                this.autocomplete[trigram[k]][_tkn] = true;
            }
        }
    },

    buscar: function (query) {
        var q = this.tokenizer(query);
        var p = {};
        var r = [];

        p = this.getPostingList(q[0]);

        for (var i = 1; i < q.length; i++)
            p = this.__and(p, this.getPostingList(q[i]));

        for (idMeta in p)
            r.push(this.metaList[idMeta]);

        return r;
    },

    tokenizer: function (text) {
        var txt = text.replace(/[^a-zA-Z0-9Ã¡Ã©Ã­Ã³ÃºÃ±ÃÃ‰ÃÃ“ÃšÃ‘]+/g, ' ').toLowerCase().trim();

        txt = txt.replace(/Ã¡/g, 'a');
        txt = txt.replace(/Ã©/g, 'e');
        txt = txt.replace(/Ã­/g, 'i');
        txt = txt.replace(/Ã³/g, 'o');
        txt = txt.replace(/Ãº/g, 'u');
        txt = txt.replace(/Ã±/g, 'Ã±');

        return txt.split(' ');
    },

    getTrigrams: function (text) {
        var tri = [];

        if (text.length > 3)
            for (var i = text.length - 3; i >= 0; i--)
                tri.push(text[i] + text[i + 1] + text[i + 2]);
        else
            tri.push(text);

        return tri;
    },

    getPostingList: function (text) {
        if (text in this.potingList) {
            return this.potingList[text];
        } else {
            var trigram = this.getTrigrams(text);
            var applyAnd = false;
            var tokenList = {};

            for (var i = 0; i < trigram.length; i++) {
                var _trigram = trigram[i];

                if (_trigram in this.autocomplete)
                    if (applyAnd) {
                        tokenList = this.__and(tokenList, this.autocomplete[_trigram]);
                    } else {
                        tokenList = this.autocomplete[_trigram];
                        applyAnd = true;
                    }
            }

            var postingListMerged = {};
            for (tkn in tokenList)
                postingListMerged = this.__or(postingListMerged, this.potingList[tkn]);

            return postingListMerged;
        }
    },

    __and: function (p1, p2) {
        var pf = {};

        for (idMeta in p1)
            if (idMeta in p2)
                pf[idMeta] = true;

        return pf;
    },

    __or: function (p1, p2) {
        var pf = {};

        for (idMeta in p1)
            pf[idMeta] = true;

        for (idMeta in p2)
            pf[idMeta] = true;

        return pf;
    },
};




