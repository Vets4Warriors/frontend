/**
 * Created by austin on 2/26/16.
 */
(function() {
    var app = angular.module('location-directives', ['location-services']);
    /*app.config(['$httpProvider', function($httpProvider) {
        $httpProvider.defaults.headers.common['Access-Control-Allow-Headers'] = '*';
    }]);*/
    
    app.config(['$httpProvider', function ($httpProvider) {
        // We need to setup some parameters for http requests
        // These three lines are all you need for CORS support
        $httpProvider.defaults.useXDomain = true;
        $httpProvider.defaults.withCredentials = false;
        delete $httpProvider.defaults.headers.common['X-Requested-With'];
    }]);



    /**
     *  This controls the list as a whole
     */
    app.controller('LocationsController', ['$scope', '$log', 'locationService',
        function($scope, $log, locationService) {
            var list = this;
            var Location = locationService.Location;
            $scope.locations = [];
            this.locationService = locationService;
            this.map = document.querySelector('google-map');
            this.mapsApi = null;

            if (this.map != null) {
                // Wait for the map to load before initializing list
                this.map.addEventListener('google-map-ready', function(e) {
                    list.mapsApi = document.querySelector('google-maps-api').api;
                    list.getLocations({});
                });
            } else {
                // Initialize with an empty query
                // Will potentially later initialize as an empty list
                this.getLocations({});
            }


            /*
            Todo: This is turning into spaghetti code with the map. Need to centralize map functions.
             */
            this.getLocations = function(queries) {
                locationService.query(queries)
                    .success(function(data) {
                        // Todo: optimize yeah optimize
                        var locations = Location.fromJsonArray(angular.fromJson(data));

                        if (list.mapsApi) {
                            // Remove all the previous markers from the map
                            for (var i = 0; i < $scope.locations.length; i++) {
                                $scope.locations[i].marker.setMap(null);
                                $scope.locations.pop();
                            }
                            // Add all the new ones and make bounds
                            var bounds = new list.mapsApi.LatLngBounds();
                            for (var i = 0; i < locations.length; i++) {
                                var marker = new list.mapsApi.Marker({
                                    map: list.map.map,
                                    position: new list.mapsApi.LatLng(locations[i].getAddrLatLng()),
                                    title: locations[i].name
                                });
                                // Attach the marker to each location for referencing later
                                locations[i].marker = marker;

                                bounds.extend(marker.getPosition());
                                $scope.locations.push(locations[i]);
                            }

                            // Fit the map around the bounds
                            // Todo: account for the search / list area
                            list.map.map.fitBounds(bounds);
                        }


                        //$scope.$apply();
                    })
                    .error(function(data) {
                        $log.error(data);
                    });
            };
    }]);

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
            controller: ['$scope', '$log', 'locationService', function($scope, $log, locationService) {

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

                $scope.submitAddForm = function() {
                    var form = document.getElementById("addForm");

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
                            } );
                    }
                    return false;
                };

            }],
            controllerAs: 'contactController'
        }
    });


    app.directive('locationSearchBox', function() {
        return {
            restrict: 'E',
            templateUrl: '/app/shared/location/location-search-box.html',
            controller: ['$scope', function($scope) {
                var searchCtrl = this;

                var searchBox = document.querySelector('.locationSearchBox>paper-input');
                var filtersBox = document.querySelector('paper-listbox');
                var filters = ['name', 'website', 'phone', 'email',
                    'locationType', 'coverage', 'services', 'tags'];

                var locCtrl = $scope.locCtrl;

                this.getQueryBy = function() {
                    var queryTerm = filters[filtersBox.selected];
                    return queryTerm;
                };

                searchBox.addEventListener('keypress', function(key) {
                    if (key.keyCode == 13) {
                        // hit the enter key
                        searchCtrl.search();
                    }
                });

                filtersBox.addEventListener('iron-select', function(e) {
                    // If changes from the default or is selected
                    //searchCtrl.search();
                });

                this.search = function() {
                    // Grab the input from the search box and the filters
                    // Build a query
                    if (searchBox.value === '' || searchBox.validate()) {
                        var key = searchCtrl.getQueryBy();
                        // Should we make a custom query object?
                        var query = {};
                        query[key] = searchBox.value;
                        locCtrl.getLocations(query);
                    }
                };
            }],
            controllerAs: 'locSearchCtrl'
        }
    });
})();