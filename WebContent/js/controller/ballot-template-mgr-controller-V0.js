
//var vmScope = {};

(function() {
    'use strict';

    angular.module('ballotTemplateDesigner').controller('ballotTemplateManagerController', BallotTemplateManagerController);
    
    BallotTemplateManagerController.$inject = ['ballotTemplateDesignerService', 'fabric', 'fabricConstants', '$scope', 
        '$location',
        '$uibModal',
        '$log',
        '$timeout',
        '$translate',
        '$window'];
    
    function BallotTemplateManagerController(ballotTemplateDesignerService, fabric, fabricConstants, $scope, 
            $location, $uibModal, $log, $timeout, $translate, $window) {
        
        var vm = this;
        
        const scaleFactor = 1.25;
        
        var usingLocalStorage = true;
        var baseTemplateUrl = '';
        
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
                width: '20%',
                headerCellFilter: 'translate',
                headerCellClass: 'text-uppercase',
            }
        ];
        
        
        const optionDesignerCustomProperties = ['id', 'subtype', 'snapToGrid'];
        const fabricExtendedProperties = ['hasRotatingPoint', 'hasControls', 'cornerSize', 'hoverCursor',
            'lockMovementX', 'lockMovementY'];
        
        const canvasProperties = fabricConstants.canvasDefaults;
        const gridSpacing = canvasProperties.grid.rowSeparation;
        /*
        vm.searchAdapter = {
            typeProperty: 'name',
            nameProperty: 'name',
            onRefresh: function(text, callback) {
                return null;
            },
            onSearch: function(elements) {
                //TODO
            }
        };*/
        
        vm.currentView = 'main';
        
        vm.shape = {};
        
        // stores the user definition for each ballot area (header, footer, instructions)
        vm.ballotStyle = {};
        
        vm.pageSizes = fabricConstants.pageSizes;
        vm.ballotOrientation = [
            'Portrait',
            'Landscape'
        ];
        vm.ballotColumns = [
            {id: 1, name: '1 column', iconClass: 'ssp-ballot-columns-1'},
            {id: 2, name: '2 columns', iconClass: 'ssp-ballot-columns-2'},
            {id: 3, name: '3 columns', iconClass: 'ssp-ballot-columns-3'}
        ];
        vm.ballotAreas = [
            {id: 1, name: 'Header'},
            {id: 2, name: 'Footer'},
            {id: 3, name: 'Portrait'}
        ];
        vm.ballotPages = [
            {id: 1, name: 'Single page'},
            {id: 2, name: 'Single page'}
        ];
        
        vm.imageLoad = {
            url: null,
            options: {}
        };
        
        vm.resizeCanvas = resizeCanvas;
        
        vm.readUrl = readUrl;
        vm.readUrlAsync = readUrlAsync;
        vm.addImageOnCanvas = addImageOnCanvas;
        vm.removeUploadImageData = removeUploadImageData;
        
        vm.clearLocalStorage = clearLocalStorage;
        vm.saveTemplate = saveTemplate;
        
        /**
         * To redirect page to wizard functionality
         */
        vm.goToWizard = function () {
            $location.url('/wizard-new-ballot-template');
        };
        
        vm.zoomIn = function() {
            let canvas = $scope.fabric.getCanvas();
            canvas.setZoom(scaleFactor);
            canvas.setHeight(canvas.getHeight() * scaleFactor);
            canvas.setWidth(canvas.getWidth() * scaleFactor);
        }
        
        vm.zoomOut = function() {
            let canvas = $scope.fabric.getCanvas();
            canvas.setZoom(1 / scaleFactor);
            canvas.setHeight(canvas.getHeight() * (1 / scaleFactor));
            canvas.setWidth(canvas.getWidth() * (1 / scaleFactor));
        }
        
        vm.alert = function(message) {
            console.log("ALERT message: " + message);
        }
        
        function getStorageLocation() {
            if (!window.location.href.startsWith('file')) {
                usingLocalStorage = false;
                baseTemplateUrl = 'ballot-designer/';
            }
            console.log("Using local storage: " + usingLocalStorage);
        }
        
        vm.reloadPage = reloadPage;
        function reloadPage() {
            $window.location.reload();
        }

        // shared function with the 'ssp-table-view' directive
        vm.onTableReady = function(adapter) {
            $log.info(adapter);
            vm.tableAdapter = adapter;
            vm.tableAdapter.sspTableViewOptions.columnDefs = columnDefs;
            loadTemplates();
        };
        
        function loadTemplates() {
            const data = ballotTemplateDesignerService.getBallotStylesTableData(function(tableData) {
                vm.tableAdapter.sspTableViewOptions.data = tableData;
                $translate('ems.ballot.template.manager.templates.total', {'totalBallotTemplates' : tableData.length})
                .then(function(t) {
                    $scope.elementsCounter = t;
                });
            });
        }
        
        /** Image handling functions */
        
        function readUrl(event) {
            console.log("Executing readUrl...");
            if (event.target.files && event.target.files[0]) {
                var reader = new FileReader();
                reader.onload = (event) => {
                    vm.imageLoad.url = event.target['result'];
                    $scope.$apply();
                }
                reader.readAsDataURL(event.target.files[0]);
            }
        }
        
        
        function readUrlAsync(event) {
            console.log("Executing readUrlAsync...");
            if (event.target.files && event.target.files[0]) {
                var reader = new FileReader();
                reader.onload = (event) => {
                    $timeout(function() {
                        vm.imageLoad.url = event.target['result'];
                        addImageOnCanvas(vm.imageLoad.url, vm.imageLoad.options);
                    });
                }
                reader.readAsDataURL(event.target.files[0]);
            }
        }
        
        vm.addImageOnCanvas = addImageOnCanvas;
        function addImageOnCanvas(url, options) {
            if (url) {
                $log.info("Adding image!!!");
                let defaultOptions = {
                    left: 0,
                    top: 75,
                    angle: 0,
                    cornerSize: 6,
                    hasRotatingPoint: false
                };
                options = angular.extend(defaultOptions, options);
                $scope.fabric.addImageBase64(url, options);
                vm.imageLoad.url = '';
                vm.imageLoad.options = {};

            }
        }
        
        function removeUploadImageData(url) {
            vm.imageLoad.url = '';
        };
        
        /** Common functions */
        
        function resizeCanvas(selectedPageSize, selectedOrientation) {
            var gridColumnsWidth = canvasProperties.grid.columnSeparation;
            var gridRowsHeight = canvasProperties.grid.rowSeparation;
            var gridColumns = selectedPageSize.columns;
            var gridRows = selectedPageSize.rows;
            
            if (selectedOrientation && selectedOrientation === 'Landscape') {
                gridColumns = selectedPageSize.rows;
                gridRows = selectedPageSize.columns;
            }
            
            $scope.fabric.setCanvasSize(gridColumns, gridRows, gridColumnsWidth, gridRowsHeight);
            $scope.fabric.createGrid(gridColumns, gridRows, gridColumnsWidth, gridRowsHeight);
            $scope.fabric.deselectActiveObject();
            
            changeView(vm.currentView);
        }
        
        function canvasIsDirty() {
            return $scope.fabric.isDirty();
        }
        
        function fieldFocus(fieldId) {
            $timeout(function() {
                var element = $window.document.getElementById(fieldId);
                if(element) {
                    element.focus();
                }
            });
        }
        
        function clearLocalStorage() {
            localStorage.removeItem('ballotOptions');
        }
        
        // Save ballot style related functions
        
        vm.votingTypes = [
            {name: 'Absentee', code: 'ABSENTEE'},
            {name: 'Early Voting', code: 'EARLY_VOTING'},
            {name: 'Election Day', code: 'ELECTION_DAY'}
        ];
        
        vm.saveBallotStyle = saveBallotStyle;
        function saveBallotStyle(ballotStyleName) {
            $log.warn('Canvas is dirty: ' + $scope.fabric.isDirty());
            storeCurrentCanvas();
            if (!ballotStyleName || ballotStyleName === '') {
                vm.errorMessage = 'Please enter a name for the ballot style';
                angular.element('#validation-modal').modal('show');
                return;
            }
            if (usingLocalStorage) {
                saveBallotStyleLocal(ballotStyleName);
                $scope.fabric.setDirty(false);
            } else {
                ballotTemplateDesignerService.saveBallotStyle(ballotStyleName, 
                        vm.votingTypes[2].code, 
                        createBallotStyleDefinition()).
                success(function(data) {
                    $log.info("DATA: " + data);
                    var ballotStyleCode = data.data;
                    $log.info("Ballot style saved successfully, id " + ballotStyleCode);
                    $scope.fabric.setDirty(false);
                }).
                error(function(data, status) {
                    $log.error('Error: ' + status);
                });
            }
        }
        
        function storeCurrentCanvas() {
            var objects = [];
            var definition = {objects: objects, background: ""};
            
            if (vm.ballotStyle.header) {
                replacePlaceholderObjects(vm.ballotStyle.header);
                objects.push(vm.ballotStyle.header.toObject(optionDesignerCustomProperties));
            }
            if (vm.ballotStyle.footer) {
                replacePlaceholderObjects(vm.ballotStyle.footer);
                objects.push(vm.ballotStyle.footer.toObject(optionDesignerCustomProperties));
            }
            if (vm.ballotStyle.instructions) {
                replacePlaceholderObjects(vm.ballotStyle.instructions);
                objects.push(vm.ballotStyle.instructions.toObject(optionDesignerCustomProperties));
            }
            
            vm.canvas.pages[vm.canvas.currentPage] = definition;
            
            loadNavigationalTemplates();
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
            showModalConfirmation("Save ballot style", "Saved succesfully.", null);
        }
        
        function createBallotStyleDefinitionForLocalStorage(ballotStyleName) {
            var templateDefinition = {'name': ballotStyleName,
                    'code': Math.floor(Math.random() * 10000) + 1,
                    'type': vm.votingTypes[2].code,
                    'definition': createBallotStyleDefinition()
            };
//          $log.info("BALLOT STYLE DEFINITION (LOCAL STORAGE):\n" + templateDefinition.definition);
            return templateDefinition;
        }
        
        function createBallotStyleDefinition() {
            var templateDefinition = {
                    'pages': vm.canvas.pages,
                    'pageSize': vm.currentPageSize,
                    'pageOrientation': vm.currentOrientation,
                    'pageColumns': vm.currentBallotColumns.value,
                    'navigationTemplates': vm.canvas.navigationTemplates
            };
            return JSON.stringify(templateDefinition);
        }
        
        /**
         * Gets a ballot template identified by the indicated template name.
         */
        function getBallotTemplateByName(templateName) {
            var ballotTemplates = vm.ballotTemplates;
            var templateIsFound = false;
            var ballotTemplate = null;
            for (var n = 0; n < ballotTemplates.length && !templateIsFound; n++) {
                if (ballotTemplates[n].name === templateName) {
                    ballotTemplate = ballotTemplates[n];
                    templateIsFound = true;
                }
            }
            return ballotTemplate;
        }
        
        function initCanvasPages() {
            vm.canvas = {
                    pages: [],
                    currentPage: 0,
                    navigationTemplates: {
                        pageNumber: null,
                        nextPageInstruction: null,
                        finalPageInstruction: null
                    }
            }
            vm.canvas.pages.push(null);
        }
        
        function loadNavigationalTemplates() {
            if (usingLocalStorage) {
                loadBallotTemplatesLocal();
                assignNavTemplate('pageNumber');
                assignNavTemplate('nextPageInstruction');
                assignNavTemplate('finalPageInstruction');
            } else {
                $log.info('Loading Ballot Templates...');
                ballotTemplateDesignerService.getBallotTemplatesList().
                success(function(data) {
                    if (data.data) {
                        $log.info("Templates loaded: " + data.data.length);
                        vm.ballotTemplates = data.data;
                        assignNavTemplate('pageNumber');
                        assignNavTemplate('nextPageInstruction');
                        assignNavTemplate('finalPageInstruction');
                    } else {
                        $log.info("No ballot templates were found");
                    }
                }).
                error(function(data, status) {
                    $log.info('Error: ' + status);
                });
            }
        }
        
        function loadBallotTemplatesLocal() {
            var retrievedObject = localStorage.getItem('ballotOptions');
            $log.info('retrievedObject: ', JSON.parse(retrievedObject));
            vm.ballotTemplates = JSON.parse(retrievedObject);
        }
        
        /**
         * templateType: 'pageNumber', 'nextPageInstruction', 'finalPageInstruction'
         */
        function assignNavTemplate(templateType) {
            var templateName = fabricConstants.defaultTemplates[templateType].name;
            var template = getBallotTemplateByName(templateName);
            if (template !== null) {
                var templateJson = JSON.parse(template.definition);
                vm.canvas.navigationTemplates[templateType] = templateJson;
            }
        }
        
        function replacePlaceholderObjects(fabricGroup) {
            var placeholderObjects = [];
            
            fabricGroup.forEachObject(function(obj) {
                // any 'excludeFromExport' object is left out
                if (obj.get('excludeFromExport') === false) {
                    if (obj.get('subtype') === 'barcode' ||
                            obj.get('subtype') === 'pageNumber' ||
                            obj.get('subtype') === 'pageNavigation') {
                        placeholderObjects.push(obj);
                    }
                }
            });
            
            
            for (let n = 0; n < placeholderObjects.length; n++) {
                let originalObject = placeholderObjects[n];
                let options = {
                    left: originalObject.left, top: originalObject.top,
                    width: originalObject.width, height: originalObject.height,
                    selectable: originalObject.selectable,
                    subtype: originalObject.subtype,
                    fill: "#E0E0E0", opacity: 0.5, 
                    snapToGrid: originalObject.snapToGrid, renderToCanvas: false
                };
                let object = $scope.fabric.addRect(options);
                
                fabricGroup.remove(placeholderObjects[n]);
                fabricGroup.add(object);
            }
        }
        
        // END - Save ballot style related functions
        
        
        function saveTemplate() {
            if (!vm.ballotTemplateName || vm.ballotTemplateName === '') {
                fieldFocus('ballotTemplateName');
                vm.errorMessage = 'Please enter a name for this ballot template.';
                angular.element('#validation-modal').modal('show');
                return;
            } else {
                var ballotTemplateAsGroup = createBallotTemplateGroup();
                if (usingLocalStorage) {
                    saveTemplateJsonLocal(ballotTemplateAsGroup);
                } else {
                    saveTemplateJson(ballotTemplateAsGroup);
                }
            }
        }
        
        vm.saveTemplateTmp = saveTemplateTmp;
        function saveTemplateTmp() {
            var ballotTemplateAsGroup = createBallotTemplateGroup();
            vm.ballotTemplateName = "test";
            if (usingLocalStorage) {
                saveTemplateJsonLocal(ballotTemplateAsGroup);
            } else {
                saveTemplateJson(ballotTemplateAsGroup);
            }
        }
        
        function saveTemplateJsonLocal(ballotTemplateAsGroup) {
            var ballotOptionTemplates = [];
            
            var found = false;
            var localTemplates = localStorage.getItem('ballotOptions');
            if (localTemplates) {
                var ballotOptionTemplates = JSON.parse(localTemplates);
                for (var n = 0; n < ballotOptionTemplates.length && !found; n++) {
                    if (ballotOptionTemplates[n].name === vm.ballotTemplateName) {
                        ballotOptionTemplates[n] = createTemplateDefinition(ballotTemplateAsGroup);
                        found = true;
                    }
                }
            }

            if (!found) {
                ballotOptionTemplates.push(createTemplateDefinition(ballotTemplateAsGroup));
            }
            
            // Put the object into storage
            localStorage.setItem('ballotOptions', JSON.stringify(ballotOptionTemplates));
            showModalInformation("Save ballot template", 
                "The ballot template '" + vm.ballotTemplateName + "' has been saved successfully.",
                function(result) {
                    if (result) {
                        $window.location.reload();
                    }
                }
            );
        }
        
        function saveTemplateJson(ballotTemplateAsGroup) {
            ballotTemplateDesignerService.saveBallotTemplate(vm.ballotTemplateName, 
                    vm.ballotTemplateType, 
                    JSON.stringify(ballotTemplateAsGroup.toObject(optionDesignerCustomProperties))).
            success(function(data, status) {
                $log.info("Ballot template saved successfully");
                showModalInformation("Save ballot template", 
                    "The ballot template has been saved successfully.",
                    function(result) {
                        if (result) {
                            $window.location.reload();
                        }
                    }
                );
            }).
            error(function(data, status) {
                $log.error('Error: ' + status);
            });
        }
        
        
        function createBallotTemplateGroup() {
            var canvas = $scope.fabric.getCanvas();
            
            var ballotTemplateObjects = [];
            
            var isStaticTemplate = vm.ballotTemplateType === 'STATIC';
            var isInternal = vm.ballotTemplateType === 'INTERNAL';
            
//            replacePlaceholderObjects();
            
            var ballotOption = null;
            var writeIn = null;
            canvas.forEachObject(function(obj) {
                // any non selectable object is left out
                if (obj.get('excludeFromExport') === false) {
                    ballotTemplateObjects.push(obj);
                    if (obj.get('subtype') === 'ballotOption') {
                        ballotOption = obj; 
                    } else if (obj.get('subtype') === 'writeIn') {
                        writeIn = obj;
                    }
                }
            });
            
            for (let n = 0; n < ballotTemplateObjects.length; n++) {
                canvas.remove(ballotTemplateObjects[n]);
            }
            
            if (ballotOption) {
                var ballotOptionGroup = createBallotOptionGroup(ballotTemplateObjects, ballotOption);
                ballotTemplateObjects.push(ballotOptionGroup);
            }
            
            if (writeIn) {
                var writeInGroup = createWriteInGroup(ballotTemplateObjects, writeIn);
                ballotTemplateObjects.push(writeInGroup);
            }
            
            var ballotTemplateGroup = $scope.fabric.createGroup(ballotTemplateObjects, {
                hasRotatingPoint: false,
                cornerSize: 6,
                opacity: 0.9
            });
            
//            if (!isStaticTemplate && !isInternal) {
//                addContestBorders(ballotTemplateGroup);
//            }
            
            ballotTemplateGroup._calcBounds(true);
            
            canvas._activeObject = null;
            
            $log.info("Ballot template group: " + JSON.stringify(ballotTemplateGroup.toObject(optionDesignerCustomProperties)));
            
            return ballotTemplateGroup;
        }
        
        $scope.fabric = null;
        
        function init(canvasName) {
            console.log("BallotTemplateManagerController.init() called");
            getStorageLocation();
            
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
                    canvasName : canvasName,
                    json : {
//                        width : canvasWidth,
//                        height : canvasHeight,
//                        gridSpacing : gridRowsHeight,
//                        enablePropertiesDialog: true,
//                        templateType: 'STATIC',
                        colSeparation: gridColumnsWidth,
                        rowSeparation: gridRowsHeight,
                        cols: canvasWidth / gridColumnsWidth,
                        rows: canvasHeight / gridRowsHeight
                    }
                });

                $scope.fabric.getCanvas().on('object:selected', function(element) {
                    console.log('MainController - object:selected event detected');
                    ballotTemplateDesignerService.objectSelectedListener(element);
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
                
                $scope.fabric.getCanvas().on('object:added', function(e) {
                    var element = e.target;
                    vm.templateManager.fixedElements.forEach(function(fixedElement) {
                       if (fixedElement.id === vm.lastAddedObjectId) {
                           $log.info("Updating last added element id from " + fixedElement.id + " to " + element.id);
                           $timeout(function() {
                               fixedElement.id = element.id;
                           });
                       }
                    });
                });
                
                $scope.fabric.addListener($scope.fabric.getCanvas().upperCanvasEl, 'dblclick', function(e) {
                    handleCanvasDoubleClick(e, null);
                });
                
                $scope.fabric.getCanvas().on('text:changed', function(e) {
                    var element = e.target;
                    console.log("Event: " + e);
                    console.log("Changed: " + element);
                });
                
                bindContextMenu();
            }
            
            vm.ballotOptionCode = Math.floor(Math.random() * 10000) + 1;
            vm.shape = {};
            vm.contest = false;
            
            vm.currentPageSize = fabricConstants.pageSizes[0];
            vm.currentOrientation = vm.ballotOrientation[0];
            vm.currentBallotColumns = vm.ballotColumns[0];
            
            vm.ballotColumns = ballotTemplateDesignerService.getBallotColumns($scope.fabric.grid.width,
                    $scope.fabric.grid.height);
            
            vm.ballotAreas = ballotTemplateDesignerService.getBallotAreas($scope.fabric.grid.width,
                    $scope.fabric.grid.height, vm.currentBallotColumns.value);
            
            resizeCanvas(vm.currentPageSize, vm.currentOrientation);
            
            initCanvasPages();
            loadNavigationalTemplates();
            
            $scope.fabric.deselectActiveObject();
        };
        
        function handleCanvasDoubleClick(event, data) {
            var activeObject = $scope.fabric.getCanvas().getActiveObject();
            if (activeObject.subtype === 'pageArea') {
                editTemplateArea(activeObject, activeObject.view);
            }
        }
        
        function editTemplateArea(templateArea, view) {
            var dialogData = {
                canvas: {
                    width: Math.round(templateArea.width / 25) * 25,
                    height: Math.round(templateArea.height / 25) * 25,
                    left: templateArea.left,
                    top: templateArea.top
                },
                view: view
            }
            if (vm.ballotStyle[view]) {
                vm.ballotStyle[view].clone(function(o) {
                    dialogData.template = o;
                    openTemplateDesigner(dialogData);
                }, fabricExtendedProperties.concat(optionDesignerCustomProperties));
            } else {
                openTemplateDesigner(dialogData);
            }
        }
        
        vm.openTemplateDesigner = openTemplateDesigner;
        function openTemplateDesigner(designerData) {
//            if (designerData.template) {
//                designerData.template.top = 0;
//                designerData.template.left = 0;
//            }
            var modalInstance = $uibModal.open({
                templateUrl: baseTemplateUrl + 'views/dialogs/modalTemplateDesigner.html',
                size: 'lg',
                windowClass: 'template-designer-modal',
                backdrop: 'static',
                keyboard: false,
                controller: 'ballotTemplateDesignerController',
                controllerAs: 'vm',
                
                resolve: {
                    designerData: function() {
                        return designerData;
                    }
                }
            });

            modalInstance.result.then(function(responseData) {
                var template = responseData.template;
                var view = responseData.view;
                
                vm.ballotStyle[view] = template;
                
                var activeObject = $scope.fabric.getCanvas().getActiveObject();
                
                template.clone(function (o) {
                    var areaBackground = $scope.fabric.addRect({
                        left: 0, top: 0, 
                        width: activeObject.width, height: activeObject.height,
                        fill: "#ffffff", stroke: "#0c7b95", strokeWidth: 1, opacity: 1,
                        renderToCanvas: false
                    });
                    var newAreaGroup = $scope.fabric.createGroup([areaBackground, o], {
                        left: activeObject.left, top: activeObject.top,
                        hasRotatingPoint: false, hasControls: false, cornerSize: 6, opacity: 1,
                        hoverCursor: "pointer", lockMovementX: true, lockMovementY: true,
                        subtype: activeObject.subtype, view: activeObject.view
                    });
                    $scope.fabric.getCanvas().remove(activeObject);
                    
                    template.top = template.top + designerData.canvas.top;
                    template.left = template.left + designerData.canvas.left;
                }, optionDesignerCustomProperties);
                
            }, function() {
                $scope.fabric.setDirty(false);
            });
        };
        
        $scope.$on('canvas:created:canvasX', function(event, data) {
            init('canvasX');
        });
        
        function renderTemplateIntoCanvas(template) {
            template.set({hasControls: false});
            $scope.fabric.getCanvas().add(template);
            $scope.fabric.getCanvas().renderAll();
        }
        
        vm.changeView = changeView;
        function changeView(viewName) {
            vm.currentView = viewName;
            vm.templateShape = {};
            if (vm.currentView === 'newTemplate') {
                vm.ballotColumns = ballotTemplateDesignerService.getBallotColumns($scope.fabric.grid.width,
                        $scope.fabric.grid.height);
                vm.currentBallotColumns = vm.ballotColumns[0];
                
                vm.ballotAreas = ballotTemplateDesignerService.getBallotAreas($scope.fabric.grid.width,
                        $scope.fabric.grid.height, vm.currentBallotColumns.value);
            } else {
                
            }
        }
                
        vm.templateManager = {};
        vm.templateManager.genericElements = ballotTemplateDesignerService.getTemplateGenericElements();
        vm.templateManager.fixedElements = ballotTemplateDesignerService.getTemplateHeaderFixedElements();
        vm.templateManager.variables = [
            {value: '${election.title}', name: 'Election title'},
            {value: '${election.date}', name: 'Election date'}
        ]
        vm.lastAddedObjectId;
        
        vm.displayColumnSeparators = displayColumnSeparators;
        function displayColumnSeparators(element) {
            var objectsToRemove = [];
            $scope.fabric.getCanvas().forEachObject(function(obj) {
                if (obj.subtype && (obj.subtype === 'columnSeparator' || obj.subtype === 'pageArea')) {
                    objectsToRemove.push(obj);
                }
            });
            objectsToRemove.forEach(function(obj) {
                $scope.fabric.getCanvas().remove(obj);
            })
            if (element.components.length > 0) {
                element.selected = true;
                drawElement(element);
            };
            vm.ballotAreas = ballotTemplateDesignerService.getBallotAreas($scope.fabric.grid.width,
                $scope.fabric.grid.height, vm.currentBallotColumns.value);
        }
        
        vm.drawElement = drawElement;
        function drawElement(element) {
            $log.info("Element with id " + element.id + " is selected: " + element.selected);
            if (element.selected === undefined || element.selected) {
                let componentsIds = [];
                vm.lastAddedObjectId = element.id;
                // add element to canvas
                var components = element.components;
                for (let n = 0; n < components.length; n++) { 
                    componentsIds.push(drawFabricElementNew(components[n]));
                }
                console.log("Comp Ids: " + componentsIds);
                if (element.groupDefinition) {
                    let fabricObjects = [];
                    componentsIds.forEach(function(componentId) {
                        $scope.fabric.getCanvas().forEachObject(function(obj) {
                            if (obj.id === componentId) {
                                fabricObjects.push(obj);
                            }
                        });
                    });
                    
                    fabricObjects.forEach(function(fabricObject) {
                        $scope.fabric.getCanvas().remove(fabricObject);
                    });
                    
                    console.log(angular.extend({left: 100, top: 100}, element.groupDefinition));
                    var group = $scope.fabric.createGroup(fabricObjects, element.groupDefinition);
                    
                    group._calcBounds(true);
                    element.id = group.id;
                }
            } else {
                // remove element from canvas
                var objectsToRemove = [];
                $scope.fabric.getCanvas().forEachObject(function(obj) {
                    if (obj.id === element.id) {
                        objectsToRemove.push(obj);
                    }
                });
                objectsToRemove.forEach(function(obj) {
                    $scope.fabric.getCanvas().remove(obj);
                })
            }
        }
        
        function drawFabricElementNew(element) {
            var elementType = element.ctype;
            let options = angular.extend({hasRotatingPoint: false, cornerSize: 6, customId: element.id}, element);
            let elementId = -1;
            let activeObject = undefined;
            if (elementType === 'text') {
                activeObject = $scope.fabric.addText(element.text, options);
                elementId = activeObject.id;
            } else if (elementType === 'textbox') {
                $scope.fabric.addTextBox(element.text, options);
                activeObject = $scope.fabric.getCanvas().getActiveObject();
                activeObject.on('changed', function(e) {
                    handleVariableRemoval(activeObject);
                });
                activeObject.on('selection:changed', function(e) {
                    highlightTemplateVariable(activeObject);
                });
                elementId = activeObject.id;
//                if (options.name && options.name !== '') {
//                    vm.templateShape[options.name] = activeObject;
//                }
            } else if (elementType === 'image') {
                $log.info("Adding image!!!");
                if (options.src === undefined) {
                    vm.selectFiles();
                } else {
                    activeObject = $scope.fabric.addImageBase64(baseTemplateUrl + options.src, options);
                    elementId = activeObject.id;
                }
                
            } else if (elementType === 'mark') {
                $log.info("Adding ballot option mark!!!");
                options = angular.extend({hasRotatingPoint: false, cornerSize: 6, fill: 'rgba(0,0,0,0)',
                    stroke: 'black', strokeWidth: 1, hoverCursor: 'not-allowed',  
                    hasControls: false, lockMovementX: true, lockMovementY: true}, options);
                activeObject = $scope.fabric.addOptionMark(options);
                elementId = activeObject.id;
            } else if (elementType === 'separationLine') {
                activeObject = $scope.fabric.addLine([0, 0, element.width, 0], options);
                elementId = activeObject.id;
            } else if (elementType === 'verticalLine') {
                activeObject = $scope.fabric.addLine([0, 0, 0, element.length], options);
                elementId = activeObject.id;
            } else if (elementType === 'rect') {
                options = angular.extend({}, fabricConstants.rectDefaults, options);
                activeObject = $scope.fabric.addRect(options);
                elementId = activeObject.id;
//                if (options.name && options.name !== '') {
//                    vm.templateShape[options.name] = activeObject;
//                }
            } else {
                $log.error("Unrecognized object type in drawFabricElementNew(): " + elementType);
                return;
            }
            if (options.name && options.name !== '' && activeObject) {
                vm.templateShape[options.name] = activeObject;
            }
            if (options.hasControls !== undefined && !options.hasControls) {
                $scope.fabric.deselectActiveObject();
            }
            $log.info("Created '" + elementType + "' element with OPTIONS: " + JSON.stringify(options));
            $log.info("Created '" + elementType + "' element with OPTIONS: " + options);
            return elementId;
        }
        
        vm.selectFiles = function() {
            $("#inputSelectFile").click();
        };

        $scope.$on('save.ballot.template', listenSaveBallotTemplate);
        
        function listenSaveBallotTemplate($event, message) {
            console.log('Received message: ' + message);
            vm.ballotTemplateName = message.name;
            saveBallotStyle(message.name);
//            saveTemplate();
        }
        
        function showModalInformation(title, message, callback) {
            var modalInstance = $uibModal.open({
                templateUrl: baseTemplateUrl + 'views/dialogs/modalInfoDialog.html',
                size: 'md',
                backdrop: 'static',
                keyboard: false,
                controller: 'ModalCtrl',
                controllerAs: 'vm',
                resolve: {
                    title: function() {
                        return title;
                    },
                    message: function() {
                      return message;  
                    }
                }
            });
            
            modalInstance.result.then(function(userSelections) {
                $log.info("User selections: " + JSON.stringify(userSelections));
                callback(userSelections);
            }, function() {
                //action on popup dismissal
            });
        }
        
        function showModalConfirmation(title, message, callback) {
            var modalInstance = $uibModal.open({
                templateUrl: baseTemplateUrl + 'views/dialogs/modalDialog.html',
                size: 'md',
                backdrop: 'static',
                keyboard: false,
                controller: 'ModalCtrl',
                controllerAs: 'vm',
                resolve: {
                    title: function() {
                        return title;
                    },
                    message: function() {
                      return message;  
                    }
                }
            });
            
            modalInstance.result.then(function(userSelections) {
                $log.info("User selections: " + JSON.stringify(userSelections));
                if (callback) {
                    callback(userSelections);
                }
                
            }, function() {
                //action on popup dismissal
                if (callback) {
                    callback(null);
                }
            });
        }
        
        function bindContextMenu() {
            $(".upper-canvas").bind('contextmenu', function(ev) {
//              alert('AHHHH!');
                var pointer = $scope.fabric.getCanvas().getPointer(ev.originalEvent);
                var objects = $scope.fabric.getCanvas().getObjects();
                for (var i = objects.length - 1; i >= 0; i--) {
                    if (objects[i].containsPoint(pointer)) {
                        console.log("clicked canvas obj");
                        $scope.fabric.getCanvas().setActiveObject(objects[i]);
                        break;
                    }
                }

                if (i < 0) {
                    $scope.fabric.getCanvas().deactivateAll();
                }

                $scope.fabric.getCanvas().renderAll();

                ev.preventDefault();
                return false;
            });
        }
        
    }
    
    
})();

