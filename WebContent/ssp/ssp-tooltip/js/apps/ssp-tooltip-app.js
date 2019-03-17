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
        'ui.bootstrap']);
    
    app.directive('sspTooltipPopup', ['$window', function($window) {
        console.log("LOC: " + $window.location);
        if (window.getBaseUrl) {
            console.log("LOC: " + window.getBaseUrl());
        };
        return {
            restrict: "EA",
            scope: {
                contentExp: '&', 
                originScope: '&' 
            },
            templateUrl: "ssp/ssp-tooltip/index.html",
            //template: '<div class="arrow"></div><div class="popover-inner"><div class="popover-content" uib-tooltip-template-transclude="contentExp()" tooltip-template-transclude-scope="originScope()"></div></div>',
            controller:  function($scope, $element, $attrs) {
                let originScope = $scope.originScope();
                let content = $scope.contentExp();
//                originScope.popover.message = "JAX!";
//                console.log("POPOVER: " + JSON.stringify(originScope.popover));
//                originScope.popover = {};
//                originScope.popover.message = "JA!!";
                /*
                if ($attrs.popoverType === undefined || $attrs.popoverType == 1) {
                    $scope.popover.message = $attrs.sspTooltip;
                } else if ($attrs.popoverType == 2) {
                    $scope.popover.message = $attrs.sspTooltip;
                } else if ($attrs.popoverType == 3) {
                    //popover with a title, image and message
                    $scope.popover.title = $attrs.popoverTitle;
                    $scope.popover.message = $attrs.sspTooltip;
                } else {
                    $scope.popover.message = "Error, unknown tooltip type: " + $attrs.popoverType;
                }
                */
            }
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
    
    
    /*********************** SSP Tooltip (Old version) *************************/
    
    app.directive('sspTooltipOld', ['$window', function($window) {
        console.log("LOC: " + $window.location);
        if (window.getBaseUrl) {
            console.log("LOC: " + window.getBaseUrl());
        }
        return {
            restrict: 'EA',
            transclude: true,
            templateUrl: 'ssp/ssp-tooltip/indexOld.html',
//            templateUrl: window.getBaseUrl() + '/ssp/ssp-tooltip/index.html',
            scope: {
                sspTooltip: '@',
                tooltipType: '@',
                tooltipPlacement : '@',
                tooltipTitle: '@',
                tooltipTrigger: '@',
            },
            controller: 'SspTooltipControllerOld'
        };
    }]);
    
    app.controller('SspTooltipControllerOld', function($scope, $element, $attrs) {
        if ($scope.tooltipPlacement === undefined) {
            $scope.tooltipPlacement = 'auto';
        }
        if ($scope.tooltipTrigger === undefined) {
            $scope.tooltipTrigger = "'mouseenter'";
        }
        
        $scope.tooltipMessage = $scope.sspTooltip;
        
        console.log("Position: " + $scope.tooltipPlacement);
        console.log("Trigger: " + $scope.tooltipTrigger);
    });
    
    app.controller('PopoverDemoCtrl', function($scope) {
        $scope.dynamicPopover = 'Hello, World!';
        $scope.dynamicPopoverTitle = 'Title';
    });

})(angular);