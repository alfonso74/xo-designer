(function() {

    'use strict';

    /*
     * Declare a new module called 'ui.fabric', and list its dependencies.
     * Modules serve as containers to help you organise code within your AngularJS application.
     * Modules can contain sub-modules, making it easy to compose functionality as needed.
     */

    angular.module('ems.fabric')
    .factory('fabric', fabric);

    /*
     * Use $inject to manually identify your dependencies for Angular components.
     * This technique mirrors the technique used by ng-annotate, for automating the creation of minification safe
     * dependencies. If ng-annotate detects injection has already been made, it will not duplicate it.
     */

fabric.$inject = [ '$log', '$rootScope', '$timeout', '$q', 'fabricWindow', 'fabricCanvas', 'canvasDirtyStatus'];

	function fabric($log, $rootScope, $timeout, $q, fabricWindow, fabricCanvas, canvasDirtyStatus) {

        return function(options) {

            var service = this;
            
            var canvasName = options.canvasName;
        	$log.info("Initializing canvas with name: " + canvasName);
            
            service.grid = {};
            
            $log.debug('fabric - loading...');
            
            service.getCanvas = getCanvas;
            service.setCanvasSize = setCanvasSize;
            
        	service.parseFabricObjectsFromJsonObjectAsync = parseFabricObjectsFromJsonObjectAsync;
        	service.createFabricObjectAsync = createFabricObjectAsync;
        
            service.cog = {};
            service.showCog = false;
            
            service.getTemplatePropertiesImage = getTemplatePropertiesImage;
            function getTemplatePropertiesImage() {
                return service.cog;
            }

            /**
             * Helper function to get the current canvas.  The canvas reference
             * is stored in the fabricCanvas service whose main responsibility
             * is to create the initial canvas.
             */
            function getCanvas() {
                return fabricCanvas.getCanvas(canvasName);
            }
            /**
             * Sets a new canvas size.
             * @param colSeparation the grid columns width
             * @param rowSeparation the grid rows height
             * @param cols the number of columns to be drawn in the grid
             * @param rows the number of rows to be drawn in the grid
             */
            function setCanvasSize(cols, rows, colSeparation, rowSeparation) {
                service.grid.columns = cols;
                service.grid.rows = rows;
                service.grid.columnSeparation = colSeparation;
                service.grid.rowSeparation = rowSeparation;
                
                service.grid.width = cols * colSeparation;
                service.grid.height = rows * rowSeparation;
                
                service.grid.space = rowSeparation;
                
                service.getCanvas().setWidth(service.grid.width);
                service.getCanvas().setHeight(service.grid.height);
                service.getCanvas().calcOffset();
            }
            
            service.getKlass = function(objectType) {
            	return new fabricWindow.util.getKlass(objectType);
            }
            
            service.addListener = function(element, event, f) {
                return new fabricWindow.util.addListener(element, event, f);
            }

            /**
             * @name addLine
             * @desc Adds a text object to the canvas
             * @param {Array} [points] An array of points
             * @param {Object} [options] A configuration object, defaults to FabricConstants.lineDefaults
             */
            service.addLine = function(points, options) {

                $log.debug('addLine() - immediate mode');

                options = options || {
                    stroke : '#ccc'
                };

                if (!points) {
                    points = [ 0, 0, 0, 0 ];
                }

                var object = new fabricWindow.Line(points, options);
                object.id = service.createId();

                service.addObjectToCanvas(object);

                return object;
            };
            
            /**
             * @name addGridLine
             * @desc Adds a line object to the canvas
             * @param {Array} [points] An array of points
             * @param {Object} [options] A configuration object, defaults to FabricConstants.lineDefaults
             */
            service.addGridLine = function(points, options) {
                options = options || { stroke: '#ccc', selectable: false};

                if (!points) {
                    points = [ 0, 0, 0, 0 ];
                }

                var object = new fabricWindow.Line(points, options);
                object.id = service.createId();
                service.getCanvas().add(object);

                return object;
            };

            /**
             * @name addRect
             * @desc Adds a text object to the canvas
             * @param {Object} [options] A configuration object, defaults to FabricConstants.rectDefaults
             */
            service.addRect = function(options) {

                $log.info('addRect()');

                options = options || service.rectDefaults;

                var object = new fabricWindow.Rect(options);
                object.id = service.createId();

                if (options.renderToCanvas === undefined || options.renderToCanvas) {
                    service.addObjectToCanvas(object);
                }
                
                return object;
            };
            
            /**
             * @name addOptionMark
             * @desc Adds a 'ballot option mark' object to the canvas.
             * @param {Object} [options] a configuration object
             */
            service.addOptionMark = function(options) {

                $log.info('addOptionMark(), markStyle: ' + options.markStyle);

                options = options || service.rectDefaults;
                
                var object = null;
                if (options.markStyle === 'Circle') {
                    options.radius = (options.width) / 4;
                    object = new fabricWindow.Circle(options);
                    object.width = options.width;
                    object.height = options.height;
                } else if (options.markStyle === 'Oval') {
                    options.rx = (options.width) / 2.5;
                    options.ry = (options.width) / 5;
                    object = new fabricWindow.Ellipse(options);
                    object.width = options.width;
                    object.height = options.height;
                } else {
                    var points = rectanglePoints(0, 0, options.width / 1.5);
                    object = new fabricWindow.Polygon(points, options);
                    object.width = options.width;
                    object.height = options.height;
                }
                object.id = service.createId();

                service.addObjectToCanvas(object);
                return object;
            };
            
            function rectanglePoints(left, top, size) {
                var points = [];
                points.push({x: left, y: top});
                points.push({x: left, y: top + size});
                points.push({x: left + size, y: top + size});
                points.push({x: left + size, y: top});
                return points;
            }
            
            service.addContestBorders = function(templateObject) {
                var left = templateObject.left;
                var top = templateObject.top;
                var width = templateObject.width - 1;
                var height = templateObject.height - 1;
                
                var contestBorders = [];
                contestBorders.push(new fabricWindow.Line(
                        [ left, top, left + width, top],
                        { stroke: 'rgb(0,0,0)', strokeWidth: 2, selectable: false}));
                contestBorders.push(new fabricWindow.Line(
                        [ left, top, left, top + height],
                        { stroke: 'rgb(0,0,0)', strokeWidth: 1, selectable: false}));
                contestBorders.push(new fabricWindow.Line(
                        [ left, top + height, left + width, top + height],
                        { stroke: 'rgb(0,0,0)', strokeWidth: 1, selectable: false}));
                
                var group = new fabricWindow.Group(contestBorders);
                group.subtype = "contestBorders";
                
                templateObject.addWithUpdate(group);
                service.getCanvas().renderAll();
            }

            /**
             * @name addText
             * @desc Adds a text object to the canvas
             * @param {String} text - The text to render on the canvas
             * @param {Object} [options] A configuration object, defaults to FabricConstants.textDefaults
             */
            service.addText = function(text, options) {
                text = text || 'New Text';
                options = options || service.textDefaults;

                var object = new fabricWindow.Text(text, options);
                object.id = service.createId();

                service.addObjectToCanvas(object);
                return object;
            };
            
            service.addTextBox = function(text, options) {
                text = text || 'New Text';
                options = options || service.textDefaults;

                var object = new fabricWindow.Textbox(text, options);
                object.id = service.createId();

                service.addObjectToCanvas(object);
                return object;
            };
            
            //
            // Image
            // ==============================================================
            service.addImage = function(imageURL, options) {
                $log.info("IMG: " + imageURL);
                fabricWindow.Image.fromURL(imageURL, function(object) {
                    object.id = service.createId();
                    service.addObjectToCanvas(object);
                    service.deselectActiveObject();
                }, options);
            };
            
            service.addImageBase64 = function(imageURL, options) {
                $log.info("IMG: " + imageURL);
                let elementId = service.createId();
                getDataUri(imageURL, function(dataUri) {
                    $log.info("IMG data URI: " + dataUri);
                    fabricWindow.Image.fromURL(dataUri, function(object) {
                        object.id = elementId;
                        service.addObjectToCanvas(object);
                    }, options);
                });
                return elementId;
            };
            
            service.addCogImage = function(imageURL, options) {
                $log.info("COG IMG: " + imageURL);
                fabricWindow.Image.fromURL(imageURL, function(object) {
                    object.id = service.createId();
                    service.addObjectToCanvas(object);
                    service.cog = object;
                }, options);
            };
            
            function getDataUri(url, callback) {
                var image = new Image();

                image.onload = function () {
                    var canvas = document.createElement('canvas');
                    canvas.width = this.naturalWidth; // or 'width' if you want a special/scaled size
                    canvas.height = this.naturalHeight; // or 'height' if you want a special/scaled size

                    canvas.getContext('2d').drawImage(this, 0, 0);

                    // Get raw image data
//                    callback(canvas.toDataURL('image/png').replace(/^data:image\/(png|jpg);base64,/, ''));
                    // ... or get as Data URI
                    callback(canvas.toDataURL('image/png'));
                };

                image.src = url;
            }

            //
            // Creating Objects
            // ==============================================================
            service.addObjectToCanvas = function(object) {
                service.deselectActiveObject();

                object.originalScaleX = object.scaleX;
                object.originalScaleY = object.scaleY;
                object.originalLeft = object.left;
                object.originalTop = object.top;

                service.getCanvas().add(object);
//              service.setObjectZoom(object);
                service.getCanvas().setActiveObject(object);
                object.bringToFront();
//                if (!object.left || !object.top) {
//                    service.center();
//                }
                service.render();
                service.selectActiveObject();
            };

            service.createId = function() {
                return Math.floor(Math.random() * 10000);
            };

            service.setObjectZoom = function(object) {
                var scaleX = object.originalScaleX;
                var scaleY = object.originalScaleY;
                var left = object.originalLeft;
                var top = object.originalTop;

                var tempScaleX = scaleX * service.canvasScale;
                var tempScaleY = scaleY * service.canvasScale;
                var tempLeft = left * service.canvasScale;
                var tempTop = top * service.canvasScale;

                object.scaleX = tempScaleX;
                object.scaleY = tempScaleY;
                object.left = tempLeft;
                object.top = tempTop;

                object.setCoords();
            };

            service.center = function() {
                var activeObject = service.getCanvas().getActiveObject();
                if (activeObject) {
                    activeObject.center();
                    service.updateActiveObjectOriginals();
                    service.render();
                }
            };

            service.render = function() {
                var objects = service.getCanvas().getObjects();
                for (var i in objects) {
                    objects[i].setCoords();
                }

                service.getCanvas().calcOffset();
                service.getCanvas().renderAll();
                service.renderCount++;
                // console.log('Render cycle:', service.renderCount);
            };
            
            //
            // Group
            // ==============================================================
            //
            /**
             * @name createGroup
             * @desc Creates a group
             * @param {Array} [objects] An array of objects
             * @param {Object} [options] A configuration object
             */
            service.createGroup = function(objects, options) {

              var group = new fabricWindow.Group(objects, options);
              // Fabric sets the hasControls property to false in the group objects.
              // This restores the hasControls property to his value before the group creation.
              group.getObjects().map(obj => {
                  obj.hasControls = obj.__origHasControls;
              });
              
              group.id = service.createId();

              service.getCanvas().add(group);
              service.render();

              return group;
            };
            
            service.createGroup2 = function(objects, options) {
                var circle1 = new fabricWindow.Circle({
                    radius: 50,
                    fill: 'red',
                    left: 0
                  });
                  var circle2 = new fabricWindow.Circle({
                    radius: 50,
                    fill: 'green',
                    left: 100
                  });
                  var circle3 = new fabricWindow.Circle({
                    radius: 50,
                    fill: 'blue',
                    left: 200
                  });

                  var group = new fabricWindow.Group([ circle1, circle2, circle3 ], 
                      angular.extend({left: 200, top: 100}, options));

                  service.getCanvas().add(group);
                  service.render();
                  
                  return group;
            }
            
            //
            // Ballot Designer actions
            // ==============================================================
            service.createGrid = function(columns, rows, columnWidth, rowHeight) {
                
                var gridHeight = rows * rowHeight;
                var gridWidth = columns * columnWidth;
                var gridLine;
                var gridLines = [];
                
                // draw the Vertical lines (columns)
                for (var x = 1; x < columns; x++) {
                    gridLine = createGridLine([ x * columnWidth, 0, x * columnWidth, gridHeight], 
                            { stroke: '#ccc', selectable: false, strokeDashArray: [3, 3]});
                    gridLines.push(gridLine);
                }

                // draw the Horizontal lines (rows)
                for (var y = 1; y < rows; y++) {
                    gridLine = createGridLine([ 0, y * rowHeight, gridWidth, y * rowHeight], 
                            { stroke: '#ccc', selectable: false, strokeDashArray: [3, 3]});
                    gridLines.push(gridLine);
                }
                
                // the gridlines group can't be selected, doesn't fire any events and is not exported to json
                var gridGroup = service.createGroup(gridLines, 
                    {selectable: false, evented: false, excludeFromExport: true});
                service.getCanvas().sendToBack(gridGroup);
            }
            
            function createGridLine(points, options) {
                options = options || { stroke: '#ccc', selectable: false};
                var object = new fabricWindow.Line(points, options);
                object.id = service.createId();
                return object;
            }
            
        /**
         * A Fabric canvas follows the next definition:
         * '{objects:[arrayWithFabricObjects], background:""}'
         */
        function parseFabricObjectsFromJsonObjectAsync(jsonBallotStyleDefinition) {
            let deferred = $q.defer();
            if (jsonBallotStyleDefinition.objects) {  // seems to be a fabric canvas with N objects
                let fabricObjects = jsonBallotStyleDefinition.objects.map(createFabricObjectAsync);
                $q.all(fabricObjects)
                .then(function(data) {
                    return deferred.resolve(data);
                });
            }
            return deferred.promise;
        }
            
        function createFabricObjectAsync(jsonObject) {
            let deferred = $q.defer();
            let fabricObject = null;
//            var klass = new fabricWindow.util.getKlass(jsonObject.type);
            let klass = window.fabric.util.getKlass(jsonObject.type);
            if (klass.async) {
                klass.fromObject(jsonObject, function (img) {
                    fabricObject = img;
                    deferred.resolve(fabricObject);
                });
            } else {
                fabricObject = klass.fromObject(jsonObject);
                deferred.resolve(fabricObject);
            }
            return deferred.promise;
        }
        
        
            //
            // Active Object
            // ==============================================================
            service.selectActiveObject = function() {
                var activeObject = service.getCanvas().getActiveObject();
                if (! activeObject) {
                    return;
                }

                service.selectedObject = activeObject;
//                service.selectedObject.text = service.getText();
//                service.selectedObject.fontSize = service.getFontSize();
//                service.selectedObject.lineHeight = service.getLineHeight();
//                service.selectedObject.textAlign = service.getTextAlign();
//                service.selectedObject.opacity = service.getOpacity();
//                service.selectedObject.fontFamily = service.getFontFamily();
//                service.selectedObject.fill = service.getFill();
//                service.selectedObject.tint = service.getTint();
            };

            service.deselectActiveObject = function() {
                service.selectedObject = false;
                service.getCanvas().deactivateAll().renderAll();
            };
            
            /**
             * Removes the currently selected object (active object) from
             * the canvas.
             */
            service.deleteActiveObject = function() {
                var activeObject = service.getCanvas().getActiveObject();
                service.getCanvas().remove(activeObject);
                service.deselectActiveObject();
            };

            service.updateActiveObjectOriginals = function() {
                var object = service.getCanvas().getActiveObject();
                if (object) {
                    object.originalScaleX = object.scaleX / service.canvasScale;
                    object.originalScaleY = object.scaleY / service.canvasScale;
                    object.originalLeft = object.left / service.canvasScale;
                    object.originalTop = object.top / service.canvasScale;

                    object.width = object.width * object.scaleX;
                    object.height = object.height * object.scaleY;
                    object.scaleX = 1;
                    object.scaleY = 1;
                }
            };
            
            service.getWidth = function() {
                return getActiveObjectProperty('width');
            };

            service.setWidth = function(value) {
                setActiveObjectProperty('width', parseInt(value, 10));
                service.render();
            };
            
            //
            // Active Object Fill Color
            // ==============================================================
            service.getFill = function() {
                return getActiveStyle('fill');
            };

            service.setFill = function(value) {
                var object = service.getCanvas().getActiveObject();
                if (object) {
                    if (object.type === 'text') {
                        setActiveStyle('fill', value);
                    } else if (object.type === 'group') {
                        // don't change fill property for group elements
                    } else {
                        service.setFillPath(object, value);
                    }
                }
            };

            service.setFillPath = function(object, value) {
                if (object.isSameColor && object.isSameColor() || !object.paths) {
                    object.setFill(value);
                } else if (object.paths) {
                    for (var i = 0; i < object.paths.length; i++) {
                        object.paths[i].setFill(value);
                    }
                }
            };
            
            service.setActiveObjectProperty = setActiveObjectProperty;
            
            function getActiveObjectProperty(name) {
                var object = service.getCanvas().getActiveObject();

                return typeof object === 'object' && object !== null ? object[name] : '';
            }

            function setActiveObjectProperty(name, value) {
                var object = service.getCanvas().getActiveObject();
                if (object) {
                    object.set(name, value);
                    service.render();
                }
            }
            
            function getActiveStyle(styleName, object) {
                object = object || service.getCanvas().getActiveObject();

                if (typeof object !== 'object' || object === null) {
                    return '';
                }

                return (object.getSelectionStyles && object.isEditing) ? (object.getSelectionStyles()[styleName] || '') : (object[styleName] || '');
            }

            function setActiveStyle(styleName, value, object) {
                object = object || service.getCanvas().getActiveObject();

                if (object.setSelectionStyles && object.isEditing) {
                    var style = { };
                    style[styleName] = value;
                    object.setSelectionStyles(style);
                } else {
                    object[styleName] = value;
                }

                service.render();
            }
            
            service.setDirty = function(value) {
                canvasDirtyStatus.setDirty(value);
            };

            service.isDirty = function() {
                return canvasDirtyStatus.isDirty();
            };

            function startCanvasListeners() {
                
                service.getCanvas().on('object:modified', function(options) {
                    var object = options.target;
                    $log.info('canvas.on(object:modified');
                    if (object.hasCollision) {
                        object.set({
                            top: object._stateProperties.top, 
                            left: object._stateProperties.left, 
                            opacity: object._stateProperties.opacity
                        });
                        if (object._stateProperties.borderColor) {
                        	object.set({
                        		borderColor: object._stateProperties.borderColor
                        	});
                        } else {
                        	delete object.borderColor;
                        }
                        object.setCoords();
                        object.hasCollision = undefined;
                        service.deselectActiveObject();
                    } else {
                        object.set({ 
                            opacity: object._stateProperties.opacity
                        });
                        service.setDirty(true);
                    }
//                    service.updateActiveObjectOriginals();
//                    service.setDirty(true);
                });
                
//                service.canvas.on('object:selected', function() {
//                    $log.info('canvas.on(object:selected');
//                    $timeout(function() {
//                        service.selectActiveObject();
//                    });
//                });
                
//                service.getCanvas().on('selection:cleared', function() {
//                    $timeout(function() {
//                        $log.info('canvas.on(selection:cleared');
//                        service.deselectActiveObject();
//                    });
//                });
                
                function getAvailable(object) {
                	service.getCanvas().forEachObject(function(obj) {
                		if (obj.selectable) {
                			if (obj != object) {
                				$log.info("O: " + obj.type + "s: " + obj.selectable);
                			}
                		}
                	});
                }
                
                service.getCanvas().on('object:moving', function(options) {
            	let object = options.target;
            	//getAvailable(object);
                keepObjectInsideCanvas(object);
                $log.info("Top: " + object.top + ', height ' + object.height);
                    let usingGridLines = false;
	                if (shouldAdjustToGrid(object)) {
                        usingGridLines = true;
                        object.set({
                            left: Math.round(object.left / service.grid.space) * service.grid.space,
                            top: Math.round(object.top / service.grid.space) * service.grid.space
                        });
                        if (service.showCog) {
                            var cog = service.getTemplatePropertiesImage();
    	                    cog.set({left: object.left + object.width - cog.width, top: object.top, opacity: 0.8});
                        }
                    }
        	        grayOutAndHighlightOnObjectCollision(object, usingGridLines);
                });
                
                function keepObjectInsideCanvas(obj) {
                    if (obj.left < 0) {
                        obj.set({left: 0});
                    }
                    if (obj.top < 0) {
                        obj.set({top: 0});
                    }
           		    if (obj.left + obj.getWidth() > service.grid.width) {
                	    obj.set({left: service.grid.width - obj.getWidth()});
                    }
	                if (obj.top + obj.getHeight() > service.grid.height) {
    	                obj.set({top: service.grid.height - obj.getHeight()});
                    }
                }
                
                function grayOutAndHighlightOnObjectCollision(target, useGridLines) {
                    var hasCollision = false;
                    var vDelta = service.grid.columnSeparation / 2;
                    var hDelta = service.grid.rowSeparation / 2;

                    var adjustedTarget = target;
                    if (useGridLines) {
                        adjustedTarget = new fabricWindow.Rect({
                            left: target.left + hDelta, 
                            top: target.top + vDelta, 
                            width: target.width - hDelta * 2, 
                            height: target.height - vDelta * 2});
                        adjustedTarget.setCoords();
                    }

                    target.setCoords();
                    var objects = service.getCanvas().getObjects();
                    for (let n = 0; n < objects.length && !hasCollision; n++) {
                        if (objects[n] !== target && objects[n].get('evented') === true &&
                                (objects[n].stackable === undefined || !objects[n].stackable)) {
                            hasCollision = adjustedTarget.intersectsWithObject(objects[n]);
                        }
                    }

                    target.setOpacity(hasCollision ? 0.5 : target.getOpacity());
                    if (hasCollision) {
                        target.set({'borderColor': 'red'});
                    } else {
                    	delete target.borderColor;
                    }

                    target.hasCollision = hasCollision;
                }
                
                function objectIsInsideBallotOption(targetObj) {
                    service.getCanvas().forEachObject(function(obj) {
                        // only test objects with the 'ballotOption' subtype
                        if (obj !== targetObj && obj.subtype === 'ballotOption') {
                            var boundingRect = obj.getBoundingRect();
                            var point1 = new fabricWindow.Point(boundingRect.left, boundingRect.top);
                            var point2 = new fabricWindow.Point(boundingRect.left + boundingRect.width,
                                    boundingRect.top + boundingRect.height);
                            
                            if (targetObj.isContainedWithinRect(point1, point2)) {
                                $log.info("Inside")
                            } else {
                                $log.error("Not inside");
                            }
                        }
                    })
                }

                service.getCanvas().on('object:scaling', function(options) {
            		let object = options.target;
	            	$log.info("Type: " + object.type + ", width: " + object.getWidth() + 
    	        		", height: " + object.getHeight() + ", snapToGrid: " + object.snapToGrid);
        	        if (shouldAdjustToGrid(object))  {
            	        scaleByGridsize(object);
                    }
                });
                
                service.getCanvas().on('mouse:over', function(e) {
                    if (e.target && service.showCog) {
                        $log.info("E: " + e.target.type);
                        var cog = service.getTemplatePropertiesImage();
                        cog.set({left: e.target.left + e.target.width - cog.width, top: e.target.top, opacity: 0.8});
                        cog.bringToFront();
                        service.getCanvas().renderAll();
                    }
                });
                
                service.getCanvas().on('mouse:out', function(e) {
                    if (e.target && service.showCog) {
                        var cog = service.getTemplatePropertiesImage();
                        cog.set({left: - 50, top: -50, opacity: 0});
                        service.getCanvas().renderAll();
                    }
                });
            }
            
        	function shouldAdjustToGrid(object) {
        		return (object.snapToGrid !== undefined && object.snapToGrid) ||
                	(object.snapToGrid === undefined && 
                		object.type != 'text' && object.type != 'textbox' && object.type != 'image' &&
	                	object.subtype != 'separationLine'
    	        	);
        	}
        
	        function scaleByGridsize(target) {
    	    	target.set({
        	        width: Math.round(target.getWidth() / service.grid.space) * service.grid.space,
            	    height: Math.round(target.getHeight() / service.grid.space) * service.grid.space,
                	scaleX: 1,
	                scaleY: 1
    	        });
        	}
            
            function enablePropertiesDialog() {
                service.addCogImage("images/gear24.png", 
                    {left: 50, top: 50, width: 24, height: 24,
                    hasRotatingPoint: false, hasControls: false,
                    subtype: 'propertiesDialogIcon'});
            }

            service.init = function() {
                $log.debug('fabric - init()');
                
                service.setCanvasSize(options.json.cols, options.json.rows,
                        options.json.colSeparation, options.json.rowSeparation);
                
                if (options.json.enablePropertiesDialog === true) {
                    enablePropertiesDialog();
                    service.showCog = true;
                }
                
                startCanvasListeners();
                canvasDirtyStatus.init();
                canvasDirtyStatus.startListening();
            };

            service.init();
            
            return service;

        }

    }

})();