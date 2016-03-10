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