/**
 * Created by jeffm on 2/24/2016.
 */

(function(){
    var app = angular.module('main', ['ngRoute']);

    app.controller('mainController', function() {

    });

    /*app.config(['$routeProvider', function ($routeProvider) {

        $routeProvider
            .when('/', {
                controller: 'mainController',
                templateUrl: '/index.html'
        })
            .when('/list', {
                controller: 'listPageController',
                templateUrl: '/app/listPage/listPage.html'
        })
        .otherwise({redirectTo: '/'});
    }]);*/
})();