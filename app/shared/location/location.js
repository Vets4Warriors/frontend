/**
 * Created by austin on 2/26/16.
 */
(function() {
    var app = angular.module('locationDirectives', ['locationCard', 'locationServices', 'mapAddressInput']);

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
            var listCtrl = this;
            var map = $scope.listPageCtrl.map;
            var Location = locationService.Location;
            $scope.locations = [];
            
             // Start by getting all locations
            getLocations({});

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
                        var bounds = new google.maps.LatLngBounds();
                        for (var i = 0; i < newLocs.length; i++) {
                            var locationToAdd = newLocs[i];

                            // Some locations just won't have addresses.
                            // Only add markers for those that do
                            var addr = locationToAdd.getLatLngAddr();
                            if (addr) {
                                var marker = new google.maps.Marker({
                                    map: map,
                                    position: new google.maps.LatLng(locationToAdd.getAddrLatLng()),
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
                        //map.fitBounds(bounds);
            };


            /*
            Todo: This is turning into spaghetti code with the mapContainer. Need to centralize mapContainer functions.
             */
            function getLocations(queries) {
                locationService.query(queries)
                    .success(function(data) {
                        var newLocs = Location.fromJsonArray(angular.fromJson(data));
                        listCtrl.updateLocations(newLocs);
                    })
                    .error(function() {
                        /*
                            {
                                text: "Sorry, we couldn't connect to the server. " +
                                "Have you checked your internet connection?",
                                duration: 0
                            }*/
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
                $scope.addressInputs = document.getElementsByTagName('map-address-input');
                $scope.addr = locationService.LocationAddress.makeEmpty();
                $scope.hqAddr = locationService.LocationAddress.makeEmpty();

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
                        if (locationData.tags != "") {
                            locationData.tags = locationData.tags.split(',');
                        } else {
                            locationData.tags = [];
                        }
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
                               /* successToast.show({
                                    text: "Added " + location.name + " to the database!",
                                    duration: 3000
                                });*/
                                $scope.resetForm();
                                
                                var newLocation = new locationService.Location(data, false);
                                $scope.locations.push(newLocation);
                            })
                            .error(function(data) {
                                // Todo: animate the paper-fab upwards as well
                               /* errorToast.show({
                                    text: "Failed to add the location!",
                                    duration: 3000
                                });*/
                                console.log("Failure!");
                            });
                    }
                    return false;
                };

                /**
                 * Must reset the target addresses as well as the whole form
                 */
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
                onClose: '&'    // Function
            },
            controller: ['$scope', '$http', 'locationService', 
                function($scope, $http, locationService) {
                    var locEditCtrl = this;
                    var coverages = $('[name="coverages"]');
                    
                    locEditCtrl.isHidden = false;
                    
                    locEditCtrl.setIsHidden = function(isHidden) {
                      locEditCtrl.isHidden = isHidden;  
                    };
                    
                    $scope.addr = locationService.LocationAddress.makeEmptyAddr();
                    $scope.hqAddr = locationService.LocationAddress.makeEmptyAddr();
            
                    /*
                    * locEditCtrl is purely for watching
                    * Wouldn't work on $scope.location
                    * But that's our real target
                    * Need to find a way to update the coverages
                    * */
                    /*
                     // For watching
                     locEditCtrl.location = {};
                    $scope.$watch("locEditCtrl.location",
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
                            //locEditCtrl.location = $scope.location;
                            updateFormWithData();
                        })
                        .error( function() {
                            console.log("Error loading location with id " + $scope.id );
                        });

                    /**
                     * Load the form with the data stored in $scope.location
                     */
                    function updateFormWithData() {
                        if ($scope.location.hasAddr()) {
                            $scope.addr = $scope.location.address;
                        }

                        if ($scope.location.hqAddress !== undefined) {
                            $scope.hqAddr = $scope.location.hqAddress;
                        }

                        // We also need to initialize the checkboxes
                        // Will do that here in javascript, could get bulky in the html
                        // Todo!
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
                            if (!$.isEmptyObject($scope.hqAddr) && $scope.hqAddr.isValid) {
                                locationData.hqAddress = $scope.hqAddr;
                            }

                            var location = new locationService.Location(locationData, true);

                            // Preserve the id to update
                            location.id = $scope.location.id;

                            locationService.update(location)
                                .success(function(data) {
                                   /* successToast.show({
                                        text: "Updated " + location.name + "!",
                                        duration: 3000
                                    });*/
                                })
                                .error(function(data){
                                    // Todo: animate the paper-fab upwards as well
                                    /*errorToast.show({
                                        text: "Failed to edit the location!",
                                        duration: 3000
                                    });*/
                                });
                        }
                        return false;
                    };

                    $scope.deleteLocation = function(confirmed) {
                        if (!confirmed) {
                            // Open the confirmation dialog
                            var dialog = $('#deleteDialog')[0];
                            dialog.open();
                        } else {
                            locationService.delete($scope.location.id)
                                .success(function(data){
                                   /* successToast.show({
                                        text: "Deleted!",
                                        duration: 3000
                                    });*/
                                    $scope.onClose();
                                })
                                .error(function(data){
                                    /*errorToast.show({
                                        text: "Failed to edit the location!",
                                        duration: 3000
                                    });*/
                                });
                        }
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
})();