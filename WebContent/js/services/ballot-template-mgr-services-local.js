(function(){
    'use strict';
    
    var ballotTemplateDesignerServiceLocal = function ($http, $q, $timeout) {
        
        /*
        const baseUrl = '/vvsg/rest/ballot-designer/';
        
        this.getContestClasses = function() {
            return $http({
                url : baseUrl + 'contestClass',
                method : 'GET',
                params : {}
            });
        };
        */
       
        this.getContestClasses = function() {
            var n = 1;
            const mockData = {
                "type" : "SUCCESS",
                "message" : null,
                "data" : [{
                    "code": 2,
                    "name": "County Assessor REGULAR",
                    "description": null,
                    "customCode": "COUN_AS.4I1LIBJL",
                    "type": "REGULAR",
                    "electionMode": null,
                    "documentsTitle": null,
                    "precedence": 1,
                    "timePeriod": null
                  }, {
                    "code": 3,
                    "name": "State Assembly REGULAR",
                    "description": null,
                    "customCode": "STAT_AS.9DGLCWWB",
                    "type": "REGULAR",
                    "electionMode": null,
                    "documentsTitle": null,
                    "precedence": 1,
                    "timePeriod": null
                  }, {
                    "code": 4,
                    "name": "County Commissioner REGULAR",
                    "description": null,
                    "customCode": "COUN_CO.ZNT4GWGO",
                    "type": "REGULAR",
                    "electionMode": null,
                    "documentsTitle": null,
                    "precedence": 1,
                    "timePeriod": null
                  }, {
                    "code": 5,
                    "name": "Dog Catcher REGULAR",
                    "description": null,
                    "customCode": "DOG_CAT.G517P7AZ",
                    "type": "REGULAR",
                    "electionMode": null,
                    "documentsTitle": null,
                    "precedence": 5,
                    "timePeriod": null
                  }, {
                    "code": 6,
                    "name": "Supreme Court Justice REGULAR",
                    "description": null,
                    "customCode": "SUPR_CO.U5Z54Z8X",
                    "type": "REGULAR",
                    "electionMode": null,
                    "documentsTitle": null,
                    "precedence": 1,
                    "timePeriod": null
                  }, {
                    "code": 7,
                    "name": "Proposal Proposal District 1",
                    "description": null,
                    "customCode": "PROP.MEQSML5HRKU",
                    "type": "ISSUE",
                    "electionMode": null,
                    "documentsTitle": null,
                    "precedence": 1,
                    "timePeriod": null
                  }, {
                    "code": 8,
                    "name": "Senator REGULAR",
                    "description": null,
                    "customCode": "SENATOR.SQSHKN3S",
                    "type": "REGULAR",
                    "electionMode": null,
                    "documentsTitle": null,
                    "precedence": 1,
                    "timePeriod": null
                  }, {
                    "code": 9,
                    "name": "Representative in Congress REGULAR",
                    "description": null,
                    "customCode": "REPR_IN.7JTL4IFR",
                    "type": "REGULAR",
                    "electionMode": null,
                    "documentsTitle": null,
                    "precedence": 1,
                    "timePeriod": null
                  }, {
                    "code": 10,
                    "name": "Proposal Proposal District 2a",
                    "description": null,
                    "customCode": "PROP.GW59L1KW2IM",
                    "type": "ISSUE",
                    "electionMode": null,
                    "documentsTitle": null,
                    "precedence": 1,
                    "timePeriod": null
                  }, {
                    "code": 11,
                    "name": "Proposal Proposal District 2b",
                    "description": null,
                    "customCode": "PROP.58PWZFZSKI9",
                    "type": "ISSUE",
                    "electionMode": null,
                    "documentsTitle": null,
                    "precedence": 1,
                    "timePeriod": null
                  }, {
                    "code": 12,
                    "name": "President and Vice President REGULAR",
                    "description": null,
                    "customCode": "PRES_AN.RDNTU15T",
                    "type": "REGULAR",
                    "electionMode": null,
                    "documentsTitle": null,
                    "precedence": 1,
                    "timePeriod": null
                  }
                ]
            };
            
            return $q.when(mockData);
        }
        
        this.getBallotTemplate = function(templateCode) {
            const mockData = {
                "type": "SUCCESS",
                "message": null,
                "data": {
                    "code": 0,
                    "customCode": "0001",
                    "name": "Regular write-in (6 cols)",
                    "type": "CONTEST",
                    "description": "Regular template with write-in support (6 columns)",
                    "definition": '{"type":"group","originX":"left","originY":"top","left":0,"top":0,"width":151,"height":152,"fill":"rgb(0,0,0)","stroke":null,"strokeWidth":0,"strokeDashArray":null,"strokeLineCap":"butt","strokeLineJoin":"miter","strokeMiterLimit":10,"scaleX":1,"scaleY":1,"angle":0,"flipX":false,"flipY":false,"opacity":0.9,"shadow":null,"visible":true,"clipTo":null,"backgroundColor":"","fillRule":"nonzero","globalCompositeOperation":"source-over","transformMatrix":null,"skewX":0,"skewY":0,"id":7163,"objects":[{"type":"rect","originX":"left","originY":"top","left":-75.5,"top":-76,"width":150,"height":25,"fill":"#f3f3f3","stroke":null,"strokeWidth":1,"strokeDashArray":null,"strokeLineCap":"butt","strokeLineJoin":"miter","strokeMiterLimit":10,"scaleX":1,"scaleY":1,"angle":0,"flipX":false,"flipY":false,"opacity":0.7,"shadow":null,"visible":true,"clipTo":null,"backgroundColor":"","fillRule":"nonzero","globalCompositeOperation":"source-over","transformMatrix":null,"skewX":0,"skewY":0,"rx":0,"ry":0,"id":3583},{"type":"textbox","originX":"left","originY":"top","left":-75.5,"top":-73,"width":150,"height":25,"fill":"rgb(0,0,0)","stroke":null,"strokeWidth":1,"strokeDashArray":null,"strokeLineCap":"butt","strokeLineJoin":"miter","strokeMiterLimit":10,"scaleX":1,"scaleY":1,"angle":0,"flipX":false,"flipY":false,"opacity":1,"shadow":null,"visible":true,"clipTo":null,"backgroundColor":"","fillRule":"nonzero","globalCompositeOperation":"source-over","transformMatrix":null,"skewX":0,"skewY":0,"text":"${contest.name}","fontSize":12,"fontWeight":"bold","fontFamily":"Times New Roman","fontStyle":"","lineHeight":1.16,"textDecoration":"","textAlign":"left","textBackgroundColor":"","charSpacing":0,"minWidth":20,"id":8966,"styles":{}},{"type":"rect","originX":"left","originY":"top","left":-75.5,"top":-51,"width":150,"height":25,"fill":"#d9ecff","stroke":null,"strokeWidth":1,"strokeDashArray":null,"strokeLineCap":"butt","strokeLineJoin":"miter","strokeMiterLimit":10,"scaleX":1,"scaleY":1,"angle":0,"flipX":false,"flipY":false,"opacity":0.7,"shadow":null,"visible":true,"clipTo":null,"backgroundColor":"","fillRule":"nonzero","globalCompositeOperation":"source-over","transformMatrix":null,"skewX":0,"skewY":0,"rx":0,"ry":0,"id":9161},{"type":"textbox","originX":"left","originY":"top","left":-75.5,"top":-46,"width":150,"height":25,"fill":"rgb(0,0,0)","stroke":null,"strokeWidth":1,"strokeDashArray":null,"strokeLineCap":"butt","strokeLineJoin":"miter","strokeMiterLimit":10,"scaleX":1,"scaleY":1,"angle":0,"flipX":false,"flipY":false,"opacity":1,"shadow":null,"visible":true,"clipTo":null,"backgroundColor":"","fillRule":"nonzero","globalCompositeOperation":"source-over","transformMatrix":null,"skewX":0,"skewY":0,"text":"Vote for ${contest.maxVotes}","fontSize":12,"fontWeight":"normal","fontFamily":"Times New Roman","fontStyle":"","lineHeight":1.16,"textDecoration":"","textAlign":"left","textBackgroundColor":"","charSpacing":0,"minWidth":20,"id":242,"styles":{}},{"type":"group","originX":"left","originY":"top","left":-75.5,"top":-26,"width":151,"height":51,"fill":"rgb(0,0,0)","stroke":null,"strokeWidth":0,"strokeDashArray":null,"strokeLineCap":"butt","strokeLineJoin":"miter","strokeMiterLimit":10,"scaleX":1,"scaleY":1,"angle":0,"flipX":false,"flipY":false,"opacity":0.9,"shadow":null,"visible":true,"clipTo":null,"backgroundColor":"","fillRule":"nonzero","globalCompositeOperation":"source-over","transformMatrix":null,"skewX":0,"skewY":0,"id":6045,"subtype":"ballotOption","objects":[{"type":"rect","originX":"left","originY":"top","left":-75.5,"top":-25.5,"width":150,"height":50,"fill":"#ffffff","stroke":null,"strokeWidth":1,"strokeDashArray":null,"strokeLineCap":"butt","strokeLineJoin":"miter","strokeMiterLimit":10,"scaleX":1,"scaleY":1,"angle":0,"flipX":false,"flipY":false,"opacity":0.7,"shadow":null,"visible":true,"clipTo":null,"backgroundColor":"","fillRule":"nonzero","globalCompositeOperation":"source-over","transformMatrix":null,"skewX":0,"skewY":0,"rx":0,"ry":0,"id":1865,"subtype":"ballotOption"},{"type":"ellipse","originX":"left","originY":"top","left":-75.5,"top":-25.5,"width":25,"height":25,"fill":"rgba(0,0,0,0)","stroke":"black","strokeWidth":1,"strokeDashArray":null,"strokeLineCap":"butt","strokeLineJoin":"miter","strokeMiterLimit":10,"scaleX":1,"scaleY":1,"angle":0,"flipX":false,"flipY":false,"opacity":1,"shadow":null,"visible":true,"clipTo":null,"backgroundColor":"","fillRule":"nonzero","globalCompositeOperation":"source-over","transformMatrix":null,"skewX":0,"skewY":0,"rx":10,"ry":5,"id":2067,"subtype":"mark"},{"type":"textbox","originX":"left","originY":"top","left":-50.5,"top":-18.5,"width":125,"height":25,"fill":"rgb(0,0,0)","stroke":null,"strokeWidth":1,"strokeDashArray":null,"strokeLineCap":"butt","strokeLineJoin":"miter","strokeMiterLimit":10,"scaleX":1,"scaleY":1,"angle":0,"flipX":false,"flipY":false,"opacity":1,"shadow":null,"visible":true,"clipTo":null,"backgroundColor":"","fillRule":"nonzero","globalCompositeOperation":"source-over","transformMatrix":null,"skewX":0,"skewY":0,"text":"${nomination.name}","fontSize":12,"fontWeight":"bold","fontFamily":"Times New Roman","fontStyle":"","lineHeight":1.16,"textDecoration":"","textAlign":"left","textBackgroundColor":"","charSpacing":0,"minWidth":20,"id":5049,"styles":{}},{"type":"textbox","originX":"left","originY":"top","left":-50.5,"top":-2.5,"width":125,"height":25,"fill":"rgb(0,0,0)","stroke":null,"strokeWidth":1,"strokeDashArray":null,"strokeLineCap":"butt","strokeLineJoin":"miter","strokeMiterLimit":10,"scaleX":1,"scaleY":1,"angle":0,"flipX":false,"flipY":false,"opacity":1,"shadow":null,"visible":true,"clipTo":null,"backgroundColor":"","fillRule":"nonzero","globalCompositeOperation":"source-over","transformMatrix":null,"skewX":0,"skewY":0,"text":"${party.name}","fontSize":12,"fontWeight":"normal","fontFamily":"Times New Roman","fontStyle":"","lineHeight":1.16,"textDecoration":"","textAlign":"left","textBackgroundColor":"","charSpacing":0,"minWidth":20,"id":1681,"styles":{}},{"type":"line","originX":"left","originY":"top","left":-50.5,"top":19.25,"width":125,"height":0,"fill":"rgb(0,0,0)","stroke":"rgb(0,0,0)","strokeWidth":1,"strokeDashArray":null,"strokeLineCap":"butt","strokeLineJoin":"miter","strokeMiterLimit":10,"scaleX":1,"scaleY":1,"angle":0,"flipX":false,"flipY":false,"opacity":1,"shadow":null,"visible":true,"clipTo":null,"backgroundColor":"","fillRule":"nonzero","globalCompositeOperation":"source-over","transformMatrix":null,"skewX":0,"skewY":0,"id":5642,"subtype":"separationLine","x1":-62.5,"x2":62.5,"y1":0,"y2":0}]},{"type":"group","originX":"left","originY":"top","left":-75.5,"top":24,"width":151,"height":51,"fill":"rgb(0,0,0)","stroke":null,"strokeWidth":0,"strokeDashArray":null,"strokeLineCap":"butt","strokeLineJoin":"miter","strokeMiterLimit":10,"scaleX":1,"scaleY":1,"angle":0,"flipX":false,"flipY":false,"opacity":0.9,"shadow":null,"visible":true,"clipTo":null,"backgroundColor":"","fillRule":"nonzero","globalCompositeOperation":"source-over","transformMatrix":null,"skewX":0,"skewY":0,"id":4610,"subtype":"writeIn","objects":[{"type":"rect","originX":"left","originY":"top","left":-75.5,"top":-25.5,"width":150,"height":50,"fill":"#ffffff","stroke":null,"strokeWidth":1,"strokeDashArray":null,"strokeLineCap":"butt","strokeLineJoin":"miter","strokeMiterLimit":10,"scaleX":1,"scaleY":1,"angle":0,"flipX":false,"flipY":false,"opacity":0.7,"shadow":null,"visible":true,"clipTo":null,"backgroundColor":"","fillRule":"nonzero","globalCompositeOperation":"source-over","transformMatrix":null,"skewX":0,"skewY":0,"rx":0,"ry":0,"id":1789,"subtype":"writeIn"},{"type":"ellipse","originX":"left","originY":"top","left":-75.5,"top":-25.5,"width":25,"height":25,"fill":"rgba(0,0,0,0)","stroke":"black","strokeWidth":1,"strokeDashArray":null,"strokeLineCap":"butt","strokeLineJoin":"miter","strokeMiterLimit":10,"scaleX":1,"scaleY":1,"angle":0,"flipX":false,"flipY":false,"opacity":1,"shadow":null,"visible":true,"clipTo":null,"backgroundColor":"","fillRule":"nonzero","globalCompositeOperation":"source-over","transformMatrix":null,"skewX":0,"skewY":0,"rx":10,"ry":5,"id":6755,"subtype":"mark"},{"type":"text","originX":"left","originY":"top","left":-48.5,"top":-19.5,"width":54,"height":13.56,"fill":"rgb(0,0,0)","stroke":null,"strokeWidth":1,"strokeDashArray":null,"strokeLineCap":"butt","strokeLineJoin":"miter","strokeMiterLimit":10,"scaleX":1,"scaleY":1,"angle":0,"flipX":false,"flipY":false,"opacity":1,"shadow":null,"visible":true,"clipTo":null,"backgroundColor":"","fillRule":"nonzero","globalCompositeOperation":"source-over","transformMatrix":null,"skewX":0,"skewY":0,"text":"or write-in","fontSize":12,"fontWeight":"bold","fontFamily":"Times New Roman","fontStyle":"","lineHeight":1.16,"textDecoration":"","textAlign":"left","textBackgroundColor":"","charSpacing":0,"id":9704},{"type":"line","originX":"left","originY":"top","left":-50.5,"top":19.34,"width":125,"height":0,"fill":"rgb(0,0,0)","stroke":"rgb(0,0,0)","strokeWidth":1,"strokeDashArray":null,"strokeLineCap":"butt","strokeLineJoin":"miter","strokeMiterLimit":10,"scaleX":1,"scaleY":1,"angle":0,"flipX":false,"flipY":false,"opacity":1,"shadow":null,"visible":true,"clipTo":null,"backgroundColor":"","fillRule":"nonzero","globalCompositeOperation":"source-over","transformMatrix":null,"skewX":0,"skewY":0,"id":446,"subtype":"separationLine","x1":-62.5,"x2":62.5,"y1":0,"y2":0}]},{"type":"group","originX":"left","originY":"top","left":-75.5,"top":-76,"width":151,"height":152,"fill":"rgb(0,0,0)","stroke":null,"strokeWidth":0,"strokeDashArray":null,"strokeLineCap":"butt","strokeLineJoin":"miter","strokeMiterLimit":10,"scaleX":1,"scaleY":1,"angle":0,"flipX":false,"flipY":false,"opacity":1,"shadow":null,"visible":true,"clipTo":null,"backgroundColor":"","fillRule":"nonzero","globalCompositeOperation":"source-over","transformMatrix":null,"skewX":0,"skewY":0,"subtype":"contestBorders","objects":[{"type":"line","originX":"left","originY":"top","left":-75.5,"top":-76,"width":151,"height":0,"fill":"rgb(0,0,0)","stroke":"rgb(0,0,0)","strokeWidth":2,"strokeDashArray":null,"strokeLineCap":"butt","strokeLineJoin":"miter","strokeMiterLimit":10,"scaleX":1,"scaleY":1,"angle":0,"flipX":false,"flipY":false,"opacity":1,"shadow":null,"visible":true,"clipTo":null,"backgroundColor":"","fillRule":"nonzero","globalCompositeOperation":"source-over","transformMatrix":null,"skewX":0,"skewY":0,"x1":-75.5,"x2":75.5,"y1":0,"y2":0},{"type":"line","originX":"left","originY":"top","left":-75.5,"top":-76,"width":0,"height":151,"fill":"rgb(0,0,0)","stroke":"rgb(0,0,0)","strokeWidth":1,"strokeDashArray":null,"strokeLineCap":"butt","strokeLineJoin":"miter","strokeMiterLimit":10,"scaleX":1,"scaleY":1,"angle":0,"flipX":false,"flipY":false,"opacity":1,"shadow":null,"visible":true,"clipTo":null,"backgroundColor":"","fillRule":"nonzero","globalCompositeOperation":"source-over","transformMatrix":null,"skewX":0,"skewY":0,"x1":0,"x2":0,"y1":-75.5,"y2":75.5},{"type":"line","originX":"left","originY":"top","left":-75.5,"top":75,"width":151,"height":0,"fill":"rgb(0,0,0)","stroke":"rgb(0,0,0)","strokeWidth":1,"strokeDashArray":null,"strokeLineCap":"butt","strokeLineJoin":"miter","strokeMiterLimit":10,"scaleX":1,"scaleY":1,"angle":0,"flipX":false,"flipY":false,"opacity":1,"shadow":null,"visible":true,"clipTo":null,"backgroundColor":"","fillRule":"nonzero","globalCompositeOperation":"source-over","transformMatrix":null,"skewX":0,"skewY":0,"x1":-75.5,"x2":75.5,"y1":0,"y2":0}]}]}'
                }
            };
            
            return $q.when({data: mockData});
        }
        
        this.getBallotTemplatesList = function() {
            const mockData = {
                "type": "SUCCESS",
                "message": null,
                "data": [{
                    "code": 0,
                    "customCode": "0001",
                    "name": "Regular write-in (6 cols)",
                    "type": "CONTEST",
                    "description": "Regular template with write-in support (6 columns)",
                    "definition": '{"type":"group","originX":"left","originY":"top","left":0,"top":0,"width":151,"height":152,"fill":"rgb(0,0,0)","stroke":null,"strokeWidth":0,"strokeDashArray":null,"strokeLineCap":"butt","strokeLineJoin":"miter","strokeMiterLimit":10,"scaleX":1,"scaleY":1,"angle":0,"flipX":false,"flipY":false,"opacity":0.9,"shadow":null,"visible":true,"clipTo":null,"backgroundColor":"","fillRule":"nonzero","globalCompositeOperation":"source-over","transformMatrix":null,"skewX":0,"skewY":0,"id":7163,"objects":[{"type":"rect","originX":"left","originY":"top","left":-75.5,"top":-76,"width":150,"height":25,"fill":"#f3f3f3","stroke":null,"strokeWidth":1,"strokeDashArray":null,"strokeLineCap":"butt","strokeLineJoin":"miter","strokeMiterLimit":10,"scaleX":1,"scaleY":1,"angle":0,"flipX":false,"flipY":false,"opacity":0.7,"shadow":null,"visible":true,"clipTo":null,"backgroundColor":"","fillRule":"nonzero","globalCompositeOperation":"source-over","transformMatrix":null,"skewX":0,"skewY":0,"rx":0,"ry":0,"id":3583},{"type":"textbox","originX":"left","originY":"top","left":-75.5,"top":-73,"width":150,"height":25,"fill":"rgb(0,0,0)","stroke":null,"strokeWidth":1,"strokeDashArray":null,"strokeLineCap":"butt","strokeLineJoin":"miter","strokeMiterLimit":10,"scaleX":1,"scaleY":1,"angle":0,"flipX":false,"flipY":false,"opacity":1,"shadow":null,"visible":true,"clipTo":null,"backgroundColor":"","fillRule":"nonzero","globalCompositeOperation":"source-over","transformMatrix":null,"skewX":0,"skewY":0,"text":"${contest.name}","fontSize":12,"fontWeight":"bold","fontFamily":"Times New Roman","fontStyle":"","lineHeight":1.16,"textDecoration":"","textAlign":"left","textBackgroundColor":"","charSpacing":0,"minWidth":20,"id":8966,"styles":{}},{"type":"rect","originX":"left","originY":"top","left":-75.5,"top":-51,"width":150,"height":25,"fill":"#d9ecff","stroke":null,"strokeWidth":1,"strokeDashArray":null,"strokeLineCap":"butt","strokeLineJoin":"miter","strokeMiterLimit":10,"scaleX":1,"scaleY":1,"angle":0,"flipX":false,"flipY":false,"opacity":0.7,"shadow":null,"visible":true,"clipTo":null,"backgroundColor":"","fillRule":"nonzero","globalCompositeOperation":"source-over","transformMatrix":null,"skewX":0,"skewY":0,"rx":0,"ry":0,"id":9161},{"type":"textbox","originX":"left","originY":"top","left":-75.5,"top":-46,"width":150,"height":25,"fill":"rgb(0,0,0)","stroke":null,"strokeWidth":1,"strokeDashArray":null,"strokeLineCap":"butt","strokeLineJoin":"miter","strokeMiterLimit":10,"scaleX":1,"scaleY":1,"angle":0,"flipX":false,"flipY":false,"opacity":1,"shadow":null,"visible":true,"clipTo":null,"backgroundColor":"","fillRule":"nonzero","globalCompositeOperation":"source-over","transformMatrix":null,"skewX":0,"skewY":0,"text":"Vote for ${contest.maxVotes}","fontSize":12,"fontWeight":"normal","fontFamily":"Times New Roman","fontStyle":"","lineHeight":1.16,"textDecoration":"","textAlign":"left","textBackgroundColor":"","charSpacing":0,"minWidth":20,"id":242,"styles":{}},{"type":"group","originX":"left","originY":"top","left":-75.5,"top":-26,"width":151,"height":51,"fill":"rgb(0,0,0)","stroke":null,"strokeWidth":0,"strokeDashArray":null,"strokeLineCap":"butt","strokeLineJoin":"miter","strokeMiterLimit":10,"scaleX":1,"scaleY":1,"angle":0,"flipX":false,"flipY":false,"opacity":0.9,"shadow":null,"visible":true,"clipTo":null,"backgroundColor":"","fillRule":"nonzero","globalCompositeOperation":"source-over","transformMatrix":null,"skewX":0,"skewY":0,"id":6045,"subtype":"ballotOption","objects":[{"type":"rect","originX":"left","originY":"top","left":-75.5,"top":-25.5,"width":150,"height":50,"fill":"#ffffff","stroke":null,"strokeWidth":1,"strokeDashArray":null,"strokeLineCap":"butt","strokeLineJoin":"miter","strokeMiterLimit":10,"scaleX":1,"scaleY":1,"angle":0,"flipX":false,"flipY":false,"opacity":0.7,"shadow":null,"visible":true,"clipTo":null,"backgroundColor":"","fillRule":"nonzero","globalCompositeOperation":"source-over","transformMatrix":null,"skewX":0,"skewY":0,"rx":0,"ry":0,"id":1865,"subtype":"ballotOption"},{"type":"ellipse","originX":"left","originY":"top","left":-75.5,"top":-25.5,"width":25,"height":25,"fill":"rgba(0,0,0,0)","stroke":"black","strokeWidth":1,"strokeDashArray":null,"strokeLineCap":"butt","strokeLineJoin":"miter","strokeMiterLimit":10,"scaleX":1,"scaleY":1,"angle":0,"flipX":false,"flipY":false,"opacity":1,"shadow":null,"visible":true,"clipTo":null,"backgroundColor":"","fillRule":"nonzero","globalCompositeOperation":"source-over","transformMatrix":null,"skewX":0,"skewY":0,"rx":10,"ry":5,"id":2067,"subtype":"mark"},{"type":"textbox","originX":"left","originY":"top","left":-50.5,"top":-18.5,"width":125,"height":25,"fill":"rgb(0,0,0)","stroke":null,"strokeWidth":1,"strokeDashArray":null,"strokeLineCap":"butt","strokeLineJoin":"miter","strokeMiterLimit":10,"scaleX":1,"scaleY":1,"angle":0,"flipX":false,"flipY":false,"opacity":1,"shadow":null,"visible":true,"clipTo":null,"backgroundColor":"","fillRule":"nonzero","globalCompositeOperation":"source-over","transformMatrix":null,"skewX":0,"skewY":0,"text":"${nomination.name}","fontSize":12,"fontWeight":"bold","fontFamily":"Times New Roman","fontStyle":"","lineHeight":1.16,"textDecoration":"","textAlign":"left","textBackgroundColor":"","charSpacing":0,"minWidth":20,"id":5049,"styles":{}},{"type":"textbox","originX":"left","originY":"top","left":-50.5,"top":-2.5,"width":125,"height":25,"fill":"rgb(0,0,0)","stroke":null,"strokeWidth":1,"strokeDashArray":null,"strokeLineCap":"butt","strokeLineJoin":"miter","strokeMiterLimit":10,"scaleX":1,"scaleY":1,"angle":0,"flipX":false,"flipY":false,"opacity":1,"shadow":null,"visible":true,"clipTo":null,"backgroundColor":"","fillRule":"nonzero","globalCompositeOperation":"source-over","transformMatrix":null,"skewX":0,"skewY":0,"text":"${party.name}","fontSize":12,"fontWeight":"normal","fontFamily":"Times New Roman","fontStyle":"","lineHeight":1.16,"textDecoration":"","textAlign":"left","textBackgroundColor":"","charSpacing":0,"minWidth":20,"id":1681,"styles":{}},{"type":"line","originX":"left","originY":"top","left":-50.5,"top":19.25,"width":125,"height":0,"fill":"rgb(0,0,0)","stroke":"rgb(0,0,0)","strokeWidth":1,"strokeDashArray":null,"strokeLineCap":"butt","strokeLineJoin":"miter","strokeMiterLimit":10,"scaleX":1,"scaleY":1,"angle":0,"flipX":false,"flipY":false,"opacity":1,"shadow":null,"visible":true,"clipTo":null,"backgroundColor":"","fillRule":"nonzero","globalCompositeOperation":"source-over","transformMatrix":null,"skewX":0,"skewY":0,"id":5642,"subtype":"separationLine","x1":-62.5,"x2":62.5,"y1":0,"y2":0}]},{"type":"group","originX":"left","originY":"top","left":-75.5,"top":24,"width":151,"height":51,"fill":"rgb(0,0,0)","stroke":null,"strokeWidth":0,"strokeDashArray":null,"strokeLineCap":"butt","strokeLineJoin":"miter","strokeMiterLimit":10,"scaleX":1,"scaleY":1,"angle":0,"flipX":false,"flipY":false,"opacity":0.9,"shadow":null,"visible":true,"clipTo":null,"backgroundColor":"","fillRule":"nonzero","globalCompositeOperation":"source-over","transformMatrix":null,"skewX":0,"skewY":0,"id":4610,"subtype":"writeIn","objects":[{"type":"rect","originX":"left","originY":"top","left":-75.5,"top":-25.5,"width":150,"height":50,"fill":"#ffffff","stroke":null,"strokeWidth":1,"strokeDashArray":null,"strokeLineCap":"butt","strokeLineJoin":"miter","strokeMiterLimit":10,"scaleX":1,"scaleY":1,"angle":0,"flipX":false,"flipY":false,"opacity":0.7,"shadow":null,"visible":true,"clipTo":null,"backgroundColor":"","fillRule":"nonzero","globalCompositeOperation":"source-over","transformMatrix":null,"skewX":0,"skewY":0,"rx":0,"ry":0,"id":1789,"subtype":"writeIn"},{"type":"ellipse","originX":"left","originY":"top","left":-75.5,"top":-25.5,"width":25,"height":25,"fill":"rgba(0,0,0,0)","stroke":"black","strokeWidth":1,"strokeDashArray":null,"strokeLineCap":"butt","strokeLineJoin":"miter","strokeMiterLimit":10,"scaleX":1,"scaleY":1,"angle":0,"flipX":false,"flipY":false,"opacity":1,"shadow":null,"visible":true,"clipTo":null,"backgroundColor":"","fillRule":"nonzero","globalCompositeOperation":"source-over","transformMatrix":null,"skewX":0,"skewY":0,"rx":10,"ry":5,"id":6755,"subtype":"mark"},{"type":"text","originX":"left","originY":"top","left":-48.5,"top":-19.5,"width":54,"height":13.56,"fill":"rgb(0,0,0)","stroke":null,"strokeWidth":1,"strokeDashArray":null,"strokeLineCap":"butt","strokeLineJoin":"miter","strokeMiterLimit":10,"scaleX":1,"scaleY":1,"angle":0,"flipX":false,"flipY":false,"opacity":1,"shadow":null,"visible":true,"clipTo":null,"backgroundColor":"","fillRule":"nonzero","globalCompositeOperation":"source-over","transformMatrix":null,"skewX":0,"skewY":0,"text":"or write-in","fontSize":12,"fontWeight":"bold","fontFamily":"Times New Roman","fontStyle":"","lineHeight":1.16,"textDecoration":"","textAlign":"left","textBackgroundColor":"","charSpacing":0,"id":9704},{"type":"line","originX":"left","originY":"top","left":-50.5,"top":19.34,"width":125,"height":0,"fill":"rgb(0,0,0)","stroke":"rgb(0,0,0)","strokeWidth":1,"strokeDashArray":null,"strokeLineCap":"butt","strokeLineJoin":"miter","strokeMiterLimit":10,"scaleX":1,"scaleY":1,"angle":0,"flipX":false,"flipY":false,"opacity":1,"shadow":null,"visible":true,"clipTo":null,"backgroundColor":"","fillRule":"nonzero","globalCompositeOperation":"source-over","transformMatrix":null,"skewX":0,"skewY":0,"id":446,"subtype":"separationLine","x1":-62.5,"x2":62.5,"y1":0,"y2":0}]},{"type":"group","originX":"left","originY":"top","left":-75.5,"top":-76,"width":151,"height":152,"fill":"rgb(0,0,0)","stroke":null,"strokeWidth":0,"strokeDashArray":null,"strokeLineCap":"butt","strokeLineJoin":"miter","strokeMiterLimit":10,"scaleX":1,"scaleY":1,"angle":0,"flipX":false,"flipY":false,"opacity":1,"shadow":null,"visible":true,"clipTo":null,"backgroundColor":"","fillRule":"nonzero","globalCompositeOperation":"source-over","transformMatrix":null,"skewX":0,"skewY":0,"subtype":"contestBorders","objects":[{"type":"line","originX":"left","originY":"top","left":-75.5,"top":-76,"width":151,"height":0,"fill":"rgb(0,0,0)","stroke":"rgb(0,0,0)","strokeWidth":2,"strokeDashArray":null,"strokeLineCap":"butt","strokeLineJoin":"miter","strokeMiterLimit":10,"scaleX":1,"scaleY":1,"angle":0,"flipX":false,"flipY":false,"opacity":1,"shadow":null,"visible":true,"clipTo":null,"backgroundColor":"","fillRule":"nonzero","globalCompositeOperation":"source-over","transformMatrix":null,"skewX":0,"skewY":0,"x1":-75.5,"x2":75.5,"y1":0,"y2":0},{"type":"line","originX":"left","originY":"top","left":-75.5,"top":-76,"width":0,"height":151,"fill":"rgb(0,0,0)","stroke":"rgb(0,0,0)","strokeWidth":1,"strokeDashArray":null,"strokeLineCap":"butt","strokeLineJoin":"miter","strokeMiterLimit":10,"scaleX":1,"scaleY":1,"angle":0,"flipX":false,"flipY":false,"opacity":1,"shadow":null,"visible":true,"clipTo":null,"backgroundColor":"","fillRule":"nonzero","globalCompositeOperation":"source-over","transformMatrix":null,"skewX":0,"skewY":0,"x1":0,"x2":0,"y1":-75.5,"y2":75.5},{"type":"line","originX":"left","originY":"top","left":-75.5,"top":75,"width":151,"height":0,"fill":"rgb(0,0,0)","stroke":"rgb(0,0,0)","strokeWidth":1,"strokeDashArray":null,"strokeLineCap":"butt","strokeLineJoin":"miter","strokeMiterLimit":10,"scaleX":1,"scaleY":1,"angle":0,"flipX":false,"flipY":false,"opacity":1,"shadow":null,"visible":true,"clipTo":null,"backgroundColor":"","fillRule":"nonzero","globalCompositeOperation":"source-over","transformMatrix":null,"skewX":0,"skewY":0,"x1":-75.5,"x2":75.5,"y1":0,"y2":0}]}]}'
                }]
            };
            
            return $q.when(mockData);
        }
        
        this.saveBallotStyleContestAssociations = function(ballotStyleCode, contestAssociations) {
            $log.error("NOT SUPPORTED YET!");
            return $q.when("NOT SUPPORTED YET!");
        }

    }
    
    ballotTemplateDesignerServiceLocal.$inject = ['$http', '$q', '$timeout'];
    
    angular.module('ballotTemplateDesigner').service('ballotTemplateDesignerServiceLocal', ballotTemplateDesignerServiceLocal);
    
})(angular);
