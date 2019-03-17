/**
 * copy-ballot-template.js
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
 * File used as the main controller to copy ballot templates
 *
 * @author carlos.perez
 */
(function(angular) {
     "use strict";

     /**
      * Controller Definition.
      */
    angular.module('ballotTemplateDesigner').controller('CopyBallotTemplateController',
        ['$rootScope', '$scope', '$translate',  
        'sspServices', 'dataService', '$log', '$timeout',
        function($rootScope, $scope, $translate, 
            sspServices, dataService, $log, $timeout) {
            
        var vm = this;
        
        vm.selectedNode = null;
        vm.ballotTemplate = null;
        vm.sourceBallotTemplate = null;
        
        vm.languageGroupTemplates = [];
        
        //This function is sort of private constructor for controller
        vm.init = function(element) {
            
            if (element && element.getSelectedNodes) {
                let ballotTemplatesTree = element;
                if (ballotTemplatesTree.getSelectedNodes().length > 0) {
                    vm.selectedNode = ballotTemplatesTree.getSelectedNodes()[0];
                    
                    $log.info("Selected element parent code: " + vm.selectedNode.parentCode);
                    loadBallotTemplate(vm.selectedNode.parentCode)
                }
            }
            
            vm.infoBox = {
                mode: 'info',
                message: 'btm.modal.copy-ballot-template.information'
            };
        };
        
        function loadBallotTemplate(ballotTemplateCode) {
            dataService.getBallotStyle(ballotTemplateCode)
            .then(function(response) {
                if (response.data) {
                    let ballotTemplate = response.data.data;
                    vm.ballotTemplate = JSON.parse(ballotTemplate.definition);
                    vm.ballotTemplate.languageBallotStyles.forEach(e => {
                        if (e.customCode !== vm.selectedNode.customCode) {
                            vm.languageGroupTemplates.push(e);
                        }
                    })
                }
            });
        }
        
        
        vm.copyTemplate = function() {
            vm.saving = true;
            
            // copy the selected ballot template (source) into the tree 
            // selected ballot template (destination)
            let destinationBallotTemplate = getDestinationBallotTemplate(vm.selectedNode.customCode);
            destinationBallotTemplate.pages = vm.sourceBallotTemplate.pages;
            
            let sourceLanguageCodes = vm.sourceBallotTemplate.languageCodes;
            // create a new array with the language codes not found in the destination ballot template
            let languageCodesToComplete = destinationBallotTemplate.languageCodes.filter(languageCode => {
                let notFound = false;
                if (sourceLanguageCodes.indexOf(languageCode) === -1) {
                    notFound = true;
                }
                return notFound;
            });
            
            $log.info("Languages to complete: " + languageCodesToComplete);
            
            saveBallotTemplate(vm.ballotTemplate, languageCodesToComplete);
        }
        
        function getDestinationBallotTemplate(customCode) {
            let destinationBallotTemplate = null;
            vm.ballotTemplate.languageBallotStyles.forEach(e => {
                if (e.customCode === customCode) {
                    destinationBallotTemplate = e;
                }
            });
            return destinationBallotTemplate;
        }
        
        function saveBallotTemplate(ballotTemplate, languageCodesToComplete) {
            let id = vm.selectedNode.parentCode;
            let ballotStyleName = ballotTemplate.name;
            let electionType = ballotTemplate.electionType;  
            let definition = JSON.stringify({
                name: ballotTemplate.name,
                page: ballotTemplate.page,
                electionType: ballotTemplate.electionType,
                languageBallotStyles: ballotTemplate.languageBallotStyles,
                status: ballotTemplate.status,
                characteristics: ballotTemplate.characteristics
            });
            
            dataService.updateBallotStyle(id,
                    ballotStyleName, 
                    electionType, 
                    definition)
            .then(function(response) {
                saveSuccess(response, languageCodesToComplete);
            })
            .catch(saveError)
            .finally(function() {
                vm.saving = false;
            });
            
        }
        
        function saveSuccess(response, languageCodesToComplete) {
            $rootScope.$broadcast('ballot.style.saved', response);
            sspServices.toast({
                type: 'success',
                title: 'btm.modal.copy-ballot-template.success.title',
                message: 'btm.modal.copy-ballot-template.success',
                params: {
                    'ballotTemplate': vm.ballotTemplate,
                    'languages': languageCodesToComplete.join(", ")
                }
            });
            $timeout(function() {
                $(".close-popover").click();
            }, 50);
        };
        
        function saveError(response) {
            sspServices.toast({
                type: 'danger',
                message: 'Error trying to copy the ballot template' 
            });
            $log.error('Error ' + response.status + ': ' + response.data);
        };
        
        $scope.$on('communication.error', function() {
            vm.infoBox = {
                mode: 'failure',
                message: 'ssp.error.message.communication.problem'
            };
        });

        $scope.$on('database.error', function() {
            vm.infoBox = {
                mode: 'failure',
                message: 'ssp.error.message.database.problem'
            };
        });

    }]);

})(angular);