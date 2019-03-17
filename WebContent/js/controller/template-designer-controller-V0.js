
var vmScope = {};

(function() {
    'use strict';

    angular.module('ballotTemplateDesigner').controller('templateDesignerController', TemplateDesignerController);
    
    TemplateDesignerController.$inject = ['ballotTemplateDesignerService', 'fabric', 'fabricConstants', '$scope',
        '$uibModalInstance',
        '$uibModal',
        '$q',
        '$log',
        '$timeout',
        '$window',
        'designerData'];
    
    function TemplateDesignerController(ballotTemplateDesignerService, fabric, fabricConstants, $scope, 
            $uibModalInstance, $uibModal, $q, $log, $timeout, $window, designerData) {
        
        var vm = this;
        
        // used by the drag and drop javascript events (outside angular)
        vmScope = this;
        
        vm.designerData = designerData;
    
        vm.ok = function () {
            var ballotTemplateAsGroup = createBallotTemplateGroup();
            ballotTemplateAsGroup.subtype = designerData.view;
//            var ballotTemplateAsJson = JSON.stringify(ballotTemplateAsGroup.toObject(optionDesignerCustomProperties))
            var responseData = {
                template: ballotTemplateAsGroup,
                view: vm.designerData.view
            }
            $uibModalInstance.close(responseData);
        };
    
        vm.cancel = function () {
            $uibModalInstance.dismiss('cancel');
        };
        
        vm.contest = false;
        vm.accordion = {};
        vm.accordion.genericElements = {
            open: false
        };
        
        var usingLocalStorage = true;
        var baseTemplateUrl = '';
        
        const optionDesignerCustomProperties = ['id', 'subtype', 'snapToGrid'];
        
        const canvasProperties = fabricConstants.canvasDefaults;
        const gridSpacing = canvasProperties.grid.rowSeparation;
        
        vm.gridSpacing = 25;
        
        // inicializar al cargar/crear templates
        vm.template = {
    		hasInstructions: true,
    		hasWriteIn: true
        };
        
        vm.currentView = 'main';
        vm.currentPageSize = angular.extend({}, fabricConstants.pageSizes[0]);
        vm.currentOrientation = 'Portrait';
        
        vm.shape = {};
        vm.pageSizes = fabricConstants.pageSizes;
        vm.fontFamilies = fabricConstants.fonts;
        vm.fontSizes = fabricConstants.fontSizes;
        vm.markTypes = fabricConstants.markTypes;
        
        vm.selectedBallotTemplate = null;
        
        vm.ballotTemplateType = 'NONE';
        
        vm.imageLoad = {
            url: null,
            options: {}
        };
        
        vm.languages = [
            {code: "EN", name: "English"},
            {code: "ES", name: "Spanish"}
        ];
        
        vm.infoBox = {
            mode: 'info',
            message: 'btm.ballot-area-editor.tools-section.information'
        };
        
        vm.clearCanvas = clearCanvas;
        vm.resizeCanvas = resizeCanvas;
        vm.deleteCanvasObject = deleteCanvasObject;
        
        vm.readUrl = readUrl;
        vm.readUrlAsync = loadImageIntoCanvas;
        vm.addImageOnCanvas = addImageOnCanvas;
        vm.removeUploadImageData = removeUploadImageData;
        
        vm.toggleMarkType = toggleMarkType;
        vm.toggleBold = toggleBold;
        vm.toggleItalic = toggleItalic;
        vm.toggleUnderline = toggleUnderline;
        vm.setTextAlignment = setTextAlignment;
        
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

        /** Image handling functions */
        function loadImageIntoCanvas(event) {
            let canvasWidth = $scope.fabric.getCanvas().getWidth();
            let canvasHeight = $scope.fabric.getCanvas().getHeight();
            
            if (event.target.files && event.target.files[0]) {
                readFile(event.target.files[0])
                .then(addImageDimensions)
                .then(function(imageData) {
                    if (imageData.height > canvasHeight || imageData.width > canvasWidth) {
                        //confirm image resizing
                        showModalConfirmation("Load image", "The selected image would be resized to fit the current canvas size.")
                        .then(function() {
                            let resizeFactor = getImageResizeFactor(imageData, canvasWidth, canvasHeight);
                            $log.info("Resize factor: " + resizeFactor);
                            vm.imageLoad.options.width = imageData.width * resizeFactor;
                            vm.imageLoad.options.height = imageData.height * resizeFactor;
                            addImageOnCanvas(imageData.url, vm.imageLoad.options);
                        })
                        .catch(function() {
                            //action canceled, nothing to do
                            $log.info("Add image action canceled by end user");
                        });
                    } else {
                        addImageOnCanvas(imageData.url, vm.imageLoad.options);
                    }
                })
            }
        };
        
        function getImageResizeFactor(imageData, canvasWidth, canvasHeight) {
            let resizeFactor = 1;
            if (imageData.height > canvasHeight) {
                resizeFactor = canvasHeight / imageData.height;
            }
            if (imageData.width > canvasWidth) {
                let factorW = canvasWidth / imageData.width;
                if (resizeFactor > factorW) {
                    resizeFactor = factorW;
                }
            }
            return resizeFactor;
        }
        
        function addImageDimensions(result) {
            let deferred = $q.defer();
            
            let imageData = {};
            
            let i = new Image();
            i.onload = function() {
                $log.info("W: " + i.width + ", H: " + i.height);
                imageData.width = i.width;
                imageData.height = i.height
                imageData.url = result;
                deferred.resolve(imageData);
            }
            i.src = result;
            return deferred.promise;
        }
        
        function readFile(file) {
            let deferred = $q.defer();
            
            let reader = new FileReader();
            reader.onload = event => deferred.resolve(reader.result);
            reader.onerror = () => deferred.reject();
            
            try {
                reader.readAsDataURL(file);
            } catch(e) {
                deferred.reject(e);
            }
            return deferred.promise;
        }
        
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
            if (event.target.files && event.target.files[0]) {
                let canvasWidth = $scope.fabric.getCanvas().getWidth();
                let canvasHeight = $scope.fabric.getCanvas().getHeight();
                let reader = new FileReader();
                reader.onload = (event) => {
                    $timeout(function() {
                        let i = new Image();
                        i.onload = function() {
                            $log.info("W: " + i.width + ", H: " + i.height);
                            vm.imageLoad.width = i.width;
                            vm.imageLoad.height = i.height;
                        }
                        i.src = event.target['result'];
                        vm.imageLoad.url = event.target['result'];
                        
                        if (imageData.height > canvasHeight || imageData.width > canvasWidth) {
                            showModalConfirmation("Load image", "The selected image is too big for the current canvas, resize image to fit?")
                            .then(function(result) {
                                let resizeFactor = getImageResizeFactor(imageData, canvasWidth, canvasHeight);
                                $log.info("Resize factor: " + resizeFactor);
                                vm.imageLoad.options.width = imageData.width * resizeFactor;
                                vm.imageLoad.options.height = imageData.height * resizeFactor;
                                addImageOnCanvas(imageData.url, vm.imageLoad.options);
                            })
                            .catch(function() {
                                //action canceled, nothing to do
                                $log.info("Add image action canceled by end user");
                            });
                        } else {
                            addImageOnCanvas(vm.imageLoad.url, vm.imageLoad.options);
                        }
                        
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
                    left: 100,
                    top: 0,
                    angle: 0,
                    cornerSize: 6,
                    hasRotatingPoint: false,
                    snapToGrid: false
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
        
        function clearCanvas() {
            $scope.fabric.getCanvas().clear();
            $scope.fabric.getCanvas().backgroundColor = "#ffffff";
            init();
        }
        
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
        }
        
        function deleteCanvasObject() {
            let activeObject = $scope.fabric.getCanvas().getActiveObject();
            if (activeObject) {
                if (activeObject.hasControls === undefined || activeObject.hasControls) {
                    $scope.fabric.deleteActiveObject();
                    vm.shape = null;
                } else {
                    $log.info("Can't remove selected object");
                }
            }
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
        
        function toggleBold(object) {
            if (object.fontWeight === 'bold') {
                object.fontWeight = 'normal';
            } else {
                object.fontWeight = 'bold';
            }
        }
        
        function toggleItalic(object) {
            if (object.fontStyle === 'italic') {
                object.fontStyle = 'normal';
            } else {
                object.fontStyle = 'italic';
            }
        }
        
        function toggleUnderline(object) {
            if (object.textDecoration === 'underline') {
                object.set('textDecoration', '');
                $scope.fabric.getCanvas().renderAll();
            } else {
                object.set('textDecoration', 'underline');
            }
        }
        
        function setTextAlignment(object, alignment) {
            object.textAlign = alignment;
        }
        
        /**
         * Changes the 'mark' type used by the current ballot template
         */
        function toggleMarkType(markType) {
            var activeObject = $scope.fabric.getCanvas().getActiveObject();
            var left = activeObject.left;
            var top = activeObject.top;
            activeObject.remove();
            let options = angular.extend({hasRotatingPoint: false, cornerSize: 6, fill: 'rgba(0,0,0,0)',
                stroke: 'black', strokeWidth: 1, left: left, top: top}, 
                {width : gridSpacing, height : gridSpacing, subtype: "mark", markStyle: markType});
            $scope.fabric.addOptionMark(options);
        }
        
        
        function createTemplateDefinition(group) {
            var templateCode = vm.ballotOptionCode;
            var templateDefinition = {'name': vm.ballotTemplateName,
                    'code': templateCode,
                    'customCode': templateCode.toString(),
                    'type': vm.ballotTemplateType, 
                    'definition': JSON.stringify(group.toObject(optionDesignerCustomProperties))};
            templateDefinition.definition = templateDefinition.definition.replace('"8"', '"${pageNumber}"');
            templateDefinition.definition = templateDefinition.definition.replace('"/ 8"', '"/ ${pageTotal}"');
            return templateDefinition;
        }
        
        vm.resizeTemplateWidth = resizeTemplateWidth;
        function resizeTemplateWidth() {
        	var newWidth = vm.templateShape.newWidthInColumns * vm.gridSpacing;
        	var delta = newWidth - vm.templateShape.titleContainer.width;
        	
            var canvas = $scope.fabric.getCanvas();
            canvas.forEachObject(function(obj) {
             // any 'excluded from export' object is left out
                if (obj.get('excludeFromExport') === false && obj.get('subtype') !== 'mark') {
                	obj.set({width: obj.width + delta});
                }
            });
            $scope.fabric.getCanvas().renderAll();
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
            
            var options = {
        		hasRotatingPoint: false,
                cornerSize: 6,
                opacity: 1
            }
            var ballotTemplateGroup = $scope.fabric.createGroup(ballotTemplateObjects, options);
            
            if (!isStaticTemplate && !isInternal) {
                addContestBorders(ballotTemplateGroup);
            }
            
            ballotTemplateGroup._calcBounds(true);
            
            canvas._activeObject = null;
            
            $log.info("Ballot template group: " + JSON.stringify(ballotTemplateGroup.toObject(optionDesignerCustomProperties)));
            
            return ballotTemplateGroup;
        }
        
        function replacePlaceholderObjects() {
            var canvas = $scope.fabric.getCanvas();
            var placeholderObjects = [];

            canvas.forEachObject(function(obj) {
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
                    snapToGrid: originalObject.snapToGrid, renderToCanvas: true
                };
                let object = $scope.fabric.addRect(options);
                canvas.remove(originalObject);
            }
        }
        
        function createBallotOptionGroup(tmpArray, ballotOption) {
            return createGroup(tmpArray, ballotOption, 'ballotOption');
        }
        
        function createWriteInGroup(tmpArray, ballotOption) {
            return createGroup(tmpArray, ballotOption, 'writeIn');
        }
        
        function createGroup(tmpArray, ballotOption, subType) {
            var ballotOptionItems = [];
            var elementsToDelete = [];
            for (let n = 0; n < tmpArray.length; n++) {
                if (rectIsContained(tmpArray[n].getBoundingRect(), ballotOption.getBoundingRect())
                        || tmpArray[n].subtype === subType) {
                    ballotOptionItems.push(tmpArray[n]);
                    elementsToDelete.push(tmpArray[n]);
                }
            }
            for (let n = 0; n < elementsToDelete.length; n++) {
                tmpArray.splice(tmpArray.indexOf(elementsToDelete[n]), 1);
            }
            var ballotOptionGroup = $scope.fabric.createGroup(ballotOptionItems, {
                hasRotatingPoint: false,
                cornerSize: 6,
                opacity: 0.9,
                subtype: subType
            });
            return ballotOptionGroup;
        }

        function addContestBorders(templateObject) {
            $scope.fabric.addContestBorders(templateObject);
        }
        
        function rectIsContained(rect1, rect2) {
            var result = false;
            if (Math.round(rect1.left) >= Math.round(rect2.left) && 
                    Math.round(rect1.left + rect1.width) <= Math.round(rect2.left + rect2.width) && 
                    Math.round(rect1.top) >= Math.round(rect2.top) && 
                    Math.round(rect1.top + rect1.height) <= Math.round(rect2.top + rect2.height)) {
                result = true;
            }
            return result;
        }
        
        $scope.fabric = null;
        
        function init(canvasName) {
            console.log("TemplateDesignerController.init() called");
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
            
            vm.currentPageSize.rows = Math.round(designerData.canvas.height / 25);
            vm.currentPageSize.columns = Math.round(designerData.canvas.width / 25);
            console.log("ROWS: " + vm.currentPageSize.rows + ", COLS: " + vm.currentPageSize.columns);
            resizeCanvas(vm.currentPageSize, vm.currentOrientation);
            
//            $scope.fabric.createGrid(canvasWidth / gridColumnsWidth, 
//                    canvasHeight / gridRowsHeight, 
//                    gridColumnsWidth, gridRowsHeight);
            
            vm.ballotOptionCode = Math.floor(Math.random() * 10000) + 1;
            vm.shape = {};
            vm.contest = false;
            
            vm.ballotColumns = ballotTemplateDesignerService.getBallotColumns($scope.fabric.grid.width,
                    $scope.fabric.grid.height);
            vm.currentBallotColumns = vm.ballotColumns[0];
            
            vm.ballotAreas = ballotTemplateDesignerService.getBallotAreas($scope.fabric.grid.width,
                    $scope.fabric.grid.height, vm.currentBallotColumns.value);
            
            $scope.fabric.deselectActiveObject();
            
            setView(designerData.view);
            
            if (designerData.template) {
                designerData.template.top = designerData.template.top - designerData.canvas.top;
                ungroup(designerData.template);
                $scope.fabric.getCanvas().forEachObject(function(obj) {
                    if (obj.subtype) {
                        setChecboxForFixedElement(obj);
                    }
                });
            }
            
        };
        
        function ungroup(group) {
            var items = group._objects;
            group._restoreObjectsState();
            $scope.fabric.getCanvas().remove(group);
            for(var i = 0; i < items.length; i++) {
                if (items[i].subtype) {
                    $scope.fabric.getCanvas().add(items[i]);
                }
            }
        }
        
        function setChecboxForFixedElement(o) {
            for (var n = 0; n < vm.templateManager.fixedElements.length; n++) {
                var e = vm.templateManager.fixedElements[n];
                if (e.value === o.subtype) {
                    e.selected = true;
                    e.id = o.id;
                }
            }
        }
        
        vm.drag = function(e) {
            e.dataTransfer.setData("text", e.target.id);
            $log.info(e.target.id);
        }
        
        vm.drop = function(e) {
            e.preventDefault;
            var templateCode = Number(e.dataTransfer.getData("text").replace("E-", ""));
            var dropX = Math.floor(e.offsetX / canvasProperties.grid.columnSeparation) * canvasProperties.grid.columnSeparation;
            var dropY = Math.floor(e.offsetY / canvasProperties.grid.rowSeparation) * canvasProperties.grid.rowSeparation;
            console.log("Drop position (element " + templateCode + "): " + dropX  + ", " + dropY);
            
            for (var n = 0; n < vm.templateManager.genericElements.length; n++) {
                var template = vm.templateManager.genericElements[n];
                if (template.id === templateCode) {
                    drawElement(template, {left: dropX, top: dropY});
                }
            }
        }
        
        vm.allowDrop = function(e) {
            e.preventDefault();
        }
        
        function handleCanvasDoubleClick(event, data) {
            var activeObject = $scope.fabric.getCanvas().getActiveObject();
            if (activeObject.subtype === 'imagePlaceholder') {
                vm.imageLoad.options = {
                    top: activeObject.top,
                    left: activeObject.left,
                    width: activeObject.width,
                    height: activeObject.height,
                    snapToGrid: activeObject.snapToGrid,
                    hasControls: false,
                    lockMovementX: true, lockMovementY: true,
                    hoverCursor: "pointer",
                    usesPlaceholder: true
                };
                vm.selectFiles();
                console.log(event);
                console.log(data);
            }
        }
        
        $scope.$on('canvas:created:canvasY', function(event, data) {
            init('canvasY');
        });

        function restrictElementProperties() {
            var canvas = $scope.fabric.getCanvas();
            canvas.forEachObject(function(obj) {
                // any 'excluded from export' object is left out
                if (obj.get('excludeFromExport') === false) {
                    if (obj.get('type') === 'rect') {
                        obj.set({
                            hasRotatingPoint: false,
                            hasControls: false
                        });
                    } else {
                        obj.set({
                            hasRotatingPoint: false,
                            cornerSize: 6
                        });                    	
                    }
                }
            });
        }
        
        function setView(viewName) {
            vm.currentView = viewName;
            vm.templateShape = {};
            if (vm.currentView === 'header') {
                vm.ballotTemplateType = 'STATIC';
                vm.templateManager.fixedElements = ballotTemplateDesignerService
                    .getTemplateHeaderFixedElements($scope.fabric.grid.width);
            } else if (vm.currentView === 'footer') {
                vm.ballotTemplateType = 'STATIC';
                vm.templateManager.fixedElements = ballotTemplateDesignerService
                    .getTemplateFooterFixedElements($scope.fabric.grid.width);
            } else if (vm.currentView === 'instructions') {
                vm.ballotTemplateType = 'STATIC';
                vm.templateManager.fixedElements = [];
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
        
        vm.drawElement = drawElement;
        function drawElement(element, position) {
            $log.info("Element with id " + element.id + " is selected: " + element.selected);
            if (element.selected === undefined || element.selected) {
                let componentsIds = [];
                vm.lastAddedObjectId = element.id;
                // add element to canvas
                var components = element.components;
                for (let n = 0; n < components.length; n++) { 
                    componentsIds.push(drawFabricElementNew(components[n], position));
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
                restrictElementProperties();
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
        
        function drawFabricElementNew(element, position) {
            var elementType = element.ctype;
            let options = angular.extend({hasRotatingPoint: false, cornerSize: 6, customId: element.id}, element);
            if (position) {
//                options = angular.extend({left: position.left, top: position.top, 
//                    hasRotatingPoint: false, cornerSize: 6, customId: element.id}, element);
                options.left = position.left;
                options.top = position.top;
            }
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
                    if (position) {
                        vm.imageLoad.options = position;
                    }
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
        
        vm.setTextColor = function(colorSelectorId) {
            $(colorSelectorId).click();
        };
        
        vm.insertVariable = function(v) {
            let activeObject = $scope.fabric.getCanvas().getActiveObject();
            if (activeObject && activeObject.type === 'textbox') {
                if (!activeObject.isEditing) {
                    activeObject.enterEditing();
                    activeObject.hiddenTextarea.focus();
                }
                let t = activeObject.text;
                let newString = t.slice(0, activeObject.selectionStart) + v + t.slice(activeObject.selectionEnd);
                activeObject.set({
                    text: newString,
                    selectionStart: (activeObject.selectionStart + v.length),
                    selectionEnd: (activeObject.selectionStart + v.length)
                    });
                activeObject._updateTextarea();
                $scope.fabric.getCanvas().renderAll();
                activeObject.enterEditing();
                activeObject.hiddenTextarea.focus();
                
                activeObject.textBeforeEvents = newString;
            }
        }
        
        /**
         * Finds out if a ballot template variable has been removed
         * @param o
         */
        function handleVariableRemoval(o) {
            if (!o.textBeforeEvents) {
                o.textBeforeEvents = o._textBeforeEdit;
            }

            let originalString = o.textBeforeEvents;
            let modifiedString = o.text;

            let differenceFoundAtPos = -1;
            for (let n = 0; n < originalString.length && differenceFoundAtPos === -1; n++) {
                if (originalString[n] !== modifiedString[n]) {
                    differenceFoundAtPos = n;
                }
            }

            // if a ending bracket '}' has been removed (from a valid variable), then
            // reset the string to his previous contents
            if (differenceFoundAtPos !== -1) {
                let removedChar = originalString[differenceFoundAtPos];
                let baseString = modifiedString.slice(0, differenceFoundAtPos);
                if (removedChar === '}' && stringHasValidOpeningBracketForVariable(baseString)) {
                    o.set({
                        text: originalString,
                        selectionStart: differenceFoundAtPos + 1,
                        selectionEnd: differenceFoundAtPos + 1,
                    })
                    modifiedString = originalString;
                }
            }

            o.textBeforeEvents = modifiedString;
        }
        
        function highlightTemplateVariable(o) {
            // get a base position to split the string into two pieces
            let pos = o.selectionStart;
            if (o.selectionStart !== o.selectionEnd) {
                if (o.text.charAt(o.selectionStart) === '$') {
                    pos = o.selectionEnd;
                }
            }

            let leftPart = o.text.slice(0, pos);
            let rightPart = o.text.slice(pos);
            let startingPos = leftPart.lastIndexOf('$');
            let endingPos = rightPart.indexOf('}');

            if (stringHasValidOpeningBracketForVariable(leftPart) &&
                    stringHasValidClosingBracketForVariable(rightPart)) {
                o.set({
                    selectionStart: startingPos,
                    selectionEnd: (leftPart.length + endingPos + 1)
                });
            }
        }
        
        function stringHasValidOpeningBracketForVariable(data) {
            let response = false;
            let a = data.lastIndexOf('$');
            let b = data.lastIndexOf('}');

            if (a !== -1) {
                if (b === -1 || a > b) {
                    response = true;
                }
            }

            return response;
        }
        
        function stringHasValidClosingBracketForVariable(data) {
            let response = false;
            let a = data.indexOf('}');
            let b = data.indexOf('${');

            if (a !== -1) {
                if (b === -1 || a < b) {
                    response = true;
                }
            }

            return response;
        }
        
        function showModalInformation(title, message) {
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
            
            return modalInstance.result;
        }
        
        function showModalConfirmation(title, message) {
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
            
            return modalInstance.result;
        }
        
        function bindContextMenu() {
            $(".upper-canvas").bind('contextmenu', function(ev) {
                var pointer = $scope.fabric.getCanvas().getPointer(ev.originalEvent);
                var objects = $scope.fabric.getCanvas().getObjects();
                for (var i = objects.length - 1; i >= 0; i--) {
                    if (objects[i].containsPoint(pointer)) {
                        $log.info("clicked canvas obj");
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
