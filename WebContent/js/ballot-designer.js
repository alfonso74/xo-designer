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
 * Definition of the ballot generation application
 *
 * @author jose.carrizo
 */
(function (angular) {
    'use strict';

    const module = angular.module('ballotDesigner', ['ui.bootstrap', 'ui.select', 'ngSanitize', 'ems.fabric']);
/*
    module.config(['$controllerProvider', '$provide',
        function($controllerProvider, $provide){

        module.register =
        {
            controller: $controllerProvider.register,
            service: $provide.service
        };

    }]);
    */

})(angular);
var vmScope = {};

(function() {
    'use strict';

    angular.module('ballotDesigner').controller('ballotDesignerController', BallotDesignerController);
    
    BallotDesignerController.$inject = ['ballotDesignerService', 'fabric', 'fabricConstants', '$scope', 
        '$uibModal',
        '$log',
        '$timeout',
        '$window'];
    
    function BallotDesignerController(ballotDesignerService, fabric, fabricConstants, $scope, 
            $uibModal, $log, $timeout, $window) {
        var vm = this;
        var baseTemplateUrl = '';
        
        var usingLocalStorage = true;
        
        vmScope = this;
        
        var canvasProperties = fabricConstants.canvasDefaults;
        const ballotDesignerCustomProperties = ['id', 'subtype', 
            'templateCode', 'templateCustomCode', 'templateType', 
            'contestClass', 'previewData'];
        
        vm.votingTypes = [
            {name: 'Absentee', code: 'ABSENTEE'},
            {name: 'Early Voting', code: 'EARLY_VOTING'},
            {name: 'Election Day', code: 'ELECTION_DAY'}
        ];
        
        vm.pageSizes = fabricConstants.pageSizes;
        vm.fontFamilies = fabricConstants.fonts;
        vm.fontSizes = fabricConstants.fontSizes;
        vm.markTypes = fabricConstants.markTypes;
        
        $scope.fabric = {};
        vm.fabricCanvas = null;
        vm.shape = {};
        
        vm.ballotTemplates = {
                issueTemplates: [],
                contestTemplates: [],
                staticTemplates: [],
                straightPartyTemplates: []
        };
        
        vm.currentPageSize = vm.pageSizes[0];
        vm.currentVotingTypes = [vm.votingTypes[2].code];
        
        vm.selectedBallotStyleCode = null;
        vm.selectedBallotStyleName = null;
        
        initCanvasPages();
        
//        loadContestClasses();
        loadMockBallotStyles();
        
//        loadBallotOptionTemplates();
        
        vm.clearCanvas = clearCanvas;
        vm.deleteCanvasObject = deleteCanvasObject;
        vm.clearLocalStorage = clearLocalStorage;
        vm.previewAsPdf = previewAsPdf;
        
        vm.resizeCanvas = resizeCanvas;
        
        vm.deleteBallotStyle = deleteBallotStyle; 
        vm.loadBallotStyle = loadBallotStyle;
        vm.selectBallotStyle = selectBallotStyle;
        
        vm.viewPreviousCanvas = viewPreviousCanvas;
        vm.viewNextCanvas = viewNextCanvas;
        vm.addCanvasPage = addCanvasPage;
        vm.removeCanvasPage = removeCanvasPage;
        
        vm.canvasIsDirty = canvasIsDirty;
        
        vm.loadBallotStyleAction = loadBallotStyleAction;
        vm.deleteBallotStyleAction = deleteBallotStyleAction;
        
        function canvasIsDirty() {
            return $scope.fabric.isDirty();
        }
        
        function deleteCanvasObject() {
            $scope.fabric.deleteActiveObject();
            vm.shape = null;
            $scope.fabric.setDirty(true);
        }

        function previewAsPdf() {
            storeCurrentCanvas();
            var definition = createBallotStyleDefinition();
            ballotDesignerService.previewAsPdf(definition)
            .then(function successCallback(response) {
                var file = new Blob([response.data], {type: 'application/pdf'});
                var fileURL = URL.createObjectURL(file);
                $log.info('Response: ' + response.length);
                $window.open(fileURL, '_blank');
            },
            function errorCallback(response) {
                $log.info(response.statusText);
            }); 
        };

        function resizeCanvas(selectedPageSize) {
            var gridColumnsWidth = canvasProperties.grid.columnSeparation;
            var gridRowsHeight = canvasProperties.grid.rowSeparation;
            var gridColumns = selectedPageSize.columns;
            var gridRows = selectedPageSize.rows;
            
            $scope.fabric.setCanvasSize(gridColumns, gridRows, gridColumnsWidth, gridRowsHeight);
            $scope.fabric.createGrid(gridColumns, gridRows, gridColumnsWidth, gridRowsHeight);
            $scope.fabric.deselectActiveObject();
        }
        
        function locateOccupiedCells() {
            var gridColumnsWidth = canvasProperties.grid.columnSeparation;
            var gridRowsHeight = canvasProperties.grid.rowSeparation;
            var gridColumns = vm.currentPageSize.columns;
            var gridRows = vm.currentPageSize.rows;
            const padding = 3;
            
            createSpaceFinderRect(gridColumnsWidth - padding * 2, gridRowsHeight - padding * 2);
            var rect = vm.fabricCanvas.getActiveObject();
            
            var canvasMatrix = createRectangularAreaMatrix(gridRows, gridColumns);
            
            for (let x = 0; x < gridColumns; x++) {
                for (let y = 0; y < gridRows; y++) {
                    rect.left = x * gridColumnsWidth + padding;
                    rect.top = y * gridRowsHeight + padding;
                    rect.setCoords();
                    if (intersectsWithAnyCanvasObject(rect)) {
                        canvasMatrix[y][x] = 0;
                    } else {
                        canvasMatrix[y][x] = 1;
                    }
                }
            }
            
            vm.fabricCanvas.remove(rect);
            return canvasMatrix;
        }
        
        vm.locateFreeAreas = locateFreeAreas;
        function locateFreeAreas() {
            var h = [
                [1, 1, 1],
                [1, 1, 1],
                [1, 0, 1],
                [1, 1, 1]
            ];
            h = locateOccupiedCells();
            
            for (let r = 0; r < h.length; r++) {
                var rowInfo = '';
                for (let c = 0; c < h[r].length; c++) {
                    rowInfo = rowInfo + ' ' + h[r][c];
                }
                $log.info(rowInfo);
            }
            
            var areaMatrix = findVerticalRectangleAreas(h);
            
            var availableAreas = [];
            
            for (let r = 0; r < areaMatrix.length; r++) {
                for (let c = 0; c < areaMatrix[r].length; c++) {
                    if (areaMatrix[r][c].area > 0) {
                        availableAreas.push(areaMatrix[r][c]);
                    }
                }
            }
            
            $log.info("\n\nAREA:\n");
            availableAreas.sort(function(a, b) {
                return b.area - a.area;
            });
            
            for (let n = 0; n < availableAreas.length; n++) {
                availableAreas[n].left *= canvasProperties.grid.columnSeparation;
                availableAreas[n].top *= canvasProperties.grid.rowSeparation;
                availableAreas[n].width *= canvasProperties.grid.columnSeparation;
                availableAreas[n].height *= canvasProperties.grid.rowSeparation;
                availableAreas[n].area = availableAreas[n].width * availableAreas[n].height;
            }
            $log.info("10 Biggest areas:\n" + JSON.stringify(availableAreas.slice(0,10)));
            
            return availableAreas;
        }
        
        function findVerticalRectangleAreas(sourceMatrix) {
            var rows = sourceMatrix.length;
            var cols = sourceMatrix[0].length;
            $log.info("Area matrix size (rows x columns): " + sourceMatrix.length + " x " + sourceMatrix[0].length);
            var resultMatrix = createRectangularAreaMatrix(sourceMatrix.length, sourceMatrix[0].length);
            
            for (let r = 0; r < rows; r++) {
            	for (let c = 0; c < cols; c++) {                
                    if (sourceMatrix[r][c] === 1) {
                        var R = findGreatestRectangleAt(sourceMatrix, {r: r, c: c});
                        angular.extend(resultMatrix[r][c], R);
                    }
                }
            }
            
            return resultMatrix;
        }
        
        function findGreatestRectangleAt(sourceMatrix, basePos) {
            var maxRow = sourceMatrix.length;
            var maxCol = sourceMatrix[0].length;
            var r = {width: 0, height: 0, area: 0};
            var greatestR = {width: 0, height: 0, area: 0};

            var pos = angular.extend({}, basePos);
            while (pos.r < maxRow && sourceMatrix[pos.r][pos.c] === 1) {
                r.height++;
                r.width = 0;
                while (pos.c < maxCol && sourceMatrix[pos.r][pos.c] === 1) {
                    r.width++;
                    pos.c++;
                }
                maxCol = pos.c;
                r.area = r.width * r.height;
                if (r.area > greatestR.area) {
                    greatestR = angular.extend({}, r);
                }
//              $log.info("POS: " + JSON.stringify(pos) + ", maxRow: " + maxRow + ", maxCol: " + maxCol + ", r: " + JSON.stringify(r));

                pos.r++;
                pos.c = basePos.c;
            }
            return greatestR;
        }
        
        function createRectangularAreaMatrix(rows, columns) {
            var areaMatrix = new Array(rows);
            for (let r = 0; r < areaMatrix.length; r++) {
                areaMatrix[r] = new Array(columns);
            }
            
            for (let r = 0; r < areaMatrix.length; r++) {
                for (let c = 0; c < areaMatrix[r].length; c++) {
                    areaMatrix[r][c] = {left: c, top: r, width: 0, height: 0, area: 0};
                }
            }
            
            return areaMatrix;
        }
        
        function createSpaceFinderRect(width, height) {
            var object = $scope.fabric.addRect(
                {left: 0, top: 0, width: width, height: height,
                hasRotatingPoint: false, hasControls: false, cornerSize: 6,
                fill: "#F7D08A"});
            return object;
        }
        
        function intersectsWithAnyCanvasObject(rect) {
            var result = false;
            vm.fabricCanvas.forEachObject(function(obj) {
                // the only object we want to exclude is the background grid (the only
                // non-evented object).
               if (obj.evented === true && obj.id !== rect.id && rect.intersectsWithObject(obj)) {
                   result = true;
               } 
            });
            return result;
        }
        
        vm.test = function() {
            alert('testing!');
        }
        
        function clearCanvas() {
            vm.fabricCanvas.clear();
            vm.fabricCanvas.backgroundColor = "#ffffff";
            vm.init();
        }
        
        function clearLocalStorage() {
            localStorage.removeItem('ballotStyles');
        }
        
        /**
         * Deletes a ballot style definition (in JSON format) identified by the
         * indicated ballot style code.
         */
        function deleteBallotStyle(ballotStyleCode) {
            if (ballotStyleCode) {
                if (usingLocalStorage) {
                    deleteBallotStyleLocal(ballotStyleCode);
                } else {
                    ballotDesignerService.deleteBallotStyle(ballotStyleCode).
                    then(function(response) {
                        if (response.status === 200) {
                            $log.info('Deleted ballot style with code: ' + ballotStyleCode);
                        } else {
                            $log.error('Response: ' + JSON.stringify(response));
                        }
                        vm.selectedBallotStyleCode = null;
                        vm.selectedBallotStyleName = null;
                        vm.ballotStyleName = null;
                    })
                    .catch(function(error) {
                        $log.error('Error response: ' + JSON.stringify(error));
                    });
                }
            }
        }
        
        /**
         * Gets the ballot style definition (in JSON format) identified by the
         * indicated ballot style code.
         */
        function loadBallotStyle(ballotStyleCode) {
            clearCanvas();
            vm.canvas.pages = [];
            
            var ballotStyle = '';
            if (usingLocalStorage) {
                ballotStyle = loadBallotStyleLocal(ballotStyleCode);
                vm.currentVotingTypes = ballotStyle.types;
                loadBallotStylePages(ballotStyle.definition);
            } else {
                $log.info('Loading ballot style with code: ' + ballotStyleCode);
                ballotDesignerService.getBallotStyle(ballotStyleCode).
                then(function(response) {
                    if (response.data) {
                        ballotStyle = response.data.data;
                        $log.info("Response data data length: " + ballotStyle.length);
                        vm.currentVotingTypes = ballotStyle.types;
                        loadBallotStylePages(ballotStyle.definition);
                    }
                });
            }
            $scope.fabric.setDirty(false);
        }
        
        /**
         * Parses the indicated ballot style definition, loads the
         * ballot style pages into the ballot designer, and displays
         * the first page.
         * 
         * @param ballotStyleDefinition json string with a ballot style
         * definition
         */
        function loadBallotStylePages(ballotStyleDefinition) {
            if (ballotStyleDefinition !== '') {
                var ballotStyle = JSON.parse(ballotStyleDefinition);
                vm.currentPageSize = ballotStyle.pageSize;
                vm.resizeCanvas(ballotStyle.pageSize);
                for (let n = 0; n < ballotStyle.pages.length; n++) {
                    vm.canvas.pages.push(ballotStyle.pages[n]);
                }
                loadCanvasPage(0);
            }
        }
        
        /**
         * Renders the indicated ballot style page into the current canvas.
         * The ballotStyle parameter expects a json object with a ballot 
         * style page definition.
         */
        function renderBallotStylePageIntoCanvas(ballotStylePageDefinition) {
            if (ballotStylePageDefinition && ballotStylePageDefinition !== '') {
                parseFabricObjectsFromJsonObjectAsync(ballotStylePageDefinition, function(fabricObjects) {
                    fabricObjects.forEach(function(ballotTemplate) {
                        ballotTemplate.set({hasControls: false});
                        previewTemplateWithData(ballotTemplate);
                    });
                });
                vm.fabricCanvas.renderAll();
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
        
        /**
         * Deletes a ballot style definition (in json format) from the
         * web browser local storage.
         * Returns '1' if a ballot style with the indicated code has been
         * removed, or '0' if the ballot style was not found.
         */
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
        }
        
        function getCurrentPageJsonDefinitionUsingTemplates() {
            var objects = [];
            var definition = {objects: objects, background: ""};
            
            var validObjects = [];
            var validObjectsTemplates = [];
            vm.fabricCanvas.forEachObject(function(obj) {
                $log.info("TYPE: " + obj.type);
                if (obj.selectable) {
                    var found = false;
                    var ballotOptionTemplates = vm.ballotOptionTemplates;
                    for (let n = 0; n < ballotOptionTemplates.length && !found; n++) {
                        if (ballotOptionTemplates[n].code === obj.templateCode) {
                            validObjects.push(obj);
                            validObjectsTemplates.push(ballotOptionTemplates[n]);
                            found = true;
                        }
                    }
                }
            });
            
            for (let n = 0; n < validObjects.length; n++) {
                var obj = validObjects[n];
                
                var fabricObject = JSON.parse(validObjectsTemplates[n].definition);
                fabricObject.left = obj.left;
                fabricObject.top = obj.top;
                
                fabricObject.contestClass = obj.contestClass;
                if (obj.previewData) {
                    fabricObject.previewData = obj.previewData;
                    fabricObject.previewData.contestClass = obj.contestClass;
                }
                fabricObject.templateCode = obj.templateCode;
                fabricObject.templateType = obj.templateType;
                
                objects.push(fabricObject);
            };
            
            return definition;
        }
        
        vm.saveBallotStyle = function() {
            $log.warn('Canvas is dirty: ' + $scope.fabric.isDirty());
            storeCurrentCanvas();
            if (usingLocalStorage) {
                saveBallotStyleLocal();
                $scope.fabric.setDirty(false);
            } else {
                if (!vm.ballotStyleName || vm.ballotStyleName === '') {
                    fieldFocus('ballotStyleName');
                    vm.errorMessage = 'Please enter a name for the ballot style';
                    angular.element('#validation-modal').modal('show');
                    return;
                }
                ballotDesignerService.saveBallotStyle(vm.ballotStyleName, 
                        vm.currentVotingTypes, 
                        createBallotStyleDefinition()).
                then(function(data) {
                    $log.info("DATA: " + data.data);
                    var ballotStyleCode = data.data.data;
                    $log.info("Ballot style saved successfully, id " + ballotStyleCode);
                    saveBallotStyleContestAssociations(ballotStyleCode);
                    $scope.fabric.setDirty(false);
                },
                function(data, status) {
                    $log.error('Error: ' + status);
                });
            }
        }
        
        vm.saveBallotStyleContestAssociations = saveBallotStyleContestAssociations;
        function saveBallotStyleContestAssociations(ballotStyleCode) {
            var contestAssociations = getContestAssociationsForBallotStyle();
            $log.info("Contest associations: " + contestAssociations);
            ballotDesignerService.saveBallotStyleContestAssociations(ballotStyleCode, contestAssociations).
            then(function(data, status) {
                $log.info("DATA: " + data.data);
                $log.info("Contest associations saved successfully for ballot style with id " + ballotStyleCode);
                $('#save-confirmation-modal').modal('show');
            },
            function(data, status) {
                $log.error('Error: ' + status);
//            then(function(response) {
//                if (response.data) {
//                    $log.info("DATA: " + response.data);
//                    $log.info("Contest associations saved successfully for ballot style with id " + ballotStyleCode);
//                    $('#save-confirmation-modal').modal('show');
//                }
            });
        }
        
        function getContestAssociationsForBallotStyle() {
            var contestAssociations = [];
            var pages = vm.canvas.pages;
            $log.info("Pages: " + pages.length);
            for (let n = 0; n < pages.length; n++) {
                var pageContestAssociations = getContestAssociationsForCanvasPage(pages[n]);
                pageContestAssociations.forEach(function(obj) {
                    contestAssociations.push(obj);
                })
            }
            $log.info("Contest associations: " + contestAssociations);
            return contestAssociations;
        }
        
        function getContestAssociationsForCanvasPage(page) {
            var contestAssociations = [];
            if (page != null && page.objects) {
                page.objects.forEach(function (obj) {
                    if (obj.type === 'group' && obj.contestClass) {
                        contestAssociations.push(obj.templateCode + ',' + obj.contestClass.code);
                    }
                });
            };
            return contestAssociations;
        }
        
        function saveBallotStyleLocal () {
            if (!vm.ballotStyleName || vm.ballotStyleName === '') {
                fieldFocus('ballotStyleName');
                vm.errorMessage = 'Please enter a name for the ballot style';
                angular.element('#validation-modal').modal('show');
                return;
            }
            
            var ballotStyleName = vm.ballotStyleName;
            $log.info("Saving ballot template: " + vm.ballotStyleName);
            
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
            
//            $log.info("BALLOT TEMPLATE DEFINITION:\n" + jsonToStore);
            $('#save-confirmation-modal').modal('show');
        }
        
        function createBallotStyleDefinitionForLocalStorage(ballotStyleName) {
            var templateDefinition = {'name': ballotStyleName,
                    'code': Math.floor(Math.random() * 10000) + 1,
                    'types': vm.currentVotingTypes,
                    'definition': createBallotStyleDefinition()};
            $log.info("BALLOT STYLE DEFINITION (LOCAL STORAGE):\n" + templateDefinition.definition);
            return templateDefinition;
        }
        
        function createBallotStyleDefinition() {
            var templateDefinition = {
                    'pages': vm.canvas.pages,
                    'pageSize': vm.currentPageSize,
                    'navigationTemplates': vm.canvas.navigationTemplates
                    };
            return JSON.stringify(templateDefinition);
        }
        
        function previewTemplateWithData(obj) {
            if (obj.type === 'group' && obj.selectable === true) {
                /*
                if (obj.templateType === 'CONTEST' || 
                        obj.templateType === 'STRAIGHT_PARTY') {
                    renderContestTemplate(obj);
                } else if (obj.templateType === 'ISSUE') {
                    renderIssueTemplate(obj);
                } else {
                    renderStaticTemplate(obj);
                }
                */
                var allCanvasArea = {
                        left: obj.left, top: obj.top,
                        width: vm.fabricCanvas.getWidth() - obj.width, 
                        height: vm.fabricCanvas.getHeight() - obj.height
                    };
                fillTemplate(obj, allCanvasArea);
                renderTemplateIntoCanvas(obj);
                $log.info("BallotTemplate with mock data: " + JSON.stringify(obj.toObject(ballotDesignerCustomProperties)));
            }
        }
        
        function adjustContestBordersToNewSize(templateObject) {
            var contestBordersGroup = null;
            templateObject.forEachObject(function(obj) {
                if (obj.subtype === 'contestBorders') {
                    contestBordersGroup = obj;
                }
            });
            templateObject.remove(contestBordersGroup);
            $scope.fabric.addContestBorders(templateObject);
            
        }
        
        /**
         * Fills the issue template (a Fabric object) placeholders with 
         * preview data, and adjusts the final template size depending on 
         * the dimensions of the new content.
         */
        function fillIssueTemplate(template) {
            var data = template.previewData;
            $log.info("Contest: " + JSON.stringify(template.contestClass));
            $log.info("Issue content: " + data.issueContent);
            
            // the contest borders should be removed to avoid a bug in the
            // current way the textbox/container relationship is handled.
            // TODO: refactor to use a group with the textbox + rect +
            // any other related component in the same section
            var contestBorders = extractSubtypeGroupFromContest(template, 'contestBorders');
            template.removeWithUpdate(contestBorders);
            
            var ballotOption = extractSubtypeGroupFromContest(template, 'ballotOption');
            var ballotOptionJson = JSON.stringify(ballotOption.toObject(ballotDesignerCustomProperties));
            var newGroup = {};
            
            replaceTemplateHeaders(template, '${contest.name}', template.contestClass.name);
            replaceTemplateHeaders(template, '${contest.contestAbstract}', data.issueContent);
            replaceBallotOptionPlaceholder(ballotOption, '${nomination.name}', 'Yes');
            for (var n = 1; n < (data.eligibleOptions); n++) {
                newGroup = appendJsonGroupToContestGroup(template, ballotOptionJson);
                replaceBallotOptionPlaceholder(newGroup, '${nomination.name}', 'No');
                template.addWithUpdate(newGroup);
            }
        }
        
        function replaceTemplateHeaders(ballotTemplate, placeholder, content) {
//            ballotTemplate.destroy();
            var templateHeightAdjusted = false;
            ballotTemplate.forEachObject(function(obj) {
                if (obj.type === 'text' || obj.type === 'textbox') {
                    var cc = obj.clone();
                    var delta = objectHeightDelta(cc, placeholder, content);
                    if (delta !== 0) {
                        $log.debug("Changing template height: " + ballotTemplate.height + ", delta: " + delta);
                        resizeObjectInsideGroup(ballotTemplate, obj, delta);
                        templateHeightAdjusted = true;
                    }
                    obj.text = obj.text.replace(placeholder, content);
                }
            });
            if (templateHeightAdjusted) {
                ballotTemplate._calcBounds(true);
            }
            $log.debug("Template current height: " + ballotTemplate.height);
        }
        
        function replacePlaceholder(ballotTemplate, placeholder, replacementText) {
            ballotTemplate.forEachObject(function(obj) {
                if (obj.type === 'text' || obj.type === 'textbox') {
                    obj.text = obj.text.replace(placeholder, replacementText);
                }
            });
        }
        
        /**
         * Almost the same purpose as the resizeObjectInsideBallotOptionGroup
         * function, but for objects that aren't part of any group.
         */
        function resizeObjectInsideGroup(ballotTemplate, objectResized, delta) {
            var verticalPositions = [];
            ballotTemplate.forEachObject(function(obj) {
                verticalPositions.push(obj);
            });
            verticalPositions.sort(function(a, b) {
                return a.top - b.top;
            });
            
            var rowHeight = canvasProperties.grid.rowSeparation;
            var deltaAdjustedToGrid = Math.floor((delta + rowHeight) / rowHeight) * rowHeight;
            
            var startObjectsShift = false;
            for (let n = 0; n < verticalPositions.length; n++) {
                var obj = verticalPositions[n];
                obj.top -= deltaAdjustedToGrid / 2;
                if (startObjectsShift) {
                    $log.debug("Top1: " + obj.type + ", " + obj.top);
                    obj.top += deltaAdjustedToGrid;
                    $log.debug("Top2: " + obj.type + ", " + obj.top);
                } else {
                    if (obj.id === objectResized.id) {
                        verticalPositions[n - 1].height += deltaAdjustedToGrid;
                        startObjectsShift = true;
                    }
                }
            }
        }
        
        /**
         * Locates a fabric object inside a 'ballot option' or 'write in' 
         * group and re-adjusts the height and top properties of the others
         * group objects (based on the height variance of the indicated
         * fabric object). 
         */
        function resizeObjectInsideBallotOptionGroup(ballotTemplate, objectResized, delta) {
            var verticalPositions = [];
            ballotTemplate.forEachObject(function(obj) {
                verticalPositions.push(obj);
            });
            verticalPositions.sort(function(a, b) {
                return a.top - b.top;
            });
            
            var rowHeight = canvasProperties.grid.rowSeparation;
            var deltaAdjustedToGrid = Math.floor((delta + rowHeight) / rowHeight) * rowHeight;
            
            var startObjectsShift = false;
            for (let n = 0; n < verticalPositions.length; n++) {
                var obj = verticalPositions[n];
                obj.top -= deltaAdjustedToGrid / 2;
                if (obj.subtype && 
                        (obj.subtype === 'ballotOption' || obj.subtype === 'writeIn')) {
                    $log.debug("Changing height from group with subtype '" + obj.subtype + "'");
                    obj.height += deltaAdjustedToGrid;
                }
                if (startObjectsShift) {
                    $log.debug("Top1: " + obj.type + ", " + obj.top);
                    obj.top += deltaAdjustedToGrid;
                    $log.debug("Top2: " + obj.type + ", " + obj.top);
                } else {
                    if (obj.id === objectResized.id) {
                        $log.debug("Object resized found at position " + n);
                        startObjectsShift = true;
                    }
                }
            }
        }
        
        /**
         * This function searches the indicated group fabric object for the
         * indicated placeholder (a string with the format ${some text}) and
         * replaces it with the indicated content.
         * The fabric object type should be a 'group' and the subtype should
         * be a 'ballotOption' or 'writeIn'.
         */
        function replaceBallotOptionPlaceholder(ballotOptionGroup, placeholder, content) {
            var placeholderFound = false;
            if (ballotOptionGroup.type === 'group' && 
                    (ballotOptionGroup.subtype === 'ballotOption'  ||
                    ballotOptionGroup.subtype === 'writeIn')) {
                
                $log.debug("Replacing '" + placeholder + "' with '" + content + "'");
                var ballotOptionHeightAdjusted = false;
                ballotOptionGroup.forEachObject(function(obj) {
                    if (obj.text && obj.text.indexOf(placeholder) !== -1) {
                        placeholderFound = true;
                        if (obj.type === 'text') {
                            obj.text = obj.text.replace(placeholder, content);
                        } else if (obj.type === 'textbox') {
                            var delta = objectHeightDelta(obj, placeholder, content);
                            if (delta !== 0) {
                                $log.debug("Changing group height: " + ballotOptionGroup.height + ", delta: " + delta);
                                resizeObjectInsideBallotOptionGroup(ballotOptionGroup, obj, delta);
                                ballotOptionHeightAdjusted = true;
                            }
                        }
                    }
                });
                if (ballotOptionHeightAdjusted) {
                    $log.debug("Ballot option new height: " + ballotOptionGroup.height + " at " + ballotOptionGroup.top);
                    ballotOptionGroup._calcBounds(true);
//                    ballotOptionGroup.destroy();
//                    ballotOptionGroup._calcBounds();
//                    ballotOptionGroup._updateObjectsCoords();
                    $log.debug("Ballot option new height: " + ballotOptionGroup.height + " at " + ballotOptionGroup.top);
                }
                
            }
            return placeholderFound;
        }
        
        /**
         * Finds out if a fabric text or textbox object will change his height
         * due to some text replacement.
         * The function returns a 'delta' value with the difference (which can
         * be a positive or negative value) or zero if the object keeps the 
         * same height.
         */
        function objectHeightDelta(obj, placeholder, content) {
            var initialHeight = obj.height;
            obj.text = obj.text.replace(placeholder, content);
            vm.fabricCanvas.add(obj);
            var finalHeight = obj.height;
            vm.fabricCanvas.remove(obj);
            return finalHeight - initialHeight;
        }
        
        function fillContestTemplate(template, availableArea) {
            var templateCanBeRendered = true;
            
            template.set({left: availableArea.left, top: availableArea.top});
            
            var data = template.previewData;
            $log.info("Contest: " + JSON.stringify(template.contestClass));
            $log.info("Candidates #: " + data.eligibleOptions);
            $log.info("Vote for #: " + data.voteFor);
            $log.info("Write-in #: " + data.writeIn);
            $log.info("Requested columns #: " + data.columns);
            
            var ballotOption = extractSubtypeGroupFromContest(template, 'ballotOption');
            var writeIn = extractSubtypeGroupFromContest(template, 'writeIn');
            var contestBorders = extractSubtypeGroupFromContest(template, 'contestBorders');
            var ballotOptionJson = JSON.stringify(ballotOption.toObject(ballotDesignerCustomProperties));
            
            template.removeWithUpdate(ballotOption);
            if (writeIn) {
                template.removeWithUpdate(writeIn);
            }
            template.removeWithUpdate(contestBorders);
            
            if (template.contestClass) {
                replaceTemplateHeaders(template, '${contest.name}', template.contestClass.name);
            }
            replaceTemplateHeaders(template, '${contest.maxVotes}', data.voteFor);
            
            var maxVerticalPos = availableArea.top + availableArea.height;
            var maxHorizontalPos = availableArea.left + availableArea.width;
            
            var requestedColumns = 1;
            if (data.columns) {
                requestedColumns = data.columns;
            }
            
            var maxRows;
            if (data.writeIn) {
                maxRows = Math.ceil((data.eligibleOptions + data.writeIn) / requestedColumns);
            } else {
                maxRows = Math.ceil(data.eligibleOptions / requestedColumns);
            }
            
            var basePosition = {left: template.left, top: template.top + template.height - 1};
            var nextPosition = basePosition;
            for (let n = 0; n < (data.eligibleOptions); n++) {
                var newGroup = parseFabricObjectFromJson(ballotOptionJson);
                
                newGroup.set(nextPosition);
                if (!ballotOptionGroupFitsInsideArea(newGroup, availableArea)) {
                    nextPosition = getNextPositionForBallotOption(basePosition, nextPosition, newGroup, 
                            maxVerticalPos, maxHorizontalPos, n, maxRows);
                    newGroup.set(nextPosition);
                }
                nextPosition = getNextPositionForBallotOption(basePosition, nextPosition, newGroup, 
                        maxVerticalPos, maxHorizontalPos, n, maxRows);
                
                replaceBallotOptionPlaceholder(newGroup, '${nomination.name}', 'Candidate ' + (n + 1));
                replaceBallotOptionPlaceholder(newGroup, '${party.name}', 'Party ' + (n + 1));
                var additionalInfoFound = true;
                for (let i = 0; additionalInfoFound && i < 10; i++) {
                    additionalInfoFound = replaceBallotOptionPlaceholder(newGroup, 
                            '${nomination.additionalInfo[' + i + ']}', 'Additional Candidate ' + (i + 1));
                }
                template.addWithUpdate(newGroup);
            }
            if (writeIn) {
                var writeInJson = JSON.stringify(writeIn.toObject(ballotDesignerCustomProperties));
                
                for (let n = data.eligibleOptions; n < (data.eligibleOptions + data.writeIn); n++) {
                    var newGroup = appendJsonGroupToContestGroup(template, writeInJson);
                    
                    newGroup.set(nextPosition);
                    if (!ballotOptionGroupFitsInsideArea(newGroup, availableArea)) {
                        nextPosition = getNextPositionForBallotOption(basePosition, nextPosition, newGroup, 
                                maxVerticalPos, maxHorizontalPos, n, maxRows);
                        newGroup.set(nextPosition);
                    }
                    nextPosition = getNextPositionForBallotOption(basePosition, nextPosition, newGroup, 
                            maxVerticalPos, maxHorizontalPos, n, maxRows);
                    
                    template.addWithUpdate(newGroup);
                }
            }
            
            adjustBallotTemplateHeadersWidth(template, template.width - 3);
            
            if (template.left + template.width - 3 > maxHorizontalPos ||
                    template.top + template.height - 3 > maxVerticalPos) {
                templateCanBeRendered = false;
            }
            
            return templateCanBeRendered;
        }
        
        function getNextPositionForBallotOption(basePosition, currentPosition, newGroup, 
                maxVerticalPosition, maxHorizontalPosition, ballotOptionCounter, maxRows) {
            var nextPosition = {};
            
            if (currentPosition === null) {
                // draw ballot option at first position
                nextPosition.left = basePosition.left;
                nextPosition.top = basePosition.top + newGroup.height - 1;
            } else if (currentPosition.top + newGroup.height > maxVerticalPosition ||
                ((ballotOptionCounter + 1) % maxRows === 0)) {
                // continue one column to the right
                nextPosition.left = currentPosition.left + newGroup.width - 1;
                nextPosition.top = basePosition.top;
            } else {
                // draw ballot option on next row
                nextPosition.left = currentPosition.left;
                nextPosition.top = currentPosition.top + newGroup.height - 1;
            }
            
            return nextPosition;
        }
        
        function ballotOptionGroupFitsInsideArea(ballotOption, area) {
            var result = true;
            if ((ballotOption.top + ballotOption.height - 3) > (area.top + area.height) ||
                    (ballotOption.left + ballotOption.width - 3) > (area.left + area.width)) {
                result = false;
            }
            return result;
        }
        
        function adjustBallotTemplateHeadersWidth(template, newWidth) {
            template.forEachObject(function(obj) {
                if (!obj.subtype) {
                    obj.width = newWidth;
                    obj.left = - (newWidth / 2);
                }
                
            })
            template._calcBounds(true);
        }
        
        /**
         * Appends a new group at the end of the indicated contest group.
         * The new group is in json format, and will be parsed to Fabric
         * objects that will be appended to the end of the contest group.
         */
        function appendJsonGroupToContestGroup(contestGroup, jsonGroup) {
            //TODO change the function name
            var newGroup = parseFabricObjectFromJson(jsonGroup);
            newGroup.left = contestGroup.left;
            newGroup.top = contestGroup.top + contestGroup.height - 1;
//            contestGroup.addWithUpdate(newGroup);
            return newGroup;
        }
        
        /**
         * For any object with subtype 'mark', the width and height properties
         * are set to the grid spacing value.
         * If the object is a group, then make a recursive call to check for
         * objects with subtype 'mark' and fix the height/width values.
         */
        function restoreSizeForMarkersWithinGroup(group, restoreToWidth, restoreToHeight) {
            if (group.type === 'group') {
                var groupObjects = group.getObjects();
                for (var i = 0; i < groupObjects.length; i++) {
                    $log.debug('Type: ' + groupObjects[i].type + ', subtype: ' + groupObjects[i].subtype + ", id: " + groupObjects[i].id);
                    if (groupObjects[i].type === 'group') {
                        restoreSizeForMarkersWithinGroup(groupObjects[i], restoreToWidth, restoreToHeight);
                    } else if (groupObjects[i].subtype === 'mark') {
                        groupObjects[i].width = restoreToWidth;
                        groupObjects[i].height = restoreToHeight;
                    }
                }
            }
        }
        
        function extractSubtypeGroupFromContest(contestGroup, subtype) {
            var result = null;
            contestGroup.forEachObject(function(obj) {
                if (obj.subtype === subtype) {
                    result = obj;
                }
            });
            return result;
        }
        
        function renderStaticTemplate(fabricObject) {
            vm.fabricCanvas.add(fabricObject);
            vm.fabricCanvas.renderAll();
        }
        
        function renderIssueTemplate(fabricObject) {
            fillIssueTemplate(fabricObject);
            adjustContestBordersToNewSize(fabricObject);
            vm.fabricCanvas.add(fabricObject);
            vm.fabricCanvas.renderAll();
        }
        
        function getRectangleAt(resultMatrix, position) {
            var result = null;
            for (let n = 0; n < resultMatrix.length && result === null; n++) {
                if (resultMatrix[n].left === position.left &&
                        resultMatrix[n].top === position.top) {
                    result = angular.extend({}, resultMatrix[n]);
                }
            }
            return result;
        }
        
        function fillTemplate(template, area) {
            if (template.templateType === 'CONTEST' ||
                template.templateType === 'STRAIGHT_PARTY') {
                fillContestTemplate(template, area);
                adjustContestBordersToNewSize(template);
            } else if (template.templateType === 'ISSUE') {
                template.set({left: area.left, top: area.top});
                fillIssueTemplate(template);
                adjustContestBordersToNewSize(template);
            } else {
                template.set({left: area.left, top: area.top});
            }
        }
        
        function renderTemplate(fabricObject) {
            locateBestAreaForTemplateDrawing(fabricObject, function(template) {
                if (template !== null) {
                    renderTemplateIntoCanvas(template);
                }
            });
        }
        
        function instantiateNewEmptyTemplate(fabricObject) {
            var templateJson = JSON.stringify(fabricObject.toObject(ballotDesignerCustomProperties));
            var newTemplate = parseFabricObjectFromJson(templateJson);
            newTemplate.set({left: 0, top: 0});
            return newTemplate;
        }
        
        function templateFitsAtPosition(template, sourceMatrix, basePos) {
            var result = false;
            
            var colsWidth = canvasProperties.grid.columnSeparation;
            var rowsHeight = canvasProperties.grid.rowSeparation;
            
            var templateCols = Math.round(template.width / colsWidth);
            var templateRows = Math.round(template.height / rowsHeight);
            
            var maxRow = sourceMatrix.length;
            var maxCol = sourceMatrix[0].length;
            var r = {width: 0, height: 0, area: 0};

            var pos = angular.extend({}, basePos);
            while (pos.r < maxRow && sourceMatrix[pos.r][pos.c] === 1 && pos.r < (basePos.r + templateRows)) {
                r.height += rowsHeight;
                r.width = 0;
                while (pos.c < maxCol && sourceMatrix[pos.r][pos.c] === 1 && pos.c < (basePos.c + templateCols)) {
                    r.width += colsWidth;
                    pos.c++;
                }
                maxCol = pos.c;
                pos.r++;
                pos.c = basePos.c;
            }
            r.area = r.width * r.height;
            if (templateFitsInsideArea(template, r)) {
                result = true;;
            }
            return result;
        }
        
        function getNextAvailableAreaForTemplate(template, sourceMatrix) {
            var area = null;

            var rows = sourceMatrix.length;
            var cols = sourceMatrix[0].length;
            for (let r = 0; r < rows && area === null; r++) {
                for (let c = 0; c < cols && area === null; c++) {
                    if (sourceMatrix[r][c] === 1 &&
                            templateFitsAtPosition(template, 
                                    sourceMatrix, 
                                    {r: r, c: c})) {
                        area = {
                                left: c * canvasProperties.grid.columnSeparation,
                                top: r * canvasProperties.grid.rowSeparation
                        };
                    };
                }
            }
            return area;
        }
        
        function locateBestAreaForTemplateDrawing(fabricObject, callback) {
            var allCanvasArea = {
                left: 0, top: 0,
                width: vm.fabricCanvas.getWidth(), 
                height: vm.fabricCanvas.getHeight()
            };

            var allAvailableAreas = locateFreeAreas();
            var biggestAvailableArea = allAvailableAreas[0]; // biggest free area

            var temporalTemplate;
            if (fabricObject.templateType === 'STATIC') {
                temporalTemplate = fabricObject;
            } else {
                temporalTemplate = instantiateNewEmptyTemplate(fabricObject);
                fillTemplate(temporalTemplate, allCanvasArea);
            }
            
            var freeAreasMatrix = locateOccupiedCells();
            var templateFitsUserSelectedArea = templateFitsAtPosition(temporalTemplate, freeAreasMatrix, {
                c: Math.round(fabricObject.left / canvasProperties.grid.columnSeparation), 
                r: Math.round(fabricObject.top / canvasProperties.grid.rowSeparation)
            });
            
            if (templateFitsUserSelectedArea) {
                temporalTemplate.set({left: Math.round(fabricObject.left), top: Math.round(fabricObject.top)});
                callback(temporalTemplate);
            } else {
                // get the biggest empty rectangle that can accept current template dimensions
                var proposedArea = getNextAvailableAreaForTemplate(temporalTemplate, freeAreasMatrix);
                $log.info("Trying at another position... " + JSON.stringify(proposedArea));
                if (proposedArea !== null) {
                    $log.info("Can be rendered at another area (" + 
                            proposedArea.left + ', ' + proposedArea.top + ")");
                    //show confirmation dialog
                    showModalConfirmation('Ballot template actions', 
                        "The contest can't be drawn at the selected location, render contest at another area?", 
                        function(result) {
                            if (result) {
                                temporalTemplate.set({left: proposedArea.left, top: proposedArea.top});
                                callback(temporalTemplate);
                            }
                        }
                    );
                } else {
                    if (temporalTemplate.templateType === 'CONTEST' || 
                            temporalTemplate.templateType === 'STRAIGHT_PARTY') {
                        temporalTemplate = instantiateNewEmptyTemplate(fabricObject);
                        var canBeRendered = fillContestTemplate(temporalTemplate, biggestAvailableArea);
                        if (canBeRendered) {
                         // draw the template at the biggest available area
                            $log.info("Can be rendered (with != cols) at another area (" + 
                                    biggestAvailableArea.left + ', ' + biggestAvailableArea.top + ")");
                            showModalConfirmation('Ballot template actions', 
                                    "The contest can't be drawn in any area with the requested number of columns, but can be drawn in another area with a different amount of columns.", 
                                function(result) {
                                    if (result) {
                                        callback(temporalTemplate);
                                    }
                                }
                            );
                        } else {
                            // the template can't be drawn in the current page
                            var message = "This template can't be drawn in the " +
                            "current page size with the selected amount of " +
                            "eligible options (" + fabricObject.previewData.eligibleOptions + ").";
                            showModalInformation("Ballot style validation.", message);
//                            angular.element('#load-ballot-config-modal').modal('show');
                            callback(null);
                        }
                    } else {
                        // the template can't be drawn in the current page size
                        showModalInformation("Ballot style validation", 
                                "This template can't be drawn in the current page size.");
                        callback(null);
                    }
                }
            }
        }
        
        function renderContestTemplate(fabricObject) {
            var templateJson = JSON.stringify(fabricObject.toObject(ballotDesignerCustomProperties));
            
            var canvasArea = {
                left: 0, top: 0,
                width: vm.fabricCanvas.getWidth(), 
                height: vm.fabricCanvas.getHeight()
            };
            
            var allAvailableAreas = locateFreeAreas();
            var areaAtUserSelection = getRectangleAt(allAvailableAreas, 
                    {left: Math.round(fabricObject.left), top: Math.round(fabricObject.top)});
            $log.info("Max area for point (" + fabricObject.left + ', ' + fabricObject.top + "): " + JSON.stringify(areaAtUserSelection));
            
            var temporalTemplate = parseFabricObjectFromJson(templateJson);
            temporalTemplate.set({left: 0, top: 0});
            fillContestTemplate(temporalTemplate, canvasArea);
            var canBeRendered = false;
            if (areaAtUserSelection) {
                canBeRendered = templateFitsInsideArea(temporalTemplate, areaAtUserSelection);
            }
            
            $log.info("Can be rendered: " + canBeRendered);
            $log.info("Template width: " + temporalTemplate.width + 
                    ", height: " + temporalTemplate.height + 
                    ", area: " + temporalTemplate.width * temporalTemplate.height);
            
            if (canBeRendered) {
                renderTemplateInsideArea(fabricObject, areaAtUserSelection);
            } else {
                var proposedArea = getSuitableAreaForTemplate(temporalTemplate, allAvailableAreas);
                $log.info("Trying at another position... " + JSON.stringify(proposedArea));

                if (proposedArea !== null) {
                    $log.info("Can be rendered at another area (" + 
                            proposedArea.left + ', ' + proposedArea.top + ")");
                    //show confirmation dialog
                    showModalConfirmation('Ballot template actions', 
                        "The contest can't be draw at the selected location, render contest at another area?", 
                        function(result) {
                            if (result) {
                                renderTemplateInsideArea(fabricObject, proposedArea);
                            }
                        }
                    );
                } else {
                    var biggestAvailableArea = allAvailableAreas[0]; // biggest free area
                    $log.info("Trying another position with a modified template: " + JSON.stringify(biggestAvailableArea));

                    temporalTemplate = parseFabricObjectFromJson(templateJson);
                    temporalTemplate.set({left: biggestAvailableArea.left, top: biggestAvailableArea.top});
                    canBeRendered = fillContestTemplate(temporalTemplate, biggestAvailableArea);
                    if (canBeRendered) {
                        $log.info("Can be rendered (with != cols) at another area (" + 
                                biggestAvailableArea.left + ', ' + biggestAvailableArea.top + ")");
                        showModalConfirmation('Ballot template actions', 
                                "The contest can't be draw in any area with the requested number of columns, but can be draw in another area with a different amount of columns.", 
                            function(result) {
                                if (result) {
                                    renderTemplateInsideArea(fabricObject, biggestAvailableArea);
                                }
                            }
                        );
                    } else {
                        // the template can't be draw in the current page 
                        var message = "This template can't be drawn in the " +
                        "current page size with the selected amount of " +
                        "eligible options (" + fabricObject.previewData.eligibleOptions + ").";
                        showModalInformation("Ballot style validation.", message);
                    }
                }
            }
        }
        
        function templateFitsInsideArea(template, area) {
            var result = false;
            var adjustedWidth = template.width - 3;
            var adjustedHeight = template.height - 3;
            if (area.area >= adjustedWidth * adjustedHeight &&
                    area.width >= adjustedWidth &&
                    area.height >= adjustedHeight) {
                result = true;
            }
            return result;
        }
        
        function getSuitableAreaForTemplate(template, allAvailableAreas) {
            var maxRectangle = getMaxRectangleForTemplate(template, allAvailableAreas);
            if (maxRectangle != null) {
                $log.info("Alternate position: " + JSON.stringify(maxRectangle));
            }
            return maxRectangle;
        }
        
        function renderTemplateInsideArea(template, area) {
        	template.set({left: area.left, top: area.top});
            fillContestTemplate(template, area);
            adjustContestBordersToNewSize(template);
            vm.fabricCanvas.add(template);
            vm.fabricCanvas.renderAll();
        }
        
        function renderTemplateIntoCanvas(template) {
            template.set({hasControls: false});
            vm.fabricCanvas.add(template);
            vm.fabricCanvas.renderAll();
        }
        
        function getMaxRectangleForTemplate(template, allAvailableAreas) {
            var result = null;
            for (let n = 0; n < allAvailableAreas.length && result === null; n++) {
                if (templateFitsInsideArea(template, allAvailableAreas[n])) {
                    result = allAvailableAreas[n];
                }
            }
            return result;
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
        
        function showModalInformation(title, message, callback) {
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
                callback(userSelections);
            }, function() {
                //action on popup dismissal
                callback(null);
            });
        }
        
        function associateContestAndRenderCandidates(fabricObject) {
            var templateSupportsWriteIn = templateHasWriteInSection(fabricObject.templateCode);
            var modalInstance = $uibModal.open({
                templateUrl: baseTemplateUrl + 'views/designer/associateContest.html',
                size: 'md',
                backdrop: 'static',
                keyboard: false,
                controller: 'AssociateContestCtrl',
                controllerAs: 'modalCtrl',
                resolve: {
                    template: function() {
                      return fabricObject;
                    },
                    writeInSupport: function() {
                        return templateSupportsWriteIn;
                    }
                }
            });

            modalInstance.result.then(function(userSelections) {
                $log.info("User selections: " + JSON.stringify(userSelections));
                
                if (contestClassCanBeAssociated(userSelections.contestClass, fabricObject)) {
                    if (fabricObject.isBeingEdited) {
                        var templateLocation = {left: fabricObject.left, top: fabricObject.top};
                        var templateCode = fabricObject.templateCode;
                        vm.fabricCanvas.remove(vm.fabricCanvas.getActiveObject());
                        fabricObject = createFabricObjectFromTemplateWithCode(templateCode);
                        fabricObject.set(templateLocation);
                    }
                    fabricObject.contestClass = userSelections.contestClass;
                    fabricObject.previewData = userSelections.previewData;
                    renderTemplate(fabricObject);
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
        
        function associateIssueAndRenderUserSelectedData(fabricObject) {
            var modalInstance = $uibModal.open({
                templateUrl: baseTemplateUrl + 'views/designer/associateIssue.html',
                size: 'md',
                backdrop: 'static',
                keyboard: false,
                controller: 'AssociateIssueCtrl',
                controllerAs: 'vm',
                resolve: {
                    template: function() {
                        return fabricObject;
                    }
                }
            });

            modalInstance.result.then(function(userSelections) {
                $log.info("User selections: " + JSON.stringify(userSelections));
                
                if (contestClassCanBeAssociated(userSelections.contestClass, fabricObject)) {
                    if (fabricObject.isBeingEdited) {
                        var templateLocation = {left: fabricObject.left, top: fabricObject.top};
                        var templateCode = fabricObject.templateCode;
                        vm.fabricCanvas.remove(vm.fabricCanvas.getActiveObject());
                        fabricObject = createFabricObjectFromTemplateWithCode(templateCode);
                        fabricObject.set(templateLocation);
                    }
                    
                    fabricObject.contestClass = userSelections.contestClass;
                    fabricObject.previewData = userSelections.previewData;
                    fabricObject.previewData.eligibleOptions = 2;
                    renderTemplate(fabricObject);
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
        
        function setupStraightPartyAndAndRenderUserSelectedData(fabricObject) {
            var modalInstance = $uibModal.open({
                templateUrl: baseTemplateUrl + 'views/designer/setupStraightParty.html',
                size: 'md',
                backdrop: 'static',
                keyboard: false,
                controller: 'SetupStraightPartyCtrl',
                controllerAs: 'vm',
                resolve: {
                    template: function() {
                        return fabricObject;
                    }
                }
            });

            modalInstance.result.then(function(userSelections) {
                $log.info("User selections: " + JSON.stringify(userSelections));
                
                if (!ballotStyleAlreadyHasStraightParty()) {
                    if (fabricObject.isBeingEdited) {
                        var templateLocation = {left: fabricObject.left, top: fabricObject.top};
                        var templateCode = fabricObject.templateCode;
                        vm.fabricCanvas.remove(vm.fabricCanvas.getActiveObject());
                        fabricObject = createFabricObjectFromTemplateWithCode(templateCode);
                        fabricObject.set(templateLocation);
                    }
                    fabricObject.previewData = userSelections.previewData;
                    fabricObject.contestClass = userSelections.contestClass;
                    renderTemplate(fabricObject);
                } else {
                    vm.errorMessage = "A ballot style can't have more than " +
                    		"one straight party template.";
                    $('#validation-modal').modal('show');
                }
                
            }, function() {
                $scope.fabric.setDirty(false);
            });
        };
        
        /**
         * Validates if the indicated contest class can be associated to a 
         * ballot template.
         * A contest class can be associated only to one template at a time 
         * (in the current ballot style).
         */
        function contestClassCanBeAssociated(currentContestClass, ballotTemplate) {
            var result = false;
            var unavailableContestClasses = [];
            vm.fabricCanvas.forEachObject(function(obj) {
                $log.info(obj.type + ": " + obj.contestClass);
                if (obj.contestClass && !obj.isBeingEdited) {
                    unavailableContestClasses.push(obj.contestClass.customCode);
                }
            });
            if (unavailableContestClasses.indexOf(currentContestClass.customCode) === -1) {
                result = true;
            }
            return result;
        }
        
        /**
         * Indicates if the current ballot style has a straight party template
         * included in his design.
         */
        function ballotStyleAlreadyHasStraightParty() {
            var result = false;
            vm.fabricCanvas.forEachObject(function(obj) {
                if (obj.contestClass && !obj.isBeingEdited && 
                        obj.templateType && obj.templateType === 'STRAIGHT_PARTY') {
                    result = true;
                }
            });
            if (!result) {
                var pages = vm.canvas.pages;
                var page;
                for (var n = 0; n < pages.length && !result; n++) {
                    page = pages[n];
                    if (page != null && n !== vm.canvas.currentPage) {
                        result = ballotStylePageHasStraightParty(page);
                    }
                }
            }
            return result;
        }
        
        /**
         * Indicates if a ballot style page has a straight party template.
         */
        function ballotStylePageHasStraightParty(page) {
            var result = false;
            var pageObjects = page.objects;
            for (var n = 0; n < pageObjects.length && !result; n++) {
                if (pageObjects[n].templateType === 'STRAIGHT_PARTY') {
                    result = true;
                }
            }
            return result;
        }
        
        /**
         * Helper method to indicate if a template has a 'write-in' section.
         */
        function templateHasWriteInSection(templateCode) {
            var result = false;
            var template = createFabricObjectFromTemplateWithCode(templateCode);
            var group = extractSubtypeGroupFromContest(template, 'writeIn');
            if (group != null) {
                result = true;
            }
            return result;
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
                        if (fabricObject.type === 'group') {
                            var restoreToWidth = canvasProperties.grid.rowSeparation;
                            var restoreToHeight = canvasProperties.grid.columnSeparation;
                            restoreSizeForMarkersWithinGroup(fabricObject, restoreToWidth, restoreToHeight);
                        }
                        fabricObjects.push(fabricObject);
                        if (++createdObjects >= objectsToCreate) {
                            callback(fabricObjects);
                        }
                    });
                }
            }
        }
        
        function parseFabricObjectFromJson(json) {
            var fabricJson = JSON.parse(json);
            return createFabricObject(fabricJson);
        }
        
        function createFabricObject(jsonObject) {
            var fabricObject = null;
            var klass = $scope.fabric.getKlass(jsonObject.type);
            if (klass.async) {
                klass.fromObject(jsonObject, function (img) {
                    fabricObject = img;
                });
            } else {
                fabricObject = klass.fromObject(jsonObject);
            }
            if (fabricObject.type === 'group') {
                var restoreToWidth = canvasProperties.grid.rowSeparation;
                var restoreToHeight = canvasProperties.grid.columnSeparation;
                restoreSizeForMarkersWithinGroup(fabricObject, restoreToWidth, restoreToHeight);
            }
            return fabricObject;
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
        
        function parseFabricObjectFromJsonAsync(json, callback) {
            var fabricJson = JSON.parse(json);
            createFabricObjectAsync(fabricJson, function(fabricObject) {
                if (fabricObject.type === 'group') {
                    var restoreToWidth = canvasProperties.grid.rowSeparation;
                    var restoreToHeight = canvasProperties.grid.columnSeparation;
                    restoreSizeForMarkersWithinGroup(fabricObject, restoreToWidth, restoreToHeight);
                }
                callback(fabricObject);
            });
        }
        
        vm.drag = function(e) {
            e.dataTransfer.setData("text", e.target.id);
            $log.info(e.target.id);
        }
        
        vm.drop = function(e) {
            e.preventDefault;
            var templateCode = Number(e.dataTransfer.getData("text").replace("BT", ""));
            var dropX = Math.floor(e.layerX / canvasProperties.grid.columnSeparation) * canvasProperties.grid.columnSeparation;
            var dropY = Math.floor(e.layerY / canvasProperties.grid.rowSeparation) * canvasProperties.grid.rowSeparation;
            
            var templateIsFound = false;
            
            var ballotOptionTemplates = vm.ballotOptionTemplates;
            for (var n = 0; n < ballotOptionTemplates.length && !templateIsFound; n++) {
                if (ballotOptionTemplates[n].code === templateCode) {
                    templateIsFound = true;
                }
            }
            if (templateIsFound) {
                var selectedTemplate = ballotOptionTemplates[n-1];
                
                parseFabricObjectFromJsonAsync(selectedTemplate.definition, function(fabricObject) {
                    fabricObject.set({
                        templateCode: selectedTemplate.code,
//                        templateCustomCode: selectedTemplate.customCode,
                        templateType: selectedTemplate.type,
                        hasControls: false
                        });
                    if (dropX + fabricObject.width - 1 > vm.fabricCanvas.width) {
                        dropX = vm.fabricCanvas.width - fabricObject.width;
                        dropX = Math.floor(dropX / canvasProperties.grid.columnSeparation) * canvasProperties.grid.columnSeparation;
                    }
                    if (dropY + fabricObject.height > vm.fabricCanvas.height) {
                        dropY = vm.fabricCanvas.height - fabricObject.height;
                        dropY = Math.floor(dropY / canvasProperties.grid.rowSeparation) * canvasProperties.grid.rowSeparation;
                    }
                    fabricObject.set({
                        left: dropX,
                        top: dropY
                        });
                    $scope.fabric.setDirty(true);
                    drawTemplateIntoCanvas(fabricObject);
                });
                
            }
        }
        
        vm.allowDrop = function(e) {
            e.preventDefault();
        }
        
        /**
         * Calls the required function(s) to draw a ballot template into
         * the Fabric canvas, since each template type has particular 
         * requirements and data.
         */
        function drawTemplateIntoCanvas(template) {
            if (template.templateType === 'CONTEST') {
                associateContestAndRenderCandidates(template);
            } else if (template.templateType === 'STRAIGHT_PARTY') {
                setupStraightPartyAndAndRenderUserSelectedData(template);
            } else if (template.templateType === 'ISSUE') {
                associateIssueAndRenderUserSelectedData(template);
            } else {
                if (!template.isBeingEdited) {
                    renderTemplate(template);
                }
            }
        }
        
        function loadBallotOptionTemplates() {
            if (usingLocalStorage) {
                loadBallotOptionTemplatesLocal();
            } else {
                $log.info('Loading BallotOption Templates...');
                ballotDesignerService.getBallotTemplatesList().
                then(function(data) {
                    if (data.data.data) {
                        $log.info("Templates loaded: " + data.data.data.length);
                        vm.ballotOptionTemplates = data.data.data;
                        filterBallotTemplatesType();
                    } else {
                        $log.info("No ballot templates were found");
                    }
                },
                function(data, status) {
                    $log.info('Error: ' + status);
                });
            }
        }
        
        function loadBallotOptionTemplatesLocal() {
            var retrievedObject = localStorage.getItem('ballotOptions');
            $log.info('retrievedObject: ', JSON.parse(retrievedObject));
            vm.ballotOptionTemplates = JSON.parse(retrievedObject);
            filterBallotTemplatesType();
        }
        
        function filterBallotTemplatesType() {
            if (vm.ballotOptionTemplates) {
                for (var n = 0; n < vm.ballotOptionTemplates.length; n++) {
                    $log.info("Template name: " + vm.ballotOptionTemplates[n].name);
                    if (vm.ballotOptionTemplates[n].type === 'STATIC') {
                        vm.ballotTemplates.staticTemplates.push(vm.ballotOptionTemplates[n]);
                    } else if (vm.ballotOptionTemplates[n].type === 'STRAIGHT_PARTY') {
                        vm.ballotTemplates.straightPartyTemplates.push(vm.ballotOptionTemplates[n]);
                    } else if (vm.ballotOptionTemplates[n].type === 'ISSUE') {
                        vm.ballotTemplates.issueTemplates.push(vm.ballotOptionTemplates[n]);
                    } else {
                        vm.ballotTemplates.contestTemplates.push(vm.ballotOptionTemplates[n]);
                    }
                }
            } else {
                vm.ballotOptionTemplates = [{"name": "No local templates found"}]
            }
            if (vm.ballotTemplates.contestTemplates.length === 0) {
                vm.ballotTemplates.contestTemplates = [{type: 'CONTEST', name: 'No local templates found'}]; 
            }
            if (vm.ballotTemplates.issueTemplates.length === 0) {
                vm.ballotTemplates.issueTemplates = [{type: 'ISSUE', name: 'No local templates found'}]; 
            }
            if (vm.ballotTemplates.staticTemplates.length === 0) {
                vm.ballotTemplates.staticTemplates = [{type: 'STATIC', name: 'No local templates found'}]; 
            }
            if (vm.ballotTemplates.straightPartyTemplates.length === 0) {
                vm.ballotTemplates.straightPartyTemplates = [{type: 'STRAIGHT_PARTY', name: 'No local templates found'}]; 
            }
        }
        
        function loadBallotStyleAction() {
            loadBallotStyles();
            loadBallotStyleValidation(function(result) {
                if (result) {
                    angular.element('#load-ballot-config-modal').modal('show');
                }
            });
        }
        
        function deleteBallotStyleAction() {
            loadBallotStyles();
//            angular.element('#delete-ballot-style-modal').modal('show');
        }
        
        function loadBallotStyles() {
            if (usingLocalStorage) {
                loadBallotStylesLocal();
            } else {
                $log.info('Loading BallotConfigurations from db');
                ballotDesignerService.getBallotStylesList().
                then(function(data) {
                    if (data.data.data) {
                        $log.info("Ballot configurations loaded: " + data.data.data.length);
                        vm.ballotStyles = data.data.data;
                    } else {
                        $log.info("No ballot configurations were found");
                        vm.ballotStyles = [{name: "No ballot styles found"}]
                    }
                },
                function(data, status) {
                    $log.info('Error: ' + status);
                });
            }
        }
        
        function loadBallotStyleValidation(callback) {
            if (vm.canvasIsDirty()) {
                showModalConfirmation("Ballot style validation", "There are unsaved changes.  Are you sure you want " +
                        "to load a ballot style?", function(result) {
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
        
        /**
         * Stores info about the ballot style that has been selected by the
         * end user.
         */
        function selectBallotStyle(ballotStyleCode, ballotStyleName) {
            vm.selectedBallotStyleCode = ballotStyleCode;
            vm.selectedBallotStyleName = ballotStyleName;
            vm.ballotStyleName = ballotStyleName;
        }
        
        function fieldFocus(fieldId) {
            $timeout(function() {
                var element = $window.document.getElementById(fieldId);
                if(element) {
                    element.focus();
                }
            });
        }
        
        function loadBallotStylesLocal() {
            var retrievedObject = localStorage.getItem('ballotStyles');
            $log.info('retrievedObject: ', JSON.parse(retrievedObject));
            vm.ballotStyles = JSON.parse(retrievedObject);
            
            if (vm.ballotStyles) {
                for (var n = 0; n < vm.ballotStyles.length; n++) {
                    $log.info("Ballot configuration name: " + vm.ballotStyles[n].name);
                }
            } else {
                vm.ballotStyles = [{"name": "No local ballot styles found"}]
            }
        }
        
        function loadMockBallotStyles() {
            vm.ballotStyles = [
                {'code': 0, 'name': 'Ballot config test'},
                {'code': 1, 'name': 'President ballot'},
                {'code': 2, 'name': 'Senator ballot'},
                {'code': 3, 'name': 'Board member ballot'},
                {'code': 4, 'name': 'Coroner ballot'}
                ]
        }
        
        function viewPreviousCanvas() {
            storeCurrentCanvas();
            loadCanvasPage(vm.canvas.currentPage - 1);
        }
        
        function viewNextCanvas() {
            storeCurrentCanvas();
            loadCanvasPage(vm.canvas.currentPage + 1);
        }
        
        function storeCurrentCanvas() {
            vm.canvas.pages[vm.canvas.currentPage] = getCurrentPageJsonDefinitionUsingTemplates();
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
            clearCanvas();
            renderBallotStylePageIntoCanvas(vm.canvas.pages[requestedCanvasPage]);
            $scope.fabric.getCanvas().calcOffset();
        }
        
        /**
         * Adds a canvas page after the current one.
         */
        function addCanvasPage() {
            storeCurrentCanvas();
            
            // inserts at the next position
            vm.canvas.currentPage++;
            vm.canvas.pages.splice(vm.canvas.currentPage, 0, null);
            
            clearCanvas();
        }
        
        function removeCanvasPage() {
            if (vm.canvas.pages.length === 1) {
                vm.errorMessage = "The ballot style should have at least one page.";
                $('#validation-modal').modal('show');
                return;
            }
            validateRemoveCanvasPage(function(canRemovePage) {
                if (canRemovePage) {
                    vm.canvas.pages.splice(vm.canvas.currentPage, 1);
                    if (vm.canvas.currentPage >= vm.canvas.pages.length) {
                        vm.canvas.currentPage = vm.canvas.pages.length - 1; 
                    }
                    clearCanvas();
                    loadCanvasPage(vm.canvas.currentPage);
                }
            });
        }
        
        function validateRemoveCanvasPage(callback) {
            var count = 0;
            vm.fabricCanvas.forEachObject(function(obj) {
                if (obj.selectable) {
                    count++;
                }
            });
            if (count > 0) {
                showModalConfirmation("Remove page action", "Are you sure you want to remove this page?", function(result) {
                    if (!result) {
                        callback(false);
                    } else {
                        callback(true);
                    }
                });
            } else {
                callback(true);
            }
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
        
        function initNavigationTemplates() {
            if (vm.canvas.navigationTemplates.nextPageInstruction === null) {
                initPageNumberTemplate();
                initNextPageTemplate();
                initFinalPageTemplate();
            }
        }
        
        function initPageNumberTemplate() {
            var templateName = fabricConstants.defaultTemplates.pageNumber.name;
            var template = getBallotTemplateByName(templateName);
            if (template !== null) {
                var templateJson = JSON.parse(template.definition);
                templateJson.top = 0;
                templateJson.left = 525;
                vm.canvas.navigationTemplates.pageNumber = templateJson;
            }
        }
        
        function initNextPageTemplate() {
            var templateName = fabricConstants.defaultTemplates.nextPageInstruction.name;
            var template = getBallotTemplateByName(templateName);
            if (template !== null) {
                var templateJson = JSON.parse(template.definition);
                templateJson.top = vm.fabricCanvas.height - templateJson.height;
                templateJson.left = vm.fabricCanvas.width - templateJson.width;
                vm.canvas.navigationTemplates.nextPageInstruction = templateJson;
            }
        }
        
        function initFinalPageTemplate() {
            var templateName = fabricConstants.defaultTemplates.finalPageInstruction.name;
            var template = getBallotTemplateByName(templateName);
            if (template !== null) {
                var templateJson = JSON.parse(template.definition);
                templateJson.top = vm.fabricCanvas.height - templateJson.height;
                templateJson.left = vm.fabricCanvas.width - templateJson.width;
                vm.canvas.navigationTemplates.finalPageInstruction = templateJson;
            }
        }
        
        function loadBallotOptionTemplatesNew() {
            if (usingLocalStorage) {
                loadBallotOptionTemplatesLocal();
                includePageNumberingTemplate();
                includeNavPageTemplate();
                initNavigationTemplates();
            } else {
                $log.info('Loading BallotOption Templates...');
                ballotDesignerService.getBallotTemplatesList().
                then(function(data) {
                    if (data.data.data) {
                        $log.info("Templates loaded: " + data.data.data.length);
                        vm.ballotOptionTemplates = data.data.data;
                        includePageNumberingTemplate();
                        includeNavPageTemplate();
                        initNavigationTemplates();
                        filterBallotTemplatesType();
                    } else {
                        $log.info("No ballot templates were found");
                    }
                },
                function(data, status) {
                    $log.info('Error: ' + status);
                });
            }
        }
        
        vm.init = function () {
            var gridColumnsWidth = canvasProperties.grid.columnSeparation;
            var gridRowsHeight = canvasProperties.grid.rowSeparation;
            var gridColumns = vm.currentPageSize.columns;
            var gridRows = vm.currentPageSize.rows;

            if (vm.fabricCanvas === null) {
                $scope.fabric = new fabric({
                    JSONExportProperties : fabricConstants.JSONExportProperties,
                    shapeDefaults : fabricConstants.shapeDefaults,
                    rectDefaults : fabricConstants.rectDefaults,
                    textDefaults : fabricConstants.textDefaults,
                    json : {
//                        width : canvasProperties.width,
//                        height : canvasProperties.height,
//                        gridSpacing : gridRowsHeight,
                        colSeparation: gridColumnsWidth,
                        rowSeparation: gridRowsHeight,
                        cols: gridColumns,
                        rows: gridRows,
//                        enablePropertiesDialog: true
                    }
                });
                
                vm.fabricCanvas = $scope.fabric.getCanvas();
                
                vm.fabricCanvas.on('object:selected', function(element) {
                    $log.info('MainController - object:selected event detected');
                    vm.shape = vm.fabricCanvas.getActiveObject();
                    // the selection has an user initiated event (user click)
                    if (element.e && element.e.type === 'mousedown') {
                        $scope.fabric.selectActiveObject();
                        $scope.$apply();
                    }
                });
                
                vm.fabricCanvas.on('selection:cleared', function(element) {
                    if (element.e && element.e.type === 'mousedown') {
                        vm.shape = null;
                        $scope.fabric.deselectActiveObject();
                        $scope.$apply();
                    }
                });
                
                loadBallotOptionTemplatesNew();
                loadBallotStyles();
                
            }
            
            $scope.fabric.createGrid(gridColumns, gridRows, gridColumnsWidth, gridRowsHeight);
            $scope.fabric.addImage(baseTemplateUrl + "images/qr154.png", {
                top: 0,
                left: 0,
                width: 75,
                height: 75,
                hoverCursor: "not-allowed",
                hasRotatingPoint: false,
                hasControls: false,
                selectable: false
            });
            
            if (vm.ballotOptionTemplates) {
                includePageNumberingTemplate();
                includeNavPageTemplate();
            }
        };

        vm.editTemplateData = editTemplateData;
        function editTemplateData() {
            var currentTemplate = vm.fabricCanvas.getActiveObject();
            currentTemplate.isBeingEdited = true;
            drawTemplateIntoCanvas(currentTemplate);
        }
        
        function includePageNumberingTemplate() {
            var templateName = fabricConstants.defaultTemplates.pageNumber.name;
            createFabricObjectFromTemplateWithNameAsync(templateName, function(pageNumberingTemplate) {
                if (pageNumberingTemplate) {
                    pageNumberingTemplate.set({
                        top: 0, left: 525,
                        hoverCursor: "not-allowed",
                        hasControls: false,
                        selectable: false
                    });
                    replacePlaceholder(pageNumberingTemplate, "${pageNumber}", vm.canvas.currentPage + 1);
                    replacePlaceholder(pageNumberingTemplate, "${pageTotal}", vm.canvas.pages.length);
                    renderStaticTemplate(pageNumberingTemplate);
                } else {
                    // draw warning box
                    $log.info("Page numbering template not found (name: " + templateName + ")");
                }
            });
        }
        
        function includeNavPageTemplate() {
            var templateName = fabricConstants.defaultTemplates.nextPageInstruction.name;
            var finalPageTemplate = fabricConstants.defaultTemplates.finalPageInstruction;
            if ((vm.canvas.currentPage + 1) === vm.canvas.pages.length) {
                templateName = finalPageTemplate.name;
            }
            createFabricObjectFromTemplateWithNameAsync(templateName, function(navPageTemplate) {
                $log.info("navPageTemplate returned with: " + navPageTemplate);
                if (navPageTemplate) {
                    navPageTemplate.set({
                        top: vm.fabricCanvas.height - navPageTemplate.height,
                        left: vm.fabricCanvas.width - navPageTemplate.width,
                        hoverCursor: "not-allowed",
                        hasControls: false,
                        selectable: false
                    });
                    renderStaticTemplate(navPageTemplate);
                } else {
                    // draw warning box
                    $log.info("Navigational template not found (name: " + templateName + ")");
                }
            })
        }
        
        function createFabricObjectFromTemplateWithNameAsync(templateName, callback) {
            var template = getBallotTemplateByName(templateName);
            if (template !== null) {
                parseFabricObjectFromJsonAsync(template.definition, function(fabricObject) {
                    fabricObject.set({
                        templateCode: template.code,
//                      templateCustomCode: template.customCode,
                        templateType: template.type,
                    });
                    callback(fabricObject);
                });
            } else {
                callback(null);
            }
        }

        /**
         * Returns a Fabric object created from the indicated template code. 
         * This function finds a template with the indicated code, parses the 
         * json definition, and returns the Fabric object created from that 
         * definition.
         * Returns null if no ballot template exists with the indicated code.
         * @param templateCode a numeric code which identifies a ballot
         * template.
         */
        function createFabricObjectFromTemplateWithCode(templateCode) {
            var fabricObject = null;
            var template = getBallotTemplateByCode(templateCode);
            if (template !== null) {
                fabricObject = parseFabricObjectFromJson(template.definition);
                fabricObject.set({
                    templateCode: template.code,
//                    templateCustomCode: template.customCode,
                    templateType: template.type,
                    hasControls: false
                });
            }
            return fabricObject;
        }
        
        /**
         * Gets a ballot template identified by the indicated template code.
         */
        function getBallotTemplateByCode(templateCode) {
            var ballotOptionTemplates = vm.ballotOptionTemplates;
            var templateIsFound = false;
            var ballotTemplate = null;
            for (var n = 0; n < ballotOptionTemplates.length && !templateIsFound; n++) {
                if (ballotOptionTemplates[n].code === templateCode) {
                    ballotTemplate = ballotOptionTemplates[n];
                    templateIsFound = true;
                }
            }
            return ballotTemplate;
        }
        
        /**
         * Gets a ballot template identified by the indicated template name.
         */
        function getBallotTemplateByName(templateName) {
            var ballotOptionTemplates = vm.ballotOptionTemplates;
            var templateIsFound = false;
            var ballotTemplate = null;
            for (var n = 0; n < ballotOptionTemplates.length && !templateIsFound; n++) {
                if (ballotOptionTemplates[n].name === templateName) {
                    ballotTemplate = ballotOptionTemplates[n];
                    templateIsFound = true;
                }
            }
            return ballotTemplate;
        }
        
        $scope.$on('canvas:created', vm.init);
        
        $scope.$on('canvas:editTemplatePreview', vm.editTemplateData);
        
        $scope.$on('$locationChangeStart', function( event ) {
            if (canvasIsDirty()) {
//                showModalConfirmation('Ballot style modified', 
//                        "There are unsaved changes. Are you sure you want to leave this page?", 
//                        function(result) {
//                    if (!result) {
//                        event.preventDefault();
//                    }
//                });
                var answer = confirm("There are unsaved changes. Are you sure you want to leave this page?")
                if (!answer) {
                    event.preventDefault();
                }
            }
        });
        
    }
    
    
})();


(function() {
    'use strict';
//Please note that $uibModalInstance represents a modal window (instance) dependency.
//It is not the same as the $uibModal service used above.

    angular.module('ballotDesigner').controller('AssociateContestCtrl', AssociateContestCtrl);
    
    AssociateContestCtrl.$inject = ['ballotDesignerService', '$uibModalInstance', 'template', 'writeInSupport'];
    
    function AssociateContestCtrl(ballotDesignerService, $uibModalInstance, template, writeInSupport) {
        var modalCtrl = this;

        modalCtrl.writeInEnabled = writeInSupport;
        modalCtrl.validationError = '';
        modalCtrl.contestClasses = [];
        modalCtrl.writeInOptions = [{code: 0, text: 'Display write-in section'},
            {code: 1, text: 'Do not create a write-in section'}];
        modalCtrl.writeInOption = modalCtrl.writeInOptions[0];
        modalCtrl.selected = {
                contestClass: {},
                previewData: {
                    eligibleOptions: 2,
                    voteFor: 1,
                    writeIn: 1,
                    columns: 1
                }
        };
        
        if (template.isBeingEdited) {
            modalCtrl.selected.contestClass = angular.extend({}, template.contestClass);
            modalCtrl.selected.previewData = angular.extend({}, template.previewData);
        }
        
        if (modalCtrl.selected.previewData.writeIn > 0) {
            modalCtrl.writeInOption = modalCtrl.writeInOptions[0];
        } else {
            modalCtrl.writeInOption = modalCtrl.writeInOptions[1];
        }
        
        modalCtrl.ok = function () {
            if (validateFields()) {
                var previewData = modalCtrl.selected.previewData;
                if (!modalCtrl.writeInEnabled ||
                    modalCtrl.writeInOption.code === 1) {
                    previewData.writeIn = 0;
                } else {
                    previewData.writeIn = previewData.voteFor;
                }
                $uibModalInstance.close(modalCtrl.selected);
            };
        };
        
        modalCtrl.cancel = function () {
            $uibModalInstance.dismiss('cancel');
        };
        
        modalCtrl.loadContestClasses = function() {
            ballotDesignerService.getContestClasses().
            then(function(response) {
                if (response.data) {
                    var contestClasses = response.data;
                    console.log("response.data length: " + contestClasses.length);
                    for (let n = 0; n < contestClasses.length; n++) {
                        if (contestClasses[n].type === 'REGULAR') {
                            modalCtrl.contestClasses.push(contestClasses[n]);
                        }
                    }
                }
                
            });
        }
        
        function validateFields() {
            var result = true;
            modalCtrl.validationError = '';
            
            var contestClass = modalCtrl.selected.contestClass;
            var eligibleOptions = modalCtrl.selected.previewData.eligibleOptions;
            var voteFor = modalCtrl.selected.previewData.voteFor;
            var writeIn = modalCtrl.selected.previewData.writeIn;
            var columnsNumber = modalCtrl.selected.previewData.columns;
            
            if (contestClass.code == undefined) {
                setValidationError("You must select a contest class");
                result = false;
            }
            if (!valueIsPositiveInteger(eligibleOptions)) {
                setValidationError("The 'Eligible options' field should have a positive integer value greater than 0");
                result = false;
            }
            if (!valueIsPositiveInteger(voteFor)) {
                setValidationError("The 'Vote for' field should have a positive integer value greater than 0");
                result = false;
            }
            if (!valueIsPositiveInteger(columnsNumber)) {
                setValidationError("The 'Contest columns' field should have a positive integer value greater than 0");
                result = false;
            }
            return result;
        }
        
        function valueIsPositiveInteger(value) {
            var result = false;
            if (Number(value) && Number(value % 1) === 0 && value > 0) {
                result = true;
            }
            return result;
        }
        
        function setValidationError(translation) {
            if (modalCtrl.validationError === '') {
                modalCtrl.validationError = "<li>" + translation + "</li>";
            } else {
                modalCtrl.validationError += '<li>' + translation + "</li>";
            }
        }
        
        modalCtrl.loadContestClasses();
    }
})();


(function() {
    'use strict';
//Please note that $uibModalInstance represents a modal window (instance) dependency.
//It is not the same as the $uibModal service used above.

    angular.module('ballotDesigner').controller('AssociateIssueCtrl', AssociateIssueCtrl);
    
    AssociateIssueCtrl.$inject = ['ballotDesignerService', '$uibModalInstance', 'template'];
    
    function AssociateIssueCtrl(ballotDesignerService, $uibModalInstance, template) {
        var vm = this;

        vm.validationError = '';
        vm.contestClasses = [];
        vm.selected = {
                contestClass: {},
                previewData: {
                    issueContent: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.'
                }
        };
        if (template.isBeingEdited) {
            vm.selected.contestClass = angular.extend({}, template.contestClass);
            vm.selected.previewData = angular.extend({}, template.previewData);
        }
    
        vm.ok = function () {
            if (validateFields()) {
                $uibModalInstance.close(vm.selected);
            };
        };
    
        vm.cancel = function () {
            $uibModalInstance.dismiss('cancel');
        };
        
        vm.loadContestClasses = function() {
            ballotDesignerService.getContestClasses().
            then(function(response) {
                if (response.data) {
                    var contestClasses = response.data;
                    console.log("response.data length: " + contestClasses.length);
                    for (let n = 0; n < contestClasses.length; n++) {
                        if (contestClasses[n].type === 'ISSUE') {
                            vm.contestClasses.push(contestClasses[n]);
                        }
                    }
                }
                
            });
        }
        
        function validateFields() {
            var result = true;
            vm.validationError = '';
            
            var contestClass = vm.selected.contestClass;
            var issueContent = vm.selected.previewData.issueContent;
            
            if (contestClass.code == undefined) {
                setValidationError("You must select a contest class");
                result = false;
            }
            if (issueContent == undefined || issueContent === '') {
                setValidationError("The 'Issue content' field can't be empty");
                result = false;
            }
            return result;
        }
        
        function setValidationError(translation) {
            if (vm.validationError === '') {
                vm.validationError = "<li>" + translation + "</li>";
            } else {
                vm.validationError += '<li>' + translation + "</li>";
            }
        }
        
        vm.loadContestClasses();
    }
})();


(function() {
    'use strict';
//Please note that $uibModalInstance represents a modal window (instance) dependency.
//It is not the same as the $uibModal service used above.

    angular.module('ballotDesigner').controller('SetupStraightPartyCtrl', SetupStraightPartyCtrl);
    
    SetupStraightPartyCtrl.$inject = ['ballotDesignerService', '$uibModalInstance', 'template'];
    
    function SetupStraightPartyCtrl(ballotDesignerService, $uibModalInstance, template) {
        var vm = this;

        vm.validationError = '';
        vm.selected = {
            contestClass: {},
            previewData: {
                eligibleOptions: 2,
                columns: 1
            }
        };
        
        if (template.isBeingEdited) {
            vm.selected.previewData = angular.extend({}, template.previewData);
        }
    
        vm.ok = function () {
            if (validateFields()) {
                $uibModalInstance.close(vm.selected);
            };
        };
    
        vm.cancel = function () {
            $uibModalInstance.dismiss('cancel');
        };
        
        function validateFields() {
            var result = true;
            vm.validationError = '';
            
            var eligibleOptions = vm.selected.previewData.eligibleOptions;
            var columnsNumber = vm.selected.previewData.columns;
            
            if (!valueIsPositiveInteger(eligibleOptions)) {
                setValidationError("The 'Eligible options' field should have a positive integer value greater than 0");
                result = false;
            }
            if (!valueIsPositiveInteger(columnsNumber)) {
                setValidationError("The 'Columns' field should have a positive integer value greater than 0");
                result = false;
            }
            return result;
        }
        
        function valueIsPositiveInteger(value) {
            var result = false;
            if (Number(value) && Number(value % 1) === 0 && value > 0) {
                result = true;
            }
            return result;
        }
        
        function setValidationError(translation) {
            if (vm.validationError === '') {
                vm.validationError = "<li>" + translation + "</li>";
            } else {
                vm.validationError += '<li>' + translation + "</li>";
            }
        }

        ballotDesignerService.getContestClasses().
        then(function(response) {
            if (response.data) {
                var contestClasses = response.data;
                console.log("response.data length: " + contestClasses.length);
                for (let n = 0; n < contestClasses.length; n++) {
                    if (contestClasses[n].type === 'STRAIGHT_PARTY') {
                        vm.selected.contestClass = contestClasses[n];
                        console.log(vm.selected.contestClass);
                    }
                }
            }

        });

    }
})();


(function() {
    'use strict';
//Please note that $uibModalInstance represents a modal window (instance) dependency.
//It is not the same as the $uibModal service used above.

    angular.module('ballotDesigner').controller('ModalCtrl', ModalCtrl);
    
    ModalCtrl.$inject = ['ballotDesignerService', '$uibModalInstance', 'title', 'message'];
    
    function ModalCtrl(ballotDesignerService, $uibModalInstance, title, message) {
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

    var ballotDesignerService = function ($http, $q, $timeout) {

        var contestClassDatasource = "contestClass";
        
        this.getContestClasses = function() {
            return $http({
//                url : '/contests/rs/contestClasses',
                url : '/ballot-designer/rs/contestClasses',
                method : 'GET',
                params : {}
            });
        };
        
        this.getBallotTemplatesList = function() {
            return $http({
                url: '/ballot-designer/rs/templates',
                method : 'GET',
                params : {}
            });
        }
        
        this.deleteBallotStyle = function(ballotStyleCode) {
            return $http({
                url: '/ballot-designer/rs/styles/' + ballotStyleCode,
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json'
                }
            })
        }

        this.saveBallotStyle = function(name, types, definition) {
            return $http({
                url: '/ballot-designer/rs/styles',
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                data : definition,
                params: {
                    name: name,
                    types: types
                }
            })
        }

        this.saveBallotStyleContestAssociations = function(ballotStyleCode, contestAssociations) {
            return $http({
                url: '/ballot-designer/rs/styles/' + ballotStyleCode + '/contestAssociations',
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                params: {
//                  ballotStyleCode: ballotStyleCode,
                    contestAssociations: contestAssociations
                }
            })
        }

        this.previewAsPdf = function(definition) {
            return $http({
                url: '/ballot-designer/rs/preview',
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                data : definition
            });
        }

        this.getBallotStylesList = function() {
            return $http({
                url: '/ballot-designer/rs/styles',
                method : 'GET',
                params : {}
            });
        }

        this.getBallotStyle = function(ballotStyleCode) {
            return $http({
                url: '/ballot-designer/rs/styles/' + ballotStyleCode,
                method : 'GET'
            });
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

        /*
        this.getMockContestData = function() {
            const mockData = [
                {'code': 1, 'name': 'THE President'},
                {'code': 2, 'name': 'Senator'},
                {'code': 3, 'name': 'Board Member'},
                {'code': 4, 'name': 'Attorney'},
                {'code': 5, 'name': 'Coroner'}
                ];
            
            var deferred = $q.defer();
            
            setupResponsePromise(deferred, mockData);
            
            return deferred.promise;
        }
        */
        
        
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

        this.getAllContestClass = function () {
            return $http.get('/contests/restapi/?dataSource=' + contestClassDatasource + "&operationType=fetch&operationId=complete",
                {headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' }});
        };
        
        this.getContestClassTypes = function() {
            const contestClassTypes = [{"TYPE": "REGULAR"},
                                  {"TYPE": "ISSUE"},
                                  {"TYPE": "RANKED_CHOICE"},
                                  {"TYPE": "CUMULATIVE"},
                                  {"TYPE": "WEIGHTED"},
                                  {"TYPE": "APPROVAL"}];
            return contestClassTypes;
        }
        
        this.getContestClassElectionTypes = function() {
            const contestClassElectionTypes = [{"TYPE": "ABSOLUTE_MAJORITY"},
                                    {"TYPE": "MULTIPLE_RELATIVE_MAJORITY"},
                                    {"TYPE": "PARTY_LIST_PHILIPPINES"},
                                    {"TYPE": "RELATIVE_MAJORITY"},
                                    {"TYPE": "RELATIVE_REPRESENTATION_BALANCE"},
                                    {"TYPE": "RELATIVE_REPRESENTATION_BALANCE_ISOLATED"},
                                    {"TYPE": "RELATIVE_REPRESENTATION_BALANCE_ONLY_LIST"},
                                    {"TYPE": "RELATIVE_REPRESENTATION_BALANCE_OPEN_LIST"},
                                    {"TYPE": "RELATIVE_REPRESENTATION_BALANCE_OPEN_LIST_LOCKED"}
                                    ];
            return contestClassElectionTypes;
        }
        
        this.getBallotOptionTemplates = function () {
            
        }

    }

    ballotDesignerService.$inject = injectParams;

    angular.module('ballotDesigner').service('ballotDesignerService', ballotDesignerService);

})(angular);