var app = angular.module("webGlLab03App", []);

app.controller("webGlLab03Ctrl", function($scope) {
    $scope.varLoading = true;
    
    $scope.types = ["Cone", "Cylinder", "Sphere"];
    $scope.objects = [];
    $scope.selectedObject = null;
    $scope.editMode = false;
    $scope.numObj = 1;
    
    $scope.baseObj = {
        name: "Untitled",
        name_changed: false,
        type: 0,
        fragments: 12,
        radius: 10.0,
        bottom_radius: 10.0,
        top_radius: 10.0,
        height: 10.0,
        closed: false,
        color: "#000000",
        pos_x: 0.0,
        pos_y: 0.0,
        pos_z: 0.0,
        rot_x: 0.0,
        rot_y: 0.0,
        rot_z: 0.0
    }
    $scope.obj = angular.copy($scope.baseObj);
    
    $scope.canvas = null;

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
        
        return true;
    }
    
    // Render function
    $scope.render = function() {
        if (!($scope.gl)) return;
        $scope.gl.clearColor(1.0, 1.0, 1.0, 1.0);
    };
    
    // Start creating new object
    $scope.newObject = function() {
        $scope.editMode = true;
        $scope.obj = angular.copy($scope.baseObj);
        $scope.obj.name = $scope.types[0] + "_" + String($scope.numObj);
    }
    
    // Auto rename current object when its name has never changed
    $scope.autoRename = function() {
        if ($scope.obj.name_changed) return;
        $scope.obj.name = $scope.types[$scope.obj.type] + "_" + String($scope.numObj);
    }
    
    // Check renaming
    $scope.checkRenaming = function() {
        $scope.obj.name_changed = ($scope.obj.name != $scope.types[$scope.obj.type] + '_' + String($scope.numObj));
    }
    
    // Save object modification
    $scope.saveObject = function(form) {
        if (form.$valid) {
            var obj = $scope.createObject();
            console.log(obj);
            $scope.objects.push(obj);
            console.log($scope.objects);
            $scope.selectedObject = obj;
            $scope.editMode = false;
        }
    }
    
    // Reset object modification
    $scope.reset = function(form) {
        if (form) {
            form.$setPristine();
            form.$setUntouched();
        }
        $scope.obj = angular.copy($scope.baseObj);
        $scope.editMode=false;
    };    
  
    // Create object
    $scope.createObject = function() {
        if ($scope.selectedObject != null) return;
        
        switch ($scope.obj.type) {
            case (0): {
                return $scope.createCone();
                break;
            }
            case (1): {
                return $scope.createCylinder();
                break;
            }
            case (2): {
                return $scope.createSphere();
                break;
            }
        }
        
        return null;
    }
    
    // Create cone object 
    $scope.createCone = function() {
        return {
            name: $scope.obj.name,
            fragments: $scope.obj.fragments,
            color: $scope.obj.color,
            bottom_radius: $scope.obj.bottom_radius,
            height: $scope.obj.height,
            closed: $scope.obj.closed,
            pos: vec3($scope.obj.pos_x, $scope.obj.pos_y, $scope.obj.pos_z),
            rotation: vec3($scope.obj.rot_x, $scope.obj.rot_y, $scope.obj.rot_z)
        }
    }
    
    // Create cylinder object 
    $scope.createCylinder = function() {
        return {
            name: $scope.obj.name,
            fragments: $scope.obj.fragments,
            color: $scope.obj.color,
            bottom_radius: $scope.obj.bottom_radius,
            top_radius: $scope.obj.top_radius,
            height: $scope.obj.height,
            closed: $scope.obj.closed,
            pos: vec3($scope.obj.pos_x, $scope.obj.pos_y, $scope.obj.pos_z),
            rotation: vec3($scope.obj.rot_x, $scope.obj.rot_y, $scope.obj.rot_z)
        }
    }

    // Create sphere object 
    $scope.createCylinder = function() {
        return {
            name: $scope.obj.name,
            fragments: $scope.obj.fragments,
            color: $scope.obj.color,
            radius: $scope.obj.radius,
            pos: vec3($scope.obj.pos_x, $scope.obj.pos_y, $scope.obj.pos_z),
            rotation: vec3($scope.obj.rot_x, $scope.obj.rot_y, $scope.obj.rot_z)
        }
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
            scope.render();
        }, true);

        w.bind('resize', function () {
            scope.$apply();
        });
    }
});