/**
 * ssp-tooltip-controller.js
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
 * Controller for the SspTooltip module.
 *
 * @author Carlos Pérez
 */
(function(angular) {
    angular.module('SspTooltip').controller('SspTooltipController',
    [
        '$scope', '$element', '$attrs', '$filter', '$window',
        function($scope, $element, $attrs, $filter, $window) {

        // object used in the popover's html -> {{popover.nameOfProperty}}
        $scope.popover = {};

        // handle tooltip and tooltip title translations
        if (angular.isDefined($scope.sspTooltipValue)) {
            $attrs.sspTooltip = $scope.sspTooltipValue;
            $scope.$watch('sspTooltipValue', (sspTooltipValue) => {
                $scope.popover.message = sspTooltipValue;
            });
        } else {
            $attrs.sspTooltip = $filter('translate')($attrs.sspTooltip);
        }
        if ($scope.sspTooltipTitleValue != null) {
            $attrs.tooltipTitle = $scope.sspTooltipTitleValue;
        } else {
            $attrs.tooltipTitle = $filter('translate')($attrs.tooltipTitle);
        }

        // even though the end user properties begin with 'tooltip' we are using 
        // ui-bootstrap popovers and css
        $attrs.popoverType = $attrs.tooltipType;
        $attrs.popoverPlacement = $attrs.tooltipPlacement;
        $attrs.popoverTrigger = $attrs.tooltipTrigger;
        $attrs.popoverTitle = $attrs.tooltipTitle;
        $attrs.popoverPopupDelay = $attrs.tooltipPopupDelay;
        $attrs.popoverAppendToBody = $attrs.tooltipAppendToBody;

        if ($attrs.popoverType === undefined || $attrs.popoverType == 1) {
            //most basic popover, just text over a white tooltip
            $scope.popover.message = $attrs.sspTooltip;
            $attrs.sspTooltip = "'" + $window.getBaseUrl()
                + "/ssp/directives/ssp-tooltip/views/tooltipType01.html'";
        } else if ($attrs.popoverType == 2) {
            //popover with image and message over colored background
            $scope.popover.message = $attrs.sspTooltip;
            $attrs.popoverClass = "popoverType2";
            $attrs.sspTooltip = "'" + $window.getBaseUrl()
                + "/ssp/directives/ssp-tooltip/views/tooltipType02.html'";
        } else if ($attrs.popoverType == 3) {
            //popover with a title, image and message
            $scope.popover.title = $attrs.popoverTitle;
            $scope.popover.message = $attrs.sspTooltip;
            $attrs.popoverClass = "popoverType3";
            $attrs.sspTooltip = "'" + $window.getBaseUrl()
                + "/ssp/directives/ssp-tooltip/views/tooltipType03.html'";
        } else {
            $scope.popover.message = "Error, unknown tooltip type: " + $attrs.popoverType;
            $attrs.sspTooltip = "'" + $window.getBaseUrl()
                + "/ssp/directives/ssp-tooltip/views/tooltipType01.html'";
        }

        // default behavior for the popover 'placement' and 'trigger' options
        if ($attrs.popoverPlacement === undefined) {
            $attrs.popoverPlacement = 'auto';
        }
        if ($attrs.popoverTrigger === undefined) {
            $attrs.popoverTrigger = "'mouseenter'";
        }
        if ($attrs.popoverPopupDelay === undefined) {
            $attrs.popoverPopupDelay = "500";
        }
        if ($attrs.popoverAppendToBody === undefined) {
            $attrs.popoverAppendToBody = false;
        }
        
    }]);

})(angular);