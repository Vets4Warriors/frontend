/**
 * Created by austin on 3/1/16.
 */


(function() {
    var app = angular.module('listPage', ['ngRoute', 'location-directives', 'angular-click-outside']);

    /* Will get fancier with this in the future. Potentially for individual location views. */
    app.config(['$routeProvider', function($routeProvider) {
        $routeProvider.when('/call', {controller: 'ListPageController'});   // Will use this for call handling
        $routeProvider.otherwise({redirectTo: '/list'});
    }]);

    app.controller('ListPageController', function($scope, $routeParams, $location) {
        var listPageCtrl = this;
        this.isAdding = $location.$$path === '/add';
        this.map = document.querySelector('google-map');
        this.currentLatLng = null;

        this.map.addEventListener('google-map-ready', function(e) {
            // Try to center the map with the users current position
            if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(
                    function (position) {
                        //success
                        console.log("Got the users current location!");
                        listPageCtrl.currentLatLng = [position.coords.latitude, position.coords.longitude];
                        listPageCtrl.zoomToLocation(listPageCtrl.currentLatLng);
                    }, function (error) {
                        // error
                        console.log("error");
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
            this.map.latitude = latLng.lat;
            this.map.longitude = latLng.lng;
        }
    });

    /**
     * Show and hide if the add button hasn't been clicked
     * Just going to use a x button
     */
    /*app.directive('clickOutsideClose', function($document) {
       return {
           restrict: 'A',
           link: function postLink($scope, element, attrs) {
               var onClick = function(event) {
                   var isChild = element[0].contains(event.target);
                   var isSelf = element[0] == event.target;
                   var clickedInside = isChild || isSelf;
                   if (!clickedInside && !$scope.listCtrl.clickedAdd) {
                       $scope.$apply(attrs.clickOutsideClose);
                   }
                   $scope.listCtrl.setClickedAdd(false);
               };
               $scope.$watch(attrs.ngShow, function(newVal, oldVal) {
                   if (newVal !== oldVal && newVal == true) {
                       $document.bind('click', onClick);
                   }
                   else if (newVal !== oldVal && newVal == false) {
                       $document.unbind('click', onClick);
                   }
               });
           }
       };
    });*/

})();