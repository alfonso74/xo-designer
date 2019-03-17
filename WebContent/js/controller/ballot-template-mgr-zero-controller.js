(function() {
    'use strict';

    angular.module('ballotTemplateDesigner').controller('ballotTemplateZeroController', BallotTemplateZeroController);
    
    BallotTemplateZeroController.$inject = ['$scope', '$location'];
    
    function BallotTemplateZeroController($scope, $location) {
        
        var vm = this;
        
        vm.goToView = goToView;
        function goToView(view) {
            $location.url('/' + view);
        }
        
    }
    
})();