(function() {
    'use strict';
//Please note that $uibModalInstance represents a modal window (instance) dependency.
//It is not the same as the $uibModal service used above.

    angular.module('ballotTemplateDesigner').controller('ModalCtrl', ModalCtrl);
    
    ModalCtrl.$inject = ['ballotTemplateDesignerService', '$uibModalInstance', 'title', 'message'];
    
    function ModalCtrl(ballotTemplateDesignerService, $uibModalInstance, title, message) {
        var vm = this;

        vm.title = title;
        vm.message = message;
    
        vm.ok = function () {
            $uibModalInstance.close('ok');
        };
    
        vm.cancel = function () {
            $uibModalInstance.dismiss('cancel');
        };

    }
})();

(function() {
    'use strict';

    angular.module('ballotTemplateDesigner').controller('SaveBallotTemplateController', SaveBallotTemplateController);
    
    SaveBallotTemplateController.$inject = ['ballotTemplateDesignerService', '$scope', '$timeout'];
    
    function SaveBallotTemplateController(ballotTemplateDesignerService, $scope, $timeout) {
        var vm = this;
        
        vm.formHasInvalidData = function() {
            let touched = $scope.forms.saveBallotTemplateForm.template_name.$touched;
            let invalid = $scope.forms.saveBallotTemplateForm.template_name.$invalid;
            let required = $scope.forms.saveBallotTemplateForm.template_name.$error.required;
            return touched &&
                    invalid &&
                    required;
        };
    
        vm.saveTemplate = function () {
            console.log("Saving template...");
            let message = {
                name: vm.templateName,
                description: vm.templateDescription,
            }
            $scope.$emit('save.ballot.template', message);
            $scope.closePopover();
        };
    
        vm.cancel = function () {
            console.log("Cancel has been called...");
            $scope.closePopover();
        };

    }
})();
