
//var vmScope = {};

(function() {
    'use strict';
    
    angular.module('ballotTemplateDesigner').controller('electoralEventController', ElectoralEventController);
    
    ElectoralEventController.$inject = ['ballotTemplateDesignerService', 'fabric', 'fabricConstants', '$scope', 
        '$uibModal',
        '$location',
        '$log',
        '$timeout',
        '$translate',
        '$window'];
    
    function ElectoralEventController(ballotTemplateDesignerService, fabric, fabricConstants, $scope, 
            $uibModal, $location, $log, $timeout, $translate, $window) {
        
        var vm = this;
        
        const scaleFactor = 1.25;
        
        var usingLocalStorage = true;
        var baseTemplateUrl = '';
        
        vm.currentView = 'main';
        
        vm.shape = {};
 
        
        /**
         * wizard adapter
         */
        vm.wizardAdapter = {};
        vm.electionSelected = {};
        vm.modal = null;

        /**
         * Base setup wizard object
         */
        vm.wizardScope = {
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
         * To redirect page to wizard functionality
         */
        $scope.goToWizard = function () {
            $location.url('/wizard-new-ballot-template');
        };


        /**
         *  method called by the wizard to indicate it's ready to be configured
         */
        $scope.onWizardReady = function (adapter) {

            $scope.wizardAdapter = adapter.adapter;
            // the wizard steps
            const steps = [];


            steps.push({
                sref: 'wElection-general-info',
                title: 'eEvent.wizard.general.title',
                shortTitle: 'eEvent.wizard.general.short.title',
                nextText: 'ssp.next',
                prevText: 'ssp.previous',
                displayStepOnHeader: true,
                templateUrl: 'views/wizard/w-general-info.html',
                onlyCenterButton: false,
                displayHeader: true,
                controller: 'EventGeneralInfoController'
            });

            steps.push({
                sref: 'wElection-data',
                title: 'eEvent.wizard.data.title',
                shortTitle: 'eEvent.wizard.data.short.title',
                nextText: 'ssp.next',
                prevText: 'ssp.previous',
                displayStepOnHeader: true,
                templateUrl: 'views/wizard/w-data.html',
                onlyCenterButton: false,
                displayHeader: true,
                controller: 'EventDataController'
            });
            steps.push({
                sref: 'wElection-review',
                title: 'eEvent.wizard.review.title',
                shortTitle: 'eEvent.wizard.review.short.title',
                prevText: 'ssp.previous',
                nextText: 'ssp.finish',
                displayStepOnHeader: true,
                templateUrl: 'views/wizard/w-review.html',
                onlyCenterButton: false,
                displayHeader: true,
                controller: 'EventReviewController'
            });

            // object used to pass information to and from each controller
            const wizard = {
                scope: $scope.wizardScope,
                steps: steps,
                addDefaultStartStep: true,
                startMessageTitle: 'eEvent.wizard.start.title',
                startMessage: 'eEvent.wizard.start.text',
                addDefaultFinishStep: true,
                finishMessageTitle: 'eEvent.wizard.finish.title',
                finishMessage: 'eEvent.wizard.finish.text',
                finishSecondMessage: 'eEvent.wizard.finish.text',
                finishButtonText: 'eEvent.wizard.finish.button',
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
            const url = '/electoral-event';
            $location.path(url);
        };
        
        
    }
    
    
})();

(function() {
    'use strict';

    angular.module('ballotTemplateDesigner').controller('EventGeneralInfoController', EventGeneralInfoController);
    
    EventGeneralInfoController.$inject = ['$scope', '$timeout'];
    
    function EventGeneralInfoController(ballotTemplateDesignerService, $scope, $timeout) {
        var vm = this;
    }
})();

(function() {
    'use strict';

    angular.module('ballotTemplateDesigner').controller('EventDataController', EventDataController);
    
    EventDataController.$inject = ['$scope', '$timeout'];
    
    function EventDataController(ballotTemplateDesignerService, $scope, $timeout) {
        var vm = this;
    }
})();

(function() {
    'use strict';

    angular.module('ballotTemplateDesigner').controller('EventReviewController', EventReviewController);
    
    EventReviewController.$inject = ['$scope', '$timeout'];
    
    function EventReviewController(ballotTemplateDesignerService, $scope, $timeout) {
        var vm = this;
    }
})();
