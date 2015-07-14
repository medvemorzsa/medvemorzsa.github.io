var app = angular.module("webGlLab01App", []);

app.controller("webGlLab01Ctrl", function($scope) {
    $scope.varLoading = true;
    
    $scope.depth = 5;
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
    
    $scope.modelChange = function() {
        if (!($scope.gl)) return;
        $scope.genScene();
    }
    
    $scope.toRGB = function(value) {
        var components = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(value);
        return vec4(parseInt(components[1], 16) / 255.0, parseInt(components[2], 16) / 255.0, parseInt(components[3], 16) / 255.0, 1.0);
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
        var bg_color = $scope.toRGB($scope.background_color);
        $scope.gl.clearColor(bg_color[0], bg_color[1], bg_color[2], bg_color[3]);
        
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
        
        var bg_color = $scope.toRGB($scope.background_color);
        $scope.gl.clearColor(bg_color[0], bg_color[1], bg_color[2], bg_color[3]);
        $scope.gl.bufferData($scope.gl.ARRAY_BUFFER, flatten($scope.points), $scope.gl.STATIC_DRAW);        
        $scope.gl.clear($scope.gl.COLOR_BUFFER_BIT);
        var colorLocation = $scope.gl.getUniformLocation($scope.program, "foreground_user_color");
        $scope.gl.uniform4f(colorLocation, 0.0, 0.0, 0.0, 1.0);
        var fg_color = $scope.toRGB($scope.foreground_color);
        $scope.gl.uniform4f(colorLocation, fg_color[0], fg_color[1], fg_color[2], fg_color[3]);
        
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

app.directive('resize', function ($window) {
    return function (scope, element) {
        var w = angular.element($window);

        scope.getWindowDimensions = function () {
            return {
                'h': element.height(),
                'w': element.width()
            };
        };
        scope.$watch(scope.getWindowDimensions, function (newValue, oldValue) {
            scope.canvas.width = Math.min(newValue.w, newValue.h);
            scope.canvas.height = Math.min(newValue.w, newValue.h);
            scope.gl.viewport(0, 0, scope.canvas.width, scope.canvas.height);
            scope.genScene();
        }, true);

        w.bind('resize', function () {
            scope.$apply();
        });
    }
})    
