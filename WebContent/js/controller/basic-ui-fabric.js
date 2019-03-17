(function () {
    
    'use strict';
    
    angular.module('basicUiFabric').controller('optionDesignerController', OptionDesignerController); 
    
    OptionDesignerController.$inject = ['fabric', 
                                        'fabricConstants',
                                        '$scope'];
    
    function OptionDesignerController(fabric, fabricConstants, $scope, $log, $timeout, $window) {
        var vm = this;
        
        var usingLocalStorage = true;
        
        const optionDesignerCustomProperties = ['id', 'subtype'];
        
        const canvasProperties = fabricConstants.canvasDefaults;
        const gridSpacing = canvasProperties.grid.rowSeparation;
        
        vm.shape = {};
        
        vm.alert = function(message) {
            console.log("ALERT message: " + message);
        }
       
        $scope.fabric = null;
        
        function init() {
            var canvasWidth = 600;
            var canvasHeight = 500;
            var gridColumnsWidth = canvasProperties.grid.columnSeparation;
            var gridRowsHeight = canvasProperties.grid.rowSeparation;

            if ($scope.fabric === null) {
                $scope.fabric = new fabric({
                    JSONExportProperties : fabricConstants.JSONExportProperties,
                    shapeDefaults : fabricConstants.shapeDefaults,
                    rectDefaults : fabricConstants.rectDefaults,
                    textDefaults : fabricConstants.textDefaults,
                    json : {
                        colSeparation: gridColumnsWidth,
                        rowSeparation: gridRowsHeight,
                        cols: canvasWidth / gridColumnsWidth,
                        rows: canvasHeight / gridRowsHeight
                    }
                });

                $scope.fabric.getCanvas().on('object:selected', function(element) {
                    console.log('MainController - object:selected event detected');
                    vm.shape = $scope.fabric.getCanvas().getActiveObject();
                    // the selection has an user initiated event (user click)
                    if (element.e && element.e.type === 'mousedown') {
                        $scope.fabric.selectActiveObject();
                        $scope.$apply();
                    }
                });
                
                $scope.fabric.getCanvas().on('selection:cleared', function(element) {
                    console.log('MainController - selection:cleared event detected: ' + element.e);
                    if (element.e && element.e.type === 'mousedown') {
                        vm.shape = null;
                        $scope.fabric.deselectActiveObject();
                        $scope.$apply();
                    }
                });
            }
            
            $scope.fabric.createGrid(canvasWidth / gridColumnsWidth, 
                    canvasHeight / gridRowsHeight, 
                    gridColumnsWidth, gridRowsHeight);
            
            vm.ballotOptionCode = Math.floor(Math.random() * 10000) + 1;

            $scope.fabric.deselectActiveObject();
        };

        $scope.$on('canvas:created', init);
        
    }
    
})();
