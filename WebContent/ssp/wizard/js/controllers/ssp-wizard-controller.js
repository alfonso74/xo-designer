/**
 * ssp-wizard-controller.js
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
 * File used as the controller for the wizard directive
 *
 * @author andres.fleitas
 */
(function (angular) {
    angular.module('SspWizardApp').controller('WizardController', ['$rootScope',
        '$scope', '$translatePartialLoader', '$state', '$timeout', 'wizardProvider',
        function ($rootScope, $scope, $translatePartialLoader,
                                 $state, $timeout, wizardProvider){

            //$translatePartialLoader.addPart('wizard');

            /*
             sref: String (required), -> indicates the direction of the step
             title: String, key for the title of the Step
             shortTitle: String, key for a second title for the step (used in the start page)
             prevText: String, -> key for the previous button for the step (if not set the wizard will not display the button for this step)
             nextText: String, -> key for the next button for the step(if not set the wizard will not display the button for this step)
             displayStepOnHeader: boolean (required), Indicates if the step should be displayed in the header ul
             templateUrl: String (required), -> path of the step template
             onlyCenterButton: boolean (required), -> indicates if there will be only one button and with center align for the step
             displayHeader: boolean (required), -> Indicates if the default header will be used for the step
             controller: String, name of the controller for the step (if not set a default controller with the same scope will be created)
             stepValidationMethod: function, method that validates and does the required process of the step (if not set the next step will be called immediately)
             disableNextBtn: function, method that toggles the next button
             */

            $scope.loadingStep = false;
            $scope.startWizard = function (conf) {
                $scope.steps = conf.steps;
                $scope.cancel = conf.onCancel;
                $scope.hideDefaultButtons = true;
                $scope.hideDefaultButtons = false;
                if (conf.hideDefaultButtons === true) {
                    $scope.hideDefaultButtons = conf.hideDefaultButtons;
                }
                if (conf.addDefaultStartStep) {
                    $scope.steps.splice(0, 0, {
                        sref: 'default-wizard-start',
                        templateUrl: 'ssp/wizard/views/start.html',
                        onlyCenterButton: true,
                        displayHeader: false
                    });
                    $scope.startMessageTitle = conf.startMessageTitle;
                    $scope.startMessage = conf.startMessage;
                }
                if (conf.addDefaultFinishStep) {
                    $scope.steps.push({
                        sref: 'default-wizard-finish',
                        nextText: conf.finishButtonText,
                        templateUrl: 'ssp/wizard/views/finish.html',
                        onlyCenterButton: false,
                        displayHeader: false,
                        stepValidationMethod: conf.finishMethod
                    });
                    $scope.finishMessageTitle = conf.finishMessageTitle;
                    $scope.finishMessage = conf.finishMessage;
                    $scope.finishSecondMessage = conf.finishSecondMessage;
                    $scope.finishButtonText = conf.finishButtonText;
                }
                $scope.steps.forEach(function (step, index) {
                    step.index = index;
                    if (index == 0) {
                        step.stage = $scope.WIZARD_STAGE.ACTIVE;
                    } else {
                        step.stage = $scope.WIZARD_STAGE.TO_DO;
                    }
                });

                $scope.uuid = $scope.UUIDGenerator();
                wizardProvider.buildSubStates($scope.uuid, conf);
                $scope.activeStep = $scope.steps[0];
                $state.go($scope.uuid + '.' + $scope.activeStep.sref);
                $scope.indexOffset = $scope.activeStep.displayHeader? 1 : 0;
            };
            
            $scope.UUIDGenerator = function () {
                const uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.
                                replace(/[xy]/g, function (c) {
                    const r = Math.random() * 16 | 0, v = c == 'x' ?
                                r : (r & 0x3 | 0x8);
                    return v.toString(16);
                });
                return uuid;
            };

            $scope.next = function () {
                $scope.loadingStep = true;
                if ($scope.activeStep.stepValidationMethod != null) {
                    const promise = $scope.activeStep.stepValidationMethod();
                    if (promise && promise.then) {
                        promise.then(function (result) {
                            if (result) {
                                callNextStep();
                            }
                        });
                    } else {
                        callNextStep();
                    }
                } else {
                    callNextStep();
                }
                $timeout(function() {
                    $scope.loadingStep = false;
                }, 500);

            };

            /**
             *   method that displays the previous step in the wizard
             */
            $scope.previous = function () {
                const prev = $scope.activeStep.index - 1;
                if (prev >= 0) {
                    $scope.validationError = '';
                    $scope.activeStep.stage = $scope.WIZARD_STAGE.TO_DO;
                    $scope.activeStep = $scope.steps[prev];
                    $scope.activeStep.stage = $scope.WIZARD_STAGE.ACTIVE;
                    $state.go($scope.uuid + '.' + $scope.activeStep.sref);
                }
            };


            $scope.goToStep = function (stepSref) {

                let stepToGo;

                $scope.steps.forEach(function(step){
                    if(step.sref === stepSref){
                        stepToGo =  step;
                    }
                });

                $scope.activeStep.stage = $scope.WIZARD_STAGE.DONE;
                $scope.activeStep = stepToGo;
                $scope.activeStep.stage = $scope.WIZARD_STAGE.ACTIVE;
                $state.go($scope.uuid + '.' + $scope.activeStep.sref);

            };

            function callNextStep() {
                const next = $scope.activeStep.index + 1;
                if (next < $scope.steps.length) {
                    $scope.activeStep.stage = $scope.WIZARD_STAGE.DONE;
                    $scope.activeStep = $scope.steps[next];
                    $scope.activeStep.stage = $scope.WIZARD_STAGE.ACTIVE;
                    $state.go($scope.uuid + '.' + $scope.activeStep.sref);
                }
            }

            $scope.lastStep = function() {
                return $scope.activeStep.index == $scope.steps.length - 1;
            };

            $scope.amountOfSteps = function() {
                return $scope.steps.length - 2;
            };

            $scope.cancel = function () {
                $scope.cancel();
            };
        }]);
})(angular);