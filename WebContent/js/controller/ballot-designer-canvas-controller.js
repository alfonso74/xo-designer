var ccScope = {};

(function() {
    'use strict';

    angular.module('ballotDesigner').controller('ballotDesignerCanvasController', BallotDesignerCanvasController); 
    
    BallotDesignerCanvasController.$inject = ['ballotDesignerService', '$uibModal', 
                                        'fabric', 
                                        'fabricConstants',
                                        '$scope',
                                        '$log'];
    
    function BallotDesignerCanvasController(ballotDesignerService, $uibModal, fabric, fabricConstants, $scope, $log) {
        var vm = this;
        
        ccScope = this;
        
        var usingLocalStorage = true;
        
        var canvasProperties = fabricConstants.canvasDefaults;
        
        vm.shape = {};
        vm.fontFamilies = fabricConstants.fonts;
        vm.fontSizes = fabricConstants.fontSizes;
        vm.markTypes = fabricConstants.markTypes;
        
        $scope.fabric = {};
        vm.fabricCanvas = {};
        
        vm.currentView = 'mainView';
        
        vm.resizeCanvas = resizeCanvas;
        
        function resizeCanvas(canvasWidth, canvasHeight) {
            canvasProperties.width = canvasWidth;
            canvasProperties.height = canvasHeight;
            vm.init();
        }
        
        vm.clear = function() {
        	vm.fabricCanvas.clear();
        	vm.init();
        	localStorage.removeItem('ballotStyles');
        }
        
        vm.loadBallotStyle = function() {
            vm.fabricCanvas.clear();
            vm.init();
            
            if (usingLocalStorage) {
                loadBallotStyleLocal();
            } else {
                let templateCode = ballotDesignerScope.selectedBallotStyleCode;
                
                $log.info('Loading ballot style with code: ' + templateCode);
                ballotDesignerService.getBallotStyle(templateCode).
                then(function(response) {
                    if (response.data) {
                        let ballotStyle = response.data.data;
                        console.log("Response data data length: " + ballotStyle.length);
                        vm.fabricCanvas.loadFromJSON(ballotStyle.definition, function() {
                            vm.fabricCanvas.renderAll();
                        });
                    }
                    
                });
            }
        }
        
        function loadBallotStyleLocal () {
        	var ballotStyleName = ballotDesignerScope.ballotStyleName;
        	console.log("Cargando ballot template: " + ballotDesignerScope.ballotStyleName);
        	
        	var ballotTemplates = [];
        	
        	var found = false;
        	var retrievedObject = localStorage.getItem('ballotStyles');
        	if (!retrievedObject) {
        		retrievedObject = [];
        	} else {
        		var ballotTemplates = JSON.parse(retrievedObject);
        		$log.info("Ballot styles found: " + ballotTemplates.length);
            	for (var n = 0; n < ballotTemplates.length; n++) {
            		if (ballotTemplates[n].name === ballotStyleName) {
            			found = true;
            		}
            	}
        	}

        	if (found) {
        		var json = ballotTemplates[n - 1].definition;
        		$log.info("BALLOT TEMPLATE LOADED: " + json);
        		vm.fabricCanvas.loadFromJSON(json, function() {
        			vm.fabricCanvas.renderAll();
        		});
        	}
        }
        
        vm.saveBallotStyle = function() {
            if (usingLocalStorage) {
                saveBallotStyleLocal();
            } else {
                if (!ballotDesignerScope.ballotStyleName || ballotDesignerScope.ballotStyleName === '') {
                    ballotDesignerScope.fieldFocus('ballotStyleName');
                    return;
                }
                ballotDesignerService.saveBallotStyle(ballotDesignerScope.ballotStyleName, 
                        'ELECTION_DAY', 
                        vm.fabricCanvas.toObject(['id', 'subtype', 'contest', 'candidatesNo'])).
                success(function(data, status) {
                    $log.info("Ballot style saved successfully");
                    $('#save-confirmation-modal').modal('show');
                }).
                error(function(data, status) {
                    $log.error('Error: ' + status);
                });
            }
        }
        
        function saveBallotStyleLocal () {
            if (!ballotDesignerScope.ballotStyleName || ballotDesignerScope.ballotStyleName === '') {
                ballotDesignerScope.fieldFocus('ballotStyleName');
                return;
            }
            
        	var ballotStyleName = ballotDesignerScope.ballotStyleName;
        	console.log("Saving ballot template: " + ballotDesignerScope.ballotStyleName);
        	
        	var ballotTemplates = [];
        	
        	var found = false;
        	var retrievedObject = localStorage.getItem('ballotStyles');
        	if (!retrievedObject) {
        		retrievedObject = [];
        	} else {
        		var ballotTemplates = JSON.parse(retrievedObject);
            	for (var n = 0; n < ballotTemplates.length; n++) {
            		if (ballotTemplates[n].name === ballotStyleName) {
            			ballotTemplates[n] = createBallotStyleDefinition(ballotStyleName);
            			found = true;
            		}
            	}
        	}

        	if (!found) {
        		ballotTemplates.push(createBallotStyleDefinition(ballotStyleName));
        	}
        	
        	// Put the object into storage
        	var jsonToStore = JSON.stringify(ballotTemplates);
        	localStorage.setItem('ballotStyles', jsonToStore);
        	
        	console.log("BALLOT TEMPLATE DEFINITION:\n" + jsonToStore);
        	$('#save-confirmation-modal').modal('show');
        }
        
        function createBallotStyleDefinition(ballotStyleName) {
            var templateDefinition = {'name': ballotStyleName,
                    'code': Math.floor(Math.random() * 10000) + 1,
                    'definition': JSON.stringify(vm.fabricCanvas.toObject(['id', 'subtype', 'contest', 'candidatesNo']))};
//                    'definition': JSON.stringify(vm.fabricCanvas)};
            return templateDefinition;
        }
        
        vm.drop = function(e) {
            e.preventDefault;
            var data = e.dataTransfer.getData("text");
            
            var found = false;
            
            var ballotOptionTemplates = ballotDesignerScope.ballotOptionTemplates;
            for (var n = 0; n < ballotOptionTemplates.length && !found; n++) {
                if (ballotOptionTemplates[n].name === data) {
                    found = true;
                }
            }
            if (found) {
                var fabricObject = parseFabricObjectFromJson(ballotOptionTemplates[n-1].definition);
                associateContest(fabricObject);
                vm.fabricCanvas.add(fabricObject);
            }
        }
        
        vm.previewWithCandidates = function() {
            $log.info("Calling vm.previewWithCandidates()");
            
            var previewObjects = [];
            vm.fabricCanvas.forEachObject(function(obj) {
                if (obj.type === 'group') {
//                    $log.info("OBJ: " + JSON.stringify(obj.toObject(['id'])));
                    $log.info("Contest: " + JSON.stringify(obj.contest));
                    $log.info("CandidateNo: " + obj.candidatesNo);
                    
                    var ballotOption = extractBallotOptionFromContest(obj);
                    var ballotOptionJson = JSON.stringify(ballotOption.toObject(['id']));
                    
                    replaceContestName(obj, obj.contest.name);
                    replaceFirstBallotOptionVariables(obj, ballotOptionJson, 0);
                    for (var n = 1; n < (obj.candidatesNo); n++) {
                        addBallotOptionToContestGroup(obj, ballotOptionJson, n);
                    }
                    
                    previewObjects.push(obj);
                    $log.info("BallotOptionGroup: " + JSON.stringify(obj.toObject(['id'])));
                }
            });
            
            vm.fabricCanvas.clear().renderAll();
            for (var n = 0; n < previewObjects.length; n++) {
                vm.fabricCanvas.add(previewObjects[n]);
            }
        }
        
        function replaceContestName(contestGroup, contestName) {
        	contestGroup.forEachObject(function(obj) {
        		if (obj.type === 'text') {
        			obj.text = obj.text.replace('$contestClass', contestName);
        		}
        	});
        }
        
        function replaceFirstBallotOptionVariables(contestGroup, ballotOptionJson, index) {
//        	contestGroup._objects[2]._objects[2].text = 'Candidato 0';
        	contestGroup.forEachObject(function(obj) {
        		if (obj.type === 'group') {
        			obj.forEachObject(function(objLvl2) {
        				if (objLvl2.type === 'text') {
        					objLvl2.text = 'Candidate 0';
        				}
        			});
        		}
        	});
        }
        
        function addBallotOptionToContestGroup(contestGroup, ballotOptionJson, index) {
        	ballotOptionJson = ballotOptionJson.replace('$candidateName', 'Candidate ' + index);
            var newGroup = parseFabricObjectFromJson(ballotOptionJson);
            newGroup.left = contestGroup.left;
            newGroup.top = contestGroup.top + contestGroup.height;
//            $log.info("New BallotOptionGroup: " + JSON.stringify(newGroup.toObject(['id'])));
            contestGroup.addWithUpdate(newGroup);
        }
        
        function extractBallotOptionFromContest(contestGroup) {
            var result = null;
            contestGroup.forEachObject(function(obj) {
                if (obj.type === 'group') {
                    result = obj;
                }
            });
            return result;
        }
        
        
        function associateContest(fabricObject) {
            var modalInstance = $uibModal.open({
                templateUrl: 'associateContest.html',
                size: 'md',
//              templateUrl: 'myModalContent.html',
                controller: 'ModalInstanceCtrl',
                controllerAs: 'modalCtrl',
                resolve: {
                    items: function() {
                        return ['item1', 'item2', 'item3'];
                    }
                }
            });

            modalInstance.result.then(function(selections) {
                $log.info("Selections: " + JSON.stringify(selections));
                fabricObject.contest = selections.contestClass;
                fabricObject.candidatesNo = selections.candidatesNo;
            });
        };
         
        function loadJsonIntoCanvas(json) {
            var fabricObject = parseFabricObjectFromJson(json);
            vm.fabricCanvas.add(fabricObject);
        }
        
        function parseFabricObjectFromJson(json) {
            var fabricJson = JSON.parse('{"objects":[' + json + '],"background":""}');
            var objects = fabricJson.objects;
            var fabricObject = null;
            
            if (objects.length > 1) {
                // do nothing
            } else {
                var theObject = objects[0];
                var klass = $scope.fabric.getKlass(theObject.type);
                if (klass.async) {
                    klass.fromObject(theObject, function (img) {
                        fabricObject = img;
                    });
                } else {
                    fabricObject = klass.fromObject(theObject);
                }
            }
            return fabricObject;
        } 
        
        vm.allowDrop = function(e) {
        	console.log("Allow drop!");
        	e.preventDefault();
        }
        
        
        
        vm.init = function () {
            var canvasWidth = canvasProperties.width;
            var canvasHeight = canvasProperties.height;
            var gridSpacing = canvasProperties.grid.rowSeparation;
        	
        	$scope.fabric = new fabric({
        		JSONExportProperties: fabricConstants.JSONExportProperties,
        		shapeDefaults: fabricConstants.shapeDefaults,
        		rectDefaults: fabricConstants.rectDefaults,
        		textDefaults: fabricConstants.textDefaults,
        		json: {width: canvasWidth, height: canvasHeight, gridSpacing: gridSpacing}
        	});
        	
        	vm.fabricCanvas = $scope.fabric.getCanvas();

        	// draw the Vertical lines
        	for (var x = gridSpacing; x <= canvasWidth; x += gridSpacing) {
        	    $scope.fabric.addGridLine([ x, 0, x, canvasHeight], 
        	            { stroke: '#ccc', selectable: false, strokeDashArray: [3, 3]});
        	}

        	// draw the Horizontal lines
        	for (var y = gridSpacing; y <= canvasHeight; y += gridSpacing) {
        		$scope.fabric.addGridLine([ 0, y, canvasWidth, y], 
        				{ stroke: '#ccc', selectable: false, strokeDashArray: [3, 3]});
        	}
        	
        	console.log("CANVAS JSON: " + vm.fabricCanvas.toJSON());

        	$scope.fabric.deselectActiveObject();

            vm.fabricCanvas.on('object:selected', function(element) {
                console.log('MainController - object:selected event detected');
//                optionDesignerService.objectSelectedListener(element);
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

        };

        $scope.$on('canvas:created', vm.init);
        
    }
    
})();



(function() {
    'use strict';
//Please note that $uibModalInstance represents a modal window (instance) dependency.
//It is not the same as the $uibModal service used above.

    angular.module('ems.fabric').controller('ModalInstanceCtrl', ModalInstanceCtrl);
    
    ModalInstanceCtrl.$inject = ['ballotDesignerService', '$uibModalInstance', 'items'];
    
    function ModalInstanceCtrl(ballotDesignerService, $uibModalInstance, items) {
        var modalCtrl = this;
//        modalCtrl.items = items;
//        modalCtrl.selected = {
//                item: modalCtrl.items[0]
//        };
        modalCtrl.contestClasses = {};
        modalCtrl.selected = {
                contestClass: {},
                candidatesNo: 1
        };
    
        modalCtrl.ok = function () {
            $uibModalInstance.close(modalCtrl.selected);
        };
    
        modalCtrl.cancel = function () {
            $uibModalInstance.dismiss('cancel');
        };
        
        modalCtrl.loadContestClasses = function() {
            ballotDesignerService.getMockContestClasses().
            then(function(response) {
                if (response.data) {
                    let contestClasses = response.data;
                    console.log("response.data length: " + contestClasses.length);
                    modalCtrl.contestClasses = contestClasses;
                }
                
            });
        }
        
        modalCtrl.loadContestClasses();
    }
})();
