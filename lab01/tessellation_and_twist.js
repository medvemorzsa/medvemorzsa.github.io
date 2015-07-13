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
    var foreground_color = vec4( 0.0, 0.0, 0.0, 1.0 );    
    var background_color = vec4( 1.0, 1.0, 1.0, 1.0 );    
    
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

    // Getter for foreground color parameter
    this.__defineGetter__("foreground_color", function() {
        return foreground_color;
    });
        
    // Setter for foreground color parameter
    this.__defineSetter__("foreground_color", function(value) {
        if (typeof value === "undefined")
            throw "Color is required!";
        if (typeof value !== "string")
            throw "Color must be filled #RRGGBB format!";
        if (!(/^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.test(value)))
            throw "Color must be filled #RRGGBB format!";
        var components = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(value);
        foreground_color = vec4(parseInt(components[1], 16) / 255.0, parseInt(components[2], 16) / 255.0, parseInt(components[3], 16) / 255.0, 1.0);
    });


    // Getter for background color parameter
    this.__defineGetter__("background_color", function() {
        return background_color;
    });
        
    // Setter for background color parameter
    this.__defineSetter__("background_color", function(value) {
        if (typeof value === "undefined")
            throw "Color is required!";
        if (typeof value !== "string")
            throw "Color must be filled #RRGGBB format!";
        if (!(/^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.test(value)))
            throw "Color must be filled #RRGGBB format!";
        var components = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(value);
        background_color = vec4(parseInt(components[1], 16) / 255.0, parseInt(components[2], 16) / 255.0, parseInt(components[3], 16) / 255.0, 1.0);
    });
    
    // Parameters for WebGL
    var canvas = null;
    var gl = null;
    var bufferID = null;
    var points = [];
    var program = null;
    
    // WebGL initialization
    this.initWebGL = function() {
        // Configure canvas and WebGL
        canvas = document.getElementById("gl-canvas");
        if ((canvas == null) || (canvas == "undefined"))
            return false;
        gl = WebGLUtils.setupWebGL(canvas);
        if (!gl) {
            alert( "WebGL isn't available" );
            return false;
        }

        gl.viewport(0, 0, canvas.width, canvas.height);
        gl.clearColor(background_color[0], background_color[1], background_color[2], background_color[3]);
        
        // Init shaders
        program = initShaders( gl, "vertex-shader", "fragment-shader" );
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
        if (!(gl)) return;
        
        gl.clearColor(background_color[0], background_color[1], background_color[2], background_color[3]);
        gl.bufferData(gl.ARRAY_BUFFER, flatten(points), gl.STATIC_DRAW);        
        gl.clear(gl.COLOR_BUFFER_BIT);
        var colorLocation = gl.getUniformLocation(program, "foreground_user_color");
        gl.uniform4f(colorLocation, foreground_color[0], foreground_color[1], foreground_color[2], foreground_color[3]);
        
        if (style == this.styles.WIREFRAMED)
            for (i = 0; i < points.length; i+= 3)
                gl.drawArrays(gl.LINE_LOOP, i, 3);
        else
            gl.drawArrays(gl.TRIANGLES, 0, points.length);
        points = [];       
    }
    
    // Generate scene
    this.genScene = function() {
        if (!(gl)) return;
        
        var r = 0.75;
        var vertices = [
            $scope.vertexRotation(vec2(0, r), Math.cos(radians(120)), Math.sin(radians(240))),
            vec2( 0,  r),
            $scope.vertexRotation(vec2(0, r), Math.cos(radians(120)), Math.sin(radians(120)))
        ];
        points = [];
        
        genSierpinskiGasket(vertices[0], vertices[1], vertices[2], $scope.depth);
        
        if ($scope.twist)
            $scope.twistRotation($scope.angle);
        else
            $scope.rotation($scope.angle);
        
        this.render();
    }
    
    // User interface initialization
    this.initUI = function() {
        if (gl) {
            $("#depth").change(function() {
                depth = $(this).val();
                $("#curDepth").html(depth.toString() + "&nbsp;level" + ((depth > 1) ? "s" : ""));
                document.app.genScene();
            });

            $("#angle").change(function() {
                angle = $(this).val();
                $("#curAngle").html(angle.toString());
                document.app.genScene();
            });

            $("#twist").change(function() {
                twist = $(this).is(':checked');
                document.app.genScene();
            });

            $("input[name=style]").change(function() {
                style = $(this).val();
                document.app.genScene();
            });

            $("#foreground_color").change(function() {
                document.app.foreground_color = $(this).val();
                document.app.genScene();
            });

            $("#background_color").change(function() {
                document.app.background_color = $(this).val();
                document.app.genScene();
            });
            
            window.addEventListener('resize', resizeCanvas, false);
            resizeCanvas();
            
            $("#depth").prop("disabled", false);
            $("#angle").prop("disabled", false);
            $("#twist").prop("disabled", false);
            $("input[name=style]").prop("disabled", false);
            $("#foreground_color").prop("disabled", false);
            $("#background_color").prop("disabled", false);            
        }
        else {
            $("#depth").prop("disabled", true);
            $("#angle").prop("disabled", true);
            $("#twist").prop("disabled", true);
            $("input[name=style]").prop("disabled", true);
            $("#foreground_color").prop("disabled", true);
            $("#background_color").prop("disabled", true);
            $("#canvas").html("<h1 align='center'>Your browser doesn't support WebGL!</h1>");
        }
    }
    
    var resizeCanvas = function(event) {
        var canvasParent = $("#canvas");
        var canvas = document.getElementById("gl-canvas");
        var size = Math.min(canvasParent.innerWidth(), canvasParent.innerHeight());
        canvas.width = size;
        canvas.height = size;
        gl.viewport(0, 0, canvas.width, canvas.height);
	}
    
    // Add triangle to points
    var addTriangle = function(p1, p2, p3) {
        points.push(p1, p2, p3);
    }
    
    // Generate Sierpinski Gasket
    var genSierpinskiGasket = function(p1, p2, p3, level) {
        console.log(level);
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
/*
$(document).ready(function(){
    document.app = new App();
    document.app.initWebGL();
    document.app.initUI();
    document.app.genScene();
});
*/
var app = angular.module("webGlLab01App", []);

app.controller("webGlLab01Ctrl", function($scope) {
    $scope.varLoading = true;
    
    $scope.depth = 4;
    $scope.angle = 0;
    $scope.twist = true;
    $scope.style = 0;
    $scope.foreground_color = "#000000";
    $scope.background_color = "#FFFFFF";
    
    $scope.canvas = null;
    $scope.gl = null;
    $scope.bufferID = null;
    $scope.points = [];
    $scope.program = null;

    $scope.styles = {
        WIREFRAMED: 0,
        PARTIALLY_FILLED: 1,
        FILLED: 2
    }
    
    // WebGL initialization
    $scope.initWebGL = function() {
        // Configure canvas and WebGL
        $scope.canvas = document.getElementById("gl-canvas");
        if (($scope.canvas == null) || ($scope.canvas == "undefined"))
            return false;
        $scope.gl = WebGLUtils.setupWebGL($scope.canvas);
        if (!$scope.gl) {
            alert( "WebGL isn't available" );
            return false;
        }

        $scope.gl.viewport(0, 0, $scope.canvas.width, $scope.canvas.height);
        //$scope.gl.clearColor(background_color[0], background_color[1], background_color[2], background_color[3]);
        $scope.gl.clearColor(1.0, 1.0, 1.0, 1.0);
        
        // Init shaders
        $scope.program = initShaders($scope.gl, "vertex-shader", "fragment-shader");
        $scope.gl.useProgram($scope.program);
        
        // Buffer
        $scope.bufferID = $scope.gl.createBuffer();
        $scope.gl.bindBuffer($scope.gl.ARRAY_BUFFER, $scope.bufferID);
        
        // Associate out shader variables with our data buffer
        var vPosition = $scope.gl.getAttribLocation($scope.program, "vPosition");
        $scope.gl.vertexAttribPointer(vPosition, 2, $scope.gl.FLOAT, false, 0, 0);
        $scope.gl.enableVertexAttribArray(vPosition);
        
        return true;
    }
    
    // Render function
    $scope.render = function() {
        if (!($scope.gl)) return;
        
        //gl.clearColor(background_color[0], background_color[1], background_color[2], background_color[3]);
        $scope.gl.clearColor(1.0, 1.0, 1.0, 1.0);
        $scope.gl.bufferData($scope.gl.ARRAY_BUFFER, flatten($scope.points), $scope.gl.STATIC_DRAW);        
        $scope.gl.clear($scope.gl.COLOR_BUFFER_BIT);
        var colorLocation = $scope.gl.getUniformLocation($scope.program, "foreground_user_color");
        $scope.gl.uniform4f(colorLocation, 0.0, 0.0, 0.0, 1.0);
        //gl.uniform4f(colorLocation, foreground_color[0], foreground_color[1], foreground_color[2], foreground_color[3]);
        
        if ($scope.style == $scope.styles.WIREFRAMED)
            for (i = 0; i < $scope.points.length; i+= 3)
                $scope.gl.drawArrays($scope.gl.LINE_LOOP, i, 3);
        else
            $scope.gl.drawArrays($scope.gl.TRIANGLES, 0, $scope.points.length);
        $scope.points = [];       
    }
    
    // Generate scene
    $scope.genScene = function() {
        if (!($scope.gl)) return;
        
        var r = 0.75;
        var vertices = [
            $scope.vertexRotation(vec2(0, r), Math.cos(radians(120)), Math.sin(radians(240))),
            vec2( 0,  r),
            $scope.vertexRotation(vec2(0, r), Math.cos(radians(120)), Math.sin(radians(120)))
        ];
        $scope.points = [];
        
        $scope.genSierpinskiGasket(vertices[0], vertices[1], vertices[2], $scope.depth);
        
        if ($scope.twist)
            $scope.twistRotation($scope.angle);
        else
            $scope.rotation($scope.angle);
        
        $scope.render();
    }
    
    // Add triangle to points
    $scope.addTriangle = function(p1, p2, p3) {
        $scope.points.push(p1, p2, p3);
    }
    
    // Generate Sierpinski Gasket
    $scope.genSierpinskiGasket = function(p1, p2, p3, level) {
        if (level == 0)
            $scope.addTriangle(p1, p2, p3);
        else {
            var p12 = mix(p1, p2, 0.5);
            var p13 = mix(p1, p3, 0.5);
            var p23 = mix(p2, p3, 0.5);

            level--;

            $scope.genSierpinskiGasket(vec2(p1[0], p1[1]), vec2(p12[0], p12[1]), vec2(p13[0], p13[1]), level);
            $scope.genSierpinskiGasket(vec2(p3[0], p3[1]), vec2(p13[0], p13[1]), vec2(p23[0], p23[1]), level);
            $scope.genSierpinskiGasket(vec2(p2[0], p2[1]), vec2(p23[0], p23[1]), vec2(p12[0], p12[1]), level);
            if ($scope.style == $scope.styles.FILLED)
                $scope.genSierpinskiGasket(vec2(p12[0], p12[1]), vec2(p23[0], p23[1]), vec2(p13[0], p13[1]), level);
        }
    }
    
    // Rotation
    $scope.rotation = function(angle) {
        var rAngle = radians(angle);
        var cosRAngle = Math.cos(rAngle);
        var sinRAngle = Math.sin(rAngle);
        for (var idx = 0; idx < $scope.points.length; idx++) {
            $scope.points[idx] = $scope.vertexRotation($scope.points[idx], cosRAngle, sinRAngle);
        }
    }
    
    // Vertex rotation
    $scope.vertexRotation = function(p, cosAngle, sinAngle) {
        return vec2([p[0] * cosAngle - p[1] * sinAngle, p[0] * sinAngle + p[1] * cosAngle]);
    }
    
    // Twist
    $scope.twistRotation = function(angle) {
        for (var idx = 0; idx < $scope.points.length; idx++) {
            var rAngle = radians(angle);
            var d = Math.sqrt(Math.pow($scope.points[idx][0], 2) + Math.pow($scope.points[idx][1], 2));
            var cosRAngle = Math.cos(d * rAngle);
            var sinRAngle = Math.sin(d * rAngle);
            $scope.points[idx] = $scope.vertexRotation($scope.points[idx], cosRAngle, sinRAngle);
        }
    }
    
    if ($scope.initWebGL()) {    
        $scope.genScene();
        $scope.varLoading = false;
    }
});
