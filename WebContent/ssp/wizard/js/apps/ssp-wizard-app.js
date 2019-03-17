/**
 * geography-crud.js
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
 * File used as the service provider for the i18n module
 *
 * @author jose.carrizo
 */
(function (angular) {
    'use strict';

    const app = angular.module('SspWizardApp', [
        'ngSanitize', 'ui.router', 'ngRoute']);

    app.provider('wizardProvider', ['$stateProvider', function($stateProvider) {
        this.buildSubStates = function(uuid, conf){

             // configure base state
             $stateProvider.state(uuid, {
                 templateUrl: 'ssp/wizard/views/wizard.html'
             });

             // prepare 'resolve' dependencies
             const resolve = conf.resolve || {};
             resolve.wizardScope = function() {
                 return conf.scope;
             };

             conf.steps.forEach(function(step) {
                 resolve.stepDef = function() {
                     return step;
                 };
                 $stateProvider.state(uuid + '.' + step.sref,
                 {
                    templateUrl: step.templateUrl,
                     resolve: resolve,
                     controller: step.controller || 'defaultWizardController'
                 });
             });

        };
        this.$get = function(){
         return this;
        };
    }]);

    app.directive('sspWizard', ['$rootScope', function ($rootScope) {
        return {
            restrict: 'EA',
            scope: {
                onWizardReady: '&'
            },
            controller: 'WizardController',
            templateUrl: 'ssp/wizard/views/wizard-entry.html',
            link: function link(scope) {
                scope.steps = [];
                scope.apiAdapter = {};

                scope.WIZARD_STAGE = {
                    TO_DO: "to-do",
                    ACTIVE: "active",
                    DONE: "done"
                };
                scope.apiAdapter.WIZARD_STAGE = scope.WIZARD_STAGE;
                scope.apiAdapter.startWizard = scope.startWizard;
                scope.apiAdapter.previous = scope.previous;
                scope.apiAdapter.next = scope.next;
                scope.apiAdapter.adapter = scope.apiAdapter;

                scope.onWizardReady()(scope.apiAdapter);
            }
        };
    }]);

    app.controller('defaultWizardController', ['$scope', 'wizardScope',
        function defaultController($scope, wizardScope) {
            $scope.wizardScope = wizardScope;
     }]);

})(angular);
