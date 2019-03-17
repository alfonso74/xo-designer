/**
 * main.js
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
 * AngularJS Directive that creates div element that represents a Box with
 * certain context or result associated to it (example: success, failure,
 * warning).
 *
 * @author  Carlos Chacon   (carlos.chacon@smartmatic.com)
 * @version 1.0 (2018/03/08)
 */
(function(angular) {
    'use strict';

    /**
     * Application Name.
     */
    const appName = 'ssp:core-ui:apps:contextual-box';


    /* contextual-box Declaration and dependencies: */
    angular.module(appName, []);


    /**
     * Angular directive that creates a roller menu.
     * <p>
     * Arguments:
     * - mode: (String) CCS Class that indicates the context of the box.
     *         Possible Values: info (blue background),
     *         success (green background), warning (yellow background), and
     *         failure (red background).
     */
    angular.module(appName).directive('sspContextualBox', function() {
        return {
            restrict: 'E',
            scope: {
                mode: '@'
            },
            templateUrl:
                'ssp/contextual-box/views/index.html'
            ,
            transclude: true
        }
    });

})(angular);
