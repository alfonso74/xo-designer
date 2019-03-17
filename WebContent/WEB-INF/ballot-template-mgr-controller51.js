
//var vmScope = {};

(function() {
    'use strict';

    angular.module('ballotTemplateDesigner').controller('ballotTemplateDesignerController', BallotTemplateDesignerController);
    
    BallotTemplateDesignerController.$inject = ['ballotTemplateDesignerService', 'fabric', 'fabricConstants', '$scope', 
        '$uibModal',
        '$log',
        '$timeout',
        '$window'];
    
    function BallotTemplateDesignerController(ballotTemplateDesignerService, fabric, fabricConstants, $scope, 
            $uibModal, $log, $timeout, $window) {
        
        var vm = this;
        
        vm.contest = false;
        
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
        
        const canvasProperties = fabricConstants.canvasDefaults;
        const gridSpacing = canvasProperties.grid.rowSeparation;
        
        vm.gridSpacing = 25;
        
        vm.searchAdapter = {
            typeProperty: 'name',
            nameProperty: 'name',
            onRefresh: function(text, callback) {
                return null;
            },
            onSearch: function(elements) {
                //TODO
            }
        };
        
        // inicializar al cargar/crear templates
        vm.template = {
    		hasInstructions: true,
    		hasWriteIn: true
        };
        
        vm.currentView = 'main';
        vm.currentPageSize = fabricConstants.pageSizes[0];
        vm.currentOrientation = 'Portrait';
        
        vm.shape = {};
        vm.pageSizes = fabricConstants.pageSizes;
        vm.fontFamilies = fabricConstants.fonts;
        vm.fontSizes = fabricConstants.fontSizes;
        vm.markTypes = fabricConstants.markTypes;
        
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
        
        vm.templateTypes = [{name: 'CONTEST'},
            {name: 'INTERNAL'},
            {name: 'ISSUE'},
            {name: 'STATIC'},
            {name: 'STRAIGHT_PARTY'}];
        vm.ballotTemplates = [];
        vm.defaultBallotTemplates = ballotTemplateDesignerService.getDefaultTemplatesDefinition();
        
        vm.selectedBallotTemplate = null;
        
        vm.ballotTemplateType = 'NONE';
        
        vm.imageLoadUrl = null;
        vm.imageLoad = {
            url: null,
            options: {}
        };
        
        vm.clearCanvas = clearCanvas;
        vm.resizeCanvas = resizeCanvas;
        vm.deleteCanvasObject = deleteCanvasObject;
        vm.refreshTemplateInCanvas = refreshTemplateInCanvas;
        vm.ungroup = ungroup;
        
        vm.readUrl = readUrl;
        vm.readUrlAsync = readUrlAsync;
        vm.addImageOnCanvas = addImageOnCanvas;
        vm.removeUploadImageData = removeUploadImageData;
        
        vm.clearLocalStorage = clearLocalStorage;
        vm.selectObject = selectObject;
        vm.saveTemplate = saveTemplate;
        vm.loadBallotTemplateAction = loadBallotTemplateAction;
        vm.loadBallotTemplates = loadBallotTemplates;
        vm.loadBallotTemplate = loadBallotTemplate;
        vm.deleteBallotTemplateAction = deleteBallotTemplateAction;
        vm.deleteBallotTemplate = deleteBallotTemplate;
        
        vm.toggleMarkType = toggleMarkType;
        vm.toggleBold = toggleBold;
        vm.toggleItalic = toggleItalic;
        vm.toggleUnderline = toggleUnderline;
        vm.setTextAlignment = setTextAlignment;
        
        vm.drawTemplate = drawTemplate;
        
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
            const data = ballotTemplateDesignerService.getBallotTemplatesTableData(function(tableData) {
                vm.tableAdapter.sspTableViewOptions.data = tableData;
            });
        }
        
        /** Image handling functions */
        
        function readUrl(event) {
            console.log("Executing readUrl...");
            if (event.target.files && event.target.files[0]) {
                var reader = new FileReader();
                reader.onload = (event) => {
                    vm.imageLoadUrl = event.target['result'];
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
                        vm.imageLoadUrl = event.target['result'];
                        addImageOnCanvas(vm.imageLoadUrl, vm.imageLoad.options);
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
                vm.imageLoadUrl = '';
                vm.imageLoad.url = '';
                vm.imageLoad.options = {};
                /*
                fabric.Image.fromURL(url, (image) => {
                    image.set({
                        left: 10,
                        top: 10,
                        angle: 0,
                        padding: 10,
                        cornersize: 10,
                        hasRotatingPoint: true
                    });
                    image.setWidth(200);
                    image.setHeight(200);
                    this.extend(image, this.randomId());
                    this.canvas.add(image);
                    this.selectItemAfterAdded(image);
                });
                */
            }
        }
        
        function removeUploadImageData(url) {
            vm.imageLoadUrl = '';
        };
        
        /** Common functions */
        
        function refreshTemplateInCanvas(name) {
            $scope.fabric.getCanvas().forEachObject(function(obj) {
                if (obj.name === name) {
                    $scope.fabric.getCanvas().setActiveObject(obj);
                    $scope.fabric.selectActiveObject();
//                    $scope.$apply();
                }
            });
            $scope.fabric.deselectActiveObject();
            $scope.fabric.getCanvas().deactivateAll();
        }
        
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
            
            changeView(vm.currentView);
        }
        
        function deleteCanvasObject() {
            $scope.fabric.deleteActiveObject();
            vm.shape = null;
        }
        
        function ungroup() {
            var group = $scope.fabric.getCanvas().getActiveObject();
//            group.destroy();
            var items = group._objects;
            group._restoreObjectsState();
            $scope.fabric.getCanvas().remove(group);
            for(var i = 0; i < items.length; i++) {
                $scope.fabric.getCanvas().add(items[i]);
            }
        }
        
        vm.testSomething = testSomething;
        function testSomething() {
            ballotTemplateDesignerService.testHash('5737b3f').
            then(function(response) {
                $log.info("Response: " + response);
                $log.info("Response data: " + response.data);
            });
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
        
        function loadBallotTemplateAction() {
            loadBallotTemplates();
            loadBallotTemplateActionValidation(function(result) {
                if (result) {
                    angular.element('#load-ballot-template-modal').modal('show');
                }
            });
        }
        
        function loadBallotTemplateActionValidation(callback) {
            if (canvasIsDirty()) {
                showModalConfirmation("Ballot template validation", "There are unsaved changes.  Are you sure you want " +
                        "to load a ballot template?", function(result) {
                    if (result) {
                        callback(true);
                    } else {
                        callback(false);
                    }
                });
            } else {
                callback(true);
            }
        }
        
        function deleteBallotTemplateAction() {
            loadBallotTemplates();
//            angular.element('#delete-ballot-style-modal').modal('show');
        }
        
        /**
         * Deletes a ballot template definition (in JSON format) identified by the
         * indicated ballot template code.
         */
        function deleteBallotTemplate(ballotTemplateCode) {
            if (ballotTemplateCode) {
                if (usingLocalStorage) {
                    deleteBallotTemplateLocal(ballotTemplateCode);
                } else {
                    var ballotTemplateName = vm.selectedBallotTemplate.name;
                    ballotTemplateDesignerService.deleteBallotTemplate(ballotTemplateCode).
                    then(function(response) {
                        if (response.status === 200) {
                            $log.info('Deleted ballot template with code: ' + ballotTemplateCode);
                            showModalInformation("Delete ballot template", 
                                    "The ballot template '" +  ballotTemplateName + "' has been deleted.");
                        }
                    });
                }
                vm.selectedBallotTemplate = null;
            }
        }
        
        /**
         * Deletes a ballot template definition (in json format) from the
         * web browser local storage.
         * Returns '1' if a ballot template with the indicated code has been
         * removed, or '0' if the ballot template was not found.
         */
        function deleteBallotTemplateLocal (ballotTemplateCode) {
            $log.info("Deleting ballot template with code: " + ballotTemplateCode);
            
            var result = 0;
            
            var localTemplates = localStorage.getItem('ballotOptions');
            if (localTemplates) {
                var ballotTemplates = JSON.parse(localTemplates);
                $log.info("Ballot templates found: " + ballotTemplates.length);
                var removeAtIndex = -1;
                for (var n = 0; n < ballotTemplates.length; n++) {
                    if (ballotTemplates[n].code === ballotTemplateCode) {
                        removeAtIndex = n;
                    }
                }
                if (removeAtIndex !== -1) {
                    var ballotTemplateName = ballotTemplates[removeAtIndex].name;
                    ballotTemplates.splice(removeAtIndex, 1);
                    result = 1;
                    
                    // Update the local storage to remove the selected object
                    localStorage.setItem('ballotOptions', JSON.stringify(ballotTemplates));
                    showModalInformation("Delete ballot template", 
                            "The ballot template '" +  ballotTemplateName + "' has been deleted.");
                }
            }

            return result;
        }
        
        function saveTemplate() {
            if (!vm.ballotTemplateName || vm.ballotTemplateName === '') {
                /*
                vm.shape = null;
                $scope.fabric.deselectActiveObject();
                vm.fieldFocus('ballotTemplateName');
                */
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
        
        /**
         * Gets the ballot templates list (including the json definition) 
         */
        function loadBallotTemplates() {
            vm.ballotTemplates = [
                {'name': 'Loading ballot templates...', 'code': -1, 'definition': '{}'}
            ];
            if (usingLocalStorage) {
                loadBallotTemplatesLocal();
            } else {
                ballotTemplateDesignerService.getBallotTemplatesList().
                success(function(data, status) {
                    if (data.data) {
                        $log.info("Templates loaded: " + data.data.length);
                        vm.ballotTemplates = data.data;
                    } else {
                        $log.info("No ballot templates were found (remote data)");
                        vm.ballotTemplates = [
                            {'name': 'No ballot templates found in database', 'code': -1, 'definition': '{}'}
                        ];
                    }
                }).
                error(function(data, status) {
                    console.log('Error: ' + status);
                });
            }
        }
        
        /**
         * Used by the 'load-ballot-template-modal' to load the user
         * selected ballot template.
         */
        function loadBallotTemplate(templateCode) {
            /*
            if (usingLocalStorage) {
                loadBallotTemplateLocal(templateCode);
            } else {
                $log.info('Loading ballot template with code: ' + templateCode);
                ballotTemplateDesignerService.getBallotTemplate(templateCode).
                then(function(response) {
                    if (response.data) {
                        let ballotTemplate = response.data.data;
                        console.log("Response data data length: " + ballotTemplate.length);
                        loadJsonIntoCanvas(ballotTemplate.definition);
                        fixMarkersSize();
                        $scope.fabric.getCanvas().renderAll();
                    }
                    
                });
            }
            vm.selectedBallotTemplate = null;
            */
            if (vm.ballotTemplates) {
                var found = false;
                for (var n = 0; n < vm.ballotTemplates.length && !found; n++) {
                    if (vm.ballotTemplates[n].code === templateCode) {
                        found = true;
                    }
                }
                if (found) {
                    loadJsonIntoCanvas(vm.ballotTemplates[n-1].definition);
                    fixMarkersSize();
                    $scope.fabric.getCanvas().renderAll();
                    $log.info("BALLOT TEMPLATE DEFINITION: " + vm.ballotTemplates[n-1].definition);
                    vm.ballotTemplateType = vm.ballotTemplates[n-1].type;
                    vm.template.width = 200;
                }
            }
            vm.selectedBallotTemplate = null;
        }
        
        /**
         * Stores info about the ballot template that has been selected by the
         * end user in a modal dialog.
         */
        function selectObject(object) {
            vm.selectedBallotTemplate = object;
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
        
        function loadBallotTemplatesLocal() {
            var retrievedObject = localStorage.getItem('ballotOptions');
            console.log('retrievedObject: ', JSON.parse(retrievedObject));
            vm.ballotTemplates = JSON.parse(retrievedObject);
            
            if (vm.ballotTemplates) {
                for (var n = 0; n < vm.ballotTemplates.length; n++) {
                    console.log("Template name: " + vm.ballotTemplates[n].name);
                }
            } else {
                vm.ballotTemplates = [
                    {'name': 'No local templates found', 'code': -1, 'definition': '{}'}
                ];
            }
        }
        
        function loadBallotTemplateLocal(templateCode) {
            var found = false;
            var retrievedObject = localStorage.getItem('ballotOptions');
            if (!retrievedObject) {
                retrievedObject = [];
            } else {
                var ballotOptionTemplates = JSON.parse(retrievedObject);
                for (var n = 0; n < ballotOptionTemplates.length && !found; n++) {
                    if (ballotOptionTemplates[n].code === templateCode) {
                        found = true;
                    }
                }
                if (found) {
                    loadJsonIntoCanvas(ballotOptionTemplates[n-1].definition);
                    fixMarkersSize();
                    $scope.fabric.getCanvas().renderAll();
                    $log.info("BALLOT TEMPLATE DEFINITION: " + ballotOptionTemplates[n-1].definition);
                }
            }
        }
        
        /**
         * When loading objects from a JSON definition into the canvas, Fabric
         * doesn't restore the width and height properties for objects with
         * type circle, ellipse and polygon, so we need to 'restore' the size
         * to show the object centered in the grid.
         */
        function fixMarkersSize() {
            var canvasObjects = $scope.fabric.getCanvas().getObjects();
            for (var i = 0; i < canvasObjects.length; i++) {
                if (canvasObjects[i].type === 'group') {
                    restoreSizeForMarkersWithinGroup(canvasObjects[i]);
                }
            }
        }
        
        /**
         * For any object with subtype 'mark', the width and height properties
         * are set to the grid spacing value.
         * If the object is a group, then make a recursive call to check for
         * objects with subtype 'mark' and fix the height/width values.
         */
        function restoreSizeForMarkersWithinGroup(group) {
            var groupObjects = group.getObjects();
            for (var i = 0; i < groupObjects.length; i++) {
                $log.debug('Type: ' + groupObjects[i].type + ', subtype: ' + groupObjects[i].subtype + ", id: " + groupObjects[i].id);
                if (groupObjects[i].type === 'group') {
                    restoreSizeForMarkersWithinGroup(groupObjects[i]);
                } else if (groupObjects[i].subtype === 'mark') {
                    groupObjects[i].width = gridSpacing;
                    groupObjects[i].height = gridSpacing;
                }
            }
        }

        function loadJsonIntoCanvas(json) {
            var fabricJson = JSON.parse('{"objects":[' + json + '],"background":""}');

            var objects = fabricJson.objects;
            for (var i = 0; i < objects.length; i++) {
                var klass = $scope.fabric.getKlass(objects[i].type);
                if (klass.async) {
                    klass.fromObject(objects[i], function (img) {
                        img.set({hasRotatingPoint: false, cornerSize: 6,});
                        $scope.fabric.getCanvas().add(img);
                    });
                } else {
                    $scope.fabric.getCanvas().add(klass.fromObject(objects[i]));
                }
            }
            var templateGroup = null;
            $scope.fabric.getCanvas().forEachObject(function(obj) {
             // any 'excluded from export' object is left out
                if (obj.get('excludeFromExport') === false) {
                    templateGroup = obj;
                }
            });
            if (templateGroup != null) {
                var items = templateGroup._objects;
                templateGroup._restoreObjectsState();
                $scope.fabric.getCanvas().remove(templateGroup);
                for(var i = 0; i < items.length; i++) {
                    $scope.fabric.getCanvas().add(items[i]);
                }
                restrictElementProperties();
            }
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
            
            replacePlaceholderObjects();
            
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
        
        function init() {
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
                
                $scope.fabric.getCanvas().on('text:changed', function(e) {
                    var element = e.target;
                    console.log("Event: " + e);
                    console.log("Changed: " + element);
                });
                
                bindContextMenu();
            }
            
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
        };
        
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
            } else if (activeObject.subtype === 'pageArea') {
            	editTemplateArea(activeObject);
            }
                        
        }
        
        function editTemplateArea(templateArea) {
        	templateArea.isBeingEdited = true;
//            drawTemplateIntoCanvas(currentTemplate);
//        	openHeaderDesigner();
        	showModalInformation("Design area", 
                    "Open the template designer (WIP)...");
        }
        
        function openHeaderDesigner(fabricObject) {
            var templateSupportsWriteIn = templateHasWriteInSection(fabricObject.templateCode);
            var modalInstance = $uibModal.open({
                templateUrl: baseTemplateUrl + 'views/dialogs/headerDesigner.html',
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
                    /*
                    template: function() {
                      return fabricObject;
                    },
                    writeInSupport: function() {
                        return templateSupportsWriteIn;
                    }
                    */
                }
            });

            modalInstance.result.then(function(userSelections) {
                $log.info("User selections: " + JSON.stringify(userSelections));
                
                if (true) {
                	// ok
                } else {
                    vm.errorMessage = "The contest class '" + 
                        userSelections.contestClass.name + "' is already " +
                        "associated to another template in this ballot style.";
                    $('#validation-modal').modal('show');
                }
                
            }, function() {
                $scope.fabric.setDirty(false);
            });
        };

        $scope.$on('canvas:created', init);
        
        $scope.$on('canvas:doubleClick', function(event, data) {
            handleCanvasDoubleClick(event, data)
        });
        
        vm.drawHeader = drawHeader;
        function drawHeader(data) {
            clearCanvas();
            var components = data.components;
            for (let n = 0; n < components.length; n++) {
                drawFabricElement(components[n]);
            }
            $scope.fabric.addImageBase64(baseTemplateUrl + "images/qr154.png", {
                top: 0,
                left: 0,
                width: 75,
                height: 75,
                hoverCursor: "not-allowed",
                hasRotatingPoint: false,
                hasControls: false,
                lockMovementX: true, 
                lockMovementY: true
            });
        }
        
        function drawTemplate(data) {
            clearCanvas();
            if (data.value === 'contestTemplate') {
                vm.contest = true;
            } else {
                vm.contest = false;
            }
            var components = data.components;
            for (let n = 0; n < components.length; n++) {
                drawFabricElement(components[n]);
            }
            restrictElementProperties();
        }
        
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
        
        vm.toggleInstructions = toggleInstructions;
        function toggleInstructions() {
            if (vm.template.hasInstructions) {
                addInstructionsToTemplate();
            } else {
                removeBallotOptionFromTemplate('instructions');
            }
        }

        vm.toggleWriteIn = toggleWriteIn;
        function toggleWriteIn() {
            if (vm.template.hasWriteIn) {
                addWriteInToTemplate();
            } else {
                removeBallotOptionFromTemplate('writeIn');
            }
        }

        function addInstructionsToTemplate() {
            var components = [
                {ctype: 'rect', left: 0, top: gridSpacing * 1, width: gridSpacing * 8, height: gridSpacing * 1, fill: "#CAE4FF", subtype: "instructions"},
                {ctype: 'textbox', left: 2, top: (gridSpacing * 1) + 5, width: gridSpacing * 8 - 3, fontSize: 12, text: 'Vote for ${contest.maxVotes}'}
                ];
            for (let n = 0; n < components.length; n++) {
                drawFabricElement(components[n]);
            }
            restrictElementProperties();
        }

        function addWriteInToTemplate() {
            var components = [
                {ctype: 'rect', left: 0, top: gridSpacing * 4, width: gridSpacing * 8, height: gridSpacing * 2,	fill: "#FFFFFF", subtype: "writeIn"},
                {ctype: 'mark', left: 0, top: gridSpacing * 4, width: gridSpacing, height: gridSpacing, subtype: "mark", markStyle: "Oval"},
                {ctype: 'textbox', left: (gridSpacing * 1) + 2, top: gridSpacing * 4 + 5, width: gridSpacing * 7 - 3, fontSize: 14, text: 'or write-in:'},
                {ctype: 'separationLine', left: gridSpacing, top: gridSpacing * 6 - 5, width: gridSpacing * 7, 
                    stroke: "rgb(0,0,0)", strokeWidth:1, subtype: "separationLine"}
                ];
            for (let n = 0; n < components.length; n++) {
                drawFabricElement(components[n]);
            }
            restrictElementProperties();
        }

        function removeBallotOptionFromTemplate(subtype) {
            var canvas = $scope.fabric.getCanvas();

            var ballotTemplateObjects = [];

            var ballotOptionToDelete = null;
            canvas.forEachObject(function(obj) {
             // any 'excluded from export' object is left out
                if (obj.get('excludeFromExport') === false) {
                    ballotTemplateObjects.push(obj);
                    if (obj.get('subtype') === subtype) {
                        ballotOptionToDelete = obj; 
                    }
                }
            });

            if (ballotOptionToDelete) {
                removeItemsFromCanvas(ballotTemplateObjects, ballotOptionToDelete, subtype);
            }

            $scope.fabric.getCanvas().renderAll();
        }
        
        function removeItemsFromCanvas(tmpArray, ballotOption, subType) {
            var elementsToDelete = [];
            for (let n = 0; n < tmpArray.length; n++) {
                if (rectIsContained(tmpArray[n].getBoundingRect(), ballotOption.getBoundingRect())
                        || tmpArray[n].subtype === subType) {
                    $scope.fabric.getCanvas().remove(tmpArray[n]);
                }
            }
        }
        
        /*
        hoverCursor: "not-allowed",
        hasRotatingPoint: false,
        hasControls: false,
        selectable: false
        */
        function drawFabricElement(data) {
            var elementType = data.ctype;
            if (elementType === 'text') {
                var textValue = data.text || 'TYPE_02';
                let options = angular.extend({hasRotatingPoint: false, cornerSize: 6}, data);
                $scope.fabric.addText(textValue, options);
                $log.info("Text OPTIONS: " + JSON.stringify(options));
            } else if (elementType === 'textbox') {
                var textValue = data.text || 'TYPE_02';
                let options = angular.extend({hasRotatingPoint: false, cornerSize: 6}, data);
//                let options = angular.extend({hasControls: false, selectable: false}, data);
                $scope.fabric.addTextBox(textValue, options);
            } else if (elementType === 'image') {
                $log.info("Adding image!!!");
                let options = angular.extend({hasRotatingPoint: false, cornerSize: 6}, data);
                $scope.fabric.addImage(data.renderOptions.imageUrl, options);
            } else if (elementType === 'mark') {
                $log.info("Adding ballot option mark!!!");
                let options = angular.extend({hasRotatingPoint: false, cornerSize: 6, fill: 'rgba(0,0,0,0)',
                    stroke: 'black', strokeWidth: 1, hoverCursor: 'not-allowed',  
                    hasControls: false, lockMovementX: true, lockMovementY: true}, data);
                $scope.fabric.addOptionMark(options);
            } else if (elementType === 'separationLine') {
                let options = angular.extend({hasRotatingPoint: false, cornerSize: 6}, data);
                $scope.fabric.addLine([0, 0, data.width, 0], options);
            } else {
                let options = angular.extend({}, fabricConstants.rectDefaults, data);
                var object = $scope.fabric.addRect(options);
                $log.info("Rect OPTIONS: " + JSON.stringify(options));
            }
        }
        
        vm.changeView = changeView;
        function changeView(viewName) {
            $scope.fabric.getCanvas().remove(vm.restrictedAreaObject);
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
                let pageColumns = 3;
                let spColumns = 1;
                
                let restrictedArea = createSpecialInstRestrictedAreaRectangle(pageColumns, spColumns);
                vm.restrictedAreaObject = restrictedArea;
            } else if (vm.currentView === 'contest') {
                vm.ballotTemplateType = 'CONTEST';
                vm.templateManager.fixedElements = [];
                vm.drawElement(ballotTemplateDesignerService
                        .getDefaultTemplatesDefinition()[0]);
                $scope.fabric.getCanvas().deactivateAll();
                vm.templateShape.newWidthInColumns = vm.templateShape.titleContainer.width / 25;
            } else if (vm.currentView === 'pageNavigation') {
                vm.ballotTemplateType = 'INTERNAL';
                vm.templateManager.fixedElements = [];
                vm.drawElement(ballotTemplateDesignerService
                    .getPageNavigationFixedElements()[0]);
                $scope.fabric.getCanvas().deactivateAll();
                vm.templateShape.newWidthInColumns = vm.templateShape.templateContainer.width / 25;
            } else {
                
            }
        }
        
        function createSpecialInstRestrictedAreaRectangle(pageColumns, spColumns) {
            let spColumnWidth = $scope.fabric.grid.width / pageColumns * spColumns; 
            let options = {
                    left: spColumnWidth + 1, top: 0,
                    width: $scope.fabric.grid.width - spColumnWidth + 1, height: $scope.fabric.grid.height,
                    fill: "#E0E0E0", opacity: 0.5, selectable: false, excludeFromExport: true
            };
            let object = $scope.fabric.addRect(options);
            $scope.fabric.deselectActiveObject();

            return object;
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
        
        $scope.$on('save.ballot.template', listenSaveBallotTemplate);
        
        function listenSaveBallotTemplate($event, message) {
            console.log('Received message: ' + message);
            vm.ballotTemplateName = message.name;
            saveTemplate();
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
                callback(userSelections);
            }, function() {
                //action on popup dismissal
                callback(null);
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
//Please note that $uibModalInstance represents a modal window (instance) dependency.
//It is not the same as the $uibModal service used above.

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
