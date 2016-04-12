/**
 * Created by austin on 3/1/16.
 */


(function() {
    var app = angular.module('listPage', ['ngRoute', 'ui.router', 'location-directives']);

    /* Will get fancier with this in the future. Potentially for individual location views. */
    /*app.config(function($routeProvider) {
        $routeProvider.when('/call', {controller: 'ListPageCtrl'});   // Will use this for call handling
        $routeProvider.when('/:id', {controller: 'ListPageCtrl'});    // will use to show specific locations
        $routeProvider.when('/:id/edit', {controller: 'TestCtrl'});    // will use to edit specific locations
        $routeProvider.when('/', {controller: 'ListPageCtrl'});    // will use to edit specific locations
        //$routeProvider.otherwise({ controller: 'ListPageCtrl'});
    });*/

    app.config(function ($stateProvider, $urlRouterProvider) {
        $urlRouterProvider.otherwise("/list");

        $stateProvider
            .state('listView', {
                url: "/list",
                templateUrl: '/app/list-page/list-partial.html'
            })
            .state('addView', {
                url: '/add',
                templateUrl: "/app/list-page/add-partial.html",
                controller: 'AddViewCtrl'
            })
            .state('editView', {
                url: '/:id/edit',
                templateUrl: "/app/list-page/edit-partial.html",
                controller: 'EditViewCtrl'
            });
    });

    app.controller('ListPageCtrl', ['$scope', '$routeParams', '$location',
        function($scope, $routeParams, $location) {
            var listPageCtrl = this;
            this.currentLatLng = null;

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


    app.controller('AddViewCtrl', ['$scope', '$state', function($scope, $state) {
        /**
         * To be passed to the form
         * Navigates back to the default view
         */
        $scope.onClose = function() {
            $state.go("listView");
        };
    }]);


    /**
     * Main job: Bind the id of the location to the scope from the url path
     */
    app.controller('EditViewCtrl', ['$scope', '$stateParams', '$state',
        function($scope, $stateParams, $state) {

            /**
             * To be passed to the form
             * Navigates back to the default view
             */
            $scope.onClose = function() {
                $state.go("listView");
            };
            $scope.editLocationId = $stateParams.id;
    }]);
})();