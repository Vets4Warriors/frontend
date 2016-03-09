/**
 * Created by austin on 3/1/16.
 */



(function() {
    "use strict";
    var locationService = angular.module('location-services', []);

    locationService.service('locationService', [/*'$resource',*/ '$http',
        // Not currently using the resource. Want to be explicit. When I get better at angular.
        // Will probably be rewritten using $resource
        function(/*$resource,*/ $http) {
            "use strict";
            const baseApiUrl = 'http://localhost:8000/api/1.0/locations';
            const service = this;

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
                        this.ratedOn = new Date();
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
                constructor(jsonData, fromForm) {
                    if (fromForm) {

                    } else {
                        // From server
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
                 * @returns {{lat: *, lng: *}}
                 */
                getAddrLatLng() {
                    return {
                        lat: this.address.latLng['coordinates'][0],
                        lng: this.address.latLng['coordinates'][1]
                    };
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

                getFormattedDateAdded() {
                    // Could potentially use a library like moment.js
                    var monthNames = [
                        "January", "February", "March",
                        "April", "May", "June", "July",
                        "August", "September", "October",
                        "November", "December"
                    ];
                    var day = this.addedOn.getDate();
                    var monthIndex = this.addedOn.getMonth();
                    var year = this.addedOn.getFullYear();
                    return day + ' ' + monthNames[monthIndex] + ' ' + year;
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
                        locations.push(new this(jsonArray[i], false));
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
                return $http.post(baseApiUrl + '/' + id + '/rate', rating);
                /*return $http({
                 url: baseApiUrl + '/' + id + '/rate',
                 method: "POST",
                 data: JSON.stringify(rating),
                 headers: {'Content-Type': 'application/json'}
                 });*/
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
})();