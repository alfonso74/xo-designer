/**
 * ssp-table-view-app.js
 *
 * Revision: $Revision$  (Last Modified: $Date$)
 * Last Modified by: [$Author$]
 *
 * Copyright (c) 2017 Smartmatic Intl.
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
 * Directive to show information in a table using ui-grid
 *
 * @author Guillermo Heuer
 */
(function (angular) {
    'use strict';

    const app = angular.module('SspTableViewApp', ['ui.grid', 'ui.grid.pagination']);

    app.directive('sspTableView', function() {
        return {
            restrict: 'E',
            templateUrl: 'ssp/table-view/'
                + '/index.html',
            controller: 'SspTableViewController',
            scope: {
                onTableReady: '&',
                title: '@'
            },
        };
    });

})(angular);