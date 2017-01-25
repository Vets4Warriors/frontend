/**
 * Created by austin on 3/1/16.
 */

(function() {
    "use strict";
    var locationService = angular.module('locationServices', []);

    // Utility function
    function emptyOrStringField(field) {
        return field === '' ? undefined : field;
    }

    locationService.service('locationService', [/*'$resource',*/ '$http',
        // Not currently using the resource. Want to be explicit. When I get better at angular.
        // Will probably be rewritten using $resource
        function(/*$resource,*/ $http) {
            var baseApiUrl = 'https://vets.cawleyedwards.com/api/1.0/locations';
            // var baseApiUrl = 'http://localhost/api/1.0/locations';
            // var baseApiUrl = 'http://localhost:5000/1.0/locations';
            const service = this;

            /**
             *
             * @type {LocationAddress}
             */
            service.LocationAddress = function LocationAddress(jsonData, fromForm) {
                if (fromForm) {
                    this.latLng = jsonData['latLng'];
                } else {
                    // latLng is stored in lng lat form in database
                    this.latLng = {};
                    this.latLng.lat = jsonData['latLng'].coordinates[1];
                    this.latLng.lng = jsonData['latLng'].coordinates[0];
                }
                this.address1 = jsonData['address1'];
                this.address2 = jsonData['address2'];
                this.city = jsonData['city'];
                this.state = jsonData['state'];
                this.country = jsonData['country'];
                this.zipcode = jsonData['zipcode'];
            };

            /**
             * Todo: refactor this to be opposite. Aka constructor makes empty
             * @returns {service.LocationAddress}
             */
            service.LocationAddress.makeEmpty = function() {
                return new service.LocationAddress({
                    address1: '',
                    address2: '',
                    city: '',
                    state: '',
                    country: '',
                    zipcode: '',
                    latLng: { lat: 0.0, lng: 0.0 }
                }, true);
            };

          /**
           *
           * @return {boolean}
           */
            service.LocationAddress.prototype.isEmpty = function() {
                return this.latLng.lat == 0.0 && this.latLng.lng == 0.0;
            };


            /**
             *
             * @returns {string}
             */
            service.LocationAddress.prototype.getFormatted = function() {
                if (this.state === '') return ''; // We know that it is empty. Quick fix. Is it harrible?

                var addrLine = this.address1 + ((this.address2 === '') ? '' : ", " + this.address2);
                return addrLine + ", " + this.city + ", " + this.state + ", " + this.country + ", " + this.zipcode;
            };

            /**
             * For searching simplification
             * The ~ is the bitwise inverse, will turn -1 to false and errything else to true
             * @param search {string}
             */
            service.LocationAddress.prototype.contains = function(search) {
                var result = false;
                if (this.address1)
                    result = result || ~this.address1.indexOf(search);
                if (this.address2)
                    result = result || ~this.address2.indexOf(search);
                if (this.city)
                    result = result || ~this.city.indexOf(search);
                if (this.state)
                    result = result || ~this.state.indexOf(search);
                if (this.country)
                    result = result || ~this.country.indexOf(search);
                if (this.zipcode)
                    result = result || ~this.zipcode.indexOf(search);
                return result;
            };

          /**
           * TODO
           * @return {boolean}
           */
          service.LocationAddress.prototype.validate = function() {
                return true;
            };

            /**
             * @type {LocationRating}
             */
            service.LocationRating = function(jsonData, fromForm) {
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
            service.LocationRating.fromJsonArray = function (jsonArray) {
                var ratings = [];
                for (var i = 0; i < jsonArray.length; i++) {
                    ratings.push(new this(jsonArray[i], false));
                }
                return ratings;
            };

            /**
             * Only addedBy and name are required
             * @type {Location}
             */
            service.Location = function(jsonData, fromForm) {
                /* Meant explicitly to send to the server */
                if (fromForm) {
                    console.log("Building location from form!");
                    // required
                    this.name = jsonData['name'];
                    this.addedBy  = jsonData['addedBy'];

                    this.phone = emptyOrStringField(jsonData['phone']);
                    this.email = emptyOrStringField(jsonData['email']);
                    this.address = jsonData['address'];
                    this.hqAddress = jsonData['hqAddress'];
                    this.locationType = emptyOrStringField(jsonData['locationType']);
                    this.coverages = jsonData['coverages'];
                    this.services = jsonData['services'];
                    this.tags = jsonData['tags'];
                    this.comments = emptyOrStringField(jsonData['comments']);
                    this.website = emptyOrStringField(jsonData['website']);
                } else {
                    // From server
                    //this.rawData = jsonData;
                    this.id = jsonData['_id']['$oid'];
                    this.name = jsonData['name'];
                    this.phone = jsonData['phone'];
                    this.email = jsonData['email'];
                    this.address = jsonData['address'] === undefined ? service.LocationAddress.makeEmpty()
                        : new service.LocationAddress(jsonData['address'], false);
                    this.hqAddress = jsonData['hqAddress'] === undefined ? service.LocationAddress.makeEmpty()
                        : new service.LocationAddress(jsonData['hqAddress'], false);
                    this.locationType = jsonData['locationType'];
                    this.coverages = jsonData['coverages'];
                    this.services = jsonData['services'];
                    this.tags = jsonData['tags'];
                    this.comments = jsonData['comments'];
                    this.rating = jsonData['rating'];
                    this.ratings = service.LocationRating.fromJsonArray(jsonData['ratings']);
                    this.website = jsonData['website'];
                    this.addedOn = new Date(jsonData['addedOn'].$date);
                    this.addedBy = jsonData['addedBy'];
                }
            };

            service.Location.makeEmpty = function() {
                var empty = {};
                empty.name = "";
                empty.phone = "";
                empty.email = "";
                empty.website = "";
                empty.address = service.LocationAddress.makeEmpty();
                empty.hqAddress = service.LocationAddress.makeEmpty();
                empty.locationType = "";
                empty.coverages = [];
                empty.services = [];
                empty.tags = [];
                empty.comments = "";
                empty.rating = 0;
                empty.ratings = [];
                return new this(empty, true);
            };

            /**
             * Format the phone number so it's nice and read-able
             * @returns {string}
             */
            service.Location.prototype.getPhone = function() {
                return this.phone;
            };

            /**
             *
             * @returns {string}
             */
            service.Location.prototype.getFormattedAddr = function() {
                return (this.address && this.address.address1 !== '') ? this.address.getFormatted() : '';
            };

            /**
             *
             * @returns {string}
             */
            service.Location.prototype.getFormattedHqAddr = function() {
                return (this.hqAddress && this.hqAddress.address1 !== '') ? this.hqAddress.getFormatted() : '';
            };

            /**
             * Tries to get an address for map purposes
             * Favors
             */
            service.Location.prototype.getLatLngAddr = function() {
                return this.address || this.hqAddress;
            };

            service.Location.prototype.hasAddr = function() {
                return (this.address !== undefined  && !this.address.isEmpty())
                    || (this.hqAddress !== undefined && !this.hqAddress.isEmpty());
            };

            /**
             *
             * @returns {{lat: *, lng: *}}
             */
            service.Location.prototype.getAddrLatLng = function() {
                return this.address.latLng;
            };


          /**
           *
           * @return {string}
           */
            service.Location.prototype.getFormattedServices = function() {
                return service.Location.formatArrayToStr(this.services, ', ', '');
            };

          /**
           *
           * @return {string}
           */
            service.Location.prototype.getFormattedCoverage = function() {
                return service.Location.formatArrayToStr(this.coverages, ', ', '');
            };

            /**
             *
             * @returns {string}
             */
            service.Location.prototype.getFormattedTags = function() {
                return service.Location.formatArrayToStr(this.tags, ', ', '');
            };

            service.Location.prototype.getFormattedDateAdded = function() {
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
            };

            /**
             *
             * @param arr
             * @param delimiter
             * @param prefix
             * @returns {string}
             */
            service.Location.formatArrayToStr = function(arr, delimiter, prefix) {
                if (!delimiter) {
                    delimiter = ','
                }
                if (!prefix) {
                    prefix = '';
                }
                var arrStr = '';
                for (var i = 0; i < arr.length; i++) {
                    if (i == 0)
                        arrStr += prefix + arr[i];
                    else
                        arrStr += delimiter + prefix + arr[i];
                }
                return arrStr;
            };

            /**
             *
             * @param jsonArray
             * @returns {Array} of Locations
             */
            service.Location.fromJsonArray = function(jsonArray) {
                var locations = [];
                for (var i = 0; i < jsonArray.length; i++) {
                    locations.push(new this(jsonArray[i], false));
                }
                return locations;
            };


            /**
             *
             * @param id
             * @returns {HttpPromise}
             */
            service.get = function(id) {
                return $http.get(baseApiUrl + '/' + id);
            };

            /**
             *
             * @param params
             * @returns {HttpPromise}
             */
            service.query = function(params) {
                var url = Arg.url(baseApiUrl, params);
                return $http.get(url);
            };

            /**
             *
             * @param id
             * @param rating
             * @returns {HttpPromise}
             */
            service.rate = function(id, rating) {
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
            service.update = function(location) {
                return $http.put(baseApiUrl + '/' + location.id, location);
            };

            /**
             *
             * @param id
             * @returns {HttpPromise}
             */
            service.delete = function(id){
                return $http.delete(baseApiUrl + '/' + id);
            };

            /**
             *
             * @param location
             * @returns {HttpPromise}
             */
            service.add = function(location) {
                return $http.post(baseApiUrl, location);
            };
        }]);
})();