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


    /* This (and all map functions) should probably be moved to the listPageController as it
    *   contains the map element directly.
    *   Todo? */
    var mapRecenter = function(map, mapsApi, latLng, offsetX, offsetY) {
        var projection = map.getProjection();
        if (projection) {
            var point1 = projection.fromLatLngToPoint(
                (latLng instanceof mapsApi.LatLng) ? latlng : map.getCenter()
            );
            var point2 = new mapsApi.Point(
                ( (typeof(offsetX) == 'number' ? offsetX : 0) / Math.pow(2, map.getZoom()) ) || 0,
                ( (typeof(offsetY) == 'number' ? offsetY : 0) / Math.pow(2, map.getZoom()) ) || 0
            );
            map.setCenter(projection.fromPointToLatLng(new mapsApi.Point(
                point1.x - point2.x,
                point1.y + point2.y
            )));
        } else {
            console.log("Couldn't get the projection map :(");
        }
    };

    /**
     *  This controls the list as a whole
     */
    app.controller('LocationsController', ['$scope', '$log', 'locationService',
        function($scope, $log, locationService) {
            var listCtrl = this;

            var mapContainer = document.querySelector('google-map');
            var mapsApi = null;

            var Location = locationService.Location;
            $scope.locations = [];
            $scope.connectionErrorToast = document.getElementById('connectionErrorToast');

            if (mapContainer) {
                // Wait for the mapContainer to load before initializing list
                mapContainer.addEventListener('google-map-ready', function(e) {
                    console.log("Map loaded! From list-page");
                    mapsApi = document.querySelector('google-maps-api').api;
                    
                    // Start by getting all locations
                    listCtrl.getLocations({});

                    mapsApi.event.trigger(mapContainer.map, 'resize');
                    mapContainer.resize();
                });
            } else {
                // Initialize with an empty query
                // Will potentially later initialize as an empty list
                listCtrl.getLocations({});
            }

            listCtrl.updateLocations = function(newLocs) {
                // Remove all the previous markers from the mapContainer
                        var numPrevLocs = $scope.locations.length;
                        for (var i = 0; i < numPrevLocs; i++) {
                            // Null the first marker and pop
                            if ($scope.locations[0].marker) {
                                $scope.locations[0].marker.setMap(null);
                            }
                            console.log("Popping: " + $scope.locations.pop());
                        }

                        // Add all the new ones and make bounds
                        var bounds = new mapsApi.LatLngBounds();
                        for (var i = 0; i < newLocs.length; i++) {
                            var locationToAdd = newLocs[i];

                            // Some locations just won't have addresses.
                            // Only add markers for those that do
                            var addr = locationToAdd.getLatLngAddr();
                            if (addr) {
                                var marker = new mapsApi.Marker({
                                    map: mapContainer.map,
                                    position: new mapsApi.LatLng(locationToAdd.getAddrLatLng()),
                                    title: locationToAdd.name
                                });

                                var marker = new mapsApi.Marker({
                                    map: mapContainer.map,
                                    position: new mapsApi.LatLng(locationToAdd.getAddrLatLng()),
                                    title: locationToAdd.name
                                });

                                // Attach the marker to each location for referencing later
                                locationToAdd.marker = marker;

                                bounds.extend(marker.getPosition());
                            }
                            $scope.locations.push(locationToAdd);
                        }

                        // Fit the map around the bounds
                        // Todo: account for the search / list area
                        mapContainer.map.fitBounds(bounds);
                        mapRecenter(mapContainer.map, mapsApi, 500, 0);
            };


            /*
            Todo: This is turning into spaghetti code with the mapContainer. Need to centralize mapContainer functions.
             */
            listCtrl.getLocations = function(queries) {
                locationService.query(queries)
                    .success(function(data) {
                        var newLocs = Location.fromJsonArray(angular.fromJson(data));
                        listCtrl.updateLocations(newLocs);
                        //var x = $scope.$apply(listCtrl.updateLocations);
                        //x(newLocs);
                        //$scope.$apply();
                    })
                    .error(function() {
                        $scope.connectionErrorToast.show(
                            {
                                text: "Sorry, we couldn't connect to the server. " +
                                "Have you checked your internet connection?",
                                duration: 0
                            }
                        );
                        $scope.connectionErrorToast.resetFit();
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
                var successToast = $('successToast')[0];
                var errorToast = document.getElementById('failureToast');
                $scope.addressInputs = document.getElementsByTagName('map-address-input');
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
                    if ($scope.form.validate()) {
                        // Send request to database api
                        // Format the form data to fit our models
                        var locationData = $scope.form.serialize();
                        locationData.services = locationData.services.split(',');

                        if (typeof locationData.coverages === 'string') {
                            // Need it to be an array
                            locationData.coverages = [locationData.coverages];
                        }

                        //Todo: regex. This almost works buuut ((#(\S?!,)*)(\s*)(,))*((\s*)(#\S*)())
                        locationData.tags = locationData.tags.split(',');
                        locationData.website = 'http://' + locationData.website;
                        // Only add the addresses if valid!
                        if ($scope.addr.isValid) {
                            locationData.address = $scope.addr;
                        }
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
                                $scope.resetForm();
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

                $scope.resetForm = function() {
                    $scope.form.reset();
                    $scope.addr = {};
                    $scope.hqAddr = {};
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
     * Want this to eventually be the same as locAddCtrl, 
     *  just with different field names/preloaded data
     */
    app.directive('locationEdit', function() {
        return {
            restrict: 'E',
            templateUrl: '/app/shared/location/location-edit.html',
            scope: {
                id: '@', // Required
                onClose: '&'
            },
            controller: ['$scope', '$http', 'locationService', 
                function($scope, $http, locationService) {
                    var locEditCtrl = this;
                    var successToast = $('.successToast')[0];
                    var errorToast = $('.failureToast')[0];
                    var coverages = $('[name="coverages"]');
                    // For watching
                    locEditCtrl.location = {};

                    $scope.addr = locationService.LocationAddress.makeEmptyAddr();
                    $scope.hqAddr = locationService.LocationAddress.makeEmptyAddr();

                    /*
                    * locEditCtrl is purely for watching
                    * Wouldn't work on $scope.location
                    * But that's our real target
                    * Need to find a way to update the coverages
                    * */
                    /*$scope.$watch("locEditCtrl.location",
                        function locationChanged(newVal, oldVal) {
                            // Need some real data
                            if ($.isEmptyObject(newVal)) {
                                return;
                            }
                           updateFormWithData();
                        });
*/
                    // First load the data
                    locationService.get($scope.id)
                        .success(function(data) {
                            $scope.location = new locationService.Location(angular.fromJson(data), false);
                            locEditCtrl.location = $scope.location;
                            updateFormWithData();
                        })
                        .error( function() {
                            console.log("Error loading location with id " + $scope.id );
                        });


                     /* Private functions */
                   function updateFormWithData() {
                        $scope.addr = $scope.location.address;

                            if ($scope.location.hqAddress !== undefined) {
                                $scope.hqAddr = $scope.location.hqAddress;
                            }

                            // We also need to initialize the checkboxes
                            // Will do that here in javascript, could get bulky in the html
                            var coverages = document.getElementsByName('coverages');

                            for (var i = 0; i < coverages.length; i++) {
                                if ($.inArray($scope.location.coverages, coverages[i].value) != -1) {
                                    coverages[i].checked = true;
                                }
                            }
                   }

                    $scope.submitEditForm = function() {
                        // validate all address input. Have got to make them extend the iron-input / build with polymer
                        if ($scope.form.validate()) {
                            // Send request to database api
                            // Format the form data to fit our models
                            var locationData = $scope.form.serialize();
                            locationData.services = locationData.services.split(',');

                            if (typeof locationData.coverages === 'string') {
                                // Need it to be an array
                                locationData.coverages = [locationData.coverages];
                            }

                            //Todo: regex. This almost works buuut ((#(\S?!,)*)(\s*)(,))*((\s*)(#\S*)())
                            locationData.tags = locationData.tags.split(',');
                            // Only add the addresses if valid!
                            if (!$.isEmptyObject($scope.addr) && $scope.addr.isValid) {
                                locationData.address = $scope.addr;
                            }
                            if (!$.isEmptyObject($scope.addr) && $scope.hqAddr.isValid) {
                                locationData.hqAddress = $scope.hqAddr;
                            }

                            var location = new locationService.Location(locationData, true);

                            // Preserve the id to update
                            location.id = $scope.location.id;

                            locationService.update(location)
                                .success(function(data) {
                                    successToast.show({
                                        text: "Updated " + location.name + "!",
                                        duration: 3000
                                    });
                                })
                                .error(function(data){
                                    // Todo: animate the paper-fab upwards as well
                                    errorToast.show({
                                        text: "Failed to edit the location!",
                                        duration: 3000
                                    });
                                    console.log("Failure!");
                                });
                        }
                        return false;
                    };

                    $scope.deleteLocation = function() {
                        locationService.delete($scope.location.id)
                            .success(function(data){
                                successToast.show({
                                    text: "Deleted " + location.name + "!",
                                    duration: 3000
                                });
                                $scope.listPageCtrl.setIsEditing(false);
                            })
                            .error(function(data){
                                // Todo: animate the paper-fab upwards as well
                                errorToast.show({
                                    text: "Failed to edit the location!",
                                    duration: 3000
                                });
                                console.log("Failure!");
                            });
                    };
            }],
            controllerAs: 'locEditCtrl',
            link: function($scope, $elem) {
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
                this.isPristine = true;

                this.setInputHidden = function (isHidden){
                    addrInput.inputIsHidden = isHidden;

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
                    addrInput.hasValidated = hasValidated;
                    $scope.target.isValid = hasValidated;
                };
                /**
                 * Take use response if the geocoded address is correct
                 * @param isConfirmed
                 */
                this.setConfirmed = function(isConfirmed) {
                    addrInput.isConfirmed = isConfirmed;
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
                    addrInput.isPristine = false;
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

                                // Steal all the nice formatted data from response 


                                var latLng = result['geometry']['location'];
                                // Put the address into the target object
                                var components = {};

                                // Parse the geocoded response
                                for (var i = 0; i < result['address_components'].length; i++) {
                                    components[result['address_components'][i]['types'][0]] = {
                                        long: result['address_components'][i]['long_name'],
                                        short: result['address_components'][i]['short_name']
                                    };
                                }
                                
                                if (components['street_number']) {
                                    $scope.target['address1'] = components['street_number'].short + ' '
                                        + components['route'].short;
                                } else {
                                    $scope.target['address1'] = components['route'].short;
                                }
                                /* Probably want to switch to something like: 
                                    https://github.com/ubilabs/geocomplete
                                */
                                
                                $scope.target['address2'] = formData['address2'];   // If they specify it, take it
                                $scope.target['city'] = components['locality'].long;
                                $scope.target['state'] = components['administrative_area_level_1'].short;
                                $scope.target['country'] = components['country'].short;
                                $scope.target['zipcode'] = components['postal_code'].short;
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

                    $scope.reset = function() {
                        addrInput.isPristine = true;
                        addrInput.hasValidated = false;
                        addrInput.isConfirmed = false;
                        addrInput.formattedAddress = '';
                        $scope.target = {};
                    };
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