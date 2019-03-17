/**
 * ssp-popover-modal-app.js
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
 * Directive to show a popover modal with background overlay
 *
 * @author Guillermo Heuer
 */
(function (angular) {
    'use strict';

    const app = angular.module('SspPopoverModalApp', [
        "ui.bootstrap"]);

    app.directive('sspPopoverModalButton', function() {
        return {
            restrict: 'E',
            templateUrl: 'ssp/ssp-popover-modal/'
                + '/index.html',
            scope: {
                buttonType: '@',
                buttonStyle: '@',
                buttonTitle: '@',
                popoverPosition : '@',
                popoverContentTemplate : '@',
                icon: '@',
                apiAdapter: '=?adapter',
                disabledOn: '=?',
            },
            controller: 'SspPopoverModalController',
            link: function link(scope) {
                // exposed api
                if (!angular.isDefined(scope.apiAdapter)) {
                   scope.apiAdapter = {};
                }
            }
        };
    });

})(angular);