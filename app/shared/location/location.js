/**
 * Created by austin on 2/26/16.
 */
(function() {
    var app = angular.module('location-directives', ['location-card-directives', 'location-services']);

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
                    // Start by getting all locations
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
                        // Remove all the previous markers from the map
                        var numPrevLocs = $scope.locations.length;
                        for (var i = 0; i < numPrevLocs; i++) {
                            // Null the first marker and pop
                            $scope.locations[0].marker.setMap(null);
                            console.log("Popping: " + $scope.locations.pop());
                        }

                        // Add all the new ones and make bounds
                        var newLocs = Location.fromJsonArray(angular.fromJson(data));
                        var bounds = new list.mapsApi.LatLngBounds();
                        for (var i = 0; i < newLocs.length; i++) {
                            var locationToAdd = newLocs[i];
                            var marker = new list.mapsApi.Marker({
                                map: list.map.map,
                                position: new list.mapsApi.LatLng(locationToAdd.getAddrLatLng()),
                                title: locationToAdd.name
                            });
                            // Attach the marker to each location for referencing later
                            locationToAdd.marker = marker;

                            bounds.extend(marker.getPosition());
                            $scope.locations.push(locationToAdd);
                        }

                        // Fit the map around the bounds
                        // Todo: account for the search / list area
                        list.map.map.fitBounds(bounds);
                    })
                    .error(function(data) {
                        $log.error(data);
                    });
            };
    }]);

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
                this.addr = locationService.LocationAddress.makeEmptyAddr();
                this.hqAddr = locationService.LocationAddress.makeEmptyAddr();

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
            controllerAs: 'locAddCtrl'
        }
    });

    /**
     * Handles the custom address input
     * Validates the address,
     * given a LocationAddress in the target, fills with valid address info
     * Can be given map for marker selection / draggable
     *
     */
    app.directive('mapAddressInput', function() {
        return {
            restrict: 'E',
            templateUrl: '/app/shared/location/map-address-input.html',
            scope: {
                target: '=target', //Required
                title: '=title',   // Required
                map: '=map'
            },
            controller: ['$scope', function($scope) {
                this.inputIsHidden = true;
                this.hasValidated = false;
                this.setInputHidden = function (isHidden){
                    this.inputIsHidden = isHidden;
                };
                this.setHasValidated = function (hasValidated) {
                    this.hasValidated = hasValidated;
                };

                /**
                 * Try to geocode the address given
                 * If successful:
                 *  Store geocode info
                 *  Ask if correct
                 *  Add draggable marker
                 * If failure:
                 *  Show toast showing error message
                 *  Ask to check for errors
                 */
                this.validate = function() {
                    this.setHasValidated(true);
                };

                /**
                 * Take use response if the geocoded address is correct
                 * @param isCorrect
                 */
                this.markCorrect = function(isCorrect) {

                };
            }],
            controllerAs: 'mapAddrCtrl'
        }
    });
})();