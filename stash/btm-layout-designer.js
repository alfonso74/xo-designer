
//var vmScope = {};

(function() {
    'use strict';

    angular.module('ballotTemplateDesigner').controller('layoutDesignerController', LayoutDesignerController);
    
    LayoutDesignerController.$inject = ['ballotTemplateDesignerService', 'fabric', 'fabricConstants', '$scope',
        '$routeParams',
        'dataService',
        'contestPreview',
        'canvasSpaceLocator',
        'sspServices',
        '$location',
        '$uibModal',
        '$log',
        '$timeout',
        '$q',
        '$translate',
        '$window'];
    
    function LayoutDesignerController(ballotTemplateDesignerService, fabric, fabricConstants, $scope, 
            $routeParams, dataService, contestPreviewService, canvasSpaceLocator, sspServices, 
            $location, $uibModal, $log, $timeout, $q, $translate, $window) {
        
        var vm = this;
        
        const scaleFactor = 1.25;
        
        var usingLocalStorage = true;
        var baseTemplateUrl = '';
        
        const optionDesignerCustomProperties = ['id', 'subtype', 'snapToGrid'];
        const fabricExtendedProperties = ['hasRotatingPoint', 'hasControls', 'cornerSize', 'hoverCursor',
            'lockMovementX', 'lockMovementY'];
        const ballotDesignerCustomProperties = ['id', 'subtype', 
            'templateCode', 'templateCustomCode', 'templateType', 
            'contestClass', 'previewData'];
        
        const canvasProperties = fabricConstants.canvasDefaults;
        const gridSpacing = canvasProperties.grid.rowSeparation;
        
//        vm.currentView = 'main';
        
        vm.shape = {};
        
        // stores the user definition for each ballot area (header, footer, instructions)
        vm.ballotStyle = {};
        vm.ballotStyleName = "No name";
        
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
        vm.ballotTemplates = [];
        
        vm.imageLoad = {
            url: null,
            options: {}
        };
        
        vm.infoBox = {
            mode: 'info',
            message: 'btm.layout-designer.properties-section.information'
        };
        
        
        vm.resizeCanvas = resizeCanvas;
        
        vm.readUrl = readUrl;
        vm.readUrlAsync = readUrlAsync;
        vm.addImageOnCanvas = addImageOnCanvas;
        vm.removeUploadImageData = removeUploadImageData;
        
        vm.clearLocalStorage = clearLocalStorage;
        
        getStorageLocation();
        
        let ballotStyleId = -1;
        let languageGroupId = -1;
        $log.info("Using the ballot style with ID: " + $routeParams.ballotStyleId);
        $log.info("Using the ballot style with language group ID: " + $routeParams.languageGroupId);
        if ($routeParams.ballotStyleId) {
            ballotStyleId = $routeParams.ballotStyleId;
            languageGroupId = $routeParams.languageGroupId;
        }
        
        vm.goToBallotTemplateList = function() {
            $location.url('/ballot-template-manager');
        }
        
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
                baseTemplateUrl = 'ballot-template-manager/';
                dataService.setRemoteMode();
            }
            $log.info("Using storage mode: " + dataService.getMode());
        }
        
        vm.reloadPage = reloadPage;
        function reloadPage() {
            $window.location.reload();
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
            
//            changeView(vm.currentView);
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

        function storeCurrentCanvas() {
            var objects = [];
            var definition = {objects: objects, background: ""};
            
            if (vm.ballotStyle.header) {
                replacePlaceholderObjects(vm.ballotStyle.header);
                objects.push(vm.ballotStyle.header.toObject(fabricExtendedProperties.concat(optionDesignerCustomProperties)));
            }
            if (vm.ballotStyle.footer) {
                replacePlaceholderObjects(vm.ballotStyle.footer);
                objects.push(vm.ballotStyle.footer.toObject(optionDesignerCustomProperties));
            }
            if (vm.ballotStyle.instructions) {
                replacePlaceholderObjects(vm.ballotStyle.instructions);
                objects.push(vm.ballotStyle.instructions.toObject(optionDesignerCustomProperties));
            }
            
            let canvasObjects = $scope.fabric.getCanvas().getObjects();
            canvasObjects.forEach((obj, index) => {
                $log.info("Exclude object from export (" + obj.id + ", subtype: " + obj.subtype + "): " + obj.excludeFromExport);
//                replacePlaceholderObjects(obj);
                if (!obj.excludeFromExport) {
                    objects.push(obj.toObject(fabricExtendedProperties.concat(optionDesignerCustomProperties)));
                }
            });
            
            vm.canvas.pages[vm.canvas.currentPage] = definition;
            
            loadNavigationalTemplates();
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
            $log.info('Loading contest templates...');
            dataService.getBallotTemplatesList()
            .then(function(response) {
                if (response.data) {
                    $log.info("Contest templates loaded: " + response.data.data.length);
                    vm.ballotTemplates = response.data.data;
                    assignNavTemplate('pageNumber');
                    assignNavTemplate('nextPageInstruction');
                    assignNavTemplate('finalPageInstruction');
                } else {
                    $log.info("No contest templates were found");
                }
            })
            .catch(function(data) {
                $log.info('Error: ' + status);
            });
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
        
        /**
         * Gets the ballot style definition (in JSON format) identified by the
         * indicated ballot style code.
         */
        vm.loadBallotStyle = loadBallotStyle;
        function loadBallotStyle(ballotStyleCode) {
//            clearCanvas();
            vm.canvas.pages = [];
            
            var ballotStyle = '';
            if (usingLocalStorage) {
//                ballotStyle = loadBallotStyleLocal(ballotStyleCode);
//                vm.currentVotingTypes = ballotStyle.types;
//                loadBallotStylePages(ballotStyle.definition);
            } else {
                $log.info('Loading ballot style with code: ' + ballotStyleCode);
                dataService.getBallotStyle(ballotStyleCode).
                then(function(response) {
                    if (response.data) {
                        ballotStyle = response.data.data;
                        $log.info("Response data data length: " + ballotStyle.length);
                        loadBallotStylePages(ballotStyle.definition, ballotStyle.types);
                    }
                });
            }
//            $scope.fabric.setDirty(false);
        }
        
        /**
         * Parses the indicated ballot style definition, loads the
         * ballot style pages into the ballot designer, and displays
         * the first page.
         * 
         * @param ballotStyleDefinition json string with a ballot style
         * definition
         */
        function loadBallotStylePages(ballotStyleDefinition, ballotStyleTypes) {
            if (ballotStyleDefinition !== '') {
                var ballotStyle = JSON.parse(ballotStyleDefinition);
                vm.currentVotingTypes = ballotStyleTypes;
                vm.currentPageSize = ballotStyle.page.size;
                vm.currentOrientation = ballotStyle.page.orientation;
                vm.currentBallotColumns = vm.ballotColumns.filter(column => column.value === ballotStyle.pageColumns);
                resizeCanvas(vm.currentPageSize, vm.currentOrientation);
//                for (let n = 0; n < ballotStyle.pages.length; n++) {
//                    vm.canvas.pages.push(ballotStyle.pages[n]);
//                }
                loadCanvasPage(0);
            }
        }
        
        /**
         * Gets a particular ballot style page definition (stored as a json 
         * object) from the canvas pages array, and loads it into the ballot
         * designer canvas.
         * 
         * @param requestedCanvasPage the page to load (ONE based)
         */
        function loadCanvasPage(requestedCanvasPage) {
            if (requestedCanvasPage >= vm.canvas.pages.length ||
                    requestedCanvasPage < 0) {
                return;
            } else {
                vm.canvas.currentPage = requestedCanvasPage;
            }
//            clearCanvas();
            renderBallotStylePageIntoCanvas(vm.canvas.pages[requestedCanvasPage]);
//            $scope.fabric.getCanvas().calcOffset();
        }
        
        /**
         * Renders the indicated ballot style page into the current canvas.
         * The ballotStyle parameter expects a json object with a ballot 
         * style page definition.
         */
        function renderBallotStylePageIntoCanvas(ballotStylePageDefinition) {
            if (ballotStylePageDefinition && ballotStylePageDefinition !== '') {
                parseFabricObjectsFromJsonObjectAsync(ballotStylePageDefinition, function(fabricObjects) {
                    fabricObjects.forEach(function(fabricObject) {
                        renderFabricObjectIntoCanvas(fabricObject);
                    });
                });
                $scope.fabric.getCanvas().renderAll();
            }
        }
        
        /**
         * A Fabric canvas follows the next definition:
         * '{objects:[arrayWithFabricObjects], background:""}'
         */
        function parseFabricObjectsFromJsonObjectAsync(jsonBallotStyleDefinition, callback) {
            var fabricObjects = [];
            if (jsonBallotStyleDefinition.objects) {  // seems to be a fabric canvas with N objects
                var objectsToCreate = jsonBallotStyleDefinition.objects.length;
                var createdObjects = 0;
                for (let n = 0; n < jsonBallotStyleDefinition.objects.length; n++) {
                    createFabricObjectAsync(jsonBallotStyleDefinition.objects[n], function(fabricObject) {
                        fabricObjects.push(fabricObject);
                        if (++createdObjects >= objectsToCreate) {
                            callback(fabricObjects);
                        }
                    });
                }
            }
        }
        
        function createFabricObjectAsync(jsonObject, callback) {
            var fabricObject = null;
            var klass = $scope.fabric.getKlass(jsonObject.type);
            if (klass.async) {
                klass.fromObject(jsonObject, function (img) {
                    fabricObject = img;
                    callback(fabricObject);
                });
            } else {
                fabricObject = klass.fromObject(jsonObject);
                callback(fabricObject);
            }
        }
        
        /**
         * Gets a ballot style definition (in json format) from the
         * web browser local storage.
         */
        function loadBallotStyleLocal (ballotStyleCode) {
            $log.info("Cargando ballot template with code: " + ballotStyleCode);
            
            var ballotStyle = '';
            
            var retrievedObject = localStorage.getItem('ballotStyles');
            if (retrievedObject) {
                var ballotStyles = JSON.parse(retrievedObject);
                $log.info("Ballot styles found: " + ballotStyles.length);
                for (var n = 0; n < ballotStyles.length && ballotStyle === ''; n++) {
                    if (ballotStyles[n].code === ballotStyleCode) {
                        ballotStyle = ballotStyles[n];
                    }
                }
            }

            return ballotStyle;
        }
        
        
        $scope.fabric = null;
        
        function init(canvasName) {
            console.log("LayoutDesignerController.init() called");
            
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
                /*
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
                */
                $scope.fabric.addListener($scope.fabric.getCanvas().upperCanvasEl, 'dblclick', function(e) {
                    handleCanvasDoubleClick(e, null);
                });
                
//                $scope.fabric.getCanvas().on('text:changed', function(e) {
//                    var element = e.target;
//                    console.log("Event: " + e);
//                    console.log("Changed: " + element);
//                });
                
//                bindContextMenu();
            }
            
            vm.ballotOptionCode = Math.floor(Math.random() * 10000) + 1;
            vm.shape = {};
            vm.contest = false;
            
            if (ballotStyleId === -1) {
                setBallotStyleDefaultValues();
            } else {
                vm.currentPageSize = vm.ballotStyle.page.size;
                vm.currentOrientation = vm.ballotStyle.page.orientation;
                resizeCanvas(vm.currentPageSize, vm.currentOrientation);
                
                vm.ballotColumns = ballotTemplateDesignerService.getBallotColumns($scope.fabric.grid.width,
                        $scope.fabric.grid.height);
                vm.currentBallotColumns = vm.ballotColumns[2];
                
                vm.ballotAreas = ballotTemplateDesignerService.getBallotAreas($scope.fabric.grid.width,
                        $scope.fabric.grid.height, vm.currentBallotColumns.value);
            }
            
            initCanvasPages();
            loadNavigationalTemplates();
            
            $scope.fabric.deselectActiveObject();
            
            if (ballotStyleId === -1) {
                vm.drawElement(vm.ballotAreas[0]);
                vm.drawElement(vm.ballotAreas[1]);
                vm.drawElement(vm.ballotAreas[2]);
            } else {
                // locate the language pages for the current ballot style
                let languageBallotStyle = locateBallotStyleForLanguageGroup(languageGroupId);
                vm.ballotStyleName = languageBallotStyle.name;
                if (languageBallotStyle !== null && languageBallotStyle.pages && languageBallotStyle.pages.length > 0) {
                    vm.canvas.pages = [];
                    languageBallotStyle.pages.forEach(languagePage => vm.canvas.pages.push(languagePage));
                    loadCanvasPage(0);
                } else {
                    if (vm.ballotStyle.page.areas.header.enabled) {
                        vm.ballotAreas[0].components[0].fill = vm.ballotStyle.page.areas.header.bgColor;
                        vm.ballotAreas[0].components[0].stroke = vm.ballotStyle.page.areas.header.borderColor;
                        vm.drawElement(vm.ballotAreas[0]);
                    }
                    if (vm.ballotStyle.page.areas.footer.enabled) {
                        vm.ballotAreas[1].components[0].fill = vm.ballotStyle.page.areas.footer.bgColor;
                        vm.ballotAreas[1].components[0].stroke = vm.ballotStyle.page.areas.footer.borderColor;
                        vm.drawElement(vm.ballotAreas[1]);
                    }
                    if (vm.ballotStyle.page.areas.instructions.enabled) {
                        vm.ballotAreas[2].components[0].fill = vm.ballotStyle.page.areas.instructions.bgColor;
                        vm.ballotAreas[2].components[0].stroke = vm.ballotStyle.page.areas.instructions.borderColor;
                        vm.drawElement(vm.ballotAreas[2]);
                    }
                }
            }
        };
        
        function setBallotStyleDefaultValues() {
            vm.currentPageSize = fabricConstants.pageSizes[0];
            vm.currentOrientation = vm.ballotOrientation[0];
            resizeCanvas(vm.currentPageSize, vm.currentOrientation);
            
            vm.ballotColumns = ballotTemplateDesignerService.getBallotColumns($scope.fabric.grid.width,
                    $scope.fabric.grid.height);
            vm.currentBallotColumns = vm.ballotColumns[2];
            
            vm.ballotAreas = ballotTemplateDesignerService.getBallotAreas($scope.fabric.grid.width,
                    $scope.fabric.grid.height, vm.currentBallotColumns.value);
        }
        
        function drawBallotStyleAreas() {
            
        }
        
        function handleCanvasDoubleClick(event, data) {
            var activeObject = $scope.fabric.getCanvas().getActiveObject();
            if (activeObject.subtype.startsWith('pageArea:') || activeObject.subtype.startsWith('pageAreaPlaceholder:')) {
                let view = activeObject.subtype.substring(activeObject.subtype.indexOf(":") + 1);
                editTemplateArea(activeObject, view);
            }
        }
        
        function editTemplateArea(templateArea, view) {
            let templateAreaColors = extractAreaColors(templateArea);
            let languages = languageGroupId.split("-");
            var dialogData = {
                canvas: {
                    width: Math.round(templateArea.width / 25) * 25,
                    height: Math.round(templateArea.height / 25) * 25,
                    left: templateArea.left,
                    top: templateArea.top,
                    bgColor: templateAreaColors.bgColor,
                    borderColor: templateAreaColors.borderColor
                },
                languages: languages,
                view: view
            }
            if (templateArea.subtype.startsWith('pageArea:')) {
                templateArea.clone(function(o) {
                    dialogData.template = o;
                    openTemplateDesigner(dialogData);
                }, fabricExtendedProperties.concat(optionDesignerCustomProperties));
            } else {
                openTemplateDesigner(dialogData);
            }
        }
        
        vm.openTemplateDesigner = openTemplateDesigner;
        function openTemplateDesigner(designerData) {
            
            let dialogSize = 'lg';
//            if (designerData.view === 'instructions') {
//                dialogSize = 'md';
//            }
            
            var modalInstance = $uibModal.open({
                templateUrl: baseTemplateUrl + 'views/dialogs/modalTemplateDesigner.html',
                size: dialogSize,
                windowClass: 'template-designer-modal',
                backdrop: 'static',
                keyboard: false,
                controller: 'templateDesignerController',
                controllerAs: 'vm',
                
                resolve: {
                    designerData: function() {
                        return designerData;
                    }
                }
            });

            modalInstance.result.then(function(responseData) {
                let template = responseData.template;
                
                let activeObject = $scope.fabric.getCanvas().getActiveObject();
                template.clone(function(o) {
                    $scope.fabric.getCanvas().remove(activeObject);
                    o.top = Math.round(template.top + designerData.canvas.top);
                    o.left = Math.round(template.left + designerData.canvas.left);
                    $scope.fabric.getCanvas().add(o);
                }, fabricExtendedProperties.concat(optionDesignerCustomProperties));
                
            }, function() {
                $scope.fabric.setDirty(false);
            });
        };
        
        function extractAreaColors(templateArea) {
            let areaColors = {};
            let items = templateArea._objects;
            items.forEach(item => {
                if (item.subtype === 'background') {
                    areaColors.bgColor = item.fill;
                    areaColors.borderColor = item.stroke;
                }
            });
            return areaColors;
        }
        
        $scope.$on('canvas:created:canvasX', function(event, data) {
            if (ballotStyleId !== -1) {
                $log.info('Loading ballot style with code: ' + ballotStyleId);
                dataService.getBallotStyle(ballotStyleId).
                then(function(response) {
                    if (response.data) {
                        let ballotStyle = response.data.data;
                        vm.ballotStyle = JSON.parse(ballotStyle.definition);
                        let result = [];
                        if (vm.ballotStyle.page.areas.header.enabled) {result.push("Header")};
                        if (vm.ballotStyle.page.areas.footer.enabled) {result.push("Footer")};
                        if (vm.ballotStyle.page.areas.instructions.enabled) {
                            result.push(vm.ballotStyle.page.areas.instructions.orientation + " instructions");
                        };
                        vm.ballotStyle.page.areas.description = result.join(', '); 
                        $log.info("Ballot style: " + ballotStyle);
                        $log.info(vm.ballotStyle);
                    }
                })
                .finally(function(response) {
                    init('canvasX');
                })
            } else {
                init('canvasX');
            }
        });
        
        function renderFabricObjectIntoCanvas(object) {
            object.set({hasControls: false});
            $scope.fabric.getCanvas().add(object);
            $scope.fabric.getCanvas().renderAll();
        }
        
//        vm.changeView = changeView;
//        function changeView(viewName) {
//            vm.currentView = viewName;
//            vm.templateShape = {};
//            if (vm.currentView === 'newTemplate') {
//                vm.ballotColumns = ballotTemplateDesignerService.getBallotColumns($scope.fabric.grid.width,
//                        $scope.fabric.grid.height);
//                vm.currentBallotColumns = vm.ballotColumns[0];
//                
//                vm.ballotAreas = ballotTemplateDesignerService.getBallotAreas($scope.fabric.grid.width,
//                        $scope.fabric.grid.height, vm.currentBallotColumns.value);
//            } else {
//                
//            }
//        }
        
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
        /*
        vm.renderSelectedContestClasses = function(element) {
            // remove all the selected contest classes from the canvas
            let selectedContestClasses = vm.contestClasses.filter(contestClass => contestClass.isChecked);
            $log.info("Contest classes to redraw: " + selectedContestClasses.map(contestClass => contestClass.code));
            removeContestClasses(selectedContestClasses.map(contestClass => contestClass.code));
            
            // remove the 'unselected' contest class from canvas
            if (!element.isChecked) {
                let unselectedContestClass = [];
                unselectedContestClass.push(element.code);
                removeContestClasses(unselectedContestClass);
            }
            
            // and redraw all the contest classes that remain selected
            drawContestClasses(selectedContestClasses, 0);
        }
        
        function removeContestClasses(contestClassCodes) {
            // remove element from canvas
            let objectsToRemove = $scope.fabric.getCanvas().getObjects()
            .filter(obj => obj.contestClass && contestClassCodes.indexOf(obj.contestClass.code) != -1);
            objectsToRemove.forEach(function(obj) {
                $scope.fabric.getCanvas().remove(obj);
            })
        }
        
        function drawContestClasses(contestClasses, index) {
            if (index === contestClasses.length) {
                return;
            }
            let element = contestClasses[index++];
            let ballotTemplateCodeForContestClass = -99;
            getBallotTemplateByCode(0)
            .then(function(selectedTemplate) {
                parseFabricObjectFromJsonAsync(selectedTemplate.definition, function(fabricObject) {
                    fabricObject.set({
                        left: 25,
                        top: 25,
                        templateCode: selectedTemplate.code,
                        templateType: selectedTemplate.type,
                        hasControls: false
                    });
                    
                    fabricObject.contestClass = element;
                    fabricObject.previewData = {
                            eligibleOptions: 4,
                            voteFor: 1,
                            writeIn: false,
                            columns: 4
                    };
                    
                    var allAvailableAreas = canvasSpaceLocator.locateFreeAreas($scope.fabric, 
                            $scope.fabric.getCanvas(), vm.currentPageSize.rows, vm.currentPageSize.columns, 
                            canvasProperties.grid.rowSeparation, canvasProperties.grid.columnSeparation);
                    var biggestAvailableArea = allAvailableAreas[0]; // biggest free area
                    contestPreviewService.fillContestTemplate($scope.fabric, $scope.fabric.getCanvas(), 
                            fabricObject, ballotDesignerCustomProperties, biggestAvailableArea, 
                            canvasProperties.grid.rowSeparation, canvasProperties.grid.columnSeparation);
                    renderTemplateIntoCanvas(fabricObject);
                    drawContestClasses(contestClasses, index)
                });
            });
        }
        
        function getBallotTemplateByCode(code) {
            let response = undefined;
            if (vm.ballotTemplates && vm.ballotTemplates.length > 0) {
                let filterResult = vm.ballotTemplates.filter(
                    ballotTemplate => ballotTemplate.code === code);
                if (filterResult.length > 0) {
                    response = $q.when(filterResult[0]);
                } else {
                    $log.warn("Getting template from remote service.  Template code: " + code);
                    response = dataService.getBallotTemplate(code);
                }
            } else {
                $log.warn("Getting template from remote service.  Template code: " + code);
                response = dataService.getBallotTemplate(code);
            }
            return response;
        }
        
        function renderTemplateIntoCanvas(fabricObject) {
            fabricObject.set({hasControls: false});
            $scope.fabric.getCanvas().add(fabricObject);
            $scope.fabric.getCanvas().renderAll();
        }
        
        function parseFabricObjectFromJsonAsync(json, callback) {
            var fabricJson = JSON.parse(json);
            createFabricObjectAsync(fabricJson, function(fabricObject) {
                callback(fabricObject);
            });
        }
        */
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
        
        vm.saveBallotStyle = saveBallotStyle;
        function saveBallotStyle(ballotIsComplete) {
            vm.saving = true;
            let languageBallotStyle = locateBallotStyleForLanguageGroup(languageGroupId);
            
            updateBallotStyleStatus(languageBallotStyle, ballotIsComplete);
            storeCurrentCanvas();
            
            let id = ballotStyleId;
            let ballotStyleName = vm.ballotStyle.name;
            let electionType = vm.ballotStyle.electionType; 
            
            dataService.updateBallotStyle(id, 
                    ballotStyleName, 
                    electionType, 
                    createBallotStyleDefinition(languageBallotStyle))
            .then(function(response) {
                sspServices.toast({type:'success', message: 'Ballot template successfully saved'});
                $log.info("Ballot style saved successfully, id " + id);
                vm.goToBallotTemplateList();
            })
            .catch(function(response) {
                sspServices.toast({type:'danger', message: 'Error saving the ballot template'});
                $log.error('Error ' + response.status + ': ' + response.data);
            })
            .finally(function() {
                vm.saving = false;
            });
        };
        
        function verifyLanguageGroupsVariables() {
            let canvasObjects = $scope.fabric.getCanvas().getObjects();
            
        }
        
        function createBallotStyleDefinition(languageBallotStyle) {
            languageBallotStyle.pages = vm.canvas.pages;
            
            vm.ballotStyle.page.size = vm.currentPageSize;
            vm.ballotStyle.page.orientation = vm.currentOrientation;
            vm.ballotStyle.pageColumns = vm.currentBallotColumns.value;
            vm.ballotStyle.navigationTemplates = vm.canvas.navigationTemplates;
            
            return JSON.stringify(vm.ballotStyle);
        };
        
        function updateBallotStyleStatus(languageBallotStyle, ballotIsComplete) {
            languageBallotStyle.status = ballotIsComplete ? "Complete" : "In progress";
            
            let ballotStyle = vm.ballotStyle;
            ballotStyle.status = "In progress";
            if (ballotStyle.languageBallotStyles && ballotStyle.languageBallotStyles.length > 0) {
                let completedStyles = ballotStyle.languageBallotStyles.filter(e => e.status === "Complete");
                if (completedStyles.length === ballotStyle.languageBallotStyles.length) {
                    ballotStyle.status = "Complete";
                }
            }
        }
        
        function ballotTemplateHasCompletedLanguage(language) {
            let languageCompleted = false;
            vm.ballotAreas.forEach(ballotArea => {
                let ballotAreaName = ballotArea.value;
                if (vm.ballotStyle[ballotAreaName]) {
                    if (areaHasLanguage(vm.ballotStyle[ballotAreaName], language)) {
                        languageCompleted = true;
                    };
                }
            });
            return languageCompleted;
        }
        
        function areaHasLanguage(fabricGroup, languageString) {
            let hasLanguage = false;
            fabricGroup.forEachObject(function(obj) {
                if (obj.get('type') === 'textbox') {
                    if (obj.get('text').includes(languageString)) {
                        hasLanguage = true;
                    }
                }
            });
            return hasLanguage;
        }
        
        function locateBallotStyleForLanguageGroup(languageGroupId) {
            let result = null;
            
            let ballotStyle = vm.ballotStyle;
            let key = ballotStyle.name + "_" + languageGroupId.replace(/-/g, "_");
            $log.info("KEY: " + key);
            if (ballotStyle.languageBallotStyles && ballotStyle.languageBallotStyles.length > 0) {
                ballotStyle.languageBallotStyles.forEach(languageGroup => {
                    if (languageGroup.customCode === key) {
                        result = languageGroup;
                    }
                });
            }
            return result;
        }
        
    }
    
})();
