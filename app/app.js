/**
 * Created by austin on 3/1/16.
 */
(function() {
    var app = angular.module('listPage', ['ngMaterial', 'ngRoute', 'ui.router', 'uiGmapgoogle-maps', 'locationDirectives']);

    /**
     * Todo: Implement callView
     */
    app.config(function ($stateProvider, $urlRouterProvider, uiGmapGoogleMapApiProvider) {
        $urlRouterProvider.otherwise("/list");

        $stateProvider
            .state('listView', {
                url: "/list",
                templateUrl: '/app/partials/list-partial.html'
            })
            .state('addView', {
                url: '/add',
                templateUrl: "/app/partials/add-partial.html",
                controller: 'AddViewCtrl'
            })
            .state('editView', {
                url: '/:id/edit',
                templateUrl: "/app/partials/edit-partial.html",
                controller: 'EditViewCtrl'
            })
            .state('callView', {
                url: '/call',
                templateUrl: "/app/partials/call-partial.html",
                controller: 'CallViewCtrl'
            });
        
        uiGmapGoogleMapApiProvider.configure({
            libraries: 'places',
            key: 'AIzaSyAbH91Y_ikGOeXR5rupXe1ARQzxLuvw7SE'
        })
    });

    /**
     * Loads the Google Map, sets the center to the user's current location
     */
    app.controller('ListPageCtrl', ['$scope', '$rootScope', 'uiGmapIsReady',
        function($scope, $rootScope, uiGmapIsReady) {
            var listPageCtrl = this;
            listPageCtrl.currentLatLng = null;
            $rootScope.mapCtrl = null;
            
            $scope.mapCenter = {latitude: 40.730610, longitude: -73.935242};
            $scope.mapOptions = {
                center: {lat: 40.730610, lng: -73.935242},
                zoom: 8,
                tilt: 0,
                //mapTypeId: 'ROADMAP',
                disableDefaultUI: true
            };
            
            uiGmapIsReady.promise(1).then(function(instances) {
               console.log("Gmap Ready!");
                if (navigator.geolocation) {
                    navigator.geolocation.getCurrentPosition(
                        function (position) {
                            //success
                            console.log("Got the users current location!");
                            listPageCtrl.zoomToLocation({
                                lat: position.coords.latitude,
                                lng: position.coords.longitude
                            });
                        }, function (error) {
                            console.log("Couldn't get user's current location: " + error);
                        });
                }
            });
            
            /*document.addEventListener('google-maps-api-loaded', function() {
                console.log("Google maps loaded from the listPage");
                var mapOptions = {
                    center: {lat: 40.730610, lng: -73.935242},
                    zoom: 8,
                    tilt: 0,
                    mapTypeId: google.maps.MapTypeId.ROADMAP,
                    disableDefaultUI: true
                };
                $rootScope.map = new google.maps.Map(document.getElementById('map'), mapOptions);

                if (navigator.geolocation) {
                    navigator.geolocation.getCurrentPosition(
                        function (position) {
                            //success
                            console.log("Got the users current location!");
                            listPageCtrl.zoomToLocation({
                                lat: position.coords.latitude, 
                                lng: position.coords.longitude
                                });
                        }, function (error) {
                            console.log("Couldn't get user's current location: " + error);
                        });
                }

                $rootScope.$broadcast('google-maps-loaded');
                //$scope.$root.$broadcast('google-maps-loaded');
            });*/

            /**
             *  Easier to work with google maps api
             * @param latLng, {{lat: float, lng: float}}
             */
            listPageCtrl.zoomToLocation = function(latLng) {
                $rootScope.map.panTo(new google.maps.LatLng(latLng));
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

    app.controller('CallViewCtrl', ['$scope', '$state', function($scope, $state) {
        
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

/**
 * The Callback function for google maps api loading */
function initMap() {
    var loadedEvent = new Event('google-maps-api-loaded');
    document.dispatchEvent(loadedEvent);
}


