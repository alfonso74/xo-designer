(function () {
    'use strict';

    var app = angular.module('test', ['ui.bootstrap']);
    
    app.controller("Ctrl1",function($scope){
        $scope.name = "Harry";
        $scope.reverseName = function(){
            $scope.name = $scope.name.split('').reverse().join('');
        };
        
        $scope.ja = ja;
        function ja() {
            console.log('JA!');
            alert('JA!');
        }
    });
    
    app.controller("rowController", function($scope) {
        $scope.ja = ja;
        function ja() {
            console.log('JA! - rowController');
            alert('JA! - rowController');
        }
    });
    
    app.directive("myDirective", function(){
        return {
            restrict: "EA",
            scope: {},
            templateUrl: "views/treeElementActions.html"
        };
    });

})();
