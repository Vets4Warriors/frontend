/**
 * Created by austin on 3/1/16.
 */



(function() {
    "use strict";
    var locationService = angular.module('locationService');

    locationService.service('Location', [/*'$resource',*/ '$http',
        // Not currently using the resource. Want to be explicit. When I get better at angular.
        // Will probably be rewritten using $resource
        function(/*$resource,*/ $http) {
            var baseApiUrl = 'http://localhost:8000/api/1.0/locations';

            this.Location = class Location {
                constructor(jsonData) {
                    // Duplication but should make posting easy
                    this.rawData = jsonData;
                    this.id = jsonData['_id']['$oid'];
                    this.name = jsonData['name'];
                    this.phone = jsonData['phone'];
                    this.email = jsonData['email'];
                    this.address = jsonData['address'];
                    this.hqAddress = jsonData['hqAddress'];
                    this.locationType = jsonData['locationType'];
                    this.coverages = jsonData['coverages'];
                    this.services = jsonData['services'];
                    this.tags = jsonData['tags'];
                    this.comments = jsonData['comments'];
                    this.rating = jsonData['rating'];
                    this.ratings = jsonData['ratings'];
                    this.website = jsonData['website'];
                    this.addedOn = jsonData['addedOn'];
                    this.addedBy = jsonData['addedBy']
                }
            };

            /**
             *
             * @param id
             * @returns {HttpPromise}
             */
            this.get = function(id) {
                return $http.get(baseApiUrl + '/' + id);
            };

            this.query = function(params) {
                var url = Arg.url(baseApiUrl, params);
                return $http.get(url);
            };

            this.rate = function(id, rating) {
                return $http.post(baseApiUrl + '/' + id + '/rate', rating);
            };

            this.update = function(id, location) {
                return $http.put(baseApiUrl + '/' + id, location);
            };

            this.delete = function(id){
                return $http.delete(baseApiUrl + '/' + id);
            };

            this.add = function(location) {
                return $http.post(baseApiUrl, location);
            };
        }]);
})();