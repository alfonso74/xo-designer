(function() {

    'use strict';

    angular.module('ems.fabric')
        .directive('fabric', fabric);

    /*
     * Use $inject to manually identify your dependencies for Angular components.
     * This technique mirrors the technique used by ng-annotate, for automating the creation of minification safe
     * dependencies. If ng-annotate detects injection has already been made, it will not duplicate it.
     */

    fabric.$inject = ['$log', 'fabricCanvas'];

    function fabric($log, fabricCanvas) {
        
        return {
            scope: {
                fabric: '=',
                name: '@'
            },
            controller: function($scope, $element) {
                
                $log.debug('fabric directive - controller()');
                $log.info("Name: " + $scope.name);
                
                fabricCanvas.setElement($element);
                fabricCanvas.createNamedCanvas($scope.name);

                // Continue rendering the canvas until the user clicks
                // to avoid the "calcOffset" bug upon load.
                $('body').on('click', 'canvas', function() {
                    $log.debug("Canvas click!");
                });
                
                /**
                 * Adds some angular watchers to enable some degree of Fabric 
                 * canvas integration.
                 */
                function addWatchers() {
                    addWatcherForNumericProperty('left');
                    addWatcherForNumericProperty('top');
                    addWatcherForNumericProperty('width');
                    addWatcherForNumericProperty('height');
                    addWatcherForNumericProperty('fontSize');
                    addWatcherForStringProperty('fontFamily');
                    addWatcherForStringProperty('fontWeight');  // bold
                    addWatcherForStringProperty('fontStyle');   // italic
                    addWatcherForStringProperty('textDecoration');  // underline
                    addWatcherForStringProperty('textAlign');   // left, center, right
//                    addWatcherForObjectProperty('strokeDashArray');
                }
                
                /**
                 * Support method to angular 'watch' a Fabric object property.
                 */
                function addWatcherForObjectProperty(objectProperty) {
                    $scope.$watch('fabric.selectedObject.' + objectProperty, function(newVal) {
                        $scope.fabric.setActiveObjectProperty(objectProperty, newVal);
                        $scope.fabric.render();
                    });
                }
                
                /**
                 * Support method to angular 'watch' a Fabric object string
                 * property.
                 */
                function addWatcherForStringProperty(objectProperty) {
                    $scope.$watch('fabric.selectedObject.' + objectProperty, function(newVal) {
                        if (typeof newVal === 'string' && newVal) {
                            $scope.fabric.setActiveObjectProperty(objectProperty, newVal);
                            $scope.fabric.render();
                        }
                    });
                }
                
                /**
                 * Support method to angular 'watch' a Fabric object numeric
                 * property.
                 */
                function addWatcherForNumericProperty(objectProperty) {
                    $scope.$watch('fabric.selectedObject.' + objectProperty, function(newVal) {
                        if (typeof newVal === 'string' || typeof newVal === 'number') {
                            $scope.fabric.setActiveObjectProperty(objectProperty, parseInt(newVal, 10));
                            $scope.fabric.render();
                        }
                    });
                }
                
                addWatchers();
                
                /**
                 * Support method to angular 'watch' a Fabric object 'fill'
                 * property.
                 */
                $scope.$watch('fabric.selectedObject.fill', function(newVal) {
                    if (typeof newVal === 'string') {
                        $scope.fabric.setFill(newVal);
                        $scope.fabric.render();
                    }
                });
                
//                $scope.$watch(watchObjectEditableProperties, updateObjectProperties);
//                
//                function watchObjectEditableProperties() {
//                    
//                }
//                
//                function updateObjectProperties() {
//                    
//                }
            }
        };

    }

})();

