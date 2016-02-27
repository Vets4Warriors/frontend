/**
 * Created by austin on 2/26/16.
 */
(function() {
    var app = angular.module('location-directives', []);

    app.controller('LocationListController', ['$http', '$log', function($http, $log) {
        var list = this;
        list.locations = [];

        $http.get('http://localhost:8000/locations')
            .success(function(data) {
                list.locations = angular.fromJson(data);
            })
            .error(function(data) {
                $log.error(data);
            });
    }]);
})();