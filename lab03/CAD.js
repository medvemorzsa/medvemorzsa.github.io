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
        $scope.oldSelectedObject = $scope.selectedObject;
        $scope.selectedObject = null;
        $scope.obj = angular.copy($scope.baseObj);
        $scope.obj.name = $scope.types[0] + "_" + String($scope.numObj);
    }
    
    // Start editing selected object
    $scope.editObject = function() {
        $scope.editMode = true;         
    }
    
    // Delete selected object
    $scope.deleteObject = function() {
        if ($scope.selectedObject == null) return;
        
        if (confirm("Are you sure you want to delete the selected object?")) {
            $scope.objects.splice($scope.objects.indexOf($scope.selectedObject), 1);
            $scope.selectedObject = null;
            if ($scope.objects.length > 0)
                $scope.selectedObject = $scope.objects[0];            
            $scope.selectable_objects = $scope.selectedObject;
            $scope.loadObject();
        }
    }
    
    // Download objects
    $scope.downloadObjects = function() {
        var jsonData = angular.toJson($scope.objects, 4);
        var jsonDataWindow = window.open("data:text/json," + encodeURIComponent(jsonData), "_blank");
        jsonDataWindow.focus();        
    }
    
    $scope.file_changed = function(element, $scope) {
        $scope.numUploadFiles = element.files.length;
        console.log($scope.numUploadFiles);
        /*
        console.log(element);
         $scope.$apply(function(scope) {
             var file = element.files[0];
             var reader = new FileReader();
             reader.onload = function(e) {
                 console.log(e);
                //$scope.prev_img = e.target.result;
             };
             reader.readAsText(file);
         });*/
    };    
    
    // Upload objects
    $scope.uploadObjects = function($event) {
        if (document.getElementById("file").files.length != 1) {
            if ($event.preventDefault) $event.preventDefault();
            if ($event.stopPropagation) $event.stopPropagation();
            if ($event.cancelBubble) $event.cancelBubble = true;
            
            return false;
        }
        
        var file = document.getElementById("file").files[0];
        var reader = new FileReader();
        reader.onload = function(e) {
            try {
                $scope.objects = angular.fromJson(e.target.result);
                $scope.selectedObject = null;
                if ($scope.objects.length > 0) {
                    $scope.selectedObject = $scope.objects[0];
                }
                $scope.numObj = $scope.objects.length;
                $scope.selectable_objects = $scope.selectedObject;
                $scope.loadObject();     

                return true;
            }
            catch(err) {
                alert("The loading or processing of file failed.\n\n" + err);
                
                return false;
            }            
        };
        reader.readAsText(file);
        
        return true;
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
            if ($scope.selectedObject == null) {
                $scope.selectedObject = $scope.createObject();
                $scope.objects.push($scope.selectedObject);
                $scope.numObj++;
            }
            else {
                $scope.updateObject();
            }
            $scope.selectable_objects = $scope.selectedObject;
            $scope.editMode = false;
        }
    }
    
    // Reset object modification
    $scope.reset = function(form) {
        if (form) {
            form.$setPristine();
            form.$setUntouched();
        }
        if ($scope.oldSelectedObject != null) {
            $scope.selectedObject = $scope.oldSelectedObject;
            $scope.oldSelectedObject = null;
        }
        if ($scope.selectedObject != null) {
            $scope.selectable_objects = $scope.selectedObject;
            $scope.loadObject();
        }
        else
            $scope.obj = angular.copy($scope.baseObj);
            
        $scope.editMode=false;
    };    
  
    // Create object
    $scope.createObject = function() {
        if ($scope.selectedObject != null) return;
        switch (parseInt($scope.obj.type)) {
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
            rotation: vec3($scope.obj.rot_x, $scope.obj.rot_y, $scope.obj.rot_z),
            
            update: function() {
                this.name = $scope.obj.name;
                this.fragments = $scope.obj.fragments;
                this.color = $scope.obj.color;
                this.bottom_radius = $scope.obj.bottom_radius;
                this.height = $scope.obj.height;
                this.closed = $scope.obj.closed;
                this.pos = vec3($scope.obj.pos_x, $scope.obj.pos_y, $scope.obj.pos_z);
                this.rotation = vec3($scope.obj.rot_x, $scope.obj.rot_y, $scope.obj.rot_z);
            }
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
            rotation: vec3($scope.obj.rot_x, $scope.obj.rot_y, $scope.obj.rot_z),
            
            update: function() {
                this.name = $scope.obj.name;
                this.fragments = $scope.obj.fragments;
                this.color = $scope.obj.color;
                this.bottom_radius = $scope.obj.bottom_radius;
                this.top_radius = $scope.obj.top_radius;
                this.height = $scope.obj.height;
                this.closed = $scope.obj.closed;
                this.pos = vec3($scope.obj.pos_x, $scope.obj.pos_y, $scope.obj.pos_z);
                this.rotation = vec3($scope.obj.rot_x, $scope.obj.rot_y, $scope.obj.rot_z);
            }
        }
    }

    // Create sphere object 
    $scope.createSphere = function() {
        return {
            name: $scope.obj.name,
            fragments: $scope.obj.fragments,
            color: $scope.obj.color,
            radius: $scope.obj.radius,
            pos: vec3($scope.obj.pos_x, $scope.obj.pos_y, $scope.obj.pos_z),
            rotation: vec3($scope.obj.rot_x, $scope.obj.rot_y, $scope.obj.rot_z),
            
            update: function() {
                this.name = $scope.obj.name;
                this.fragments = $scope.obj.fragments;
                this.color = $scope.obj.color;
                this.radius = $scope.obj.radius;
                this.pos = vec3($scope.obj.pos_x, $scope.obj.pos_y, $scope.obj.pos_z);
                this.rotation = vec3($scope.obj.rot_x, $scope.obj.rot_y, $scope.obj.rot_z);
            }
        }
    }
    
    // Update object
    $scope.updateObject = function() {
        if ($scope.selectedObject == null) return;

        if ($scope.selectedObject.update)
            $scope.selectedObject.update();
    }
    
    // Load datas of object into UI components
    $scope.loadObject = function() {
        if (($scope.selectable_objects == null) || (typeof $scope.selectable_objects === "undefined")) {
            $scope.obj = angular.copy($scope.baseObj);
            return;
        }
        
        $scope.selectedObject = $scope.selectable_objects;
        $scope.obj.name = $scope.selectedObject.name;
        $scope.obj.type = "0";
        $scope.obj.fragments = $scope.selectedObject.fragments;
        $scope.obj.color = $scope.selectedObject.color;
        if ($scope.selectedObject.radius) {
            $scope.obj.type = "2";
            $scope.obj.radius = $scope.selectedObject.radius;
        }
        if ($scope.selectedObject.top_radius) {
            $scope.obj.type = "1";
            $scope.obj.top_radius = $scope.selectedObject.top_radius;
        }
        if ($scope.selectedObject.bottom_radius)
            $scope.obj.bottom_radius = $scope.selectedObject.bottom_radius;
        if ($scope.selectedObject.height)
            $scope.obj.height = $scope.selectedObject.height;        
        if ($scope.selectedObject.closed)
            $scope.obj.closed = $scope.selectedObject.closed;
        $scope.obj.pos_x = $scope.selectedObject.pos[0];
        $scope.obj.pos_y = $scope.selectedObject.pos[1];
        $scope.obj.pos_z = $scope.selectedObject.pos[2];
        $scope.obj.rot_x = $scope.selectedObject.rotation[0];
        $scope.obj.rot_y = $scope.selectedObject.rotation[1];
        $scope.obj.rot_z = $scope.selectedObject.rotation[2];
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