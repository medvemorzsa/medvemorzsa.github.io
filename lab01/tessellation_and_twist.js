function App(maxDepth) {
    // Constants
    this.styles = {
        WIREFRAMED: 0,
        PARTIALLY_FILLED: 1,
        FILLED: 2
    }
    
    if (Object.freeze)
        Object.freeze(this.styles);
    
    var maxDepth = (typeof maxDepth !== 'undefined') ?  maxDepth : 8;
    
    // User-modifiable parameters
    var depth = 4;
    var angle = 0;
    var twist = true;
    var style = this.styles.WIREFRAMED;
    var color = vec4( 0.0, 0.0, 0.0, 1.0 );    
    
    // Getter for depth parameter
    this.__defineGetter__("depth", function() {
        return depth;
    });
    
    // Setter for depth parameter
    this.__defineSetter__("depth", function(value) {
        if (typeof value === "undefined")
            throw "Depth is required!";
        if ((isNaN(value)) || (!(Number.isInteger(value))))
            throw "Depth must be integer value!";
        if ((value < 0) || (value > maxDepth))
            throw "Depth must be between 0 and " + maxDepth + "!";
        depth = value;
    });
    
    // Getter for angle parameter
    this.__defineGetter__("angle", function() {
        return angle;
    });
    
    // Setter for angle parameter
    this.__defineSetter__("angle", function(value) {
        if (typeof value === "undefined")
            throw "Angle is required!";
        if ((isNaN(value)) || (!(Number.isInteger(value))))
            throw "Angle must be integer value!";
        if ((value < 0) || (value > 359))
            throw "Angle must be between 0 and 359!";
        angle = value;
    });

    // Setter for twist parameter
    this.__defineGetter__("twist", function() {
        return twist;
    });
    
    // Getter for twist parameter
    this.__defineSetter__("twist", function(value) {
        if (typeof value === "undefined")
            throw "twist is required!";
        if (typeof value !== "boolean")
            throw "twist must be boolean value!"
        twist = value;
    });    

    // Getter for style parameter
    this.__defineGetter__("style", function() {
        return style;
    });
    
    // Setter for style parameter
    this.__defineSetter__("style", function(value) {
        if (typeof value === "undefined")
            throw "Style is required!";
        if ((isNaN(value)) || (!(Number.isInteger(value))))
            throw "Style must be one of WIREFRAMED, PARTIALLY_FILLED, FILLED constants!"
        validProp = false;
        for (var prop in this.styles) { 
            if ((this.styles.hasOwnProperty(prop)) && (this.styles[prop] == value))
                validProp = true;
        }
        if (!(validProp))
            throw "Style must be one of WIREFRAMED, PARTIALLY_FILLED, FILLED constants!"
        style = value;
    }); 

    // Getter for color parameter
    this.__defineGetter__("color", function() {
        _red = (color[0] * 255).toString(16);
        if (_red.length == 1)
            _red = "0" + _red
        _green = (color[1] * 255).toString(16);
        if (_green.length == 1)
            _green = "0" + _green
        _blue = (color[2] * 255).toString(16);
        if (_blue.length == 1)
            _blue = "0" + _blue
        return "#" + _red + _green + _blue;
    });
    
    // Setter for color parameter
    this.__defineSetter__("color", function(value) {
        if (typeof value === "undefined")
            throw "Color is required!";
        if (typeof value !== "string")
            throw "Color must be filled #RRGGBB format!";
        if (!(/^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.test(value)))
            throw "Color must be filled #RRGGBB format!";
        var components = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(value);
        color = vec4(parseInt(components[1], 16) / 255.0, parseInt(components[2], 16) / 255.0, parseInt(components[3], 16) / 255.0, 1.0);
    });
    
    // Parameters for WebGL
    var canvas = null;
    var gl = null;
    var bufferID = null;
    var points = [];
    
    // WebGL initialization
    this.initWebGL = function() {
        // Configure canvas and WebGL
        canvas = document.getElementById("gl-canvas");
        gl = WebGLUtils.setupWebGL(canvas);
        if (!gl) {
            alert( "WebGL isn't available" );
            return;
        }

        gl.viewport(0, 0, canvas.width, canvas.height);
        gl.clearColor(1.0, 1.0, 1.0, 1.0);
        
        // Init shaders
        var program = initShaders( gl, "vertex-shader", "fragment-shader" );
        gl.useProgram(program);
        
        // Buffer
        bufferID = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, bufferID);
        
        // Associate out shader variables with our data buffer
        var vPosition = gl.getAttribLocation(program, "vPosition");
        gl.vertexAttribPointer(vPosition, 2, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(vPosition);
    }
    
    // Render function
    this.render = function() {
        var r = 0.75;
        var vertices = [
            vertexRotation(vec2(0, r), Math.cos(radians(120)), Math.sin(radians(240))),
            vec2( 0,  r),
            vertexRotation(vec2(0, r), Math.cos(radians(120)), Math.sin(radians(120)))
        ];
        points = [];
        
        genSierpinskiGasket(vertices[0], vertices[1], vertices[2], depth);
        if (twist)
            twistRotation(angle);
        else
            rotation(angle);
        gl.bufferData(gl.ARRAY_BUFFER, flatten(points), gl.STATIC_DRAW);        
        gl.clear(gl.COLOR_BUFFER_BIT);
        if (style == this.styles.WIREFRAMED)
            for (i = 0; i < points.length; i+= 3)
                gl.drawArrays(gl.LINE_LOOP, i, 3);
        else
            gl.drawArrays(gl.TRIANGLES, 0, points.length);
        points = [];       
    }
    
    // User interface initialization
    this.initUI = function() {
        $("#depth").change(function() {
            depth = $(this).val();
            $("#curDepth").html(depth.toString() + "&nbsp;level" + ((depth > 1) ? "s" : ""));
            document.app.render();
        });

        $("#angle").change(function() {
            angle = $(this).val();
            $("#curAngle").html(angle.toString());
            document.app.render();
        });

        $("#twist").change(function() {
            twist = $(this).is(':checked');
            document.app.render();
        });

        $("input[name=style]").change(function() {
            style = $(this).val();
            document.app.render();
        });

        $("#color").change(function() {
            color = $(this).val();
            document.app.render();
        });
    }
    
    // Add triangle to points
    var addTriangle = function(p1, p2, p3) {
        points.push(p1, p2, p3);
    }
    
    // Generate Sierpinski Gasket
    var genSierpinskiGasket = function(p1, p2, p3, level) {
        if (level == 0)
            addTriangle(p1, p2, p3);
        else {
            var p12 = mix(p1, p2, 0.5);
            var p13 = mix(p1, p3, 0.5);
            var p23 = mix(p2, p3, 0.5);

            level--;

            genSierpinskiGasket(vec2(p1[0], p1[1]), vec2(p12[0], p12[1]), vec2(p13[0], p13[1]), level);
            genSierpinskiGasket(vec2(p3[0], p3[1]), vec2(p13[0], p13[1]), vec2(p23[0], p23[1]), level);
            genSierpinskiGasket(vec2(p2[0], p2[1]), vec2(p23[0], p23[1]), vec2(p12[0], p12[1]), level);
            if (style == document.app.styles.FILLED)
                genSierpinskiGasket(vec2(p12[0], p12[1]), vec2(p23[0], p23[1]), vec2(p13[0], p13[1]), level);
        }
    }
    
    // Rotation
    var rotation = function(angle) {
        var rAngle = radians(angle);
        var cosRAngle = Math.cos(rAngle);
        var sinRAngle = Math.sin(rAngle);
        for (var idx = 0; idx < points.length; idx++) {
            points[idx] = vertexRotation(points[idx], cosRAngle, sinRAngle);
        }
    }
    
    // Vertex rotation
    var vertexRotation = function(p, cosAngle, sinAngle) {
        return vec2([p[0] * cosAngle - p[1] * sinAngle, p[0] * sinAngle + p[1] * cosAngle]);
    }
    
    // Twist
    var twistRotation = function(angle) {
        for (var idx = 0; idx < points.length; idx++) {
            var rAngle = radians(angle);
            var d = Math.sqrt(Math.pow(points[idx][0], 2) + Math.pow(points[idx][1], 2));
            var cosRAngle = Math.cos(d * rAngle);
            var sinRAngle = Math.sin(d * rAngle);
            points[idx] = vertexRotation(points[idx], cosRAngle, sinRAngle);
        }
    }
}

Number.isInteger = Number.isInteger || function(value) {
    return ((typeof value === "number") && 
           (isFinite(value)) && 
           (Math.floor(value) === value));
};

$(document).ready(function(){
    document.app = new App();
    document.app.initWebGL();
    document.app.initUI();
    document.app.render();
});