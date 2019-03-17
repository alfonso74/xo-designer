(function(){
    'use strict';

    var injectParams = ['$http', '$q', '$timeout'];

    var ballotTemplateDesignerService = function ($http, $q, $timeout) {
        
        const gridSpacing = 25;
        
        const baseUrl = '/vvsg/rest/ballot-designer/';
        
        
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
        };
        
        this.getBallotTemplatesTableData = function(callback) {
            this.getBallotTemplatesList().
            then(function successCallback(response) {
                //transform data
                let tableData = [];
                if (response.data.data) {
                    let ballotTemplates = response.data.data;
                    ballotTemplates.forEach(function(element) {
                        tableData.push({
                            name: element.name,
                            type: element.type,
                            size: "8.5\" x 11\"",
                            orientation: "Not available",
                            columns: "Not available"
                        });
                    })
                }
                callback(tableData);
            },
            function errorCallback(response) {
                callback(response);
            });
        };
        
        this.getBallotTemplate = function(templateCode) {
            return $http({
                url: baseUrl + 'ballot/templates/' + templateCode,
                method : 'GET'
            });
        }
        
        this.saveBallotTemplate = function(name, type, definition) {
            return $http({
                url: baseUrl + 'ballot/templates',
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                data : definition,
                params: {
                    name: name,
                    type: type
                }
            })
        };
        
        this.deleteBallotTemplate = function(ballotTemplateCode) {
            return $http({
                url: baseUrl + 'ballot/templates/' + ballotTemplateCode,
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json'
                }
            })
        };
        
        this.getBallotStylesList = function() {
            return $http({
                url: baseUrl + 'ballot/styles',
                method : 'GET',
                params : {}
            });
        };
        
        this.getBallotStyle = function(ballotStyleCode) {
            return $http({
                url: baseUrl + 'ballot/styles/' + ballotStyleCode,
                method : 'GET'
            });
        }
        
        this.getBallotStylesTableData = function(callback) {
            this.getBallotStylesList().
            then(function successCallback(response) {
                //transform data
                let tableData = [];
                if (response.data.data) {
                    let ballotStyles = response.data.data;
                    ballotStyles.forEach(function(element) {
                        var ballotStyleDefinition = JSON.parse(element.definition);
                        var ballotStyleType = "";
                        if (element.types) {
                            ballotStyleType = element.types.join();
                        }
                        tableData.push({
                            code: element.code,
                            name: element.name,
                            type: ballotStyleType,
                            size: ballotStyleDefinition.pageSize.name,
                            orientation: ballotStyleDefinition.pageOrientation,
                            columns: ballotStyleDefinition.pageColumns
                        });
                    })
                }
                callback(tableData);
            },
            function errorCallback(response) {
                callback(response);
            });
        };
        
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
            });
        };
        
        this.saveBallotStyleContestAssociations = function(ballotStyleCode, contestAssociations) {
            return $http({
                url: baseUrl + 'ballot/styles/' + ballotStyleCode + '/contestAssociations',
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                params: {
                    contestAssociations: contestAssociations
                }
            });
        };
        
        this.deleteBallotStyle = function(ballotStyleCode) {
            return $http({
                url: baseUrl + 'ballot/styles/' + ballotStyleCode,
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
        };
        
        this.duplicateBallotStyle = function(ballotStyleCode) {
            return $http({
                url: baseUrl + 'ballot/styles/' + ballotStyleCode + '/duplicate',
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
        };
        
        this.getBallotColumns = function(pageWidth, pageHeight) {
        	if (!pageWidth) {
                pageWidth = 0;
            }
            if (!pageHeight) {
                pageHeight = 0;
            }

            let n = 1;
            const definitions = [
                {
                    "id"              : 1,
                    "name"            : "1 column",
                    "value"           : "1",
                    iconClass         : "ssp-ballot-columns-1",
                    "components"      : [
                     ]
                },
                {
                    "id"              : 2,
                    "name"            : "2 columns",
                    "value"           : "2",
                    iconClass         : "ssp-ballot-columns-2",
                    "components"      : [
                        {ctype: 'verticalLine', left: pageWidth / 2, top: 0, length: pageHeight, 
                            stroke: "#0c7b95", strokeWidth:1, padding:2, 
                            hasControls: false, selectable: false, subtype: "columnSeparator"}
                     ]
                },
                {
                    "id"              : 3,
                    "name"            : "3 columns",
                    "value"           : "3",
                    iconClass         : "ssp-ballot-columns-3",
                    "components"      : [
                        {ctype: 'verticalLine', left: pageWidth / 3, top: 0, length: pageHeight, 
                            stroke: "#0c7b95", strokeWidth:1, padding:2, 
                            hasControls: false, selectable: false, subtype: "columnLine"},
                        {ctype: 'verticalLine', left: pageWidth / 3 * 2, top: 0, length: pageHeight, 
                            stroke: "#0c7b95", strokeWidth:1, padding:2, 
                            hasControls: false, selectable: false, subtype: "columnLine"}
                     ],
                     "groupDefinition": {
                         opacity: 1,
                         hasControls: false, selectable: false,
                         subtype: "columnSeparator"
                     }
                }
            ];
            
            return definitions;
        };
        
        this.getBallotAreas = function(pageWidth, pageHeight, ballotColumns) {
            if (!pageWidth) {
                pageWidth = 0;
            }
            if (!pageHeight) {
                pageHeight = 0;
            }
            if (!ballotColumns) {
            	ballotColumns = 3;
            }
            
            let n = 1;
            const definitions = [
                {
                    "id"              : n++,
                    "name"            : "Header",
                    "value"           : "header",
                    "components"      : [
                        {ctype: 'rect', left: 0, top: 0, width: pageWidth, height: gridSpacing * 3,
                            fill: "#ffffff", stroke: "#0c7b95", strokeWidth: 1, opacity: 1, subtype: "background"},
                        {ctype: 'textbox', left: 5, top: 5, width: 126, fontSize: 14, 
                            textAlign: 'left', fontFamily: 'Arial', fontWeight: 'bold', hasControls: false,
                            text: 'Header'},
                        {ctype: 'textbox', left: 0, top: gridSpacing * 1.5, width: pageWidth, fontSize: 12, 
                            textAlign: 'center', fontFamily: 'Arial', hasControls: false,
                            text: 'Double click here to start designing this area'}
                     ],
                     "groupDefinition": {
                         top: 0, left: 0,
                         hasRotatingPoint: false, hasControls: false, cornerSize: 6, opacity: 1,
                         hoverCursor: "pointer", lockMovementX: true, lockMovementY: true,
                         subtype: "pageAreaPlaceholder:header", view: 'header', pristine: true
                     }
                },
                {
                    "id"              : n++,
                    "name"            : "Footer",
                    "value"           : "footer",
                    "components"      : [
                        {ctype: 'rect', left: 0, top: 0, width: pageWidth, height: gridSpacing * 3,
                            fill: "#ffffff", stroke: "#0c7b95", strokeWidth: 1, opacity: 1, subtype: "background"},
                        {ctype: 'textbox', left: 5, top: 5, width: 126, fontSize: 14, 
                            textAlign: 'left', fontFamily: 'Arial', fontWeight: 'bold', hasControls: false,
                            text: 'Footer'},
                        {ctype: 'textbox', left: 0, top: gridSpacing * 1.5, width: pageWidth, fontSize: 12, 
                            textAlign: 'center', fontFamily: 'Arial', hasControls: false,
                            text: 'Double click here to start designing this area'}
                     ],
                     "groupDefinition": {
                         top: pageHeight - gridSpacing * 3, left: 0,
                         hasRotatingPoint: false, hasControls: false, cornerSize: 6, opacity: 1,
                         hoverCursor: "pointer", lockMovementX: true, lockMovementY: true,
                         subtype: "pageAreaPlaceholder:footer", view: "footer", pristine: true
                     }
                },
                {
                    "id"              : n++,
                    "name"            : "Instructions",
                    "value"           : "instructions",
                    "components"      : [
                        {ctype: 'rect', left: 0, top: 0, width: pageWidth / ballotColumns, height: pageHeight - gridSpacing * 6,
                            fill: "#ffffff", stroke: "#0c7b95", strokeWidth: 1, opacity: 1, subtype: "background"},
                        {ctype: 'textbox', left: 5, top: 5, width: 126, fontSize: 14, 
                            textAlign: 'left', fontFamily: 'Arial', fontWeight: 'bold', hasControls: false,
                            text: 'Instructions'},
                        {ctype: 'textbox', left: 0, top: (pageHeight - gridSpacing * 6) / 2, width: pageWidth / ballotColumns - 20, fontSize: 12, 
                            textAlign: 'center', fontFamily: 'Arial', hasControls: false,
                            text: 'Double click here to start designing this area'}
                     ],
                     "groupDefinition": {
                         top: gridSpacing * 3, left: 0,
                         hasRotatingPoint: false, hasControls: false, cornerSize: 6, opacity: 1,
                         hoverCursor: "pointer", lockMovementX: true, lockMovementY: true,
                         subtype: "pageAreaPlaceholder:instructions", view: "instructions", pristine: true
                     }
                }
            ];
            
            return definitions;
        }
        
        this.getDefaultTemplatesDefinition = function() {
            let n = 1;
            const definitions = [
                {
                    "id"              : n++,
                    "name"            : "Contest template",
                    "value"           : "contestTemplate",
                    "src"             : "http://placehold.it/32x32/F7D08A",
                    "components"   : [
                        {ctype: 'rect', left: 0, top: 0, width: gridSpacing * 8, height: gridSpacing * 1, fill: "#EBEBEB",
                            name: 'titleContainer', hasControls: false, selectable: false},
                        {ctype: 'rect', left: 0, top: gridSpacing * 1, width: gridSpacing * 8, height: gridSpacing * 1, 
                            fill: "#CAE4FF", hasControls: false, selectable: false, selectable: false, 
                            name: 'instructionsContainer', subtype: "instructions"},
                        {ctype: 'rect', left: 0, top: gridSpacing * 2, width: gridSpacing * 8, height: gridSpacing * 2,
                            fill: "#FFFFFF", hasControls: false, selectable: false, selectable: false, 
                            name:  'ballotOptionContainer', subtype: "ballotOption"},
                        {ctype: 'rect', left: 0, top: gridSpacing * 4, width: gridSpacing * 8, height: gridSpacing * 2, 
                            fill: "#FFFFFF", hasControls: false, selectable: false, selectable: false, 
                            name: 'writeInContainer', subtype: "writeIn"},
                        {ctype: 'textbox', left: 2, top: 5, width: gridSpacing * 8 - 3, fontSize: 12, fontWeight: 'bold', text: '${contest.name}',
                            hasControls: false, selectable: false, name: 'title'},
                        {ctype: 'textbox', left: 2, top: (gridSpacing * 1) + 5, width: gridSpacing * 8 - 3, fontSize: 12, text: 'Vote for ${contest.maxVotes}',
                            hasControls: false, selectable: false, name: 'instructions'},
                        {ctype: 'mark', left: 0, top: gridSpacing * 2, width: gridSpacing, height: gridSpacing,
                            hasControls: false, selectable: false, selectable: false,
                            subtype: "mark", markStyle: "Oval"},
                        {ctype: 'textbox', left: (gridSpacing * 1) + 2, top: gridSpacing * 2 + 5, width: gridSpacing * 7 - 3, fontSize: 14, text: '${nomination.name}',
                            hasControls: false, selectable: false, name: 'candidate'},
                        {ctype: 'textbox', left: (gridSpacing * 1) + 2, top: gridSpacing * 3, width: gridSpacing * 7 - 3, fontSize: 12, text: '${party.name}',
                            hasControls: false, selectable: false, name: 'party'},
                        {ctype: 'separationLine', left: gridSpacing, top: gridSpacing * 4 - 5, width: gridSpacing * 7, 
                            stroke: "rgb(0,0,0)", strokeWidth:1, padding:2, hasControls: false, selectable: false, subtype: "separationLine"},
                        {ctype: 'mark', left: 0, top: gridSpacing * 4, width: gridSpacing, height: gridSpacing, 
                            hasControls: false, selectable: false, selectable: false, 
                            subtype: "mark", markStyle: "Oval"},
                        {ctype: 'textbox', left: (gridSpacing * 1) + 2, top: gridSpacing * 4 + 5, width: gridSpacing * 7 - 3, fontSize: 14, text: 'or write-in:'
                            ,hasControls: false, selectable: false},
                        {ctype: 'separationLine', left: gridSpacing, top: gridSpacing * 6 - 5, width: gridSpacing * 7, 
                            stroke: "rgb(0,0,0)", strokeWidth:1, padding:2, hasControls: false, selectable: false, subtype: "separationLine"}
                    ],
                    "backgroundColor" : "#F7D08A"
                    
                },
                {
                    "id"              : n++,
                    "name"            : "Issue template",
                    "value"           : "issueTemplate",
                    "src"             : "http://placehold.it/32x32/F7D08A",
                    "components"   : [
                        {ctype: 'rect', left: 0, top: 0, width: gridSpacing * 24, height: gridSpacing * 1, fill: "#EBEBEB"},
                        {ctype: 'textbox', left: 0, top: 4, width: gridSpacing * 24, fontSize: 12, fontFamily: 'Arial', fontWeight: 'bold', 
                            text: '${contest.name}'},
                        {ctype: 'rect', left: 0, top: gridSpacing * 1, width: gridSpacing * 24, height: gridSpacing * 1, 
                            fill: "#CAE4FF"},
                        {ctype: 'textbox', left: 2, top: (gridSpacing * 1) + 5, width: gridSpacing * 24, fontSize: 12, fontFamily: 'Arial', fontWeight: 'bold', 
                            text: 'Vote yes or no'},
                        {ctype: 'rect', left: 0, top: gridSpacing * 2, width: gridSpacing * 24, height: gridSpacing * 13,
                            fill: "#FFFFFF"},
                        {ctype: 'textbox', left: 2, top: (gridSpacing * 2) + 5, width: gridSpacing * 24, fontSize: 12, fontFamily: 'Arial', 
                            text: 'Amendment text'},
                        {ctype: 'rect', left: 0, top: gridSpacing * 15, width: gridSpacing * 24, height: gridSpacing * 1, 
                            fill: "#FFFFFF", subtype: "ballotOption"},
                        {ctype: 'mark', left: 0, top: gridSpacing * 15, width: gridSpacing, height: gridSpacing, subtype: "mark", markStyle: "Oval"},
                        {ctype: 'textbox', left: (gridSpacing * 1) + 0, top: gridSpacing * 15 + 4, width: gridSpacing * 22, fontSize: 12, fontWeight: 'bold', 
                            text: '${nomination.name}'},
                        {ctype: 'separationLine', left: gridSpacing, top: gridSpacing * 16 - 5, width: gridSpacing * 23, 
                            stroke: "rgb(0,0,0)", strokeWidth:1, subtype: "separationLine"}
                    ],
                    "backgroundColor" : "#F7D08A"
                    
                },
                {
                    "id"              : n++,
                    "name"            : "Contest Header",
                    "value"           : "contestClass",
                    "src"             : "http://placehold.it/32x32/F7D08A",
                    "components"      : [
                        {left: 0, top: 0, width: gridSpacing * 24, height: gridSpacing * 3, fill: "#FFFFFF", opacity: 1},
                     ],
                    "backgroundColor" : "#F7D08A"
                }
            ];
            
            return definitions;
        }
        
        this.getTemplateGenericElements = function() {
            let n = 1;
            const definitions = [
                {
                    "id"              : n++,
                    "name"            : "Image",
                    "value"           : "headerImage01",
                    "components"      : [
                        {ctype: 'image', left: 100, top: 0, width: gridSpacing * 3, height: gridSpacing * 3, 
                            hoverCursor: "not-allowed", hasRotatingPoint: false, hasControls: false,
                            lockMovementX: true, lockMovementY: true
                        }
                     ]
                },/*
                {
                    "id"              : n++,
                    "name"            : "Image placeholder",
                    "value"           : "imagePlaceholder",
                    "components"      : [
                        {ctype: 'rect', left: 100, top: 0, width: gridSpacing * 2, height: gridSpacing * 2, 
                            fill: "#e0e0e0", hasRotatingPoint: false, 
                            snapToGrid: false, excludeFromExport: true,
                            subtype: 'imagePlaceholder'
                        }
                     ]
                },*/
                {
                    "id"              : n++,
                    "name"            : "Text",
                    "value"           : "textElement",
                    "components"      : [
                        {ctype: 'textbox', left: 102, top: (gridSpacing * 1) + 5, width: gridSpacing * 6, fontSize: 12, fontFamily: 'Arial', 
                            text: 'Write something...', hasControls: true},
                     ]
                },
            ];
            
            return definitions;
        }
        
        this.getTemplateHeaderFixedElements = function(pageWidth) {
            if (!pageWidth) {
                pageWidth = 0;
            }
            
            let n = 1;
            const definitions = [
                {
                    "id"              : n++,
                    "name"            : "Barcode (QR)",
                    "value"           : "barcode",
                    "components"      : [
                        {ctype: 'image', left: 0, top: 0, width: gridSpacing * 3, height: gridSpacing * 3, 
                            hoverCursor: "not-allowed", hasRotatingPoint: false, hasControls: false,
                            lockMovementX: true, lockMovementY: true, src: 'images/qr154.png', 
                            //selectable: false,
                            subtype: "barcode"
                        }
                     ]
                },
                {
                    "id"              : n++,
                    "name"            : "Page number",
                    "value"           : "pageNumber",
                    "components"      : [
                        {ctype: 'rect', left: 0, top: 0, width: gridSpacing * 3, height: gridSpacing * 2,
                            fill: "#FFFFFF"},
                        {ctype: 'textbox', left: 14, top: 10, width: 20, height: 31.64, fontSize: 28, textAlign: 'right', 
                            fontFamily: 'Arial', hasControls: false, text: 'N'},
                        {ctype: 'textbox', left: 36, top: 24, width: 20, height: 13.56, fontSize: 12, fontFamily: 'Arial', 
                            hasControls: false, text: '/ N'},
                     ],
                     "groupDefinition": {
                         top: 0, left: pageWidth - gridSpacing * 3,
                         hasRotatingPoint: false, hasControls: false, cornerSize: 6, opacity: 1,
                         hoverCursor: "not-allowed", lockMovementX: true, lockMovementY: true,
                         //selectable: false,
                         subtype: "pageNumber"
                     } 
                },/*
                {
                    "id"              : n++,
                    "name"            : "Page number (persistent)",
                    "value"           : "pageNumber",
                    "components"      : [
                        {ctype: 'rect', left: 0, top: 0, width: gridSpacing * 3, height: gridSpacing * 2,
                            fill: "#FFFFFF"},
                        {ctype: 'textbox', left: 14, top: 10, width: 20, height: 31.64, fontSize: 28, textAlign: 'right', 
                            fontFamily: 'Arial', hasControls: false, text: '8'},
                        {ctype: 'textbox', left: 36, top: 24, width: 20, height: 13.56, fontSize: 12, fontFamily: 'Arial', 
                            hasControls: false, text: '/ 8'},
                     ],
                     "groupDefinition": {
                         top: 0, left: pageWidth - gridSpacing * 3,
                         hasRotatingPoint: false, hasControls: false, cornerSize: 6, opacity: 0.8,
                         hoverCursor: "not-allowed", lockMovementX: true, lockMovementY: true,
                     } 
                },*/
            ];
            
            return definitions;
        }
        
        this.getTemplateFooterFixedElements = function(pageWidth) {
            if (!pageWidth) {
                pageWidth = 0;
            }
            
            let n = 1;
            const definitions = [
                {
                    "id"              : n++,
                    "name"            : "Next page",
                    "value"           : "nextPage",
                    "components"      : [
                        {ctype: 'image', left: pageWidth - gridSpacing * 8, top: 0, width: gridSpacing * 8, height: gridSpacing * 3, 
                            hoverCursor: "not-allowed", hasRotatingPoint: false, hasControls: false,
                            //selectable: false,
                            src: 'images/continueVoting.png',
                            subtype: "pageNavigation"
                        }
                     ]
                },
                {
                    "id"              : n++,
                    "name"            : "Last page",
                    "value"           : "lastPage",
                    "components"      : [
                        {ctype: 'rect', left: 0, top: gridSpacing, width: gridSpacing * 6, height: gridSpacing * 2,
                            fill: "#e6f8fd"},
                        {ctype: 'textbox', left: 14, top: 3 + gridSpacing, width: 126, height: 45, fontSize: 12, 
                            textAlign: 'left', fontFamily: 'Arial', fontWeight: 'bold', hasControls: false,
                            text: 'Thank you for voting!\nPlease turn in\nyour finished ballot'}
                     ],
                     "groupDefinition": {
                         top: gridSpacing, left: pageWidth - gridSpacing * 6,
                         hasRotatingPoint: false, hasControls: false, cornerSize: 6, opacity: 1,
                         hoverCursor: "not-allowed", lockMovementX: true, lockMovementY: true,
                         //selectable: false,
                         subtype: "pageNavigation"
                     }
                }
            ];
            
            return definitions;
        }
        
        this.getPageNavigationFixedElements = function(pageWidth) {
            if (!pageWidth) {
                pageWidth = 0;
            }
            
            let n = 1;
            const definitions = [
                {
                    "id"              : n++,
                    "name"            : "Next page",
                    "value"           : "nextPage",
                    "components"      : [
                        {ctype: 'rect', left: 0, top: 0, width: gridSpacing * 4, height: gridSpacing * 2,
                            fill: "#e6f8fd", stackable: true, hasControls: false,
                            name: 'templateContainer'},
                        {ctype: 'text', left: 5, top: 11, width: 89, height: 29.29, fontSize: 12, fontWeight: "bold", fontFamily: 'Arial', 
                            hasControls: false, text: "Continue voting\nnext side", hasControls: false,
                            name: 'instructions'},
                        {ctype: 'image', left: gridSpacing * 4, top: 0, width: gridSpacing * 2, height: gridSpacing * 2, 
                            hasRotatingPoint: false, hasControls: false,
                            name: 'image',
                            src: 'images/arrow50.png'
                        }
                     ],
//                     "groupDefinition": {
//                         hasRotatingPoint: false, cornerSize: 6, opacity: 0.8
//                     }
                }
            ];
            
            return definitions;
        }
        
    }

    ballotTemplateDesignerService.$inject = injectParams;

    angular.module('ballotTemplateDesigner').service('ballotTemplateDesignerService', ballotTemplateDesignerService);

})(angular);
