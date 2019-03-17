(function() {
    'use strict';
    
    /**
     * Finds available areas in a canvas with the indicated properties (rows,
     * columns, row height, and column width.
     */
    angular.module('ballotTemplateDesigner').factory('canvasSpaceLocator', CanvasSpaceLocator);
    
    CanvasSpaceLocator.$inject = ['$log'];
    
    function CanvasSpaceLocator($log) {
        
        function locateFreeAreas(fabric, fabricCanvas, rows, columns, rowHeight, columnWidth) {
            var grid = {
                'rows': rows,
                'columns': columns,
                'rowHeight': rowHeight,
                'columnWidth': columnWidth
            }
            
            var h = [
                [1, 1, 1],
                [1, 1, 1],
                [1, 0, 1],
                [1, 1, 1]
            ];
            h = locateOccupiedCells(fabric, fabricCanvas, grid);
            
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
                availableAreas[n].left *= columnWidth;
                availableAreas[n].top *= rowHeight;
                availableAreas[n].width *= columnWidth;
                availableAreas[n].height *= rowHeight;
                availableAreas[n].area = availableAreas[n].width * availableAreas[n].height;
            }
            $log.info("10 Biggest areas:\n" + JSON.stringify(availableAreas.slice(0,10)));
            
            return availableAreas;
        }
        
        function locateOccupiedCells(fabric, fabricCanvas, grid) {
            let gridColumnsWidth = grid.columnWidth;
            let gridRowsHeight = grid.rowHeight;
            let gridColumns = grid.columns;
            let gridRows = grid.rows;
            const padding = 3;
            
            createSpaceFinderRect(fabric, gridColumnsWidth - padding * 2, gridRowsHeight - padding * 2);
            var rect = fabricCanvas.getActiveObject();
            
            var canvasMatrix = createRectangularAreaMatrix(gridRows, gridColumns);
            
            for (let x = 0; x < gridColumns; x++) {
                for (let y = 0; y < gridRows; y++) {
                    rect.left = x * gridColumnsWidth + padding;
                    rect.top = y * gridRowsHeight + padding;
                    rect.setCoords();
                    if (intersectsWithAnyCanvasObject(fabricCanvas, rect)) {
                        canvasMatrix[y][x] = 0;
                    } else {
                        canvasMatrix[y][x] = 1;
                    }
                }
            }
            
            fabricCanvas.remove(rect);
            return canvasMatrix;
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
        
        function createSpaceFinderRect(fabric, width, height) {
            var object = fabric.addRect(
                {left: 0, top: 0, width: width, height: height,
                hasRotatingPoint: false, hasControls: false, cornerSize: 6,
                fill: "#F7D08A"});
            return object;
        }
        
        function intersectsWithAnyCanvasObject(fabricCanvas, rect) {
            var result = false;
            fabricCanvas.forEachObject(function(obj) {
                // the only object we want to exclude is the background grid (the only
                // non-evented object).
               if (obj.evented === true && obj.id !== rect.id && rect.intersectsWithObject(obj)) {
                   result = true;
               } 
            });
            return result;
        }
        
        return {
            locateFreeAreas: locateFreeAreas
        }
        
    }
    
})();
