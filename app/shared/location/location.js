/**
 * Created by austin on 2/26/16.
 */
(function() {
    var app = angular.module('location-directives', []);

    /*app.config(function ($stateProvider, $httpProvider, $urlRouterProvider) {

        // We need to setup some parameters for http requests
        // These three lines are all you need for CORS support
        $httpProvider.defaults.useXDomain = true;
        $httpProvider.defaults.withCredentials = true;
        delete $httpProvider.defaults.headers.common['X-Requested-With'];
    });*/

    app.service('locationService', [/*'$resource',*/ '$http',
        // Not currently using the resource. Want to be explicit. When I get better at angular.
        // Will probably be rewritten using $resource
        function(/*$resource,*/ $http) {
            "use strict";
            var baseApiUrl = 'http://localhost:8000/api/1.0/locations';
            var service = this;

            /**
             *
             * @type {LocationAddress}
             */
            this.LocationAddress = class LocationAddress {
                constructor(jsonData, autoLoad) {
                    this.address1 = jsonData['address1'];
                    this.address2 = jsonData['address2'];
                    this.city = jsonData['city'];
                    this.state = jsonData['state'];
                    this.country = jsonData['country'];
                    this.latLng = jsonData['latLng'];
                    this.zipcode = jsonData['zipcode'];
                }

                /**
                 *
                 * @returns {string}
                 */
                getFormatted() {
                    var addrLine = this.address1 + ((this.address2 === '') ? '' : ", " + this.address2);
                    return addrLine + ", " + this.city + ", " + this.state + ", " + this.country + ", " + this.zipcode;
                }
            };

            /**
             *
             * @type {LocationRating}
             */
            this.LocationRating = class LocationRating {
                constructor(jsonData, fromForm) {
                    // When building from the server
                    if (fromForm) {
                        this.user = jsonData['user'];
                        this.value = parseInt(jsonData['value']);
                        this.comment = jsonData['comment'];
                    } else {
                        // From Server
                        this.user = jsonData['user'];
                        this.value = jsonData['value'];
                        this.comment = jsonData['comment'];
                        this.ratedOn = new Date(jsonData['ratedOn'].$date);
                    }
                };

                /**
                 *
                 * @param jsonArray
                 * @returns {Array}
                 */
                static fromJsonArray (jsonArray) {
                    var ratings = [];
                    for (var i = 0; i < jsonArray.length; i++) {
                        ratings.push(new this(jsonArray[i], false));
                    }
                    return ratings;
                }
            };

            /**
             *
             * @type {Location}
             */
            this.Location = class Location {
                constructor(jsonData) {
                    // Duplication but should make posting easy
                    this.rawData = jsonData;
                    this.id = jsonData['_id']['$oid'];
                    this.name = jsonData['name'];
                    this.phone = jsonData['phone'];
                    this.email = jsonData['email'];
                    this.address = new service.LocationAddress(jsonData['address'], true);
                    this.hqAddress = jsonData['hqAddress'] === undefined ?
                        jsonData['hqAddress'] : new service.LocationAddress(jsonData['hqAddress'], true);
                    this.locationType = jsonData['locationType'];
                    this.coverages = jsonData['coverage'];
                    this.services = jsonData['services'];
                    this.tags = jsonData['tags'];
                    this.comments = jsonData['comments'];
                    this.rating = jsonData['rating'];
                    this.ratings = service.LocationRating.fromJsonArray(jsonData['ratings']);
                    this.website = jsonData['website'];
                    this.addedOn = new Date(jsonData['addedOn'].$date);
                    this.addedBy = jsonData['addedBy'];
                }

                /**
                 * Format the phone number so it's nice and read-able
                 * @returns {string}
                 */
                getPhone() {
                    return this.phone;
                }

                /**
                 *
                 * @returns {string}
                 */
                getFormattedAddr() {
                    return this.address.getFormatted();
                }

                /**
                 *
                 * @returns {string}
                 */
                getFormattedHqAddr() {
                    return this.hqAddress.getFormatted();
                }

                getFormattedServices() {
                    return Location.formatArrayToStr(this.services);
                }

                getFormattedCoverage() {
                    return Location.formatArrayToStr(this.coverages);
                }

                /**
                 *
                 * @returns {string}
                 */
                getFormattedTags() {
                    return Location.formatArrayToStr(this.tags);
                }

                /**
                 *
                 * @param arr
                 * @returns {string}
                 */
                static formatArrayToStr(arr) {
                    var arrStr = '';
                    for (var i = 0; i < arr.length; i++) {
                        if (i == 0)
                            arrStr += arr[i];
                        else
                            arrStr += ', ' + arr[i];
                    }
                    return arrStr;
                }

                /**
                 *
                 * @param jsonArray
                 * @returns {Array} of Locations
                 */
                static fromJsonArray (jsonArray) {
                    var locations = [];
                    for (var i = 0; i < jsonArray.length; i++) {
                        locations.push(new this(jsonArray[i]));
                    }
                    return locations;
                };
            };



            /**
             *
             * @param id
             * @returns {HttpPromise}
             */
            this.get = function(id) {
                return $http.get(baseApiUrl + '/' + id);
            };

            /**
             *
             * @param params
             * @returns {HttpPromise}
             */
            this.query = function(params) {
                var url = Arg.url(baseApiUrl, params);
                return $http.get(url);
            };

            /**
             *
             * @param id
             * @param rating
             * @returns {HttpPromise}
             */
            this.rate = function(id, rating) {
                return $http({
                    url: baseApiUrl + '/' + id + '/rate',
                    method: "POST",
                    data: JSON.stringify(rating),
                    headers: {'Content-Type': 'application/json'}
                });
            };

            /**
             *
             * @param id
             * @param location
             * @returns {HttpPromise}
             */
            this.update = function(id, location) {
                return $http.put(baseApiUrl + '/' + id, location);
            };

            /**
             *
             * @param id
             * @returns {HttpPromise}
             */
            this.delete = function(id){
                return $http.delete(baseApiUrl + '/' + id);
            };

            /**
             *
             * @param location
             * @returns {HttpPromise}
             */
            this.add = function(location) {
                return $http.post(baseApiUrl, location);
            };
        }]);

    /**
     *  This controls the list as a whole
     */
    app.controller('LocationsController', ['$scope', '$log', 'locationService',
        function($scope, $log, locationService) {
            var list = this;
            var Location = locationService.Location;
            list.locations = [];
            list.locationService = locationService;

            locationService.query({})
                .success(function(data) {
                    // This is ugly
                    list.locations = Location.fromJsonArray(angular.fromJson(data));
                })
                .error(function(data) {
                    $log.error(data);
                });
    }]);

    /**
     *  The main container for each location.
     */
    app.directive('locationCard', function() {
       return {
           restrict: 'E',
           templateUrl: '../shared/location/location-card.html',
           controller: function() {
               this.tab = 0;

               this.isShowing = function(tabIndex) {
                   return tabIndex === this.tab;
               };

               this.setTab = function(tabIndex) {
                   this.tab = tabIndex;
               }
           },
           controllerAs: 'cardController'
       };
    });

    /**
     *
     */
    app.directive('locationRating', function() {
        return {
            restrict: 'E',
            templateUrl: '../shared/location/location-rating.html',
            controller: ['$scope', '$log', 'locationService', function($scope, $log, locationService) {

                $scope.submitRatingForm = function() {
                    var form = document.getElementById($scope.location.name);

                    if (form.validate()) {
                        // Send request to database api
                        var rating = new locationService.LocationRating(form.serialize(), true);

                        locationService.rate($scope.location.id, rating)
                            .success(function(data) {
                                $log.debug(data);
                                form.reset();
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

                    return ratings.length != 0 ? sum/ratings.length : 0;
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
           templateUrl: '../shared/location/location-info.html'
       }
    });

    /**
     *  Part of the location card. Tab to display basic location info
     */
    app.directive('locationContact', function() {
        return {
            restrict: 'E',
            templateUrl: '../shared/location/location-contact.html',
            controller: ['locationService', function() {
                
            }],
            controllerAs: 'contactController'
        }
    });


    /**
     * The form to add locations
     */
    app.directive('locationAdd', function() {
        return {
            restrict: 'E',
            templateUrl: '../shared/location/location-add.html',
            controller: ['locationService', function() {

            }],
            controllerAs: 'contactController'
        }
    });

})();