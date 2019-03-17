/**
 * ssp-popover-modal-controller.js
 *
 * Revision: $Revision$  (Last Modified: $Date$)
 * Last Modified by: [$Author$]
 *
 * Copyright (c) 2016 Smartmatic Intl.
 * 1001 Broken Sound Parkway NW, Suite D
 * Boca Raton FL 33487, U.S.A.
 * All rights reserved.
 *
 * This software is the confidential and proprietary information of
 * Smartmatic Intl. ("Confidential Information"). You shall not
 * disclose such Confidential Information and shall use it only in
 * accordance with the terms of the license agreement you entered
 * into with Smartmatic Intl.
 */

/**
 * Controller of the popover modal button
 *
 * @author guillermo.heuer
 */
(function(angular) {
    angular.module('SspPopoverModalApp').controller('SspPopoverModalController',
        ['$rootScope', '$scope', function($rootScope, $scope) {

//        $scope.popoverContentTemplate = window.getBaseUrl() +
//            + $scope.popoverContentTemplate;

        $scope.$watch('sspPopoverOpen', function(value) {
            if (value) {
                $("body").prepend('<div id="popover-overlay1"></div>');
            } else {
                $("#popover-overlay1").remove();
            }
        });

        $scope.closePopover = function() {
            $scope.sspPopoverOpen = !$scope.sspPopoverOpen;
            $("#popover-overlay1").remove();
            $rootScope.$broadcast('popover.closed', {});
        };
    }]);

})(angular);