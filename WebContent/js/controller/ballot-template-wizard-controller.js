
(function() {
    'use strict';

    angular.module('ballotTemplateDesigner').controller('ballotTemplateWizardController', BallotTemplateWizardController);
    
    BallotTemplateWizardController.$inject = ['$scope',
        '$location',
        '$log',
        '$translate',
        '$window'];
    
    function BallotTemplateWizardController($scope, 
            $location, $log, $translate, $window) {
        
        var vm = this;
        
        var usingLocalStorage = true;
        var baseTemplateUrl = '';
        
        vm.infoBox = {
            mode: 'info',
            message: 'btm.modal.create-ballot-template.information',
            parameters: "{'districtType' : districtType}"
        };
        
        
        /**
         * wizard adapter
         */
        $scope.wizardAdapter = {};

        /**
         * Base setup wizard object
         */
        $scope.wizardScope = {
            election: {
                name: "",
                shortName: "",
                description: "",
                eventDate: new Date(),
                type: ""
            },
            deviceTypes: [],
            contestClass: [],
            officers: [],
            ballots: []
        };
        
        
        /**
         *  method called by the wizard to indicate it's ready to be configured
         */
        $scope.onWizardReady = function (adapter) {
            getStorageLocation();

            $scope.wizardAdapter = adapter.adapter;
            // the wizard steps
            const steps = [];


            steps.push({
                sref: 'ballot-template-step01',
                title: 'ballot.wizard.general.title',
                shortTitle: 'ballot.wizard.general.short.title',
                nextText: 'ssp.next',
                prevText: 'ssp.previous',
                displayStepOnHeader: true,
                templateUrl: baseTemplateUrl + 'views/wizard/ballot-template-designer.html',
                onlyCenterButton: false,
                displayHeader: true,
                controller: 'ballotTemplateManagerController as vm'
            });

            steps.push({
                sref: 'ballot-template-step02',
                title: 'ballot.wizard.data.title',
                shortTitle: 'ballot.wizard.data.short.title',
                nextText: 'ssp.next',
                prevText: 'ssp.previous',
                displayStepOnHeader: true,
                templateUrl: baseTemplateUrl + 'views/wizard/language-review.html',
                onlyCenterButton: false,
                displayHeader: true,
                controller: 'languageReviewController as vm'
            });
            steps.push({
                sref: 'ballot-template-step03',
                title: 'ballot.wizard.review.title',
                shortTitle: 'ballot.wizard.review.short.title',
                prevText: 'ssp.previous',
                nextText: 'ssp.finish',
                displayStepOnHeader: true,
                templateUrl: baseTemplateUrl + 'views/wizard/save-template.html',
                onlyCenterButton: false,
                displayHeader: true,
                controller: 'saveTemplateController as vm'
            });

            // object used to pass information to and from each controller
            const wizard = {
                scope: $scope.wizardScope,
                steps: steps,
                addDefaultStartStep: true,
                startMessageTitle: 'ballot.wizard.start.title',
                startMessage: 'ballot.wizard.start.text',
                addDefaultFinishStep: true,
                finishMessageTitle: 'ballot.wizard.finish.title',
                finishMessage: 'ballot.wizard.finish.text',
                finishSecondMessage: 'ballot.wizard.finish.text',
                finishButtonText: 'ballot.wizard.finish.button',
                finishMethod: onFinishCalled,
                resolve: {
                    translate: function () {
                        return $translate.refresh();
                    }
                },
                onCancel: onFinishCalled
            };
            // configures the wizard
            $scope.wizardAdapter.startWizard(wizard);
        };
        
        function onFinishCalled() {
//            const url = '/ballot-template-manager';
            const url = '/' + baseTemplateUrl;
            $location.path(url);
        };
        
        function getStorageLocation() {
            if (!window.location.href.startsWith('file')) {
                usingLocalStorage = false;
                baseTemplateUrl = 'ballot-template-manager/';
            }
            console.log("Using local storage: " + usingLocalStorage);
        };
        
    }
    
})();

(function() {
    'use strict';

    angular.module('ballotTemplateDesigner').controller('languageReviewController', LanguageReviewController);
    
    LanguageReviewController.$inject = ['$scope', 'wizardScope', 'stepDef', '$q', '$timeout'];
    
    function LanguageReviewController($scope, wizardScope, stepDef, $q, $timeout) {
        var vm = this;
        
        stepDef.stepValidationMethod = function() {
            var deferred = $q.defer();
            $timeout(function() {
                deferred.resolve(true);
            }, 1500);
            return deferred.promise;
        }
        
    }
})();

