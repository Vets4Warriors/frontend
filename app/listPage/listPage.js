/**
 * Created by austin on 3/1/16.
 */


(function() {
    var app = angular.module('listPage', ['ngRoute', 'location-directives', 'angular-click-outside']);

    app.controller('ListPageController', function() {
        this.isAdding = false;

        this.setIsAdding = function(show) {
            console.log("isAdding: " + show);
            if (show) {
                this.setClickedAdd(true);
            }

            this.isAdding = show;
        };

        this.setClickedAdd = function(clicked) {
            console.log("Clicked add: " + clicked);
            this.clickedAdd = clicked;
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