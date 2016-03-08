/**
 * Created by austin on 3/2/16.
 *
 * A small node.js server to run our angular app
 *  All node packages should be managed with npm (i.e. not with bower: [jQuery, angular, ...])
 */

require('newrelic');
require('del');
(function() {
    var express = require('express');
    // For logging
    var morgan = require('morgan');

    var app = express();

    app.use(morgan('dev')); // log every request to the console

    // Todo: compile _assets and app into one static directory
    app.use('/_assets', express.static(__dirname + '/_assets'));
    app.use('/bower_components',express.static(__dirname + '/bower_components'));
    app.use('/app',express.static(__dirname + '/app'));

    /* Routes */
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

