var app = angular.module("webGlLab02App", []);

app.controller("webGlLab02Ctrl", function($scope) {
    $scope.varLoading = true;
    
    $scope.lineWidth = 1;
    $scope.minStepDistance = 5;
    $scope.close = false;
    $scope.color = "#000000";
    
    $scope.canvas = null;
    $scope.gl = null;
    $scope.bufferID = null;
    $scope.points = [];
    $scope.program = null;
    $scope.pMatrix = mat4();
    $scope.shapes = [];
    $scope.currentShape = null;
    
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
        $scope.gl.viewportWidth = $scope.canvas.width;
        $scope.gl.viewportHeight = $scope.canvas.height;
        $scope.pMatrix = $scope.ortho(0, $scope.canvas.width, 0, $scope.canvas.height, -1, 1);
//        $scope.pMatrix = ortho(0, $scope.gl.viewportWidth, 0, $scope.gl.viewportHeight, -1, 1);
        
        $scope.gl.clearColor(1.0, 1.0, 1.0, 1.0);
        
        // Init shaders
        $scope.program = initShaders($scope.gl, "vertex-shader", "fragment-shader");
        $scope.gl.useProgram($scope.program);
        
        // Buffer
        $scope.bufferID = $scope.gl.createBuffer();
        $scope.gl.bindBuffer($scope.gl.ARRAY_BUFFER, $scope.bufferID);
        
        // Associate out shader variables with our data buffer
        $scope.program.vPosition = $scope.gl.getAttribLocation($scope.program, "vPosition");
        $scope.gl.vertexAttribPointer($scope.program.vPosition, 2, $scope.gl.FLOAT, false, 0, 0);
        $scope.gl.enableVertexAttribArray($scope.program.vPosition);
        
	    $scope.program.pMatrixLoc = $scope.gl.getUniformLocation($scope.program, "uPMatrix");        
        return true;
    }
    
    // Render function
    $scope.render = function() {
        if (!($scope.gl)) return;
        $scope.gl.clearColor(1.0, 1.0, 1.0, 1.0);
        var colorLocation = $scope.gl.getUniformLocation($scope.program, "user_color");
        $scope.gl.uniform4f(colorLocation, 0.0, 0.0, 0.0, 1.0);

        var vertices = [
            0, 0, 0, 
            $scope.canvas.width, 0, 0,
            $scope.canvas.width, $scope.canvas.height, 0,
            0, $scope.canvas.height, 0,
            0, 0, 0
        ];
        
        var itemSize = 3;
        var numItems = vertices.length / itemSize;
        
        $scope.gl.bufferData($scope.gl.ARRAY_BUFFER, new Float32Array(vertices), $scope.gl.STATIC_DRAW);
        $scope.gl.vertexAttribPointer($scope.program.vPosition, itemSize, $scope.gl.FLOAT, false, 0, 0);

        $scope.gl.uniformMatrix4fv($scope.program.pMatrixLoc, 0, $scope.pMatrix);

        $scope.gl.drawArrays($scope.gl.LINE_STRIP, 0, numItems); 
        
        for (var idx in $scope.shapes) 
            $scope.renderShape($scope.shapes[idx]);
        if ($scope.currentShape != null) 
            $scope.renderShape($scope.currentShape);
    }
    
    $scope.renderShape = function(shape) {
        if (!($scope.gl)) return;
        if (shape == null) return;

        var colorLocation = $scope.gl.getUniformLocation($scope.program, "user_color");
        $scope.gl.uniform4f(colorLocation, 0.0, 0.0, 0.0, 1.0);
        var color = $scope.toRGB(shape.color);
        $scope.gl.uniform4f(colorLocation, color[0], color[1], color[2], color[3]);
        
        var itemSize = 3;
        var numItems = shape.points.length;
        
        $scope.gl.bufferData($scope.gl.ARRAY_BUFFER, flatten(shape.points), $scope.gl.STATIC_DRAW);
        $scope.gl.vertexAttribPointer($scope.program.vPosition, itemSize, $scope.gl.FLOAT, false, 0, 0);

        $scope.gl.uniformMatrix4fv($scope.program.pMatrixLoc, 0, $scope.pMatrix);

        $scope.gl.lineWidth(10);

        $scope.gl.drawArrays($scope.gl.LINE_STRIP, 0, numItems); 
    }
    
    $scope.ortho = function (left, right, bottom, top, near, far) {
        dest = new Float32Array(16);
        var rl = (right - left),
            tb = -(top - bottom),
            fn = (far - near);
        dest[0] = 2 / rl;
        dest[1] = 0;
        dest[2] = 0;
        dest[3] = 0;
        dest[4] = 0;
        dest[5] = 2 / tb;
        dest[6] = 0;
        dest[7] = 0;
        dest[8] = 0;
        dest[9] = 0;
        dest[10] = -2 / fn;
        dest[11] = 0;
        dest[12] = -(left + right) / rl;
        dest[13] = -(top + bottom) / tb;
        dest[14] = -(far + near) / fn;
        dest[15] = 1;
        
        return dest;
    };    

    // Shape object
    $scope.shape = function(x, y, color, lineWidth) {
        this.color = color;
        this.lineWidth = parseInt(lineWidth);
        this.points = [];
        this.points.push(vec3(x, y, 0));
        
        // Get distance between two points
        this.distance = function(p1, p2) {
            var diff = subtract(p1, p2);
            return Math.sqrt(dot(diff, diff));
        }
        
        // Add new point to path
        this.addPoint = function(x, y, z) {
            var newPoint = vec3(x, y, z);
            var lastPoint = (this.points.length > 0) ? this.points[this.points.length - 1] : null;
            
            var add = ((this.points.length == 0) || ($scope.minStepDistance == 1));
            if ($scope.minStepDistance > 1)
                if (this.points.length < 2)
                    add = true;
                else
                    add = ((this.distance(lastPoint, newPoint) >= $scope.minStepDistance) || (this.distance(lastPoint, this.points[this.points.length - 2]) >= $scope.minStepDistance));
            add = ((add) && (!(equal(lastPoint, newPoint))));
            if (add)
                this.points.push(newPoint);
            else
                this.points[this.points.length - 1] = newPoint;
        }
    }
    
    // Event listener for mousedown event to start drawing
    $scope.startDrawing = function($event) {
        if ($scope.currentShape == null) {
            $scope.currentShape = new $scope.shape($event.offsetX, $event.offsetY, $scope.color, parseInt($scope.lineWidth));
            $scope.render();
        }
    }
    
    // Event listener for mousemove event to drawing
    $scope.drawing = function($event) {
        if ($scope.currentShape == null) return;
        
        $scope.currentShape.addPoint($event.offsetX, $event.offsetY, 0.0);
        $scope.render();
    }
    
    // Event listener foro mouseup event to end drawing
    $scope.endDrawing = function($event) {
        if ($scope.currentShape == null) return;
        $scope.currentShape.addPoint($event.offsetX, $event.offsetY, 0.0, true);
        if ($scope.close) $scope.currentShape.addPoint($scope.currentShape.points[0]);
        
        $scope.shapes.push($scope.currentShape);
        $scope.currentShape = null;
        $scope.render();
    }
    
    if ($scope.initWebGL()) {   
        $scope.render();
        $scope.varLoading = false;
    }
});
    
// Resize canvas
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
            scope.gl.viewportWidth = scope.canvas.width;
            scope.gl.viewportHeight = scope.canvas.height;
            scope.pMatrix = scope.ortho(0, scope.canvas.width, 0, scope.canvas.height, -1, 1);
            scope.render();
        }, true);

        w.bind('resize', function () {
            scope.$apply();
        });
    }
});
