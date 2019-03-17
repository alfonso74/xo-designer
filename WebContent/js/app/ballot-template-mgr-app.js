/**
 * ballot-template-app.js
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
 * Ballot template manager - Angular module definition.
 *
 * @author carlos.perez
 */
(function (angular) {
    'use strict';

    const module = angular.module('ballotTemplateDesigner', ['ui.bootstrap',
        'ngSanitize', 'ems.fabric', 'SspTableViewApp', 'SspGeneralOverviewApp',
        'ssp:core-ui:apps:contextual-box', 
        'pascalprecht.translate', 'ui.grid', 'ui.grid.selection', 'ngToast',
        'SspWizardApp', 'SspPopoverModalApp', 'SspTooltip']);
    
    module.config(['$translateProvider', '$translatePartialLoaderProvider',
        function($translateProvider, $translatePartialLoaderProvider) {
        $translateProvider.useSanitizeValueStrategy('sanitizeParameters');
        $translatePartialLoaderProvider.addPart('ballotTemplateManager');
        $translateProvider.useLoader('$translatePartialLoader', {
            urlTemplate: 'i18n/en.json'
        });
        $translateProvider.preferredLanguage("en");

    }]);
    
    module.config(function ($routeProvider) {
        $routeProvider
        .when("/ballot-template-list", {
            templateUrl: "ballotTemplateList.html"
        })
        .when("/ballot-template-wizard", {
            templateUrl: "ballotTemplateWizard.html"
        })
        .when("/ballot-template-designer", {
            templateUrl: "ballotTemplateDesigner.html"
//            templateUrl: "views/wizard/wizard-new-template2.html"
        });
    });

    module.run(['$rootScope', '$translate', function ($rootScope, $translate) {
      $rootScope.$on('$translatePartialLoaderStructureChanged', function () {
        // automatically reload translation tables when a controller adds
        // a new translation file
        $translate.refresh();
      });
    }]);
    
})(angular);

(function() {
    'use strict';
    angular.module('ballotTemplateDesigner').directive('customOnChange', function() {
        return {
            restrict: 'A',
            link: function (scope, element, attrs) {
                var onChangeHandler = scope.$eval(attrs.customOnChange);
                element.bind('change', onChangeHandler);
            }
        };
    });
    
})(angular);