/**
 * Created by austin on 3/1/16.
 */


(function() {
    var app = angular.module('listPage', ['ngRoute', 'location-directives']);

    /* Will get fancier with this in the future. Potentially for individual location views. */
    app.config(['$routeProvider', function($routeProvider) {
        $routeProvider.when('/call', {controller: 'ListPageCtrl'});   // Will use this for call handling
        $routeProvider.when('/:id', {controller: 'ListPageCtrl'});    // will use to show specific locations
        $routeProvider.when('/:id/edit', {controller: 'TestCtrl'});    // will use to edit specific locations
        $routeProvider.when('/', {controller: 'ListPageCtrl'});    // will use to edit specific locations
        //$routeProvider.otherwise({ controller: 'ListPageCtrl'});
    }]);
    
    app.controller('TestCtrl', function() {
       console.log("test"); 
    });

    app.controller('ListPageCtrl', ['$scope', '$routeParams', '$location',
        function($scope, $routeParams, $location) {
            var listPageCtrl = this;
            this.isAdding = $location.$$path === '/add';
            this.isEditing = $location.$$path === '/edit';  // This will get ugly when we have a lot of views
            this.currentLatLng = null;

            $scope.editLocationId = '56e36c6cd2ccda2d35afcbd0';

            var mapContainer = document.querySelector('google-map');

            mapContainer.addEventListener('google-map-ready', function(e) {
                // Try to center the mapContainer with the users current position
                console.log("Map loaded! From list-page");
                if (navigator.geolocation) {
                    navigator.geolocation.getCurrentPosition(
                        function (position) {
                            //success
                            console.log("Got the users current location!");
                            listPageCtrl.currentLatLng = [position.coords.latitude, position.coords.longitude];
                            listPageCtrl.zoomToLocation(listPageCtrl.currentLatLng);
                        }, function (error) {
                            console.log("Couldn't get user's current location: " + error);
                        });
                }
            });


            listPageCtrl.setIsAdding = function(isAdding) {
                console.log("isAdding: " + isAdding);
                listPageCtrl.isAdding = isAdding;
            };

            listPageCtrl.listIsShowing = function() {
                return !listPageCtrl.isAdding && !listPageCtrl.isEditing;
            };

            /**
             *  Easier to work with google maps api
             * @param latLng, {{lat: float, lng: float}}
             */
            listPageCtrl.zoomToLocation = function(latLng) {
                listPageCtrl.currentLatLng = latLng;
                mapContainer.latitude = latLng.lat;
                mapContainer.longitude = latLng.lng;
            }
    }]);
})();