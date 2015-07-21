var app = angular.module("webGlLab02App", []);

app.controller("webGlLab02Ctrl", function($scope) {
    $scope.varLoading = true;
    
    $scope.lineWidth = 1;
    $scope.close = false;
    $scope.color = "#000000";
    
    $scope.canvas = null;
    $scope.gl = null;
    $scope.bufferID = null;
    $scope.points = [];
    $scope.program = null;
    
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
        $scope.gl.clearColor(1.0, 1.0, 1.0, 1.0);
    }
    
    if ($scope.initWebGL()) {    
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
        }, true);

        w.bind('resize', function () {
            scope.$apply();
        });
    }
});
