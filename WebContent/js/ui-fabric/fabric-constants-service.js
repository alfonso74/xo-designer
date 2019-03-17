(function() {

    'use strict';


    angular.module('ems.fabric').service('fabricConstants', fabricConstants);


    fabricConstants.$inject = [ '$log' ];

    function fabricConstants($log) {
        var service = this;
        
        service.pageSizes = [
            { name: '8.5" x 11"', code: 'LETTER', width: 612, height: 792, dpi: 72, columns: 24, rows: 26},
            { name: '8.5" x 14"', code: 'LEGAL', width: 612, height: 1008, dpi: 72, columns: 24, rows: 36},
            { name: '8.5" x 17"', code: 'VVSG17', width: 612, height: 1224, dpi: 72, columns: 24, rows: 46},
            { name: '8.5" x 19"', code: 'VVSG19', width: 612, height: 1368, dpi: 72, columns: 24, rows: 53}
        ];
        
        service.fonts = [
            { name: 'Arial' },
            { name: 'Times New Roman' },
            { name: 'Helvetica' },
            { name: 'Courier' },
            { name: 'Comic Sans MS' },
            { name: 'Mi fuente CSS' }
        ];
        
        service.fontSizes = [
            {id: 1, value: 10},
            {id: 2, value: 12},
            {id: 3, value: 14},
            {id: 4, value: 16},
            {id: 5, value: 18},
            {id: 6, value: 20},
            {id: 7, value: 24},
            {id: 8, value: 28},
            {id: 9, value: 36}
        ];
        
        service.markTypes = [
            { name: 'Circle' },
            { name: 'Oval' },
            { name: 'Square' }
        ];
        
        service.defaultTemplates = {
            pageNumber: {name: 'Default page number', code: 1, customCode: 'PN'},
            nextPageInstruction: {name: 'Default next page', code: 2, customCode: 'NPI'},
            finalPageInstruction: {name: 'Default final page', code: 3, customCode: 'FPI'}
        };

        service.JSONExportProperties = [
            'height',
            'width',
            'background',
            'objects',

            'originalHeight',
            'originalWidth',
            'originalScaleX',
            'originalScaleY',
            'originalLeft',
            'originalTop',

            'lineHeight',
            'lockMovementX',
            'lockMovementY',
            'lockScalingX',
            'lockScalingY',
            'lockUniScaling',
            'lockRotation',
            'lockObject',
            'id',
            'isTinted',
            'filters'
        ];

        service.windowDefaults = {
            padding : 0,
            rotatingPointOffset : 40,
            transparentCorners : true
        };

        service.canvasDefaults = {
            backgroundColor : '#ffffff',
            width: service.pageSizes[0].width,
            height: service.pageSizes[0].height,
            selection : false,
            preserveObjectStacking: true,
            stateful: true, // allow access to fabric object's _stateProperties
            grid : {
                columns: service.pageSizes[0].columns,
                rows: service.pageSizes[0].rows,
                columnSeparation: 25,
                rowSeparation: 25,
                show: true,
                snapTo: true
            }
        };

        var objectDefaults = {
            rotatingPointOffset : 40,
            padding : 0,
            borderColor : 'rgba(102,153,255,0.75)',
            cornerColor : 'rgba(102,153,255,0.5)',
            cornerSize : 10,
            transparentCorners : true,
            hasRotatingPoint : true,
            centerTransform : true
        };

        service.shapeDefaults = angular.extend({
            fill : '#0088cc'
        }, objectDefaults);

        service.rectDefaults = angular.extend(objectDefaults, {
            left : 0,
            top : 0,
            width : 200,
            height : 50,
            fill : '#FFFF00',
            hasRotatingPoint: false,
            hasControls: true,
            cornerSize: 6,
            opacity : 0.7});
        
        service.textDefaults = angular.extend({
            left : 0,
            top : 0,
            originX : 'left',
            originY : 'top',
            scaleX : 1,
            scaleY : 1,
            fontFamily : 'Tahoma',
            fontSize : 12,
            fontWeight : 'normal',
            fill : '#454545',
            textAlign : 'left'
        }, objectDefaults);

        return service;

    }

})();