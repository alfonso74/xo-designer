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
 * Directive to show a SSP tooltip
 *
 * @author Carlos Pérez
 */
(function (angular) {
    'use strict';
    
    const app = angular.module('SspTooltip', [
        'ui.bootstrap', 'ui.bootstrap.tooltip']);
    
    app.directive('sspTooltip', ['$window', function($window) {
        console.log("LOC: " + $window.location);
        if (window.getBaseUrl) {
            console.log("LOC: " + window.getBaseUrl());
        }
        return {
            restrict: 'EA',
            transclude: true,
            templateUrl: 'ssp/ssp-tooltip/index.html',
//            templateUrl: window.getBaseUrl() + '/ssp/ssp-tooltip/index.html',
            scope: {
                sspTooltip: '@',
                tooltipType: '@',
                tooltipPlacement : '@',
                tooltipTitle: '@',
                tooltipTrigger: '@',
            },
            controller: 'SspTooltipController'
        };
    }]);
    
    app.directive('sspTooltip2', ['$window', '$http', '$compile', function($window, $http, $compile) {
        console.log("LOC: " + $window.location);
        if (window.getBaseUrl) {
            console.log("LOC: " + window.getBaseUrl());
        }
        return {
            restrict: 'EA',
//            templateUrl: 'ssp/ssp-tooltip/index2.html',
//            templateUrl: window.getBaseUrl() + '/ssp/ssp-tooltip/index.html',
            scope: {
                sspTooltip: '@',
                tooltipType: '@',
                tooltipPlacement : '@',
                tooltipTitle: '@',
                tooltipTrigger: '@',
            },
            link: function(scope, element){
                $http.get('ssp/ssp-tooltip/index2.html')
                  .then(function(response){
                    element.after($compile(response.data)(scope));
                  });
            },
            controller: 'SspTooltipController'
        };
    }]);
    
    app.directive('sspTooltip3', ['$window', function($window) {
        console.log("LOC: " + $window.location);
        if (window.getBaseUrl) {
            console.log("LOC: " + window.getBaseUrl());
        }
        return {
            restrict: 'EA',
            templateUrl: 'ssp/ssp-tooltip/index3.html',
            transclude: true,
//          templateUrl: window.getBaseUrl() + '/ssp/ssp-tooltip/index.html',
            scope: {
                sspTooltip: '@',
                tooltipType: '@',
                tooltipPlacement : '@',
                tooltipTitle: '@',
                tooltipTrigger: '@',
            },
            link: function (scope, element, attrs, ngModelCtrl, transclude) {
                element.append(transclude());
            },
            controller: 'SspTooltipController'
        };
    }]);
    
    app.directive("sspTooltip4Popup", function () {
        return {
            restrict: "A",
            templateUrl: 'ssp/ssp-tooltip/index4.html',
            scope: { uibTitle: '@', content: '@' }
        };
    })
    
    app.directive('sspTooltip4', ['$uibTooltip', function($uibTooltip) {
        return $uibTooltip('sspTooltip4', 'popover', 'click');
    }]);
    
    app.directive("sspTooltip5Popup", function () {
        return {
            restrict: "EA",
            scope: { uibTitle: '@', contentExp: '&', originScope: '&' },
            templateUrl: "ssp/ssp-tooltip/index5.html"
        };
    })

    app.directive("sspTooltip5", [ "$uibTooltip", function ($uibTooltip) {
        return $uibTooltip("sspTooltip5", "popover", "click");
    }]);
    
    app.directive("sspTooltip6Popup", function () {
        return {
            restrict: "EA",
            scope: { uibTitle: '@', contentExp: '&', originScope: '&' },
            templateUrl: "ssp/ssp-tooltip/index6.html"
//            controller: 'SspTooltipController3'
        };
    })

    app.directive("sspTooltip6", [ "$uibTooltip", function ($uibTooltip) {
        let uibTT = $uibTooltip("sspTooltip6", "popover", "click", {
            useContentExp: true
        });
        uibTT.controller = 'SspTooltipController3';
        return uibTT; 
    }]);
    
    app.controller('SspTooltipController3', function($scope, $element, $attrs) {
        console.log("Controller3!!");
        $scope.content="JA!";
        $scope.uibTitle="JA2";
//        $scope.tooltipMessage = "JA!!";
        if ($attrs.tooltipType == 1) {
            $scope.tooltipMessage = $attrs.sspTooltip6;
            $attrs.sspTooltip6 = "'ssp/ssp-tooltip/tooltipType1.html'"
        }
        if ($attrs.tooltipType == 2) {
            $scope.tooltipMessage = $attrs.sspTooltip6;
            $attrs.sspTooltip6 = "'ssp/ssp-tooltip/tooltipType2.html'"
        }
        
    });
    
    app.controller('PopoverDemoCtrl', function($scope) {
        $scope.dynamicPopover = 'Hello, World!';
        $scope.dynamicPopoverTitle = 'Title';
    });

})(angular);