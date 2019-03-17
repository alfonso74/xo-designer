(function() {

    'use strict';

    angular.module('ems.fabric')
    .service('canvasDirtyStatus', canvasDirtyStatus);

    canvasDirtyStatus.$inject = ['$log', '$window'];

    function canvasDirtyStatus($log, $window) {

        var service = this;

        service.init = function () {
            service.dirty = false;
            $log.debug('canvasDirtyStatus - init()');
        };

        service.dirty = false;

        function checkSaveStatus() {
            if (service.isDirty()) {
                return "You have unsaved changes.\n\nPlease save before leaving so you don't lose any work.";
            }
        }

        service.endListening = function() {
            $window.onbeforeunload = null;
            $window.onhashchange = null;
        };

        service.startListening = function() {
            $window.onbeforeunload = checkSaveStatus;
            $window.onhashchange = checkSaveStatus;
        };

        service.isDirty = function() {
            return service.dirty;
        };

        service.setDirty = function(value) {
            service.dirty = value;
        };

        service.init();

        return service;

    }

})();

