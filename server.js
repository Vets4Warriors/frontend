/**
 * Created by austin on 3/2/16.
 *
 * A small node.js server to run our angular app
 *
 */

(function() {
    require('newrelic');
    var express = require('express');
    var app = express();
    // For logging
    var morgan = require('morgan');


    //app.use(express.static(__dirname + '/public'));  // set the static files location
    app.use(morgan('dev')); // log every request to the console

    app.use('/_assets', express.static(__dirname + '/_assets'));
    app.use('/bower_components',express.static(__dirname + '/bower_components'));
    app.use('/app',express.static(__dirname + '/app'));

    app.get('/', function(req, res) {
        res.sendFile(__dirname + '/index.html');
    });

    app.get('/list', function(req, res) {
        res.sendFile(__dirname + '/app/listPage/listPage.html');
    });

    // Start the server on port 8080
    console.log("Vet's frontend listening on port 8080!");
    app.listen(8080);
})();

