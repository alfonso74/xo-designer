/**
 * ssp-general-overview-app.js
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
 * Directive to show a General Overview component
 *
 * @author guillermo.heuer
 */
(function (angular) {
    'use strict';

    const app = angular.module('SspGeneralOverviewApp', []);

    app.directive('sspGeneralOverview', function() {
        return {
            restrict: 'E',
            scope: {
                title: '@title',
                description: '@description',
                elementsAmount: '@elements',
                searchAdapter: '=searchAdapter'
            },
            templateUrl: 'ssp/ssp-general-overview/'
                + 'index.html',
            controller: 'SSpGeneralOverviewController'
        };
    });

})(angular);