(function() {
    'use strict';
    
    /**
     * Fills a template with mock data.
     */
    angular.module('ballotTemplateDesigner').factory('contestPreview', ContestPreview);
    
    ContestPreview.$inject = ['$log'];
    
    function ContestPreview($log) {
        
        function fillContestTemplate(fabric, fabricCanvas, template, ballotDesignerCustomProperties, availableArea,
                rowHeight, columnWidth) {
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
                replaceTemplateHeaders(fabricCanvas, rowHeight, template, '${contest.name}', template.contestClass.name);
            }
            replaceTemplateHeaders(fabricCanvas, rowHeight, template, '${contest.maxVotes}', data.voteFor);
            
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
                var newGroup = parseFabricObjectFromJson(fabric, ballotOptionJson);
                restoreSizeForMarkersWithinGroup(newGroup, columnWidth, rowHeight);
                
                newGroup.set(nextPosition);
                if (!ballotOptionGroupFitsInsideArea(newGroup, availableArea)) {
                    nextPosition = getNextPositionForBallotOption(basePosition, nextPosition, newGroup, 
                            maxVerticalPos, maxHorizontalPos, n, maxRows);
                    newGroup.set(nextPosition);
                }
                nextPosition = getNextPositionForBallotOption(basePosition, nextPosition, newGroup, 
                        maxVerticalPos, maxHorizontalPos, n, maxRows);
                
                replaceBallotOptionPlaceholder(fabricCanvas, newGroup, '${nomination.name}', 'Candidate ' + (n + 1));
                replaceBallotOptionPlaceholder(fabricCanvas, newGroup, '${party.name}', 'Party ' + (n + 1));
                var additionalInfoFound = true;
                for (let i = 0; additionalInfoFound && i < 10; i++) {
                    additionalInfoFound = replaceBallotOptionPlaceholder(fabricCanvas, newGroup, 
                            '${nomination.additionalInfo[' + i + ']}', 'Additional Candidate ' + (i + 1));
                }
                template.addWithUpdate(newGroup);
            }
            if (writeIn) {
                var writeInJson = JSON.stringify(writeIn.toObject(ballotDesignerCustomProperties));
                
                for (let n = data.eligibleOptions; n < (data.eligibleOptions + data.writeIn); n++) {
                    var newGroup = appendJsonGroupToContestGroup(fabric, template, writeInJson, 
                            rowHeight, columnWidth);
                    
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
            
            adjustContestBordersToNewSize(fabric, template);
            
            if (template.left + template.width - 3 > maxHorizontalPos ||
                    template.top + template.height - 3 > maxVerticalPos) {
                templateCanBeRendered = false;
            }
            
            return templateCanBeRendered;
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
        
        function replaceTemplateHeaders(fabricCanvas, rowHeight, ballotTemplate, placeholder, content) {
//          ballotTemplate.destroy();
            var templateHeightAdjusted = false;
            ballotTemplate.forEachObject(function(obj) {
                if (obj.type === 'text' || obj.type === 'textbox') {
                    var cc = obj.clone();
                    var delta = objectHeightDelta(fabricCanvas, cc, placeholder, content);
                    if (delta !== 0) {
                        $log.debug("Changing template height: " + ballotTemplate.height + ", delta: " + delta);
                        resizeObjectInsideGroup(ballotTemplate, obj, delta, rowHeight);
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
        
        /**
         * Finds out if a fabric text or textbox object will change his height
         * due to some text replacement.
         * The function returns a 'delta' value with the difference (which can
         * be a positive or negative value) or zero if the object keeps the 
         * same height.
         */
        function objectHeightDelta(fabricCanvas, obj, placeholder, content) {
            var initialHeight = obj.height;
            obj.text = obj.text.replace(placeholder, content);
            fabricCanvas.add(obj);
            var finalHeight = obj.height;
            fabricCanvas.remove(obj);
            return finalHeight - initialHeight;
        }
        
        /**
         * Almost the same purpose as the resizeObjectInsideBallotOptionGroup
         * function, but for objects that aren't part of any group.
         */
        function resizeObjectInsideGroup(ballotTemplate, objectResized, delta, rowHeight) {
            var verticalPositions = [];
            ballotTemplate.forEachObject(function(obj) {
                verticalPositions.push(obj);
            });
            verticalPositions.sort(function(a, b) {
                return a.top - b.top;
            });

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
        
        function parseFabricObjectFromJson(fabric, json) {
            var fabricJson = JSON.parse(json);
            return createFabricObject(fabric, fabricJson);
        }
        
        function createFabricObject(fabric, jsonObject) {
            var fabricObject = null;
            var klass = fabric.getKlass(jsonObject.type);
            if (klass.async) {
                klass.fromObject(jsonObject, function (img) {
                    fabricObject = img;
                });
            } else {
                fabricObject = klass.fromObject(jsonObject);
            }
            return fabricObject;
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
        
        function ballotOptionGroupFitsInsideArea(ballotOption, area) {
            var result = true;
            if ((ballotOption.top + ballotOption.height - 3) > (area.top + area.height) ||
                    (ballotOption.left + ballotOption.width - 3) > (area.left + area.width)) {
                result = false;
            }
            return result;
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
        
        /**
         * This function searches the indicated group fabric object for the
         * indicated placeholder (a string with the format ${some text}) and
         * replaces it with the indicated content.
         * The fabric object type should be a 'group' and the subtype should
         * be a 'ballotOption' or 'writeIn'.
         */
        function replaceBallotOptionPlaceholder(fabricCanvas, ballotOptionGroup, placeholder, content) {
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
                            var delta = objectHeightDelta(fabricCanvas, obj, placeholder, content);
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
        
        function appendJsonGroupToContestGroup(fabric, contestGroup, jsonGroup, rowHeight, columnWidth) {
            //TODO change the function name
            var newGroup = parseFabricObjectFromJson(fabric, jsonGroup);
            restoreSizeForMarkersWithinGroup(newGroup, columnWidth, rowHeight);
            newGroup.left = contestGroup.left;
            newGroup.top = contestGroup.top + contestGroup.height - 1;
//            contestGroup.addWithUpdate(newGroup);
            return newGroup;
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
        
        function adjustContestBordersToNewSize(fabric, templateObject) {
            var contestBordersGroup = null;
            templateObject.forEachObject(function(obj) {
                if (obj.subtype === 'contestBorders') {
                    contestBordersGroup = obj;
                }
            });
            templateObject.remove(contestBordersGroup);
            fabric.addContestBorders(templateObject);
        }
        
        
        return {
            fillContestTemplate: fillContestTemplate
        }
        
    }
    
})();
