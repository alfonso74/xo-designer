(function() {
    'use strict';

    angular.module('ballotTemplateDesigner').controller('ballotTemplateListController', BallotTemplateListController);
    
    BallotTemplateListController.$inject = ['ballotTemplateDesignerService', '$scope',
        '$location',
        '$log',
        '$translate',
        '$window'];
    
    function BallotTemplateListController(ballotTemplateDesignerService, $scope, 
            $location, $log, $translate, $window) {
        
        var vm = this;
        
        var usingLocalStorage = true;
        var baseTemplateUrl = '';
        
        getStorageLocation();
        
        // Table view
        // Configuration of the ui-grid
        const columnDefs = [
            {
                displayName: 'ems.ballot.template.manager.list.column.name',
                field: 'name',
                headerCellFilter: 'translate',
                headerCellClass: 'text-uppercase',
                width: '34%',
            },
            {
                displayName: 'ems.ballot.template.manager.list.column.type',
                field: 'type',
                headerCellFilter: 'translate',
                headerCellClass: 'text-uppercase',
                width: '15%',
            },
            {
                displayName: 'ems.ballot.template.manager.list.column.size',
                field: 'size',
                headerCellFilter: 'translate',
                headerCellClass: 'text-uppercase',
                width: '10%',
            },
            {
                displayName: 'ems.ballot.template.manager.list.column.orientation',
                field: 'orientation',
                width: '20%',
                headerCellFilter: 'translate',
                headerCellClass: 'text-uppercase',
            },
            {
                displayName: 'ems.ballot.template.manager.list.column.columns',
                field: 'columns',
                width: '10%',
                headerCellFilter: 'translate',
                headerCellClass: 'text-uppercase',
            },
            {
                displayName: ' ',
                field: 'deleteButton',
                width: '10%',
                enableColumnMenu: false,
//                cellTemplate: '<div class="centered"><button id="cancel" type="button" class="btn btn-xs" ng-click="$event.stopPropagation(); vm.deleteModal(row, row.entity.custom_code)"><span class="ssp-icon ssp-sm-icon ssp-delete-icon"></span></button></div>'
//                cellTemplate: '<div ng-if="row.isSelected"><a href="" ng-click="vm.deleteBallotStyle(row.entity.code)"><i class="ssp-icon ssp-sm-icon ssp-delete-icon"></i></a>X:{{grid.appScope.$parent.vm.currentView}}</div>'
//                cellTemplate: '<div ng-if="row.isSelected && grid.selection.selectedCount === 1"><a href="" ng-click="grid.appScope.$parent.vm.deleteBallotStyle(row.entity.code)"><i class="ssp-icon ssp-sm-icon ssp-delete-icon"></i></a>{{grid.selection.selectedCount}}</div>'
//                cellTemplate: '<div ng-if="row.isSelected && grid.appScope.apiAdapter.getSelectedElements().length === 1"><a href="" ng-click="grid.appScope.$parent.vm.deleteBallotStyle(row.entity.code)"><i class="ssp-icon ssp-sm-icon ssp-delete-icon"></i></a></div>'
                cellTemplate: baseTemplateUrl + 'views/ballotTemplateListActions.html'
            }
        ];
        
        
        vm.goToView = goToView;
        function goToView(view) {
            $location.url('/' + view);
        };

        function getStorageLocation() {
            if (!window.location.href.startsWith('file')) {
                usingLocalStorage = false;
                baseTemplateUrl = 'ballot-template-manager/';
            }
            console.log("Using local storage: " + usingLocalStorage);
        };

        // function used by the 'ssp-table-view' directive
        vm.onTableReady = function(adapter) {
            $log.info(adapter);
            vm.tableAdapter = adapter;
            vm.tableAdapter.sspTableViewOptions.columnDefs = columnDefs;
//            vm.tableAdapter.sspTableViewOptions.appScopeProvider = vm;  // circular reference  :/
            loadTemplates();
        };
        
        function loadTemplates() {
            if (usingLocalStorage) {
                loadTemplatesLocal();
            } else {
                const data = ballotTemplateDesignerService.getBallotStylesTableData(function(tableData) {
                    vm.tableAdapter.sspTableViewOptions.data = tableData;
                    $translate('ems.ballot.template.manager.templates.total', {'totalBallotTemplates' : tableData.length})
                    .then(function(t) {
                        $scope.elementsCounter = t;
                    });
                });
            }
        };
        
        function loadTemplatesLocal() {
            let tableData = [
                {code: 1, name: 'MockBallotStyle', type: 'Election Day', size: '8.5 x 11', orientation: 'Portrait', columns: 2},
                {code: 2, name: 'MockBallotStyle2', type: 'Election Day', size: '8.5 x 11', orientation: 'Landscape', columns: 3},
                {code: 3, name: 'MockBallotStyle3', type: 'Election Day', size: '8.5 x 11', orientation: 'Landscape', columns: 3}
            ];
            vm.tableAdapter.sspTableViewOptions.data = tableData;
            $translate('ems.ballot.template.manager.templates.total', {'totalBallotTemplates' : tableData.length})
            .then(function(t) {
                vm.elementsCounter = t;
            });
        };
        
        $scope.$on('delete.ballot.style', deleteBallotStyleHandler);
        
        function deleteBallotStyleHandler($event, ballotStyleCode) {
            deleteBallotStyle(ballotStyleCode);
        }
        
        vm.deleteBallotStyle = deleteBallotStyle;
        function deleteBallotStyle(ballotStyleCode) {
            console.log("Delete ballot style " + ballotStyleCode);
            if (ballotStyleCode) {
                if (usingLocalStorage) {
                    deleteBallotStyleLocal(ballotStyleCode);
                } else {
                    ballotTemplateDesignerService.deleteBallotStyle(ballotStyleCode).
                    then(function(response) {
                        if (response.status === 200) {
                            $log.info('Deleted ballot style with code: ' + ballotStyleCode);
                            loadTemplates();
                        } else {
                            $log.error('Response: ' + JSON.stringify(response));
                        }
                    })
                    .catch(function(error) {
                        $log.error('Error response: ' + JSON.stringify(error));
                    });
                }
            }
        };
        
        function deleteBallotStyleLocal (ballotStyleCode) {
            $log.info("Deleting ballot style with code: " + ballotStyleCode);
            
            var result = 0;
            
            var retrievedObject = localStorage.getItem('ballotStyles');
            if (retrievedObject) {
                var ballotStyles = JSON.parse(retrievedObject);
                $log.info("Ballot styles found: " + ballotStyles.length);
                var removeAtIndex = -1;
                for (var n = 0; n < ballotStyles.length && removeAtIndex === -1; n++) {
                    if (ballotStyles[n].code === ballotStyleCode) {
                        removeAtIndex = n;
                    }
                }
                if (removeAtIndex !== -1) {
                    ballotStyles.splice(removeAtIndex, 1);
                    result = 1;
                    
                    // Put the object into storage
                    var jsonToStore = JSON.stringify(ballotStyles);
                    localStorage.setItem('ballotStyles', jsonToStore);
                }
            }

            return result;
        };
        
        vm.duplicateBallotStyle = duplicateBallotStyle;
        function duplicateBallotStyle(ballotStyleCode) {
            console.log("Duplicate ballot style function called");
            ballotTemplateDesignerService.duplicateBallotStyle(ballotStyleCode).
            then(function(response) {
                if (response.status === 200) {
                    $log.info('Duplicated ballot style with code: ' + ballotStyleCode);
                    loadTemplates();
                } else {
                    $log.error('Response: ' + JSON.stringify(response));
                }
            })
            .catch(function(error) {
                $log.error('Error response: ' + JSON.stringify(error));
            });
        };
        
    }
    
})();

(function() {
    'use strict';
//Please note that $uibModalInstance represents a modal window (instance) dependency.
//It is not the same as the $uibModal service used above.

    angular.module('ballotTemplateDesigner').controller('DeleteBallotStyleController', DeleteBallotStyleController);
    
    DeleteBallotStyleController.$inject = ['ballotTemplateDesignerService', '$rootScope', '$scope', 'sspServices'];
    
    function DeleteBallotStyleController(ballotTemplateDesignerService, $rootScope, $scope, ssp) {
        var vm = this;
        
        /**
         * Initialize controller
         */
        vm.init = function(apiAdapter) {
            vm.apiAdapter = apiAdapter;
            vm.selectedElements = apiAdapter.getSelectedElements();
            vm.selectedBallotStyleCode = vm.selectedElements[0].code;
        };
        
        vm.isDeleting = function () {
            return false;
        }
        
        vm.ok = function () {
            $rootScope.$broadcast('delete.ballot.style', vm.selectedBallotStyleCode);
            $scope.closePopover();
//            $uibModalInstance.close('ok');
        };
    
        vm.cancel = function () {
            $scope.closePopover();
//            $uibModalInstance.dismiss('cancel');
        };

    }
})();