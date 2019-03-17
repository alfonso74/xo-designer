(function (angular) {
    'use strict';

    var module = angular.module('ballotDesigner', ['ui.bootstrap', 'ui.select', 'ngSanitize', 'ems.fabric']);
    
    module.factory('timestampMarker', [function() {  
        var timestampMarker = {
            request: function(config) {
                config.requestTimestamp = new Date().getTime();
                return config;
            },
            response: function(response) {
                response.config.responseTimestamp = new Date().getTime();
                return response;
            }
        };
        return timestampMarker;
    }]);
    
    module.config(['$httpProvider', function($httpProvider){

//        module.register =
//        {
//            controller: $controllerProvider.register,
//            service: $provide.service
//        };
        
//        $httpProvider.interceptors.push('timestampMarker');
        
        $httpProvider.interceptors.push(function($q, $log) {
            return {
                'request': function(config) {
                    $log.debug('$httpProvider.interceptor.push');
                    return config;
                }
            }
        });

    }]);
    
})(angular);
