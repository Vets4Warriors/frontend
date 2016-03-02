/**
 * Created by austin on 2/26/16.
 */
(function() {
    var app = angular.module('location-directives', []);

    app.controller('LocationController', ['$scope', '$log', 'locationService',
        function($scope, $log, locationService) {
        var list = this;
        list.locations = [];

        locationService.query({})
            .success(function(data) {
                list.locations = angular.fromJson(data);
            })
            .error(function(data) {
                $log.error(data);
            });
    }]);

    app.directive('locationCard', function() {
       return {
           restrict: 'E',
           templateUrl: '../shared/location/location-card.html',
           controller: function() {
               this.tab = 0;

               this.isShowing = function(tabIndex) {
                   return tabIndex === this.tab;
               };
           },
           controllerAs: "card"
       };
    });

    app.directive('locationRating', function() {
        return {
            restrict: 'E',
            templateUrl: '../shared/location/location-rating.html',
            controller: ['$scope', function($scope) {
                $scope.averageRating = function(ratings) {
                    var sum = 0;
                    for (var i = 0; i < ratings.length; i++) {
                        sum += ratings[i].value;
                    }

                    return ratings.length != 0 ? sum/ratings.length : 0;
                };
            }]
        };
    });

})();