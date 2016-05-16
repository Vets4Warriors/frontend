/**
 * Created by austin on 4/29/16.
 */

(function() {
    var app = angular.module('mapAddressInput', ['locationServices']);

    /**
     * Handles the custom address input
     * Validates the address,
     * given a LocationAddress in the target, fills with valid address info
     * Can be given map for marker selection / draggable (?)
     *
     *
     */
    app.directive('mapAddressInput', function() {
        return {
            restrict: 'E',
            templateUrl: '/app/shared/location/map-address-input.html',
            scope: {
                address: '=addressModel', //Required
                formattedAddress: '=formattedModel',
                title: '@',   // Required, readOnly
                required: '=required',
                onClose: '&'
            },
            controller: ['$scope', '$attrs', '$mdDialog', function($scope, $attrs, $mdDialog) {
                var addrInput = this;
                addrInput.required = $scope.$eval($attrs.required);
                addrInput.$valid = true;
                addrInput.$pristine = true;
                
                if (!$scope.formattedAddress)
                    $scope.formattedAddress = $scope.address ? $scope.address.getFormatted() : '';
                
                /**
                 * Opens the dialog with the input
                 * @param event
                 */
                $scope.open = function(event) {
                    $mdDialog.show({
                        controller: InputController,
                        templateUrl: '/app/shared/location/map-address-input-dialog.html',
                        parent: $scope.parent,
                        scope: $scope,
                        preserveScope: true,
                        targetEvent: event,
                        clickOutsideToClose: true
                    }).then(function(newAddr, fr) {
                        // Update the addr
                        addrInput.$pristine = false;
                       addrInput.$valid = true;
                        $scope.address = newAddr;
                        // Update the formatted address
                        $scope.formattedAddress = newAddr.getFormatted();
                    });
                };

                $scope.address.validate = function() {
                    return addrInput.$valid || (addrInput.$pristine && !addrInput.required)
                };

                $scope.reset = function() {
                    $scope.formattedAddress = '';
                    $scope.target = {};
                };

            }],
            controllerAs: 'mapAddrCtrl',
            link: function ($scope, $elem, $attrs) {
                $scope.container = $elem[0];
                $scope.parent = $elem.parent();
                $scope.formattedAddress = $scope.iFormattedAddress;
            }
        }
    });

    function InputController(locationService, $scope, $rootScope, $mdDialog) {
        $scope.tempAddr = locationService.LocationAddress.makeEmpty();
        $scope.tempFormattedAddress = '';
        $scope.geocompleteInput = null;
        var marker = null;

        /* A janky way to access the form
         * Want to redo this whole process, it's super convoluted with passing all this weird data
         * Need to find a way to bind the model with the autocomplete
         * Might look into using angular-ui-gmap
          * */
        $scope.setupGeocomplete = function() {
            if (!$scope.geocompleteInput) {
                $scope.geocompleteInput = $("#addressForm #autoComplete").geocomplete({
                    map: $rootScope.map,
                    // details: "#addressDetails" // this would be cool if angular did models with autofill
                }).bind("geocode:result", function(event, result) {
                    /* Fills in the addresses deets */
                    var latLng = result.geometry.location;

                    // Steal all the nice formatted data from response
                    var components = {};
                    // Parse the geocoded response
                    for (var i = 0; i < result['address_components'].length; i++) {
                        // Take long names for city, short for everything else
                        if (result['address_components'][i]['types'][0] == 'locality') {
                            components[result['address_components'][i]['types'][0]] =
                                result['address_components'][i]['long_name'];
                        } else {
                            components[result['address_components'][i]['types'][0]] =
                                result['address_components'][i]['short_name'];
                        }
                    }

                    // Need at least an address with a street name, and a zip code
                    // Put the address into the target object
                    if (components['street_number']) {
                        $scope.tempAddr['address1'] = components['street_number'] + ' '
                            + components['route'];
                    } else if(components['route']){
                        $scope.tempAddr['address1'] = components['route'];
                    }

                    // Address 2 should be taken care of with ng-model

                    $scope.tempAddr['city'] = components['locality'];
                    $scope.tempAddr['state'] = components['administrative_area_level_1'];
                    $scope.tempAddr['country'] = components['country'];
                    $scope.tempAddr['zipcode'] = components['postal_code'];
                    $scope.tempAddr['latLng'] = {lat: latLng.lat(), lng: latLng.lng()};
                    $scope.tempFormattedAddress = result['formatted_address'];

                    // If there was already a marker from a previous search, clear it!
                    clearMarker();

                    // Add a marker to the map
                    marker = new google.maps.Marker({
                        map: $rootScope.map,
                        position: latLng,
                        title: $scope.tempFormattedAddress
                    });

                    // Zoom to it
                    $rootScope.map.panTo(latLng);
                });
            }
        };
        
        $scope.close = function() {
            clearMarker();
            $scope.tempFormattedAddress = '';
            $mdDialog.cancel();
        };

        $scope.confirm = function() {
            clearMarker();
            $mdDialog.hide($scope.tempAddr);
        };

        function clearMarker() {
            // If there was already a marker from a previous search, clear it!
            if (marker) {
                marker.setMap(null);
            }
        }
    }

})();