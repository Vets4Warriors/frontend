/**
 * Created by austin on 3/1/16.
 */


(function() {
    var app = angular.module('listPage', ['ngRoute', 'location-directives', 'angular-click-outside']);

    app.controller('ListPageController', function() {
        var listPageCtrl = this;
        this.isAdding = false;
        this.map = document.querySelector('google-map');
        this.currentLatLng = null;

        this.map.addEventListener('google-map-ready', function(e) {
            if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(
                    function (position) {
                        //success
                        console.log("Got the location!");
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
         *
         * @param latLng, array [lat, lng]
         */
        this.zoomToLocation = function(latLng) {
            this.map.latitude = latLng[0];
            this.map.longitude = latLng[1];
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

    app.config(['$routeProvider', function ($routeProvider) {

    }]);

})();