(function() {
    'use strict';
    
    angular.module('ballotTemplateDesigner').factory('dataService', DataService);
    
    DataService.$inject = ['ballotTemplateDesignerService', 'ballotTemplateDesignerServiceLocal', '$q', '$log'];
    
    function DataService(ballotTemplateDesignerService, ballotTemplateDesignerServiceLocal, $q, $log) {
        
        const LOCAL_MODE = 'local';
        const REMOTE_MODE = 'remote';
        
        let mode = LOCAL_MODE;
        let data = {
            local: ballotTemplateDesignerServiceLocal,
            remote: ballotTemplateDesignerService
        }
        
        function setRemoteMode() {
            mode = REMOTE_MODE;
        }
        
        function setLocalMode() {
            mode = LOCAL_MODE;
        }
        
        function getMode() {
            return mode;
        }
        
        function getContestClasses() {
            return data[mode].getContestClasses();
        }
        
        function getBallotTemplate(templateCode) {
            let deferred = $q.defer();
            
            data[mode].getBallotTemplate(0)
            .then(function(data) {
                if (data.data) {
                    deferred.resolve(data.data.data);
                } else {
                    $log.info("No ballot templates were found");
                    deferred.reject();
                }
            });
            
            return deferred.promise;
        }
        
        function getBallotTemplatesList() {
            return data[mode].getBallotTemplatesList();
        }
        
        function saveBallotStyleContestAssociations(ballotStyleCode, contestAssociations) {
            return data[mode].saveBallotStyleContestAssociations(ballotStyleCode, contestAssociations);
        }
        
        return {
            setLocalMode: setLocalMode,
            setRemoteMode: setRemoteMode,
            getMode: getMode,
            getContestClasses: getContestClasses,
            getBallotTemplate: getBallotTemplate,
            getBallotTemplatesList: getBallotTemplatesList
        }

    }
})();