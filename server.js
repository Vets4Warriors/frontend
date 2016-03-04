/**
 * Created by austin on 3/2/16.
 *
 * A small node.js server to run our angular app
 *
 * Todo!
 */

(function() {
    require('newrelic');
    var express = require('express');
    var app = express();
    // For logging
    var morgan = require('morgan');


    //app.use(express.static(__dirname + '/public'));  // set the static files location
    app.use(morgan('dev')); // log every request to the console

    app.get('/', function(req, res) {
        res.sendFile('index.html');
    });

    app.get('/list', function(req, res) {
        res.sendFile('app/listPage/listPage.html');
    });



    // Start the server on port 8080
    console.log("Vet's frontend listening on port 8080!");
    app.listen(8080);
})();

