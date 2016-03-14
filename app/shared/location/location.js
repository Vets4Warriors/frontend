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
            this.mapContainer = document.querySelector('google-map');
            this.mapsApi = null;

            if (this.mapContainer) {
                // Wait for the mapContainer to load before initializing list
                this.mapContainer.addEventListener('google-map-ready', function(e) {
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
            Todo: This is turning into spaghetti code with the mapContainer. Need to centralize mapContainer functions.
             */
            this.getLocations = function(queries) {
                locationService.query(queries)
                    .success(function(data) {
                        // Remove all the previous markers from the mapContainer
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
                                map: list.mapContainer.map,
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
                        list.mapContainer.map.fitBounds(bounds);
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
                var locAddCtrl = this;
                var successToast = document.getElementById('successToast');
                var errorToast = document.getElementById('failureToast');
                $scope.addr = locationService.LocationAddress.makeEmptyAddr();
                $scope.hqAddr = locationService.LocationAddress.makeEmptyAddr();

                $scope.keyPressed = function(key) {
                    if (key.keyCode == 13) {
                        // hit the enter key
                        $scope.submitAddForm();
                    }
                };

                $scope.submitAddForm = function() {
                    // validate all address input. Have got to make them extend the iron-input / build with polymer
                    //var addressInputs = form.getElementsByTagName('map-address-input');

                    if ($scope.form.validate() && $scope.addr.isValid) {
                        // Send request to database api
                        // Format the form data to fit our models
                        var locationData = $scope.form.serialize();
                        locationData.services = locationData.services.split(',');

                        if (typeof locationData.coverages === 'string') {
                            // Need it to be an array
                            locationData.coverages = [locationData.coverages];
                        }

                        locationData.tags = locationData.tags.split(',');
                        locationData.website = 'http://' + locationData.website;
                        locationData.address = $scope.addr;
                        // Only add the hq if valid!
                        if ($scope.hqAddr.isValid) {
                            locationData.hqAddress = $scope.hqAddr;
                        }

                        var location = new locationService.Location(locationData, true);

                        locationService.add(location)
                            .success(function(data) {
                                successToast.show({
                                    text: "Added " + location.name + " to the database!",
                                    duration: 3000
                                });
                                $scope.form.reset();
                                var newLocation = new locationService.Location(data, false);
                                $scope.locations.push(newLocation);
                            })
                            .error(function(data) {
                                // Todo: animate the paper-fab upwards as well
                                errorToast.show({
                                    text: "Failed to add the location!",
                                    duration: 3000
                                });
                                console.log("Failure!");
                            });
                    }
                    return false;
                };

            }],
            controllerAs: 'locAddCtrl',
            link: function ($scope, $elem, $attrs) {
                // Fired second after created
                // Create a link in the scope so it can be referenced as a container for the dialogs
                $scope.$parentElem = $elem[0].parentElement;
                $scope.form = $elem[0].querySelector('form');
                $scope.mapContainer = document.querySelector('google-map');
            }
        }
    });

    /**
     * Handles the custom address input
     * Validates the address,
     * given a LocationAddress in the target, fills with valid address info
     * Can be given map for marker selection / draggable (?)
     *
     * Target will be given a hasValidated and isConfirmed field. Will do better when know more angular
     *
     */
    app.directive('mapAddressInput', function() {
        return {
            restrict: 'E',
            templateUrl: '/app/shared/location/map-address-input.html',
            scope: {
                target: '=target', //Required
                title: '@',   // Required, readOnly
                mapContainer: '=map',
                required: '=required',
                container: '=container'
            },
            controller: ['$scope', '$attrs', '$http', function($scope, $attrs, $http) {
                var addrInput = this;
                var marker = null;
                this.inputIsHidden = true;
                this.hasValidated = false;
                this.isConfirmed = false;
                this.formattedAddress = '';
                this.required = $scope.$eval($attrs.required);
                this.containerElem;

                
                this.setInputHidden = function (isHidden){
                    this.inputIsHidden = isHidden;

                    // Remove the marker if there is one
                    if (isHidden) {
                        $scope.inputDialog.close();
                        if (marker) {
                            marker.setMap(null);
                        }
                    } else {
                        $scope.inputDialog.refit();
                        $scope.inputDialog.open();
                    }
                };
                this.setHasValidated = function (hasValidated) {
                    this.hasValidated = hasValidated;
                    $scope.target.isValid = hasValidated;
                };
                /**
                 * Take use response if the geocoded address is correct
                 * @param isConfirmed
                 */
                this.setConfirmed = function(isConfirmed) {
                    this.isConfirmed = isConfirmed;
                    $scope.target.isConfirmed = isConfirmed;

                    if (isConfirmed) {
                        // Close the input
                        addrInput.setInputHidden(true);
                    }
                };

                /**
                 * Check if the address has been validated. Probably should check if it has been confirmed as well
                 * @returns {boolean|*}
                 */
                this.isValidated = function() {
                    return addrInput.hasValidated;
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
                $scope.validate = function() {
                    var form = document.getElementById('addressForm_' + $scope.title);

                    if (form.validate()) {
                        var formData = form.serialize();
                        // Should probably do this with a googleMapsApi obj or at least an apiKey
                        var geoUrl = "https://maps.googleapis.com/maps/api/geocode/json?address=" +
                            formData['address1'] + ' ' + formData['address2'] + ' ' + formData['city'] +
                            ' ' + formData['state'] + ' ' + formData['zipcode'];

                        $http.get(geoUrl)
                            .success(function(data) {
                                // Make a address object with the data
                                console.log(data);
                                var possibleResults = data['results'];
                                // For now let's just take the first result, as it's the most likely
                                // In future we can present a list
                                var result = possibleResults[0];

                                // Could break it down into address components but nah for now
                                // This whole directive is pretty much 'nah for now'
                                var latLng = result['geometry']['location'];
                                // Put the address into the target object
                                $scope.target['address1'] = formData['address1'];
                                $scope.target['address2'] = formData['address2'];
                                $scope.target['city'] = formData['city'];
                                $scope.target['state'] = formData['state'];
                                $scope.target['zipcode'] = formData['zipcode'];
                                $scope.target['latLng'] = latLng;
                                addrInput.formattedAddress = result['formatted_address'];

                                // If there's a map, do some fancy stuff with markers
                                if ($scope.mapContainer.map) {
                                    console.log("Start doing cool mapContainer.map stuff");
                                    // Get a copy of the maps api
                                    var mapsApi = document.querySelector('google-maps-api').api;

                                    // If there was already a marker from a previous search, clear it!
                                    if (marker) {
                                        marker.setMap(null);
                                    }

                                    // Add a marker to the map
                                    marker = new mapsApi.Marker({
                                        map: $scope.mapContainer.map,
                                        position: new mapsApi.LatLng(latLng),
                                        title: addrInput.formattedAddress
                                    });

                                    // Zoom to it
                                    $scope.mapContainer.map.latitude = latLng.lat;
                                    $scope.mapContainer.map.longitude = latLng.lng;
                                }
                            }).error(function() {
                            // Show a toast saying we couldn't find the address
                        });

                        addrInput.setHasValidated(true);
                    }
                };
            }],
            controllerAs: 'mapAddrCtrl',
            link: function ($scope, $elem, $attrs) {
                $scope.inputDialog = $elem[0].querySelector('paper-dialog');
                $scope.inputDialog.fitInto = $scope.container;
            }
        }
    });
})();