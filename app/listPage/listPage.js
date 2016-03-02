/**
 * Created by austin on 3/1/16.
 */


(function() {
    var app = angular.module('listPage', ['ngRoute', 'location-directives']);

    app.controller('listPageController', function() {
        this.x = 'test';
    });

    app.config(['$routeProvider', function ($routeProvider) {

    }]);

})();