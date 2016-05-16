/**
 * @ngdoc service
 * @name listPage:locationFilter
 *
 * @description
 *
 *
 * */
(function() {
    angular.module('listPage')
    /**
     *
     */
    .filter('locationFilter', function(){
        /**
         * Deals with different types of properties in locations
         * @param item
         * @param term
         */
        function contains(item, term) {
            //console.log(item);
            //console.log(typeof item);
            //console.log(term);

            if (typeof item === 'string') {
                return ~item.indexOf(term);
            } else if (item !== undefined) {
                // Type object, no numbers here, also no undefined please
                if (Array.isArray(item)) {
                    // Tags, Services, Coverages
                    // Always lists of strings
                    for (var i = 0; i < item.length; i++) {
                        // Always return on first success
                        if (~item[0].indexOf(term)) {
                            return true;
                        }
                    }
                } else {
                    // Address
                    // @see location-services.LocationAddress.contains
                    return item.contains(term);
                }
            }
            
            // Default
            return false;
        }

        return function(locations, searchTerm, searchBy) {
            // Default when search bar is empty
            if (!searchTerm) {
                return locations;
            }

            var filtered = [];

            /*
            // If there are no search terms, search in all reasonable fields
            name
            email
            website
            locationType
            coverages
            services
            tags
            address
            hqAddress
            phone
            */
            var searchFields = [
                'name', 'website', 'email', 'phone', 'locationType', 'coverages', 'locationType', 'services', 'tags',
                'address', 'hqAddress'
            ];
            if (searchBy && searchBy.length > 0) {
                searchFields = searchBy;
            }

            for (var i = 0; i < locations.length; i++) {
                for (var j = 0; j < searchFields.length; j++) {
                    // Break after first successful search, no need to search everything everytime
                    if (contains(locations[i][searchFields[j]], searchTerm)) {
                        filtered.push(locations[i]);
                        break;
                    }
                }
            }

            return filtered;
        };
    });
})();


