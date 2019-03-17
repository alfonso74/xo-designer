(function() {

    angular.module('ems.fabric')
    .factory('fabricWindow', fabricWindow);

    fabricWindow.$inject = ['$window'];

//  We need to wrap this in a service so that we don't reference global 
//  objects inside AngularJS components.
    function fabricWindow($window) {
        return $window.fabric;
    }

})();