(function() {
    'use strict';

    angular.module('ballotTemplateDesigner').controller('saveTemplateController', SaveTemplateController);
    
    SaveTemplateController.$inject = ['ballotTemplateDesignerService', '$rootScope', '$scope', 'wizardScope', 'stepDef', 
        'dataService', 'ngToast','sspServices','$timeout', '$q', '$log'];
    
    function SaveTemplateController(ballotTemplateDesignerService, $rootScope, $scope, wizardScope, stepDef, 
            dataService, ngToast, ssp, $timeout, $q, $log) {
        var vm = this;
        
        var usingLocalStorage = wizardScope.usingLocalStorage;
        vm.canvas = wizardScope.canvas;
        vm.currentVotingTypes = wizardScope.canvas.currentVotingTypes;
        vm.currentPageSize = wizardScope.canvas.currentPageSize;
        vm.currentOrientation = wizardScope.canvas.currentOrientation;
        vm.currentBallotColumns = wizardScope.canvas.currentBallotColumns;
        
        vm.formHasInvalidData = function() {
            let touched = $scope.forms.saveBallotTemplateForm.template_name.$touched;
            let invalid = $scope.forms.saveBallotTemplateForm.template_name.$invalid;
            let required = $scope.forms.saveBallotTemplateForm.template_name.$error.required;
            return touched &&
                    invalid &&
                    required;
        };
        
        /**
         * Wizard's way to call a function before next step
         */
        stepDef.stepValidationMethod = function() {
            $log.info("Requesting template save action: " + vm.templateName);
            let message = {
                    name: vm.templateName,
                    description: vm.templateDescription,
            }
            wizardScope.templateName = vm.templateName;  // used in some translated messages
            
            return saveBallotStyle(vm.templateName);
        };
        
        function saveBallotStyle(ballotStyleName) {
            var deferred = $q.defer();
            if (!ballotStyleName || ballotStyleName === '' || ballotStyleName === 'x') {
                wizardScope.showModalInformation("Save ballot style", 
                        "Please enter a name for the ballot style.");
                ssp.toast('danger', 'ballot.wizard.save.error.missing.name');
                deferred.reject();
            } else {
                if (usingLocalStorage) {
                    saveBallotStyleLocal(ballotStyleName);
                    deferred.resolve(true);
                } else {
                    let ballotStyleCode = undefined;
                    ballotTemplateDesignerService.saveBallotStyle(ballotStyleName, 
                            vm.currentVotingTypes, 
                            createBallotStyleDefinition())
                    .then(function(response) {
                        ballotStyleCode = response.data.data;
                        return saveBallotStyleContestAssociations(ballotStyleCode);
                    })
                    .then(function() {
                        ssp.toast('success', 'ballot.wizard.finish.title');
                        $log.info("Ballot style saved successfully, id " + ballotStyleCode);
                        deferred.resolve(true);
                    })
                    .catch(function(data, status) {
                        $log.error('Error: ' + status);
                        ssp.toast('danger', 'ballot.wizard.save.error');
                        deferred.reject('Error: ' + status);
                    });
                }
            }
            return deferred.promise;
        };
        
        function saveBallotStyleContestAssociations(ballotStyleCode) {
            var contestAssociations = getContestAssociationsForBallotStyle();
            return ballotTemplateDesignerService.saveBallotStyleContestAssociations(ballotStyleCode, contestAssociations);
        }
        
        function getContestAssociationsForBallotStyle() {
            var contestAssociations = [];
            var pages = vm.canvas.pages;
            $log.info("Pages: " + pages.length);
            for (let n = 0; n < pages.length; n++) {
                var pageContestAssociations = getContestAssociationsForCanvasPage(pages[n]);
                pageContestAssociations.forEach(function(obj) {
                    contestAssociations.push(obj);
                })
            }
            $log.info("Contest associations: " + contestAssociations);
            return contestAssociations;
        }
        
        function getContestAssociationsForCanvasPage(page) {
            var contestAssociations = [];
            if (page != null && page.objects) {
                page.objects.forEach(function (obj) {
                    if (obj.type === 'group' && obj.contestClass) {
                        contestAssociations.push(obj.templateCode + ',' + obj.contestClass.code);
                    }
                });
            };
            return contestAssociations;
        }
        
        function saveBallotStyleLocal (ballotStyleName) {
            var ballotStyleName = ballotStyleName;
            $log.info("Saving ballot template: " + ballotStyleName);
            
            var ballotTemplates = [];
            
            var found = false;
            var retrievedObject = localStorage.getItem('ballotStyles');
            if (!retrievedObject) {
                retrievedObject = [];
            } else {
                var ballotTemplates = JSON.parse(retrievedObject);
                for (var n = 0; n < ballotTemplates.length; n++) {
                    if (ballotTemplates[n].name === ballotStyleName) {
                        ballotTemplates[n] = createBallotStyleDefinitionForLocalStorage(ballotStyleName);
                        found = true;
                    }
                }
            }

            if (!found) {
                ballotTemplates.push(createBallotStyleDefinitionForLocalStorage(ballotStyleName));
            }
            
            // Put the object into storage
            var jsonToStore = JSON.stringify(ballotTemplates);
            localStorage.setItem('ballotStyles', jsonToStore);
            
            $log.info("BALLOT TEMPLATE DEFINITION:\n" + jsonToStore);
//            showModalConfirmation("Save ballot style", "Saved succesfully.", null);
        };
        
        function createBallotStyleDefinitionForLocalStorage(ballotStyleName) {
            var templateDefinition = {'name': ballotStyleName,
                    'code': Math.floor(Math.random() * 10000) + 1,
                    'types': vm.currentVotingTypes,
                    'definition': createBallotStyleDefinition()
            };
//          $log.info("BALLOT STYLE DEFINITION (LOCAL STORAGE):\n" + templateDefinition.definition);
            return templateDefinition;
        };
        
        function createBallotStyleDefinition() {
            var templateDefinition = {
                    'pages': vm.canvas.pages,
                    'pageSize': vm.currentPageSize,
                    'pageOrientation': vm.currentOrientation,
                    'pageColumns': vm.currentBallotColumns.value,
                    'navigationTemplates': vm.canvas.navigationTemplates
            };
            return JSON.stringify(templateDefinition);
        };
        
    }
})();
