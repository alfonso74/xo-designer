/**
 * ssp-table-view-controller.js
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
 * Controller of the table view
 *
 * @author guillermo.heuer
 */
(function(angular) {
    angular.module('SspTableViewApp').controller('SspTableViewController',
        ['$rootScope', '$scope', function($rootScope, $scope) {

        let gridApi = null;

        $scope.apiAdapter = {
            sspTableViewOptions : {
                paginationPageSizes: [25, 50, 75],
                paginationPageSize: 25,
                enableRowSelection: true,
                enableSelectAll: true,
                enableSorting: true,
                multiSelect: true,
                enablePaginationControls : false,
                enableHorizontalScrollbar : 0
            }
        };

        $scope.apiAdapter.sspTableViewOptions.onRegisterApi = function (gridAPI) {
            gridApi = gridAPI;
        };

        $scope.onTableReady()($scope.apiAdapter);

        function getSelectedElements() {
            return gridApi.selection.getSelectedRows();
        }

        function setSelectedElements(elements) {
            gridApi.grid.modifyRows($scope.apiAdapter.sspTableViewOptions.data);
            angular.forEach(elements, function (element) {
                angular.forEach($scope.apiAdapter.sspTableViewOptions.data,
                        function (localData) {
                    if (element.customCode === localData.customCode) {
                        gridApi.selection.selectRow(localData);
                    }
                });
            });
        }

        // Pagination functions
        $scope.currentPage = function() {
            return gridApi.pagination.getPage()
        };

        $scope.havePages = function() {
            return gridApi.pagination.getTotalPages() > 1;
        };

        $scope.getTotalPagesAsArray = function() {
            return new Array(gridApi.pagination.getTotalPages());
        };

        $scope.getTotalPages = function() {
            return gridApi.pagination.getTotalPages();
        };

        $scope.goTo = function(page) {
            gridApi.pagination.seek(page);
        };

        $scope.goToNextPage = function() {
            gridApi.pagination.nextPage();
        };

        $scope.goToPreviousPage = function() {
            gridApi.pagination.previousPage();
        };

        $scope.apiAdapter.getSelectedElements = getSelectedElements;
        $scope.apiAdapter.setSelectedElements = setSelectedElements;

    }]);

})(angular);