/**
 * ballot-designer-app.js
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
 * Ballot template designer controller and support services.
 *
 * @author carlos.perez
 */
(function (angular) {
    'use strict';

    const module = angular.module('ballotTemplateDesigner', ['ui.bootstrap', 'ngSanitize', 'ems.fabric']);

})(angular);


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
        
        const optionDesignerCustomProperties = ['id', 'subtype'];
        
        const canvasProperties = fabricConstants.canvasDefaults;
        const gridSpacing = canvasProperties.grid.rowSeparation;
        
        vm.gridSpacing = 25;
        
        vm.dummyTotalBallotTemplates = 0;
        
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
        vm.fontStyles = [{name: 'normal'},
            {name: 'italic'},
            {name: 'oblique'}];
        vm.lineTypes = [
            {name: 'Continuous', strokeDashArray: null},
            {name: 'Dashed', strokeDashArray: [4,4]}
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
        
        vm.clearCanvas = clearCanvas;
        vm.resizeCanvas = resizeCanvas;
        vm.deleteCanvasObject = deleteCanvasObject;
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
        
        vm.drawTemplate = drawTemplate;
        
        vm.alert = function(message) {
            console.log("ALERT message: " + message);
        }
        
        function getStorageLocation() {
            if (!window.location.href.startsWith('file')) {
                usingLocalStorage = false;
                baseTemplateUrl = 'ballot-template-manager/';
            }
            console.log("Using local storage: " + usingLocalStorage);
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
                    });
                }
                reader.readAsDataURL(event.target.files[0]);
            }
        }
        
        vm.addImageOnCanvas = addImageOnCanvas;
        function addImageOnCanvas(url) {
            if (url) {
                $log.info("Adding image!!!");
                $scope.fabric.addImageBase64(url, {
                    width: 200,
                    height: 200,
                    left: 10,
                    top: 10,
                    angle: 0,
                    cornerSize: 6,
                    hasRotatingPoint: false
                });
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
        
        function toggleBold() {
            if (vm.shape.fontWeight === 'bold') {
                vm.shape.fontWeight = 'normal';
            } else {
                vm.shape.fontWeight = 'bold';
            }
        }
        
        function toggleItalic() {
            if (vm.shape.fontStyle === 'italic') {
                vm.shape.fontStyle = 'normal';
            } else {
                vm.shape.fontStyle = 'italic';
            }
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
                "The ballot template '" + vm.ballotTemplateName + "' has been saved successfully.");
        }
        
        function saveTemplateJson(ballotTemplateAsGroup) {
            ballotTemplateDesignerService.saveBallotTemplate(vm.ballotTemplateName, 
                    vm.ballotTemplateType, 
                    JSON.stringify(ballotTemplateAsGroup.toObject(optionDesignerCustomProperties))).
            success(function(data, status) {
                $log.info("Ballot template saved successfully");
//                $('#save-confirmation-modal').modal('show');
                //TODO: if the showModalInformation works ok, remove the #save-confirmation-modal from the html
                showModalInformation("Save ballot template", 
                    "The ballot template has been saved successfully.");
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
                // any non selectable object is left out
                if (obj.get('selectable') === true) {
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
            var canvas = $scope.fabric.getCanvas();
            canvas.forEachObject(function(obj) {
                // any non selectable object is left out
                if (obj.get('selectable') === true) {
                    if (obj.get('type') === 'rect') {
                        vm.template.width = Math.round(vm.template.width / 25) * 25;
                        obj.set({width: vm.template.width});
                    }
                }
            });
            $scope.fabric.getCanvas().renderAll();
        }
        
        function createBallotTemplateGroup() {
            var canvas = $scope.fabric.getCanvas();
            
            var ballotTemplateObjects = [];
            
            var isStaticTemplate = vm.ballotOptionType === 'STATIC';
            
            var ballotOption = null;
            var writeIn = null;
            canvas.forEachObject(function(obj) {
                // any non selectable object is left out
                if (obj.get('selectable') === true) {
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
            
            if (!isStaticTemplate) {
                addContestBorders(ballotTemplateGroup);
            }
            
            ballotTemplateGroup._calcBounds(true);
            
            canvas._activeObject = null;
            
            $log.info("Ballot template group: " + JSON.stringify(ballotTemplateGroup.toObject(optionDesignerCustomProperties)));
            
            return ballotTemplateGroup;
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
            }
            
            resizeCanvas(vm.currentPageSize, vm.currentOrientation);
            
//            $scope.fabric.createGrid(canvasWidth / gridColumnsWidth, 
//                    canvasHeight / gridRowsHeight, 
//                    gridColumnsWidth, gridRowsHeight);
            
            vm.ballotOptionCode = Math.floor(Math.random() * 10000) + 1;
            vm.shape = {};
            vm.contest = false;
            vm.template.width = 200;

            $scope.fabric.deselectActiveObject();
        };

        $scope.$on('canvas:created', init);
        
        vm.drawHeader = drawHeader;
        function drawHeader(data) {
            clearCanvas();
            var components = data.components;
            for (let n = 0; n < components.length; n++) {
                drawFabricElement(components[n]);
            }
            $scope.fabric.addImage(baseTemplateUrl + "images/qr154.png", {
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
                // any non selectable object is left out
                if (obj.get('selectable') === true) {
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
                // any non selectable object is left out
                if (obj.get('selectable') === true) {
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
        
        function showModalInformation(title, message) {
            var modalInstance = $uibModal.open({
                templateUrl: baseTemplateUrl + 'views/designer/modalInfoDialog.html',
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
            }, function() {
                //action on popup dismissal
            });
        }
        
        function showModalConfirmation(title, message, callback) {
            var modalInstance = $uibModal.open({
                templateUrl: baseTemplateUrl + 'views/designer/modalDialog.html',
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

(function(){

    var injectParams = ['$http', '$q', '$timeout'];

    var ballotTemplateDesignerService = function ($http, $q, $timeout) {
        
        const gridSpacing = 25;
        
        const baseUrl = '/vvsg/rest/ballot-designer/';
        
        
        this.getContestClasses = function() {
            return $http({
                url : baseUrl + 'contestClass',
                method : 'GET',
                params : {}
            });
        };
        
        this.getBallotTemplatesList = function() {
            return $http({
                url: baseUrl + 'ballot/templates',
                method : 'GET',
                params : {}
            });
        }
        
        this.getBallotTemplate = function(templateCode) {
            return $http({
                url: baseUrl + 'ballot/templates/' + templateCode,
                method : 'GET'
            });
        }
        
        this.saveBallotTemplate = function(name, type, definition) {
            return $http({
                url: baseUrl + 'ballot/templates',
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                data : definition,
                params: {
                    name: name,
                    type: type
                }
            })
        }
        
        this.deleteBallotTemplate = function(ballotTemplateCode) {
            return $http({
                url: baseUrl + 'ballot/templates/' + ballotTemplateCode,
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json'
                }
            })
        }
        
        this.getDefaultTemplatesDefinition = function() {
            let n = 1;
            const definitions = [
                {
                    "id"              : n++,
                    "name"            : "Contest template",
                    "value"           : "contestTemplate",
                    "src"             : "http://placehold.it/32x32/F7D08A",
                    "components"   : [
                        {ctype: 'rect', left: 0, top: 0, width: gridSpacing * 8, height: gridSpacing * 1, fill: "#EBEBEB"},
                        {ctype: 'rect', left: 0, top: gridSpacing * 1, width: gridSpacing * 8, height: gridSpacing * 1, 
                            fill: "#CAE4FF", subtype: "instructions"},
                        {ctype: 'rect', left: 0, top: gridSpacing * 2, width: gridSpacing * 8, height: gridSpacing * 2,
                            fill: "#FFFFFF", subtype: "ballotOption"},
                        {ctype: 'rect', left: 0, top: gridSpacing * 4, width: gridSpacing * 8, height: gridSpacing * 2, 
                            fill: "#FFFFFF", subtype: "writeIn"},
                        {ctype: 'textbox', left: 2, top: 5, width: gridSpacing * 8 - 3, fontSize: 12, fontWeight: 'bold', text: '${contest.name}'},
                        {ctype: 'textbox', left: 2, top: (gridSpacing * 1) + 5, width: gridSpacing * 8 - 3, fontSize: 12, text: 'Vote for ${contest.maxVotes}'},
                        {ctype: 'mark', left: 0, top: gridSpacing * 2, width: gridSpacing, height: gridSpacing, subtype: "mark", markStyle: "Oval"},
                        {ctype: 'textbox', left: (gridSpacing * 1) + 2, top: gridSpacing * 2 + 5, width: gridSpacing * 7 - 3, fontSize: 14, text: '${nomination.name}'},
                        {ctype: 'textbox', left: (gridSpacing * 1) + 2, top: gridSpacing * 3, width: gridSpacing * 7 - 3, fontSize: 12, text: '${party.name}'},
                        {ctype: 'separationLine', left: gridSpacing, top: gridSpacing * 4 - 5, width: gridSpacing * 7, 
                            stroke: "rgb(0,0,0)", strokeWidth:1, padding:2, subtype: "separationLine"},
                        {ctype: 'mark', left: 0, top: gridSpacing * 4, width: gridSpacing, height: gridSpacing, subtype: "mark", markStyle: "Oval"},
                        {ctype: 'textbox', left: (gridSpacing * 1) + 2, top: gridSpacing * 4 + 5, width: gridSpacing * 7 - 3, fontSize: 14, text: 'or write-in:'},
                        {ctype: 'separationLine', left: gridSpacing, top: gridSpacing * 6 - 5, width: gridSpacing * 7, 
                            stroke: "rgb(0,0,0)", strokeWidth:1, padding:2, subtype: "separationLine"}
                    ],
                    "backgroundColor" : "#F7D08A"
                    
                },
                {
                    "id"              : n++,
                    "name"            : "Issue template",
                    "value"           : "issueTemplate",
                    "src"             : "http://placehold.it/32x32/F7D08A",
                    "components"   : [
                        {ctype: 'rect', left: 0, top: 0, width: gridSpacing * 24, height: gridSpacing * 1, fill: "#EBEBEB"},
                        {ctype: 'textbox', left: 0, top: 4, width: gridSpacing * 24, fontSize: 12, fontFamily: 'Arial', fontWeight: 'bold', 
                            text: '${contest.name}'},
                        {ctype: 'rect', left: 0, top: gridSpacing * 1, width: gridSpacing * 24, height: gridSpacing * 1, 
                            fill: "#CAE4FF"},
                        {ctype: 'textbox', left: 2, top: (gridSpacing * 1) + 5, width: gridSpacing * 24, fontSize: 12, fontFamily: 'Arial', fontWeight: 'bold', 
                            text: 'Vote yes or no'},
                        {ctype: 'rect', left: 0, top: gridSpacing * 2, width: gridSpacing * 24, height: gridSpacing * 13,
                            fill: "#FFFFFF"},
                        {ctype: 'textbox', left: 2, top: (gridSpacing * 2) + 5, width: gridSpacing * 24, fontSize: 12, fontFamily: 'Arial', 
                            text: 'Amendment text'},
                        {ctype: 'rect', left: 0, top: gridSpacing * 15, width: gridSpacing * 24, height: gridSpacing * 1, 
                            fill: "#FFFFFF", subtype: "ballotOption"},
                        {ctype: 'mark', left: 0, top: gridSpacing * 15, width: gridSpacing, height: gridSpacing, subtype: "mark", markStyle: "Oval"},
                        {ctype: 'textbox', left: (gridSpacing * 1) + 0, top: gridSpacing * 15 + 4, width: gridSpacing * 22, fontSize: 12, fontWeight: 'bold', 
                            text: '${nomination.name}'},
                        {ctype: 'separationLine', left: gridSpacing, top: gridSpacing * 16 - 5, width: gridSpacing * 23, 
                            stroke: "rgb(0,0,0)", strokeWidth:1, subtype: "separationLine"}
                    ],
                    "backgroundColor" : "#F7D08A"
                    
                },
                {
                    "id"              : n++,
                    "name"            : "Contest Header",
                    "value"           : "contestClass",
                    "src"             : "http://placehold.it/32x32/F7D08A",
                    "components"      : [
                     	{left: 0, top: 0, width: gridSpacing * 24, height: gridSpacing * 3, fill: "#FFFFFF", opacity: 1},
                     ],
                    "backgroundColor" : "#F7D08A"
                }
            ];
            
            return definitions;
        }
        
        this.getMockContestClasses = function() {
            var n = 1;
            const mockData = {
                "type" : "SUCCESS",
                "message" : null,
                "data" : [ {
                    "code" : n++,
                    "name" : "Question",
                    "description" : null,
                    "customCode" : "1",
                    "type" : "ISSUE",
                    "electionMode" : "RELATIVE_MAJORITY",
                    "documentsTitle" : null,
                    "precedence" : 1,
                    "timePeriod" : {
                        "period" : 1,
                        "unit" : "YEAR"
                    }
                }, {
                    "code" : n++,
                    "name" : "President",
                    "description" : null,
                    "customCode" : "2",
                    "type" : "REGULAR",
                    "electionMode" : "RELATIVE_MAJORITY",
                    "documentsTitle" : null,
                    "precedence" : 1,
                    "timePeriod" : {
                        "period" : 1,
                        "unit" : "YEAR"
                    }
                }, {
                    "code" : n++,
                    "name" : "Senator",
                    "description" : null,
                    "customCode" : "3",
                    "type" : "REGULAR",
                    "electionMode" : "RELATIVE_MAJORITY",
                    "documentsTitle" : null,
                    "precedence" : 1,
                    "timePeriod" : {
                        "period" : 1,
                        "unit" : "YEAR"
                    }
                }, {
                    "code" : n++,
                    "name" : "Governor",
                    "description" : null,
                    "customCode" : "4",
                    "type" : "REGULAR",
                    "electionMode" : "RELATIVE_MAJORITY",
                    "documentsTitle" : null,
                    "precedence" : 1,
                    "timePeriod" : {
                        "period" : 1,
                        "unit" : "YEAR"
                    }
                }, {
                    "code" : n++,
                    "name" : "Governor with a far longer description",
                    "description" : null,
                    "customCode" : "5",
                    "type" : "REGULAR",
                    "electionMode" : "RELATIVE_MAJORITY",
                    "documentsTitle" : null,
                    "precedence" : 1,
                    "timePeriod" : {
                        "period" : 1,
                        "unit" : "YEAR"
                    }
                },{
                    "code" : n++,
                    "name" : "Question with a longer description",
                    "description" : null,
                    "customCode" : "6",
                    "type" : "ISSUE",
                    "electionMode" : "RELATIVE_MAJORITY",
                    "documentsTitle" : null,
                    "precedence" : 1,
                    "timePeriod" : {
                        "period" : 1,
                        "unit" : "YEAR"
                    }
                }]
            };
            
            var deferred = $q.defer();
            setupResponsePromise(deferred, mockData);
            return deferred.promise;
        }
        
        setupResponsePromise = function(deferred, response) {
            var promise = deferred.promise;
            
            $timeout(function() {
                deferred.resolve(response);
            }, 100);
            
            promise.success = function(fn) {
                promise.then(fn);
                return promise;
            }

            promise.error = function(fn) {
                promise.then(null, fn);
                return promise;
            }
        }
        
        this.objectSelectedListener = function(element) {
            console.log('Called method objectSelectedListener()');
        }

    }

    ballotTemplateDesignerService.$inject = injectParams;

    angular.module('ballotTemplateDesigner').service('ballotTemplateDesignerService', ballotTemplateDesignerService);

})(angular);


(function() {
    'use strict';
    angular.module('ballotTemplateDesigner').directive('customOnChange', function() {
        return {
            restrict: 'A',
            link: function (scope, element, attrs) {
                var onChangeHandler = scope.$eval(attrs.customOnChange);
                element.bind('change', onChangeHandler);
            }
        };
    });
})(angular);