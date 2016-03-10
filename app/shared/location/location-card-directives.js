/**
 * Created by austin on 3/10/16.
 */
(function() {
    var app = angular.module('location-card-directives', ['location-services']);

    /**
     *  The main container for each location.
     */
    app.directive('locationCard', function() {
        return {
            restrict: 'E',
            templateUrl: '/app/shared/location/location-card.html',
            controller: ['$element', function($element) {
                this.isExpanded = false;
                this.tab = 0;

                this.contentCollapse = $element.find('iron-collapse')[0];

                this.tabIsShowing = function(tabIndex) {
                    return tabIndex === this.tab;
                };

                this.setTab = function(tabIndex) {
                    this.tab = tabIndex;
                };

                this.toggleContent = function() {
                    this.isExpanded = !this.isExpanded;
                    this.contentCollapse.toggle();
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
            controller: ['$scope', '$log', 'locationService', function($scope, $log, locationService) {

                $scope.keyPressed = function(key) {
                    if (key.keyCode == 13) {
                        // hit the enter key
                        $scope.submitRatingForm();
                    }
                };

                $scope.submitRatingForm = function() {
                    var form = document.getElementById($scope.location.id + '_ratingForm');
                    if (form.validate()) {
                        // Send request to database api
                        var rating = new locationService.LocationRating(form.serialize(), true);

                        locationService.rate($scope.location.id, rating)
                            .success(function(data) {
                                $log.debug(data);
                                form.reset();
                                // push the rating into the locations ratings hehe
                                $scope.location.ratings.push(rating);
                            })
                            .error(function(data) {
                                $log.error(data);
                            });
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
            controllerAs: 'locRatingController'
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
            controller: ['locationService', function() {}],
            controllerAs: 'contactController'
        }
    });


    /**
     * The form to add locations
     */
    app.directive('locationAdd', function() {
        return {
            restrict: 'E',
            templateUrl: '/app/shared/location/location-add.html',
            controller: ['$scope', '$log', '$http', 'locationService', function($scope, $log, $http, locationService) {

                /**
                 * Allow for enter key to be used as submission.
                 * Todo: This should be made into an attribute directive for all forms
                 * @param key pressed. The $event var in angular
                 */
                $scope.keyPressed = function(key) {
                    if (key.keyCode == 13) {
                        // hit the enter key
                        $scope.submitAddForm();
                    }
                };

                $scope.validateAddress = function() {
                    /*   How @fran did address validation, should we use it?

                     $.get("https://maps.googleapis.com/maps/api/geocode/json?address=" + $('#searchable_address').val() + "&sensor=true", function(data) {
                     searchable_address = $("#address").val() + " " + $("#city").val() + " " + $("#state").val() + " " + $("#zip").val()+ " " + $("#country").val()
                     $("#searchable_address").val(searchable_address);
                     $("#addresses").empty();
                     for (var i = 0; i < (data['results']).length; i++) {
                     address = data['results'][i]['formatted_address']
                     country = address.substr(address.length - 3) //country code at end of formatted address
                     street_number = address.substr(0, 1)
                     if ($.isNumeric(street_number) && country == "USA") { // currently only accepting USA addresses with valid street numbers
                     $('#addresses').append('<li class="address_li">' + address + '</li>');
                     }
                     }
                     // in case we cannot find an address
                     if ($(".address_li").length == 0) {
                     $('#addresses').append('<li> We could not find any addresses that match.</li>');
                     }
                     });*/
                    var form = document.getElementById("addForm");
                    var url = "https://maps.googleapis.com/maps/api/geocode/json?address=" +
                        form.address.value + "&sensor=true";
                    $http.get(url)
                        .success(function(data) {
                            console.log(data);
                        })
                        .error(function(data) {
                            console.log(data);
                        });
                };

                $scope.submitAddForm = function() {
                    var form = document.getElementById("addForm");

                    $scope.validateAddress();


                    if (form.validate()) {
                        // Send request to database api
                        // Format the form data to fit our models
                        var locationData = form.serialize();
                        locationData.services = locationData.services.split(',');
                        locationData.website = 'http://' + locationData.website;

                        var location = new locationService.Location(form.serialize(), true);

                        locationService.add(location)
                            .success(function(data) {
                                $log.debug(data);
                                form.reset();
                                // push the rating into the locations ratings hehe
                                $scope.locations.push(location);
                            })
                            .error(function(data) {
                                // Todo: Show a toast error message
                            });
                    }
                    return false;
                };

            }],
            controllerAs: 'contactController'
        }
    });
})();
