/**
 * Created by austin on 2/26/16.
 */
(function() {
    var app = angular.module('locationDirectives', ['locationCard', 'locationServices', 'checklist-model',
        'mapAddressInput', 'ngMaterial']);

    app.config(['$httpProvider', function ($httpProvider) {
        // We need to setup some parameters for http requests
        // These three lines are all we need for CORS support
        $httpProvider.defaults.useXDomain = true;
        $httpProvider.defaults.withCredentials = false;
        delete $httpProvider.defaults.headers.common['X-Requested-With'];
    }]);

    /**
     *  This controls the list as a whole
     */
    app.controller('LocationsController', ['$scope', '$log', 'locationService', '$mdToast',
        function($scope, $log, locationService, $mdToast) {
            var listCtrl = this;
            var map = $scope.$root.map;
            var Location = locationService.Location;
            //$scope.searchText = '';
            $scope.locations = [];
            
            // Start by getting all locations if the we don't already have a list
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
                        map.fitBounds(bounds);
            };

            /**
             *
             * @param location
             */
            $scope.locFilter = function(location) {
                return true;
            };


            function getLocations(queries) {
                locationService.query(queries)
                    .success(function(data) {
                        var newLocs = Location.fromJsonArray(angular.fromJson(data));
                        listCtrl.updateLocations(newLocs);
                    })
                    .error(function() {
                        $mdToast.showSimple("Sorry, we couldn't connect to the server. " +
                            "Have you checked your internet connection?");
                    });
            }
    }]);

    app.directive('locationSearchBox', function() {
        return {
            restrict: 'E',
            templateUrl: '/app/shared/location/location-search-box.html',
            scope: {
                searchModel: '=searchModel'
            },
            controller: ['$scope', function($scope) {
                var searchCtrl = this;
                var locCtrl = $scope.locCtrl;

               /* 
                Old stuff from polymer, may be useful at somepoint. Probably not. 
                
               var searchBox = document.querySelector('.locationSearchBox>paper-input');
                var filtersBox = document.querySelector('paper-listbox');
                var filters = ['name', 'website', 'phone', 'email',
                    'locationType', 'coverage', 'services', 'tags'];

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
                */
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
            controller: ['$scope', '$log', '$http', 'locationService', '$mdConstant',
                function($scope, $log, $http, locationService, $mdConstant) {
                
                var locAddCtrl = this;
                locAddCtrl.separatorKeys = [$mdConstant.KEY_CODE.COMMA];
                $scope.location = locationService.Location.makeEmpty();
                $scope.addressInputs = document.getElementsByTagName('map-address-input');

                $scope.submitAddForm = function() {
                    // validate all address input.
                    if ($scope.addForm.$valid && $scope.location.address.validate()
                        && $scope.location.hqAddress.validate()) {
                        // Send request to database api

                        //locationData.website = 'http://' + locationData.website;

                        var location = new locationService.Location($scope.location, true);

                        locationService.add(location)
                            .success(function(data) {
                                $mdToast.showSimple("Added " + location.name + " to the database!");
                                $scope.resetForm();
                                
                                var newLocation = new locationService.Location(angular.fromJson(data), false);
                                $scope.locations.push(newLocation);
                            })
                            .error(function(data) {
                                $mdToast.showSimple("Failed to add the location!");
                            });
                    }
                    return false;
                };

                /**
                 * Must reset the target addresses as well as the whole form
                 */
                $scope.resetForm = function() {
                    $scope.location.address = locationService.Location.makeEmpty();
                    $scope.hqAddr = locationService.Location.makeEmpty();
                };

            }],
            controllerAs: 'locAddCtrl',
            link: function ($scope, $elem, $attrs) {
                // Fired second after created
                // Create a link in the scope so it can be referenced as a container for the dialogs
                $scope.$parentElem = $elem.parent();
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
            controller: ['$scope', '$http', 'locationService', '$mdToast', '$mdDialog',
                function($scope, $http, locationService, $mdToast, $mdDialog) {
                    var locEditCtrl = this;
                    $scope.locationCopy = locationService.Location.makeEmpty();

                    // First load the data
                    locationService.get($scope.id)
                        .success(function(data) {
                            $scope.location = new locationService.Location(angular.fromJson(data), false);
                            // Make a deep copy to preserve the original,
                            // though this doesn't really matter as we aren't pulling straight from the main list
                            angular.copy($scope.location, $scope.locationCopy);
                            $scope.locationCopy.formattedAddr = $scope.locationCopy.getFormattedAddr();
                            $scope.locationCopy.formattedHqAddr = $scope.locationCopy.getFormattedHqAddr();
                        })
                        .error( function() {
                            console.log("Error loading location with id " + $scope.id );
                        });

                    $scope.submitEditForm = function() {
                        // validate all address input. Have got to make them extend the iron-input / build with polymer
                        if ($scope.editForm.$valid
                            /* Will forget 'bout address validaiton for now. Hopefully the geoautocomplete does enough
                            hehe todo!
                            && $scope.locationCopy.address.validate()
                            && $scope.locationCopy.hqAddress.validate()*/) {
                            // Send request to database api

                            locationService.update($scope.locationCopy)
                                .success(function(data) {
                                    angular.copy($scope.locationCopy, $scope.location);
                                    $mdToast.showSimple("Updated " + $scope.location.name + "!");
                                })
                                .error(function(data){
                                    $mdToast.showSimple("Failed to edit the location!");
                                });
                        }
                        return false;
                    };

                    $scope.deleteLocation = function(event) {
                        $mdDialog.show({
                            controller: DeleteDialogController,
                            templateUrl: '/app/shared/location/location-delete-dialog.html',
                            scope: $scope,
                            parent: $scope.$elem,
                            targetEvent: event,
                            clickOutsideToClose: true
                        }).then(function() {
                            // Delete upon confirmation
                            locationService.delete($scope.location.id)
                                .success(function(data){
                                    $mdToast.showSimple("Deleted " + $scope.location.name + "!");
                                    $scope.onClose();
                                })
                                .error(function(data){
                                    $mdToast.showSimple("Failed to delete the location!");
                                });
                        });
                    };
                    
                    function DeleteDialogController($scope, $mdDialog) {
                        $scope.close = function() {
                            $mdDialog.cancel();
                        };

                        $scope.confirm = function() {
                            $mdDialog.hide();
                        };
                    }
            }],
            controllerAs: 'locEditCtrl',
            link: function($scope, $elem) {
                // Fired second after created
                // Create a link in the scope so it can be referenced as a container for the dialogs
                $scope.$elem = $elem[0];
                $scope.$parentElem = $elem[0].parentElement;
            }
        }
    });
})();