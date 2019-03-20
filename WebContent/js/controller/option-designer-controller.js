(function() {
    'use strict';

    angular.module('optionDesigner').controller('optionDesignerController', OptionDesignerController); 
    
    OptionDesignerController.$inject = ['optionDesignerService', 
                                        'fabric', 
                                        'fabricConstants',
                                        '$scope',
                                        '$log',
                                        '$timeout',
                                        '$window'];
    
    function OptionDesignerController(optionDesignerService, fabric, fabricConstants, $scope, $log, $timeout, $window) {
        var vm = this;
        
        var usingLocalStorage = true;
        
        const optionDesignerCustomProperties = ['stackable', 'subtype', 'customData', 'id'];
        
        const canvasProperties = fabricConstants.canvasDefaults;
        const gridSpacing = canvasProperties.grid.rowSeparation;
        
        vm.shape = {};
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
        vm.ballotTemplates = [
            {'name': 'No local templates found', 'code': -1, 'definition': '{}'}
        ];
        vm.selectedBallotTemplateCode = null;

        vm.type01Group = null;
        vm.type02Group = null;
        
        loadType01Group();
        loadType02Group();
        
        vm.clear = clear;
        vm.deleteCanvasObject = deleteCanvasObject;
        vm.ungroup = ungroup;
        vm.clearLocalStorage = clearLocalStorage;
        vm.saveTemplate = saveTemplate;
        vm.loadBallotTemplates = loadBallotTemplates;
        vm.loadBallotTemplate = loadBallotTemplate;
        vm.selectBallotTemplate = selectBallotTemplate;
        vm.toggleMarkType = toggleMarkType;
        vm.toggleBold = toggleBold;
        vm.toggleItalic = toggleItalic;
        
        vm.alert = function(message) {
            console.log("ALERT message: " + message);
        }
        
        function clear() {
            $scope.fabric.getCanvas().clear();
            init();
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
        
        function clearLocalStorage() {
            localStorage.removeItem('ballotOptions');
        }
        
        vm.testSomething = testSomething;
        function testSomething() {
            optionDesignerService.testHash('5737b3f').
            then(function(response) {
                $log.info("Response: " + response);
                $log.info("Response data: " + response.data);
            });
        }
        
        vm.loadTemplateFromJsonDefition = loadTemplateFromJsonDefition;
        function loadTemplateFromJsonDefition() {
        	let definition = optionDesignerService.getTemplateJsonDefinition();
        	loadJsonIntoCanvas(JSON.stringify(definition));
        }
        
        
        function saveTemplate() {
            if (usingLocalStorage) {
                saveTemplateJsonLocal();
            } else {
                if (!vm.ballotOptionName || vm.ballotOptionName === '') {
                    vm.shape = null;
                    $scope.fabric.deselectActiveObject();
                    vm.fieldFocus('ballotOptionName');
                    return;
                }
                
                var group = createBallotTemplateGroup();
                optionDesignerService.saveBallotTemplate(vm.ballotOptionName, 
                        vm.ballotOptionType, 
                        JSON.stringify(group.toObject(optionDesignerCustomProperties))).
                success(function(data, status) {
                    $log.info("Ballot template saved successfully");
                    $('#save-confirmation-modal').modal('show');
                }).
                error(function(data, status) {
                    $log.error('Error: ' + status);
                });
            }
        }
        
        /**
         * Gets the ballot templates list (including the json definition) 
         */
        function loadBallotTemplates() {
            if (usingLocalStorage) {
                loadBallotTemplatesLocal();
            } else {
                console.log('loadBallotTemplates!');
                optionDesignerService.getBallotTemplatesList().
                success(function(data, status) {
                    if (data.data) {
                        $log.info("Templates loaded: " + data.data.length);
                        vm.ballotTemplates = data.data;
                    } else {
                        $log.info("No ballot templates were found");
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
        function loadBallotTemplate() {
            let templateCode = vm.selectedBallotTemplateCode;
            if (usingLocalStorage) {
                loadBallotTemplateLocal(templateCode);
            } else {
                $log.info('Loading ballot template with code: ' + templateCode);
                optionDesignerService.getBallotTemplate(templateCode).
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
            vm.selectedBallotTemplateCode = null;
        }
        
        /**
         * Used by the 'load-ballot-template-modal' to register the user
         * selected ballot template to be loaded.
         */
        function selectBallotTemplate(templateCode) {
            vm.selectedBallotTemplateCode = templateCode; 
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
        
        function saveTemplateJsonLocal() {
            if (!vm.ballotOptionName || vm.ballotOptionName === '') {
                vm.shape = null;
                $scope.fabric.deselectActiveObject();
                vm.fieldFocus('ballotOptionName');
                return;
            }
            
            var group = createBallotTemplateGroup();
            
            var ballotOptionTemplates = [];
            
            var found = false;
            var retrievedObject = localStorage.getItem('ballotOptions');
            if (!retrievedObject) {
                retrievedObject = [];
            } else {
                var ballotOptionTemplates = JSON.parse(retrievedObject);
                for (var n = 0; n < ballotOptionTemplates.length; n++) {
                    if (ballotOptionTemplates[n].name === vm.ballotOptionName) {
                        ballotOptionTemplates[n] = createTemplateDefinition(group);
                        found = true;
                    }
                }
            }

            if (!found) {
                ballotOptionTemplates.push(createTemplateDefinition(group));
            }
            
            // Put the object into storage
            localStorage.setItem('ballotOptions', JSON.stringify(ballotOptionTemplates));
            $('#save-confirmation-modal').modal('show');
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
                vm.ballotTemplates = [{"name": "No local templates found"}]
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
        }
        
        function createTemplateDefinition(group) {
            var templateCode = vm.ballotOptionCode;
            var templateDefinition = {'name': vm.ballotOptionName,
                    'code': templateCode,
                    'customCode': templateCode.toString(),
                    'type': vm.ballotOptionType, 
                    'definition': JSON.stringify(group.toObject(optionDesignerCustomProperties))};
            templateDefinition.definition = templateDefinition.definition.replace('"8"', '"${pageNumber}"');
            templateDefinition.definition = templateDefinition.definition.replace('"/ 8"', '"/ ${pageTotal}"');
            return templateDefinition;
        }
        
        function loadType01Group() {
            vm.type01Group = optionDesignerService.getContainers();
        }
        
        function loadType02Group() {
            vm.type02Group = optionDesignerService.getBallotOptionComponents();
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
                    optionDesignerService.objectSelectedListener(element);
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
        
        vm.newType01 = function(data) {
            console.log('MainController.newType01(): ' + data.value);
            
            if (data.value == 'contestTemplate') {
                var components = data.renderOptions;
                for (let n = 0; n < components.length; n++) {
                    drawComponent(components[n]);
                }
            } else {
                let options = angular.extend(fabricConstants.rectDefaults, data.renderOptions);
                $scope.fabric.addRect(options);
                
                if (data.value == 'contestClass') {
                    $scope.fabric.addText("${contest.name}", {
                        left: 105,
                        top: 5,
                        width: gridSpacing * 4,
                        height: gridSpacing * 1,
                        fontSize: 12,
                        hasRotatingPoint: false,
                        cornerSize: 6
                    });
                }
            }
            
        };
        
        function drawComponent(data) {
            var elementType = data.ctype;
            if (elementType === 'text') {
                var textValue = data.text || 'TYPE_02';
                let options = angular.extend({hasRotatingPoint: false, cornerSize: 6}, data);
                $scope.fabric.addText(textValue, options);
                $log.info("Text OPTIONS: " + JSON.stringify(options));
            } else if (elementType === 'textbox') {
                var textValue = data.text || 'TYPE_02';
                let options = angular.extend({hasRotatingPoint: false, cornerSize: 6}, data);
                $scope.fabric.addTextBox(textValue, options);
            } else if (elementType === 'image') {
                $log.info("Adding image!!!");
                let options = angular.extend({hasRotatingPoint: false, cornerSize: 6}, data);
//                $scope.fabric.addImage(data.imageUrl, options);
                $scope.fabric.addImageBase64(data.imageUrl, options);
            } else if (elementType === 'mark') {
                $log.info("Adding ballot option mark!!!");
                let options = angular.extend({hasRotatingPoint: false, cornerSize: 6, fill: 'rgba(0,0,0,0)',
                    stroke: 'black', strokeWidth: 1}, data);
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
        
        vm.newType02 = function(data) {
            console.log('MainController.newType02()');

            var elementType = data.type;
            if (elementType === 'text') {
            	var textValue = data.value || 'TYPE_02';
            	let options = angular.extend({hasRotatingPoint: false, cornerSize: 6}, data.renderOptions);
                $scope.fabric.addText(textValue, options);
                $log.info("Text OPTIONS: " + JSON.stringify(options));
            } else if (elementType === 'textbox') {
                var textValue = data.value || 'TYPE_02';
                let options = angular.extend({hasRotatingPoint: false, cornerSize: 6}, data.renderOptions);
                $scope.fabric.addTextBox(textValue, options);
            } else if (elementType === 'image') {
                $log.info("Adding image!!!");
                let options = angular.extend({hasRotatingPoint: false, cornerSize: 6}, data.renderOptions);
                $scope.fabric.addImageBase64(data.renderOptions.imageUrl, options);
            } else if (elementType === 'mark') {
                $log.info("Adding ballot option mark!!!");
                let options = angular.extend({hasRotatingPoint: false, cornerSize: 6, fill: 'rgba(0,0,0,0)',
                    stroke: 'black', strokeWidth: 1}, data.renderOptions);
                $scope.fabric.addOptionMark(options);
            } else if (elementType === 'separationLine') {
                let options = angular.extend({hasRotatingPoint: false, cornerSize: 6}, data.renderOptions);
                $scope.fabric.addLine([0, 0, gridSpacing * 4, 0], options);
            } else {
                let options = angular.extend({}, fabricConstants.rectDefaults, data.renderOptions);
                var object = $scope.fabric.addRect(options);
                $log.info("Rect OPTIONS: " + JSON.stringify(options));
            }
            
        };
        
        vm.fieldFocus = function(fieldId) {
        	$timeout(function() {
        		var element = $window.document.getElementById(fieldId);
                if(element) {
                	element.focus();
                }
        	});
        }
        
    }
    
})();


