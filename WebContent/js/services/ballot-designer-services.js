(function(){

    var injectParams = ['$http', '$q', '$timeout'];

    var ballotDesignerService = function ($http, $q, $timeout) {

        var contestClassDatasource = "contestClass";
        
        var baseUrl = '/vvsg/rest/ballot-designer/';
        
        this.getContestClasses = function() {
            return $http({
                url : baseUrl + 'contestClass',
                method : 'GET',
                params : {}
            });
        };
        
        this.getBallotTemplatesList = function() {
            return $http({
                url: baseUrl + 'ballot/templates',
                method : 'GET',
                params : {}
            });
        }
        
        this.deleteBallotStyle = function(ballotStyleCode) {
            return $http({
                url: baseUrl + 'ballot/styles/' + ballotStyleCode,
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json'
                }
            })
        }

        this.saveBallotStyle = function(name, types, definition) {
            return $http({
                url: baseUrl + 'ballot/styles',
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                data : definition,
                params: {
                    name: name,
                    types: types
                }
            })
        }

        this.saveBallotStyleContestAssociations = function(ballotStyleCode, contestAssociations) {
            return $http({
                url: baseUrl + 'ballot/styles/' + ballotStyleCode + '/contestAssociations',
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                params: {
//                  ballotStyleCode: ballotStyleCode,
                    contestAssociations: contestAssociations
                }
            })
        }

        this.previewAsPdf = function(definition) {
            return $http({
                url: baseUrl + 'ballot/preview',
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                data : definition
            });
        }

        this.getBallotStylesList = function() {
            return $http({
                url: baseUrl + 'ballot/styles',
                method : 'GET',
                params : {}
            });
        }

        this.getBallotStyle = function(ballotStyleCode) {
            return $http({
                url: baseUrl + 'ballot/styles/' + ballotStyleCode,
                method : 'GET'
            });
        }


        this.getMockContestClasses = function() {
            var n = 1;
            const mockData = {
                "type" : "SUCCESS",
                "message" : null,
                "data" : [ {
                    "code" : n++,
                    "name" : "Question",
                    "description" : null,
                    "customCode" : "1",
                    "type" : "ISSUE",
                    "electionMode" : "RELATIVE_MAJORITY",
                    "documentsTitle" : null,
                    "precedence" : 1,
                    "timePeriod" : {
                        "period" : 1,
                        "unit" : "YEAR"
                    }
                }, {
                    "code" : n++,
                    "name" : "President",
                    "description" : null,
                    "customCode" : "2",
                    "type" : "REGULAR",
                    "electionMode" : "RELATIVE_MAJORITY",
                    "documentsTitle" : null,
                    "precedence" : 1,
                    "timePeriod" : {
                        "period" : 1,
                        "unit" : "YEAR"
                    }
                }, {
                    "code" : n++,
                    "name" : "Senator",
                    "description" : null,
                    "customCode" : "3",
                    "type" : "REGULAR",
                    "electionMode" : "RELATIVE_MAJORITY",
                    "documentsTitle" : null,
                    "precedence" : 1,
                    "timePeriod" : {
                        "period" : 1,
                        "unit" : "YEAR"
                    }
                }, {
                    "code" : n++,
                    "name" : "Governor",
                    "description" : null,
                    "customCode" : "4",
                    "type" : "REGULAR",
                    "electionMode" : "RELATIVE_MAJORITY",
                    "documentsTitle" : null,
                    "precedence" : 1,
                    "timePeriod" : {
                        "period" : 1,
                        "unit" : "YEAR"
                    }
                }, {
                    "code" : n++,
                    "name" : "Governor with a far longer description",
                    "description" : null,
                    "customCode" : "5",
                    "type" : "REGULAR",
                    "electionMode" : "RELATIVE_MAJORITY",
                    "documentsTitle" : null,
                    "precedence" : 1,
                    "timePeriod" : {
                        "period" : 1,
                        "unit" : "YEAR"
                    }
                },{
                    "code" : n++,
                    "name" : "Question with a longer description",
                    "description" : null,
                    "customCode" : "6",
                    "type" : "ISSUE",
                    "electionMode" : "RELATIVE_MAJORITY",
                    "documentsTitle" : null,
                    "precedence" : 1,
                    "timePeriod" : {
                        "period" : 1,
                        "unit" : "YEAR"
                    }
                }]
            };
            
            var deferred = $q.defer();
            setupResponsePromise(deferred, mockData);
            return deferred.promise;
        }

        /*
        this.getMockContestData = function() {
            const mockData = [
                {'code': 1, 'name': 'THE President'},
                {'code': 2, 'name': 'Senator'},
                {'code': 3, 'name': 'Board Member'},
                {'code': 4, 'name': 'Attorney'},
                {'code': 5, 'name': 'Coroner'}
                ];
            
            var deferred = $q.defer();
            
            setupResponsePromise(deferred, mockData);
            
            return deferred.promise;
        }
        */
        
        
        setupResponsePromise = function(deferred, response) {
            var promise = deferred.promise;
            
            $timeout(function() {
                deferred.resolve(response);
            }, 100);
            
            promise.success = function(fn) {
                promise.then(fn);
                return promise;
            }

            promise.error = function(fn) {
                promise.then(null, fn);
                return promise;
            }
        }

        this.getAllContestClass = function () {
            return $http.get('/contests/restapi/?dataSource=' + contestClassDatasource + "&operationType=fetch&operationId=complete",
                {headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' }});
        };
        
        this.getContestClassTypes = function() {
            const contestClassTypes = [{"TYPE": "REGULAR"},
                                  {"TYPE": "ISSUE"},
                                  {"TYPE": "RANKED_CHOICE"},
                                  {"TYPE": "CUMULATIVE"},
                                  {"TYPE": "WEIGHTED"},
                                  {"TYPE": "APPROVAL"}];
            return contestClassTypes;
        }
        
        this.getContestClassElectionTypes = function() {
            const contestClassElectionTypes = [{"TYPE": "ABSOLUTE_MAJORITY"},
                                    {"TYPE": "MULTIPLE_RELATIVE_MAJORITY"},
                                    {"TYPE": "PARTY_LIST_PHILIPPINES"},
                                    {"TYPE": "RELATIVE_MAJORITY"},
                                    {"TYPE": "RELATIVE_REPRESENTATION_BALANCE"},
                                    {"TYPE": "RELATIVE_REPRESENTATION_BALANCE_ISOLATED"},
                                    {"TYPE": "RELATIVE_REPRESENTATION_BALANCE_ONLY_LIST"},
                                    {"TYPE": "RELATIVE_REPRESENTATION_BALANCE_OPEN_LIST"},
                                    {"TYPE": "RELATIVE_REPRESENTATION_BALANCE_OPEN_LIST_LOCKED"}
                                    ];
            return contestClassElectionTypes;
        }
        
        this.getBallotOptionTemplates = function () {
            
        }

    }

    ballotDesignerService.$inject = injectParams;

    angular.module('ballotDesigner').service('ballotDesignerService', ballotDesignerService);

})(angular);