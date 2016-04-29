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
     * Target will be given a hasValidated field. Will do better when know more angular
     *
     */
    app.directive('mapAddressInput', function() {
        return {
            restrict: 'E',
            templateUrl: '/app/shared/location/map-address-input.html',
            scope: {
                target: '=target', //Required
                title: '@',   // Required, readOnly
                mapContainer: '=map',
                required: '=required',
                container: '=container',
                onClose: '&'
            },
            controller: ['$scope', '$attrs', '$mdDialog', function($scope, $attrs, $mdDialog) {
                var addrInput = this;
                addrInput.marker = null;
                addrInput.inputIsHidden = true;
                addrInput.hasValidated = false;
                addrInput.required = $scope.$eval($attrs.required);

                addrInput.setInputHidden = function (isHidden){
                    addrInput.inputIsHidden = isHidden;

                    // Remove the marker if there is one
                    if (isHidden) {
                        // $scope.inputDialog.close();
                        if (addrInput.marker) {
                            addrInput.marker.setMap(null);
                        }
                        // If an onClose function was provided, call it
                        if ($scope.onClose) {
                            $scope.onClose();
                        }
                    } else {
                        // $scope.inputDialog.refit();
                        // $scope.inputDialog.open();
                    }
                };

                /**
                 * Opens the dialog with the input
                 * @param event
                 */
                $scope.open = function(event) {
                    $mdDialog.show({
                        controller: DialogController,
                        templateUrl: '/app/shared/location/map-address-input-dialog.html',
                        parent: $scope.parent,
                        targetEvent: event,
                        clickOutsideToClose: true
                    }).then(function(newAddr) {
                        // Update the addr
                        console.log(newAddr);
                    });
                };

                /**
                 * Try to geocode the address given
                 * If successful:
                 *  Store geocode info
                 *  Ask if correct
                 *  Add draggable marker
                 * If failure:
                 *  Show toast showing error message
                 *  Ask to check for errors
                 */
                $scope.validate = function() {
                    var mapsApi = document.querySelector('google-maps-api').api;
                    var geocoder = new mapsApi.Geocoder();

                    geocoder.geocode({'address': $scope.geocompleteInput.val()}, function(result, status) {
                        // Status should always be OK and we should always get the right result in index 0
                        if (status == mapsApi.GeocoderStatus.OK) {
                            result = result[0];
                            var formData = $scope.form.serialize();
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
                                $scope.target['address1'] = components['street_number'] + ' '
                                    + components['route'];
                            } else if(components['route']){
                                $scope.target['address1'] = components['route'];
                            } else {
                                addrInput.showError("Need an address with a street name!");
                                return;
                            }
                            // Need to figure out a way for address 2
                            $scope.target['address2'] = formData['address2'];    // If they provide it, take it
                            $scope.target['city'] = components['locality'];
                            $scope.target['state'] = components['administrative_area_level_1'];
                            $scope.target['country'] = components['country'];
                            $scope.target['zipcode'] = components['postal_code'];
                            $scope.target['latLng'] = latLng;
                            $scope.formattedAddress = result['formatted_address'];

                            // If there was already a marker from a previous search, clear it!
                            if (addrInput.marker) {
                                addrInput.marker.setMap(null);
                            }

                            // Add a marker to the map
                            addrInput.marker = new mapsApi.Marker({
                                map: $scope.mapContainer.map,
                                position: latLng,
                                title: addrInput.formattedAddress
                            });

                            // Zoom to it
                            $scope.mapContainer.map.latitude = latLng.lat;
                            $scope.mapContainer.map.longitude = latLng.lng;

                            addrInput.setHasValidated(true);
                        } else {
                            console.log("Error geocoding address!");
                        }
                    });
                };


                $scope.reset = function() {
                    addrInput.hasValidated = false;
                    $scope.formattedAddress = '';
                    $scope.target = {};
                };

            }],
            controllerAs: 'mapAddrCtrl',
            link: function ($scope, $elem, $attrs) {
                $scope.parent = $elem.parent();
                $scope.form = $elem[0].querySelector('#addressForm');
                var geoInput = $elem[0].querySelector('#autoComplete');
                $scope.geocompleteInput = $(geoInput).geocomplete();

                // Todo: The .chilren[0] is a quick fix for main content being within the div.ui-view
                // $scope.inputDialog.fitInto = $scope.container.children[0];
                $scope.formattedAddress = $scope.iFormattedAddress;
            }
        }
    });

    function DialogController(locationService, $scope, $mdDialog) {
        $scope.address = locationService.LocationAddress.makeEmpty();

        $scope.close = function() {
            $mdDialog.cancel();
        };

        $scope.confirm = function() {
            $mdDialog.hide($scope.address);
        }
    }

})();