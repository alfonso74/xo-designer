(function() {

  'use strict';

  angular.module('ems.fabric')
    .service('fabricCanvas', fabricCanvas);

  fabricCanvas.$inject = ['$log', '$rootScope', 'fabricWindow', 'fabricConstants'];

  /**
   * @name fabricCanvas
   * @desc Creates a Canvas
   * @param {Object} [$log]
   * @param {Object} [$rootScope]
   * @param {Object} [fabricConfig]
   * @param {Object} [fabricWindow]
   * @return {Object} Returns the new fabricCanvas object
   *
   * @fires canvas:created
   *
   */
  function fabricCanvas($log, $rootScope, fabricWindow, fabricConstants) {

    var service = this;

    service.data = [];
    service.element = null;

    service.init = function () {
      $log.debug('fabricCanvas - init()');
    };

    var createId = function() {
      return Math.floor(Math.random() * 10000);
    };

    service.setElement = function(element) {
      service.element = element;
    };
    
    /*
    service.createCanvas = function(options) {
        options = options || fabricConstants.canvasDefaults;
        $log.debug('Creating canvas with options: ' + JSON.stringify(['e', options], null, '\t'));
        var canvas = {};
        canvas.id = 'fabric-canvas-' + createId();
//        canvas.id = 'fabric-canvas-999';
        service.element.attr('id', canvas.id);
        canvas.definition = new fabricWindow.Canvas(canvas.id, options);
        service.data.push(canvas);
        $rootScope.$broadcast('canvas:created');
        return canvas.definition;
    };
    */
    
    service.createNamedCanvas = function(name, options) {
        if (!name || name === '') {
            name = 'default';
        };
        options = options || fabricConstants.canvasDefaults;
        $log.debug('Creating canvas with options: ' + JSON.stringify(['e', options], null, '\t'));
        var canvas = {}
        canvas.id = 'fabric-canvas-' + createId();
        canvas.name = name;
        service.element.attr('id', canvas.id);
        canvas.definition = new fabricWindow.Canvas(canvas.id, options);
        service.data.push(canvas);
        if (name === 'default') {
            $rootScope.$broadcast('canvas:created');
        } else {
            $rootScope.$broadcast('canvas:created:' + name);
        }
        
        return canvas.definition;
    };

    service.getCanvas = function(name) {
        var canvas = service.data[0].definition;
        if (name && name !== '') {
            for (let n = 0; n < service.data.length; n++) {
                if (service.data[n].name === name) {
                    canvas = service.data[n].definition;
                }
            } 
        }        return canvas;
    };

    service.init();

    return service;

  }

})();

