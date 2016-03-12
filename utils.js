/**
 * Created by austin on 3/11/16.
 */
var envConfigs = require('./env.json');

/**
 * Either 'local', 'dev', 'prod'
 * @param env
 */
exports.setEnv = function(env) {
    process.env.VETS_ENV = env;
};

/**
 * For running
 */
exports.config = function() {
    var vets_env = process.env.VETS_ENV || 'prod';
    return envConfigs[vets_env];
};