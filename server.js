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

    var env = argv.e;
    utils.setEnv(env);
    var config = utils.config();

    app.use(morgan(config['morgan-level'])); // log every request to the console

    // Todo: compile _assets and app into one static directory
    app.use('/_assets', express.static(__dirname + '/_assets'));
    app.use('/bower_components', express.static(__dirname + '/bower_components'));

    /* Routes */
    if (env === 'dev' || env === 'local') {
        /* DEV ROUTES */
        app.use('/app', express.static(__dirname + '/app'));

        app.get('/', function(req, res) {
            res.sendFile(__dirname + '/index.html');
        });

        app.get('/resources', function(req, res) {
            res.sendFile(__dirname + '/app/list-page/list-page.html');
        });

        app.get('/_config', function(req, res) {
            res.status(200).send(config);
        });
    } else {    // Default
        /* PROD ROUTES
         * Should be the same as dev routes but from the dist directory
         * -> where our app is compiled */
        app.use('/app', express.static(__dirname + '/dist'));

        app.get('/', function(req, res) {
            res.sendFile(__dirname + '/dist_index.html');
        });

        app.get('/resources', function(req, res) {
            res.sendFile(__dirname + '/dist/list-page/list-page.html');
        });
    }

    console.log("Vet's frontend listening on port: " + config['port'],
        "in " + env + " mode.");
    app.listen(config['port']);
})();

