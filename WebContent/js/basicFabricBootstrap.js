//var canvas;

function init() {
    //create a wrapper around native canvas element (with id="c")
    var canvas = new fabric.Canvas('c');
    var canvas2 = new fabric.Canvas('c2');

    // create a rectangle object
    var rect = new fabric.Rect({
      left: 100,
      top: 100,
      fill: 'red',
      width: 20,
      height: 20
    });
    
    var circle = new fabric.Circle({ radius: 10 });

    // "add" rectangle onto canvas
    canvas.add(rect);
    canvas.add(circle);
    
    canvas2.add(new fabric.Circle({ radius: 15 }));
    
    pp2b(canvas);
    qq(canvas2);
}

window.onload = function() {
    
    init();
//    pp2();
    $('#target').contextmenu(function() {
        alert('j');
        return false;
    });
}

function pp1() {
    $('#pp').contextmenu(function() {
        alert('j');
        return false;
    });
}

function pp2(canvas) {
    $('#pp').bind('contextmenu', function (env) {
//        alert('j');
        var x = env.offsetX;
        var y = env.offsetY;
        $.each (canvas._objects, function(i, e) {
            // e.left and e.top are the middle of the object use some "math" to find the outer edges
            var d = e.width / 2;
            var h = e.height / 2;
            if (x >= (e.left - d) && x <= (e.left+d)) {
                if(y >= (e.top - h) && y <= (e.top+h)) {
                    console.log("clicked canvas obj #"+i);
                    //TODO show custom menu at x, y
                    return false; //in case the icons are stacked only take action on one.
                }
            }
        });
        return false; //stops the event propagation
    });
}

function pp2b(canvas) {
    $('#pp').bind('contextmenu', env => {
//        alert('j');
        var x = env.offsetX;
        var y = env.offsetY;
        $.each (canvas._objects, function(i, e) {
            // e.left and e.top are the middle of the object use some "math" to find the outer edges
            var d = e.width / 2;
            var h = e.height / 2;
            if (x >= (e.left - d) && x <= (e.left+d)) {
                if(y >= (e.top - h) && y <= (e.top+h)) {
                    console.log("clicked canvas obj #"+i);
                    //TODO show custom menu at x, y
                    return false; //in case the icons are stacked only take action on one.
                }
            }
        });
        return false; //stops the event propagation
    });
}


function pp3(canvas) {
    $(".upper-canvas").bind('contextmenu', function(ev) {
//        alert('AHHHH!');
        var pointer = canvas.getPointer(ev.originalEvent);
        var objects = canvas.getObjects();
        for (var i = objects.length - 1; i >= 0; i--) {
            if (objects[i].containsPoint(pointer)) {
                console.log("clicked canvas obj: " + objects[i].type);
                canvas.setActiveObject(objects[i]);
                break;
            }
        }

        if (i < 0) {
            canvas.deactivateAll();
        }

        canvas.renderAll();

        ev.preventDefault();
        return false;
    });
}

function qq(canvas) {
    //#qq .upper-canvas -->  element with class 'upper-canvas' inside element with id 'qq'
    //#qq.upper-canvas -->  element with class 'upper-canvas' and id 'qq'
    $('#qq .upper-canvas').bind('contextmenu', function (ev) {
        var pointer = canvas.getPointer(ev.originalEvent);
        var objects = canvas.getObjects();
        for (var i = objects.length - 1; i >= 0; i--) {
            if (objects[i].containsPoint(pointer)) {
                console.log("clicked canvas obj: " + objects[i].type);
                canvas.setActiveObject(objects[i]);
                break;
            }
        }

        if (i < 0) {
            canvas.deactivateAll();
        }

        canvas.renderAll();

        ev.preventDefault();
        return false;
    });
}


