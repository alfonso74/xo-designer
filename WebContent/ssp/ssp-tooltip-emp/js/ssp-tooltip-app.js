/**
 * ssp-tooltip-app.js
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
 * Directive to show a SSP tooltip.
 *
 * Arguments: 
 *   - tooltip-type: 1 for a simple tooltip, 2 for a tooltip with image, and 3 for a tooltip with 
 *        title, image and content.  Default is 1.
 *   - tooltip-placement:  the tooltip location (top, bottom, left, right, auto).  Default is auto.
 *   - tooltip-trigger:  event which fires the trigger ('click', 'mouseenter', 'focus', 'none').  Default
 *        is 'mouseenter'.
 *   - tooltip-title:  a string to display as the tooltip title.  Only applies for tooltip-type 3.
 *   - tooltip-append-to-body:  append the tooltip to '$body' instead of the parent element?.  Default is
 *        'false'.
 *    
 * Use case examples:
 *   <span ssp-tooltip="System modules">Some text</span>
 *   <span ssp-tooltip="System modules" tooltip-type=3 tooltip-title="TITLE TYPE 3" 
         tooltip-trigger="'click'" tooltip-placement="bottom">Some text</span>
 *
 * @author Carlos Pérez
 */
(function (angular) {
    'use strict';
    
    const app = angular.module('SspTooltip', [
        'ui.bootstrap', 'SspI18nApp']);
    
    app.directive('sspTooltipPopup', ['$window', function($window) {
        return {
            restrict: "EA",
            scope: {
                contentExp: '&', 
                originScope: '&' 
            },
            templateUrl: window.getBaseUrl()
                + "/ssp/directives/ssp-tooltip/views/index.html"
        };
    }]);
    
    app.directive("sspTooltip", [ "$uibTooltip", function ($uibTooltip) {
        let directiveObject = $uibTooltip("sspTooltip", "popover", "click", {
            useContentExp: true
        });
        directiveObject.scope = {
            sspTooltipTitleValue: '@',
            sspTooltipValue: '@'
        };
        directiveObject.controller = 'SspTooltipController';
        return directiveObject; 
    }]);

})(angular);