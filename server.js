/**
 * Created by austin on 3/2/16.
 *
 * A small node.js server to run our angular app
 *  All node packages should be managed with npm (i.e. not with bower: [jQuery, angular, ...])
 */

require('newrelic');
require('del');
(function() {
    // The basic server
    var express = require('express');
    var utils = require('./utils');
    // For logging
    var morgan = require('morgan');
    var app = express();


    // Determine the environment
    var argv = require('optimist')
        .usage("Usage: $0 -e ['local', 'dev', 'prod']")
        .demand('e')
        .default('e', 'prod')
        .argv;

    utils.setEnv(argv.e);
    var config = utils.config();

    app.use(morgan(config['morgan-level'])); // log every request to the console

    // Todo: compile _assets and app into one static directory
    app.use('/_assets', express.static(__dirname + '/_assets'));
    app.use('/bower_components', express.static(__dirname + '/bower_components'));
    app.use('/app', express.static(__dirname + '/app'));

    /* Routes */
    app.get('/', function(req, res) {
        res.sendFile(__dirname + '/index.html');
    });

    app.get('/list', function(req, res) {
        res.sendFile(__dirname + '/app/listPage/list-page.html');
    });

    // Todo: make this into a gulp task
    app.get('/_config', function(req, res) {
        res.send(200, config);
    });

    // Start the server on port 8080
    console.log("Vet's frontend listening on port 8080!");
    app.listen(config['port']);
})();

