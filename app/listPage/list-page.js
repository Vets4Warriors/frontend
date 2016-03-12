/**
 * Created by austin on 3/1/16.
 */


(function() {
    var app = angular.module('listPage', ['ngRoute', 'location-directives']);

    /* Will get fancier with this in the future. Potentially for individual location views. */
    app.config(['$routeProvider', function($routeProvider) {
        $routeProvider.when('/call', {controller: 'ListPageController'});   // Will use this for call handling
        $routeProvider.otherwise({redirectTo: '/list'});
    }]);

    app.controller('ListPageController', ['$scope', '$routeParams', '$location', '$http',
        function($scope, $routeParams, $location, $http) {
        var listPageCtrl = this;
        this.isAdding = $location.$$path === '/add';
        this.mapContainer = document.querySelector('google-map');
        this.currentLatLng = null;

        /*$http.get('/_config').success(function(config){
                listPageCtrl.mapContainer.apiKey = config['google-maps-api-key'];
            }).error(function() {
               console.log("Failed to get the config");
            });*/

        this.mapContainer.addEventListener('google-map-ready', function(e) {
            // Try to center the mapContainer with the users current position
            if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(
                    function (position) {
                        //success
                        console.log("Got the users current location!");
                        listPageCtrl.currentLatLng = [position.coords.latitude, position.coords.longitude];
                        listPageCtrl.zoomToLocation(listPageCtrl.currentLatLng);
                    }, function (error) {
                        // error, todo: show a toast
                        console.log("Couldn't get user's current location: " + error);
                    });
            }
        });

        this.setIsAdding = function(show) {
            console.log("isAdding: " + show);
            this.isAdding = show;
        };

        /**
         *  Easier to work with google maps api
         * @param latLng, {{lat: float, lng: float}}
         */
        this.zoomToLocation = function(latLng) {
            this.mapContainer.latitude = latLng.lat;
            this.mapContainer.longitude = latLng.lng;
        }
    }]);
})();