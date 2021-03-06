var app = angular.module("webGlLab02App", ["ngTouchmove", "ngTouchstart", "ngTouchend"]);

app.controller("webGlLab02Ctrl", function($scope) {
    $scope.varLoading = true;
    
    $scope.thickness = 5;
    $scope.minStepDistance = 10;
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
        $scope.gl.clear($scope.gl.COLOR_BUFFER_BIT);
        
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
            $scope.shapes[idx].render();
        if ($scope.currentShape != null) 
            $scope.currentShape.render();
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
    $scope.shape = function(x, y, color, thickness) {
        this.color = color;
        this.thickness = parseInt(thickness);
        this.points = [];
        this.points.push(vec3(x, y, 0));
        this.triangles = [];
        if (this.thickness > 1) {
            var d = Math.sqrt(this.thickness * this.thickness / 2);
            this.triangles.push(vec3(x - d, y - d, 0), vec3(x + d, y - d, 0), vec3(x - d, y + d, 0));
            this.triangles.push(vec3(x + d, y - d, 0), vec3(x + d, y + d, 0),vec3(x - d, y + d, 0));
        }
        
        // Get distance between two points
        this.distance = function(p1, p2) {
            var diff = subtract(p1, p2);
            return Math.sqrt(dot(diff, diff));
        }
        
        // Add new point to path
        this.addPoint = function(newPoint) {
            var lastPoint = (this.points.length > 0) ? this.points[this.points.length - 1] : null;
            
            var _add = ((this.points.length == 0) || ($scope.minStepDistance == 1) || (this.points[0] == newPoint));
            if ($scope.minStepDistance > 1)
                _add = (this.points.length < 2) ? true : ((this.points[0] == newPoint) || (this.distance(lastPoint, newPoint) >= $scope.minStepDistance) || (this.distance(lastPoint, this.points[this.points.length - 2]) >= $scope.minStepDistance));
            _add = ((_add) && (!(equal(lastPoint, newPoint))));
            
            // Add new point
            if (_add)
                this.points.push(newPoint);
            // Update last point
            else {
                this.points[this.points.length - 1] = newPoint;
                if (this.points.length <= 1) return;
                if (this.points.length == 2)
                    this.triangles.splice(0, this.triangles.length);
                else
                    this.triangles.splice(this.triangles.length - 12, 12);
                lastPoint = this.points[this.points.length - 2];
            }
            // Generate or modify segments
            var v = subtract(newPoint, lastPoint);
            v = normalize(v);
            v = scale(this.thickness, v);

            var np1 = add(newPoint, v);
            var np2 = add(newPoint, vec3(-v[1], v[0], 0.0));
            var np3 = add(newPoint, vec3(v[1], -v[0], 0.0));
            // When new point is the first (closed line)
            if (newPoint == this.points[0]) {
                v = this.getBisectingAngleStraight(this.points[1], newPoint, lastPoint);
                np1 = newPoint;
                np2 = add(newPoint, v);
                np3 = subtract(newPoint, v);
                this.triangles[0] = np1;
                this.triangles[1] = np3;
                this.triangles[3] = np1;
                this.triangles[6] = np1;
                this.triangles[9] = np1;
                this.triangles[11] = np2;
            }
            // When last is first
            if (this.points[0] == lastPoint) {
                var lp1 = subtract(lastPoint, v);
                var lp2 = add(lastPoint, vec3(-v[1], v[0], 0.0));
                var lp3 = add(lastPoint, vec3(v[1], -v[0], 0.0));
            } else {  
                var penultimatePoint = this.points[this.points.length - 3];
                v = this.getBisectingAngleStraight(newPoint, lastPoint, penultimatePoint);
                
                var lp1 = lastPoint;
                var lp2 = add(lastPoint, v);
                var lp3 = subtract(lastPoint, v);

                this.triangles[this.triangles.length - 2] = lp2;
                this.triangles[this.triangles.length - 4] = lp2;
                this.triangles[this.triangles.length - 5] = lp1;
                this.triangles[this.triangles.length - 7] = lp1;
                this.triangles[this.triangles.length - 8] = lp3;
                this.triangles[this.triangles.length - 10] = lp3;
            }
            
            this.triangles.push(lp1, lp3, np3);
            this.triangles.push(lp1, np3, np1);
            this.triangles.push(lp1, np1, np2);
            this.triangles.push(lp1, np2, lp2);                
        }
        
        this.getBisectingAngleStraight = function(newPoint, lastPoint, penultimatePoint) {
            var tangent = normalize(add(normalize(subtract(newPoint, lastPoint)),normalize(subtract(lastPoint, penultimatePoint))));
            var mitter = vec3(-tangent[1], tangent[0], 0.0);
            var l = subtract(newPoint, lastPoint);
            var normal = normalize(vec3(-l[1], l[0], 0.0));
            var length = this.thickness / dot(mitter, normal);
            return scale(length, mitter);
        }

        // Rendering
        this.render = function() {
            if (!($scope.gl)) return;

            var colorLocation = $scope.gl.getUniformLocation($scope.program, "user_color");
            $scope.gl.uniform4f(colorLocation, 0.0, 0.0, 0.0, 1.0);
            var color = $scope.toRGB(this.color);
            $scope.gl.uniform4f(colorLocation, color[0], color[1], color[2], color[3]);
            
            $scope.gl.bufferData($scope.gl.ARRAY_BUFFER, flatten((this.thickness == 1) ? this.points : this.triangles), $scope.gl.STATIC_DRAW);
            $scope.gl.uniformMatrix4fv($scope.program.pMatrixLoc, 0, $scope.pMatrix);

            $scope.gl.drawArrays((this.thickness == 1) ? $scope.gl.LINE_STRIP : $scope.gl.TRIANGLES, 0, (this.thickness == 1) ? this.points.length : this.triangles.length); 
        }       
    }

    // Vertex rotation
    $scope.vertexRotation = function(p, cosAngle, sinAngle) {
        return vec3([p[0] * cosAngle - p[1] * sinAngle, p[0] * sinAngle + p[1] * cosAngle], 0.0);
    }        
    
    // Event listener for mousedown event to start drawing
    $scope.startDrawing = function($event) {
        if ($scope.currentShape == null) {
            var x = $event.offsetX;
            var y = $event.offsetY;
            if (($event.originalEvent) && ($event.originalEvent.touches)) {
                x = $event.originalEvent.touches[0].pageX - $event.currentTarget.offsetLeft;
                y = $event.originalEvent.touches[0].pageY - $event.currentTarget.offsetTop;
            }         
            $scope.currentShape = new $scope.shape(x, y, $scope.color, parseInt($scope.thickness));
            $scope.render();
        }
    }
    
    // Event listener for mousemove event to drawing
    $scope.drawing = function($event) {
        if ($scope.currentShape == null) return;

        var x = $event.offsetX;
        var y = $event.offsetY;
        if (($event.originalEvent) && ($event.originalEvent.touches)) {
            x = $event.originalEvent.touches[0].pageX - $event.currentTarget.offsetLeft;
            y = $event.originalEvent.touches[0].pageY - $event.currentTarget.offsetTop;
        }            
        
        $scope.currentShape.addPoint(vec3(x, y, 0.0));
        $scope.render();
    }
    
    // Event listener foro mouseup event to end drawing
    $scope.endDrawing = function($event) {
        if ($scope.currentShape == null) return;
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