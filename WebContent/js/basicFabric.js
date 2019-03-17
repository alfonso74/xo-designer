var canvas;

function init() {
    //create a wrapper around native canvas element (with id="c")
    canvas = new fabric.Canvas('c');

    // create a rectangle object
    var rect = new fabric.Rect({
      left: 100,
      top: 100,
      fill: 'red',
      width: 20,
      height: 20,
    });
    
    var circle = new fabric.Circle({ radius: 10 });
    
    var texto = new fabric.Textbox('carimañola', {
        left: 100,
        top: 90,
        width: 100,
        evented: false
    });

    // "add" rectangle onto canvas
    canvas.add(circle);
    canvas.add(rect);
    canvas.add(texto);
}

window.onload = function() {
    init();
    pp3();
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

function pp2() {
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


function pp3() {
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


