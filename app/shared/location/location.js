/**
 * Created by austin on 2/26/16.
 */
(function() {
    var app = angular.module('locationDirectives', ['locationCard', 'locationServices', 'checklist-model',
        'mapAddressInput', 'ngMaterial']);

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
            var map = $scope.$root.map;
            var Location = locationService.Location;
            $scope.locations = [];
            
             // Start by getting all locations if the we don't already have a list
            if ($scope.locations.length == 0)
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
                    $scope.location.address = locationService.Location.makeEmpty();
                    $scope.hqAddr = locationService.Location.makeEmpty();
                };

            }],
            controllerAs: 'locAddCtrl',
            link: function ($scope, $elem, $attrs) {
                // Fired second after created
                // Create a link in the scope so it can be referenced as a container for the dialogs
                $scope.$parentElem = $elem[0].parentElement;
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
                            
                            //var location = new locationService.Location($scope.locationCopy, true);

                            // Copy the id to update
                            //$scope.locationCopy.id = $scope.location.id;

                            locationService.update($scope.locationCopy)
                                .success(function(data) {
                                   /* successToast.show({
                                        text: "Updated " + location.name + "!",
                                        duration: 3000
                                    });*/
                                    angular.copy($scope.locationCopy, $scope.location);
                                    console.log("Success updating");
                                })
                                .error(function(data){
                                    // Todo: animate the paper-fab upwards as well
                                    /*errorToast.show({
                                        text: "Failed to edit the location!",
                                        duration: 3000
                                    });*/
                                    console.log("Error updating");
                                });
                        }
                        return false;
                    };

                    $scope.deleteLocation = function(confirmed) {
                        if (!confirmed) {
                            // Open the confirmation dialog

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
            }
        }
    });
})();