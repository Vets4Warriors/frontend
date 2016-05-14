/**
 * Created by austin on 3/10/16.
 */
(function() {
    var app = angular.module('locationCard', ['ngMaterial', 'locationServices', 'angular-input-stars']);

    /**
     *  The main container for each location.
     */
    app.directive('locationCard', function() {
        return {
            restrict: 'E',
            templateUrl: '/app/shared/location/location-card.html',
            controller: ['$element', '$scope', '$location', function($element, $scope, $location) {
                this.isExpanded = false;
                this.tab = 0;

                this.tabIsShowing = function(tabIndex) {
                    return tabIndex === this.tab;
                };

                this.setTab = function(tabIndex) {
                    this.tab = tabIndex;
                };

                this.toggleContent = function() {
                    this.isExpanded = !this.isExpanded;
                    //this.contentCollapse.toggle();
                };

                this.edit = function() {
                    $location.url('/' + $scope.location.id + '/edit');
                };
            }],
            controllerAs: 'cardCtrl'
        };
    });

    /**
     *
     */
    app.directive('locationRating', function() {
        return {
            restrict: 'E',
            templateUrl: '/app/shared/location/location-rating.html',
            controller: ['$scope', 'locationService', function($scope,locationService) {
                var locRatingCtrl = this;
                
                $scope.keyPressed = function(key) {
                    if (key.keyCode == 13) {
                        // hit the enter key
                        $scope.submitRatingForm();
                    }
                };

                $scope.submitRatingForm = function() {
                    if ($scope.ratingForm.$valid) {
                        // Send request to database api
                        $scope.rating.value = $scope.locRatingCtrl.value;
                        var rating = new locationService.LocationRating($scope.rating, true);

                        locationService.rate($scope.location.id, rating)
                            .success(function(data) {
                                // Reset the form
                                $scope.ratingForm.$setPristine();
                                $scope.ratingForm.$setUntouched();
                                $scope.rating = {};
                                $scope.locRatingCtrl.value = null;
                                // push the rating into the locations ratings hehe
                                $scope.location.ratings.push(rating);
                            })
                            .error(function(data) {
                                console.log(data);
                            });
                    } else {
                        // For some reason it will not show validations
                        $scope.ratingForm.$setSubmitted();
                    }
                    return false;
                };

                $scope.averageRating = function(ratings) {
                    var sum = 0;
                    for (var i = 0; i < ratings.length; i++) {
                        sum += ratings[i].value;
                    }
                    return ratings.length != 0 ? (sum/ratings.length).toFixed(1) : 0;
                };
            }],
            controllerAs: 'locRatingCtrl'
        };
    });

    /**
     *  Part of the location card. Tab to display basic location info
     */
    app.directive('locationInfo', function() {
        return {
            restrict: 'E',
            templateUrl: '/app/shared/location/location-info.html'
        }
    });

    /**
     *  Part of the location card. Tab to display basic location info
     */
    app.directive('locationContact', function() {
        return {
            restrict: 'E',
            templateUrl: '/app/shared/location/location-contact.html',
            controller: ['locationService', function(locService) {}],
            controllerAs: 'contactController'
        }
    });
})();
