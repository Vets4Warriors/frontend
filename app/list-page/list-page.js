/**
 * Created by austin on 3/1/16.
 */


(function() {
    var app = angular.module('listPage', ['ngMaterial', 'ngRoute', 'ui.router', 'locationDirectives']);
    
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
            })
            .state('callView', {
                url: '/call',
                templateUrl: "/app/list-page/call-partial.html",
                controller: 'CallViewCtrl'
            });
    });

    
    app.controller('ListPageCtrl', ['$scope', '$rootScope',
        function($scope, $rootScope) {
            var listPageCtrl = this;
            listPageCtrl.currentLatLng = null;
            listPageCtrl.map = null;

            document.addEventListener('google-maps-api-loaded', function() {
                console.log("Google maps loaded from the listPage");
                var mapOptions = {
                    center: {lat: 40.730610, lng: -73.935242},
                    zoom: 8,
                    tilt: 0,
                    mapTypeId: google.maps.MapTypeId.ROADMAP,
                    disableDefaultUI: true
                };
                listPageCtrl.map = new google.maps.Map(document.getElementById('map'), mapOptions);

                if (navigator.geolocation) {
                    navigator.geolocation.getCurrentPosition(
                        function (position) {
                            //success
                            console.log("Got the users current location!");
                            listPageCtrl.currentLatLng = {lat: position.coords.latitude, lng: position.coords.longitude};
                            listPageCtrl.zoomToLocation(listPageCtrl.currentLatLng);
                        }, function (error) {
                            console.log("Couldn't get user's current location: " + error);
                        });
                }

                $rootScope.$broadcast('google-maps-loaded');
                $scope.$root.$broadcast('google-maps-loaded');
            });

            /**
             *  Easier to work with google maps api
             * @param latLng, {{lat: float, lng: float}}
             */
            listPageCtrl.zoomToLocation = function(latLng) {
                listPageCtrl.currentLatLng = new google.maps.LatLng(latLng);
                listPageCtrl.map.panTo(listPageCtrl.currentLatLng);
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


