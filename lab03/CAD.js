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
        radius: 1.0,
        bottom_radius: 1.0,
        top_radius: 1.0,
        height: 1.0,
        closed: false,
        color: "#FFFF00",
        pos_x: 0.0,
        pos_y: 0.0,
        pos_z: 0.0,
        rot_x: 0.0,
        rot_y: 0.0,
        rot_z: 0.0
    }
    $scope.obj = angular.copy($scope.baseObj);
    
    $scope.canvas = null;
    $scope.gl = null;
    $scope.vBuffer = null;
    $scope.program = null;

    $scope.modeViewMatrix = null;
    $scope.projectionMatrix = null;
    $scope.modelViewMatrixLoc;
    $scope.projectionMatrixLoc;

    $scope.near = -100;
    $scope.far = 100;
    $scope.radius = 6.0;
    $scope.theta  = 0.0;
    $scope.phi    = 0.0;

    $scope.at = vec3(0.0, -3.0, -5.0);
    $scope.up = vec3(0.0, 1.0, 0.0);

    $scope.left = -10.0;
    $scope.right = 10.0;
    $scope.ytop = 10.0;
    $scope.bottom = -10.0;
        
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
        
        $scope.gl.enable($scope.gl.DEPTH_TEST);
        $scope.gl.depthFunc($scope.gl.LEQUAL);
        $scope.gl.enable($scope.gl.POLYGON_OFFSET_FILL);
        $scope.gl.polygonOffset(1.0, 2.0);
        
        $scope.program = initShaders($scope.gl, "vertex-shader", "fragment-shader");
        $scope.gl.useProgram($scope.program);
        
        $scope.vBuffer = $scope.gl.createBuffer();
        $scope.gl.bindBuffer($scope.gl.ARRAY_BUFFER, $scope.vBuffer);

        $scope.vPosition = $scope.gl.getAttribLocation($scope.program, "vPosition");
        $scope.gl.vertexAttribPointer($scope.vPosition, 4, $scope.gl.FLOAT, false, 0, 0);
        $scope.gl.enableVertexAttribArray($scope.vPosition);
        
        $scope.modelViewMatrixLoc = $scope.gl.getUniformLocation($scope.program, "modelViewMatrix" );
        $scope.projectionMatrixLoc = $scope.gl.getUniformLocation($scope.program, "projectionMatrix" );
                
        return true;
    }
    
    // Render function
    $scope.render = function() {
        if (!($scope.gl)) return;
        $scope.gl.clearColor(1.0, 1.0, 1.0, 1.0);
        $scope.gl.clear($scope.gl.COLOR_BUFFER_BIT | $scope.gl.DEPTH_BUFFER_BIT);

        $scope.eye = vec3( 
            $scope.radius*Math.sin($scope.theta)*Math.cos($scope.phi),
            $scope.radius*Math.sin($scope.theta)*Math.sin($scope.phi),
            $scope.radius*Math.cos($scope.theta)
        );
       
        $scope.modelViewMatrix = lookAt($scope.eye, $scope.at, $scope.up);
        $scope.projectionMatrix = ortho($scope.left, $scope.right, $scope.bottom, $scope.ytop, $scope.near, $scope.far);

        $scope.gl.uniformMatrix4fv($scope.modelViewMatrixLoc, false, flatten($scope.modelViewMatrix));
        $scope.gl.uniformMatrix4fv($scope.projectionMatrixLoc, false, flatten($scope.projectionMatrix));
        
        
        angular.forEach($scope.objects, function(object) {
            if (object.render)
                object.render();
        });      
    };

    $scope.toRGB = function(value) {
        var components = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(value);
        return vec4(parseInt(components[1], 16) / 255.0, parseInt(components[2], 16) / 255.0, parseInt(components[3], 16) / 255.0, 1.0);
    }
        
    // Start creating new object
    $scope.newObject = function() {
        $scope.editMode = true;
        $scope.oldSelectedObject = $scope.selectedObject;
        $scope.selectedObject = null;
        $scope.obj = angular.copy($scope.baseObj);
        $scope.obj.name = $scope.types[$scope.obj.type] + "_" + String($scope.numObj);
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
            $scope.render();
        }
    }
    
    // Download objects
    $scope.downloadObjects = function() {
        var jsonData = angular.toJson($scope.objects, 4);
        var jsonDataWindow = window.open("data:text/json," + encodeURIComponent(jsonData), "_blank");
        jsonDataWindow.focus();        
    }

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
                var temp_objects = angular.fromJson(e.target.result);
                $scope.objects = [];                
                angular.forEach(temp_objects, function(temp_object) {
                    if (typeof temp_object.type !== "undefined") {
                        switch (parseInt(temp_object.type)) {
                            case (0) : { 
                                var ok = true;
                                ok = ok && (typeof temp_object.name !== "undefined");
                                ok = ok && (typeof temp_object.fragments !== "undefined")
                                ok = ok && (typeof temp_object.color !== "undefined");
                                ok = ok && (typeof temp_object.radius !== "undefined");
                                ok = ok && (typeof temp_object.height !== "undefined");
                                ok = ok && (typeof temp_object.closed !== "undefined");
                                ok = ok && (typeof temp_object.pos !== "undefined");
                                ok = ok && (typeof temp_object.rotation !== "undefined");
                                if (ok) 
                                    $scope.objects.push(
                                        $scope.createCone(
                                            temp_object.name,
                                            temp_object.fragments,
                                            temp_object.color,
                                            temp_object.radius,
                                            temp_object.height,
                                            temp_object.closed,
                                            vec3(temp_object.pos[0], temp_object.pos[1], temp_object.pos[2]),
                                            vec3(temp_object.rotation[0], temp_object.rotation[1], temp_object.rotation[2])
                                        ).generate()
                                    );
                                break;
                            }
                            case (1) : { 
                                var ok = true;
                                ok = ok && (typeof temp_object.name !== "undefined");
                                ok = ok && (typeof temp_object.fragments !== "undefined")
                                ok = ok && (typeof temp_object.color !== "undefined");
                                ok = ok && (typeof temp_object.top_radius !== "undefined");
                                ok = ok && (typeof temp_object.bottom_radius !== "undefined");
                                ok = ok && (typeof temp_object.height !== "undefined");
                                ok = ok && (typeof temp_object.closed !== "undefined");
                                ok = ok && (typeof temp_object.pos !== "undefined");
                                ok = ok && (typeof temp_object.rotation !== "undefined");
                                if (ok) 
                                    $scope.objects.push(
                                        $scope.createCylinder(
                                            temp_object.name,
                                            temp_object.fragments,
                                            temp_object.color,
                                            temp_object.top_radius,
                                            temp_object.bottom_radius,
                                            temp_object.height,
                                            temp_object.closed,
                                            vec3(temp_object.pos[0], temp_object.pos[1], temp_object.pos[2]),
                                            vec3(temp_object.rotation[0], temp_object.rotation[1], temp_object.rotation[2])
                                        ).generate()
                                    );
                                break;
                            }
                            case (2) : { 
                                var ok = true;
                                ok = ok && (typeof temp_object.name !== "undefined");
                                ok = ok && (typeof temp_object.fragments !== "undefined")
                                ok = ok && (typeof temp_object.color !== "undefined");
                                ok = ok && (typeof temp_object.radius !== "undefined");
                                ok = ok && (typeof temp_object.pos !== "undefined");
                                ok = ok && (typeof temp_object.rotation !== "undefined");
                                if (ok) 
                                    $scope.objects.push(
                                        $scope.createSphere(
                                            temp_object.name,
                                            temp_object.fragments,
                                            temp_object.color,
                                            temp_object.radius,
                                            vec3(temp_object.pos[0], temp_object.pos[1], temp_object.pos[2]),
                                            vec3(temp_object.rotation[0], temp_object.rotation[1], temp_object.rotation[2])
                                        ).generate()
                                    );
                                break;
                            }
                        }
                    }
                });
                
                console.log($scope.objects);
                
                $scope.selectedObject = null;
                if ($scope.objects.length > 0) {
                    $scope.selectedObject = $scope.objects[0];
                }
                $scope.numObj = $scope.objects.length;
                $scope.selectable_objects = $scope.selectedObject;
                $scope.loadObject();     
                $scope.render();

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
            $scope.render();
            $scope.selectable_objects = $scope.selectedObject;
            $scope.loadObject();
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
                return $scope.createCone(
                    $scope.obj.name, 
                    parseInt($scope.obj.fragments), 
                    $scope.obj.color, 
                    $scope.obj.radius, 
                    $scope.obj.height, 
                    $scope.obj.closed, 
                    vec3($scope.obj.pos_x, $scope.obj.pos_y, $scope.obj.pos_z), 
                    vec3($scope.obj.rot_x, $scope.obj.rot_y, $scope.obj.rot_z)
                ).generate();
                break;
            }
            case (1): {
                return $scope.createCylinder(
                    $scope.obj.name, 
                    parseInt($scope.obj.fragments), 
                    $scope.obj.color, 
                    $scope.obj.top_radius, 
                    $scope.obj.bottom_radius, 
                    $scope.obj.height, 
                    $scope.obj.closed, 
                    vec3($scope.obj.pos_x, $scope.obj.pos_y, $scope.obj.pos_z), 
                    vec3($scope.obj.rot_x, $scope.obj.rot_y, $scope.obj.rot_z)
                ).generate();
                break;
            }
            case (2): {
                return $scope.createSphere(
                    $scope.obj.name, 
                    parseInt($scope.obj.fragments), 
                    $scope.obj.color, 
                    $scope.obj.radius, 
                    vec3($scope.obj.pos_x, $scope.obj.pos_y, $scope.obj.pos_z), 
                    vec3($scope.obj.rot_x, $scope.obj.rot_y, $scope.obj.rot_z)
                ).generate();
                break;
            }
        }
        
        return null;
    }
    
    // Create cone object 
    $scope.createCone = function(_name, _fragments, _color, _radius, _height, _closed, _pos, _rotation) {
        return {  
            name: _name,
            fragments: _fragments,
            type: 0,
            color: _color,
            radius: _radius,
            height: _height,
            closed: _closed,
            pos: _pos,
            rotation: _rotation,
            vertices: [],
            /*        
            name: $scope.obj.name,
            fragments: parseInt($scope.obj.fragments),
            type: 0,
            color: $scope.obj.color,
            radius: $scope.obj.radius,
            height: $scope.obj.height,
            closed: $scope.obj.closed,
            pos: vec3($scope.obj.pos_x, $scope.obj.pos_y, $scope.obj.pos_z),
            rotation: vec3($scope.obj.rot_x, $scope.obj.rot_y, $scope.obj.rot_z),
            vertices: [],
            */
            
            update: function() {
                this.name = $scope.obj.name;
                this.fragments = parseInt($scope.obj.fragments);
                this.color = $scope.obj.color;
                this.radius = $scope.obj.radius;
                this.height = $scope.obj.height;
                this.closed = $scope.obj.closed;
                this.pos = vec3($scope.obj.pos_x, $scope.obj.pos_y, $scope.obj.pos_z);
                this.rotation = vec3($scope.obj.rot_x, $scope.obj.rot_y, $scope.obj.rot_z);
                
                this.generate();
            },

            generate: function() {                
                this.vertices = [];

                this.radius = (this.radius == null) ? 1.0 : this.radius;
                this.height = (this.height == null) ? 1.0 : this.height;
                this.pos[0] = (this.pos[0] == null) ? 0.0 : this.pos[0];
                this.pos[1] = (this.pos[1] == null) ? 0.0 : this.pos[1];
                this.pos[2] = (this.pos[2] == null) ? 0.0 : this.pos[2];
                this.rotation[0] = (this.rotation[0] == null) ? 0.0 : this.rotation[0];
                this.rotation[1] = (this.rotation[1] == null) ? 0.0 : this.rotation[1];
                this.rotation[2] = (this.rotation[2] == null) ? 0.0 : this.rotation[2];
                
                var v = vec4(this.radius, -this.height / 2.0, 0.0, 1.0);
                var top_vertex = vec4(0.0, this.height / 2.0, 0.0, 1.0);
                var bottom_vertex = vec4(0.0, -this.height / 2, 0.0, 1.0);
                
                var datas = [];
                
                for (var i = 0; i < this.fragments; i++) {
                    var degr_angle = i * 360.0 / this.fragments;
                    var rad_angle = radians(degr_angle);
                    var cos_angle = Math.cos(rad_angle);
                    var sin_angle = Math.sin(rad_angle);                   
                    datas.push($scope.vertexRotateY(v, cos_angle, sin_angle));
                }
                
                for (var i = 0; i < this.fragments; i++) {
                    var p1 = $scope.vertexTranslate($scope.vertexRotate(top_vertex, this.rotation[0], this.rotation[1], this.rotation[2]), this.pos[0], this.pos[1], this.pos[2]);
                    var p2 = $scope.vertexTranslate($scope.vertexRotate(datas[i], this.rotation[0], this.rotation[1], this.rotation[2]), this.pos[0], this.pos[1], this.pos[2]);
                    var p3 = $scope.vertexTranslate($scope.vertexRotate(datas[(i + 1) % this.fragments], this.rotation[0], this.rotation[1], this.rotation[2]), this.pos[0], this.pos[1], this.pos[2]);
                    this.vertices.push(p1, p2, p3);                     
                }
                if (this.closed) {
                    for (var i = 0; i < this.fragments; i++)  {                  
                        var p1 = $scope.vertexTranslate($scope.vertexRotate(bottom_vertex, this.rotation[0], this.rotation[1], this.rotation[2]), this.pos[0], this.pos[1], this.pos[2]);
                        var p2 = $scope.vertexTranslate($scope.vertexRotate(datas[i], this.rotation[0], this.rotation[1], this.rotation[2]), this.pos[0], this.pos[1], this.pos[2]);
                        var p3 = $scope.vertexTranslate($scope.vertexRotate(datas[(i + 1) % this.fragments], this.rotation[0], this.rotation[1], this.rotation[2]), this.pos[0], this.pos[1], this.pos[2]);
                        this.vertices.push(p1, p2, p3);
                    }
                }
                
                return this;
            },
            
            render: function() {
                //console.log(flatten(this.vertices));                
                $scope.gl.bufferData($scope.gl.ARRAY_BUFFER, flatten(this.vertices), $scope.gl.STATIC_DRAW);
                
                var colorLocation = $scope.gl.getUniformLocation($scope.program, "user_color");
                var _color = $scope.toRGB(this.color);
                
                $scope.gl.uniform4f(colorLocation, _color[0], _color[1], _color[2], _color[3]);
                for (var i=0; i<this.vertices.length; i+=3) {
                    $scope.gl.drawArrays($scope.gl.TRIANGLES, i, 3);
                }

                $scope.gl.uniform4f(colorLocation, 0.0, 0.0, 0.0, 1.0);
                for (var i=0; i<this.vertices.length - 1; i++) {                
                    $scope.gl.drawArrays($scope.gl.LINES, i, 2);
                }                
                
            }
        }
    }
    
    // Create cylinder object 
    $scope.createCylinder = function(_name, _fragments, _color, _top_radius, _bottom_radius, _height, _closed, _pos, _rotation) {
        return {  
            name: _name,
            fragments: _fragments,
            type: 1,
            color: _color,
            top_radius: _top_radius,
            bottom_radius: _bottom_radius,
            height: _height,
            closed: _closed,
            pos: _pos,
            rotation: _rotation,
            vertices: [],
            
            update: function() {
                this.name = $scope.obj.name;
                this.fragments = parseInt($scope.obj.fragments);
                this.color = $scope.obj.color;
                this.bottom_radius = $scope.obj.bottom_radius;
                this.top_radius = $scope.obj.top_radius;
                this.height = $scope.obj.height;
                this.closed = $scope.obj.closed;
                this.pos = vec3($scope.obj.pos_x, $scope.obj.pos_y, $scope.obj.pos_z);
                this.rotation = vec3($scope.obj.rot_x, $scope.obj.rot_y, $scope.obj.rot_z);
                
                this.generate();
            },
            
            generate: function() {
                this.vertices = [];
                
                this.bottom_radius = (this.bottom_radius == null) ? 1.0 : this.bottom_radius;
                this.top_radius = (this.top_radius == null) ? 1.0 : this.top_radius;
                this.height = (this.height == null) ? 1.0 : this.height;
                this.pos[0] = (this.pos[0] == null) ? 0.0 : this.pos[0];
                this.pos[1] = (this.pos[1] == null) ? 0.0 : this.pos[1];
                this.pos[2] = (this.pos[2] == null) ? 0.0 : this.pos[2];
                this.rotation[0] = (this.rotation[0] == null) ? 0.0 : this.rotation[0];
                this.rotation[1] = (this.rotation[1] == null) ? 0.0 : this.rotation[1];
                this.rotation[2] = (this.rotation[2] == null) ? 0.0 : this.rotation[2];
                
                var top_vertex = vec4(0.0, this.height / 2.0, 0.0, 1.0);
                var bottom_vertex = vec4(0.0, -this.height / 2, 0.0, 1.0);
                
                var datas = [];
                
                var v = vec4(this.top_radius, this.height / 2.0, 0.0, 1.0);
                for (var i = 0; i < this.fragments; i++) {
                    var degr_angle = i * 360.0 / this.fragments;
                    var rad_angle = radians(degr_angle);
                    var cos_angle = Math.cos(rad_angle);
                    var sin_angle = Math.sin(rad_angle);                   
                    datas.push($scope.vertexRotateY(v, cos_angle, sin_angle));
                }

                var v = vec4(this.bottom_radius, -this.height / 2.0, 0.0, 1.0);
                for (var i = 0; i < this.fragments; i++) {
                    var degr_angle = i * 360.0 / this.fragments;
                    var rad_angle = radians(degr_angle);
                    var cos_angle = Math.cos(rad_angle);
                    var sin_angle = Math.sin(rad_angle);                   
                    datas.push($scope.vertexRotateY(v, cos_angle, sin_angle));
                }

                for (var i = 0; i < this.fragments; i++) {
                    var p1 = $scope.vertexTranslate($scope.vertexRotate(datas[i], this.rotation[0], this.rotation[1], this.rotation[2]), this.pos[0], this.pos[1], this.pos[2]);
                    var p2 = $scope.vertexTranslate($scope.vertexRotate(datas[(i + 1) % this.fragments], this.rotation[0], this.rotation[1], this.rotation[2]), this.pos[0], this.pos[1], this.pos[2]);
                    var p3 = $scope.vertexTranslate($scope.vertexRotate(datas[i + this.fragments], this.rotation[0], this.rotation[1], this.rotation[2]), this.pos[0], this.pos[1], this.pos[2]);
                    this.vertices.push(p1, p2, p3);
                    
                    p1 = $scope.vertexTranslate($scope.vertexRotate(datas[(i + 1) % this.fragments], this.rotation[0], this.rotation[1], this.rotation[2]), this.pos[0], this.pos[1], this.pos[2]);
                    p2 = $scope.vertexTranslate($scope.vertexRotate(datas[(i + 1) % this.fragments + this.fragments], this.rotation[0], this.rotation[1], this.rotation[2]), this.pos[0], this.pos[1], this.pos[2]);
                    p3 = $scope.vertexTranslate($scope.vertexRotate(datas[i + this.fragments], this.rotation[0], this.rotation[1], this.rotation[2]), this.pos[0], this.pos[1], this.pos[2]);
                    this.vertices.push(p1, p2, p3);
                }
                
                if (this.closed) {
                    for (var i = 0; i < this.fragments; i++)  {
                        var p1 = $scope.vertexTranslate($scope.vertexRotate(top_vertex, this.rotation[0], this.rotation[1], this.rotation[2]), this.pos[0], this.pos[1], this.pos[2]);
                        var p2 = $scope.vertexTranslate($scope.vertexRotate(datas[i], this.rotation[0], this.rotation[1], this.rotation[2]), this.pos[0], this.pos[1], this.pos[2]);
                        var p3 = $scope.vertexTranslate($scope.vertexRotate(datas[(i + 1) % this.fragments], this.rotation[0], this.rotation[1], this.rotation[2]), this.pos[0], this.pos[1], this.pos[2]);
                        this.vertices.push(p1, p2, p3);
                    }
                    for (var i = 0; i < this.fragments; i++) {
                        var p1 = $scope.vertexTranslate($scope.vertexRotate(bottom_vertex, this.rotation[0], this.rotation[1], this.rotation[2]), this.pos[0], this.pos[1], this.pos[2]);
                        var p2 = $scope.vertexTranslate($scope.vertexRotate(datas[i + this.fragments], this.rotation[0], this.rotation[1], this.rotation[2]), this.pos[0], this.pos[1], this.pos[2]);
                        var p3 = $scope.vertexTranslate($scope.vertexRotate(datas[(i + 1) % this.fragments + this.fragments], this.rotation[0], this.rotation[1], this.rotation[2]), this.pos[0], this.pos[1], this.pos[2]);
                        this.vertices.push(p1, p2, p3);
                    }
                }
                
                return this;
            },
            
            render: function() {
                //console.log(flatten(this.vertices));
                $scope.gl.bufferData($scope.gl.ARRAY_BUFFER, flatten(this.vertices), $scope.gl.STATIC_DRAW);
                
                var colorLocation = $scope.gl.getUniformLocation($scope.program, "user_color");
                var _color = $scope.toRGB(this.color);
                $scope.gl.uniform4f(colorLocation, _color[0], _color[1], _color[2], _color[3]);
                
                for (var i=0; i<this.vertices.length; i+=3) {
                    $scope.gl.drawArrays($scope.gl.TRIANGLES, i, 3);
                }

                $scope.gl.uniform4f(colorLocation, 0.0, 0.0, 0.0, 1.0);
                for (var i=0; i<this.vertices.length - 1; i++) {                
                    $scope.gl.drawArrays($scope.gl.LINES, i, 2);
                }
            }
        }
    }

    // Create sphere object 
    $scope.createSphere = function(_name, _fragments, _color, _radius, _pos, _rotation) {
        return {  
            name: _name,
            fragments: _fragments,
            type: 2,
            color: _color,
            radius: _radius,
            pos: _pos,
            rotation: _rotation,
            vertices: [],
            
            update: function() {
                this.name = $scope.obj.name;
                this.fragments = parseInt($scope.obj.fragments);
                this.color = $scope.obj.color;
                this.radius = $scope.obj.radius;
                this.pos = vec3($scope.obj.pos_x, $scope.obj.pos_y, $scope.obj.pos_z);
                this.rotation = vec3($scope.obj.rot_x, $scope.obj.rot_y, $scope.obj.rot_z);
                
                this.generate();
            },

            generate: function() {               
                this.vertices = [];
                
                this.radius = (this.radius == null) ? 1.0 : this.radius;
                this.pos[0] = (this.pos[0] == null) ? 0.0 : this.pos[0];
                this.pos[1] = (this.pos[1] == null) ? 0.0 : this.pos[1];
                this.pos[2] = (this.pos[2] == null) ? 0.0 : this.pos[2];
                this.rotation[0] = (this.rotation[0] == null) ? 0.0 : this.rotation[0];
                this.rotation[1] = (this.rotation[1] == null) ? 0.0 : this.rotation[1];
                this.rotation[2] = (this.rotation[2] == null) ? 0.0 : this.rotation[2];
                
                var v = vec4(this.radius, 0.0, 0.0, 1.0);
                var top_vertex = vec4(0.0, this.radius, 0.0, 1.0);
                var bottom_vertex = vec4(0.0, -this.radius, 0.0, 1.0);
                
                var datas = [];
                
                for (var i = 1; i < this.fragments; i++) {
                    var degr_angle = 90.0 - i * 180.0 / this.fragments;
                    var rad_angle = radians(degr_angle);
                    var cos_angle = Math.cos(rad_angle);
                    var sin_angle = Math.sin(rad_angle);
                    var _v = $scope.vertexRotateZ(v, cos_angle, sin_angle);
                    for (var j = 0; j < this.fragments; j++) {
                        degr_angle = j * 360.0 / this.fragments;
                        rad_angle = radians(degr_angle);
                        cos_angle = Math.cos(rad_angle);
                        sin_angle = Math.sin(rad_angle);
                        datas.push($scope.vertexRotateY(_v, cos_angle, sin_angle));                        
                    }
                }

                for (var j = 0; j < this.fragments; j++) {
                    var p1 = $scope.vertexTranslate($scope.vertexRotate(top_vertex, this.rotation[0], this.rotation[1], this.rotation[2]), this.pos[0], this.pos[1], this.pos[2]);
                    var p2 = $scope.vertexTranslate($scope.vertexRotate(datas[j], this.rotation[0], this.rotation[1], this.rotation[2]), this.pos[0], this.pos[1], this.pos[2]);
                    var p3 = $scope.vertexTranslate($scope.vertexRotate(datas[(j + 1) % this.fragments], this.rotation[0], this.rotation[1], this.rotation[2]), this.pos[0], this.pos[1], this.pos[2]);
                    this.vertices.push(p1, p2, p3);
                }
                for (var i = 0; i < this.fragments - 2; i++)
                    for (var j = 0; j < this.fragments; j++) {
                        var p1 = $scope.vertexTranslate($scope.vertexRotate(datas[i * this.fragments + j], this.rotation[0], this.rotation[1], this.rotation[2]), this.pos[0], this.pos[1], this.pos[2]);
                        var p2 = $scope.vertexTranslate($scope.vertexRotate(datas[i * this.fragments + (j + 1) % this.fragments], this.rotation[0], this.rotation[1], this.rotation[2]), this.pos[0], this.pos[1], this.pos[2]);
                        var p3 = $scope.vertexTranslate($scope.vertexRotate(datas[(i + 1) * this.fragments + j], this.rotation[0], this.rotation[1], this.rotation[2]), this.pos[0], this.pos[1], this.pos[2]);
                        this.vertices.push(p1, p2, p3);
                        
                        p1 = $scope.vertexTranslate($scope.vertexRotate(datas[i * this.fragments + (j + 1) % this.fragments], this.rotation[0], this.rotation[1], this.rotation[2]), this.pos[0], this.pos[1], this.pos[2]);
                        p2 = $scope.vertexTranslate($scope.vertexRotate(datas[(i + 1) * this.fragments + (j + 1) % this.fragments], this.rotation[0], this.rotation[1], this.rotation[2]), this.pos[0], this.pos[1], this.pos[2]);
                        p3 = $scope.vertexTranslate($scope.vertexRotate(datas[(i + 1) * this.fragments + j], this.rotation[0], this.rotation[1], this.rotation[2]), this.pos[0], this.pos[1], this.pos[2]);
                        this.vertices.push(p1, p2, p3);
                    }
                
                for (var j = 0; j < this.fragments; j++) {
                    var p1 = $scope.vertexTranslate($scope.vertexRotate(bottom_vertex, this.rotation[0], this.rotation[1], this.rotation[2]), this.pos[0], this.pos[1], this.pos[2]);
                    var p2 = $scope.vertexTranslate($scope.vertexRotate(datas[(this.fragments - 2) * this.fragments + (j + 1) % this.fragments], this.rotation[0], this.rotation[1], this.rotation[2]), this.pos[0], this.pos[1], this.pos[2]);
                    var p3 = $scope.vertexTranslate($scope.vertexRotate(datas[(this.fragments - 2) * this.fragments + j], this.rotation[0], this.rotation[1], this.rotation[2]), this.pos[0], this.pos[1], this.pos[2]);
                    this.vertices.push(p1, p2, p3);
                }
                
                return this;
            },
            
            render: function() {
                //console.log(flatten(this.vertices));
                $scope.gl.bufferData($scope.gl.ARRAY_BUFFER, flatten(this.vertices), $scope.gl.STATIC_DRAW);
                
                var colorLocation = $scope.gl.getUniformLocation($scope.program, "user_color");
                var _color = $scope.toRGB(this.color);
                $scope.gl.uniform4f(colorLocation, _color[0], _color[1], _color[2], _color[3]);
                
                for (var i=0; i<this.vertices.length; i+=3) {
                    $scope.gl.drawArrays($scope.gl.TRIANGLES, i, 3);
                }

                $scope.gl.uniform4f(colorLocation, 0.0, 0.0, 0.0, 1.0);
                for (var i=0; i<this.vertices.length - 1; i++) {                
                    $scope.gl.drawArrays($scope.gl.LINES, i, 2);
                }                
            }
        }
    }
   
    // Vertex translate
    $scope.vertexTranslate = function(v, dx, dy, dz) {
        return vec4(
            v[0] + dx,
            v[1] + dy,
            v[2] + dz,
            1.0
        );
    }
    
    // Vertex rotation around X axis around center
    $scope.vertexRotateX = function(v, cos_angle, sin_angle) {
        return vec4(
            v[0],
            cos_angle * v[1] - sin_angle * v[2], 
            sin_angle * v[1] + cos_angle * v[2],
            1.0
        );
    }
    
    // Vertex rotation around Y axis around center
    $scope.vertexRotateY = function(v, cos_angle, sin_angle) {
        return vec4(
            cos_angle * v[0] + sin_angle * v[2], 
            v[1], 
            -sin_angle * v[0] + cos_angle * v[2],
            1.0
        );
    }
    
    // Vertex rotation around Z axis around center
    $scope.vertexRotateZ = function(v, cos_angle, sin_angle) {
        return vec4(
            cos_angle * v[0] - sin_angle * v[1], 
            sin_angle * v[0] + cos_angle * v[1], 
            v[2],
            1.0
        );
    }
    
    // Vertex rotation around center
    $scope.vertexRotate = function(v, x_angle, y_angle, z_angle) {
        var rad_x_angle = radians(x_angle);
        var rad_y_angle = radians(y_angle);
        var rad_z_angle = radians(z_angle);
        
        var cos_rad_x_angle = Math.cos(rad_x_angle);
        var sin_rad_x_angle = Math.sin(rad_x_angle);
        var cos_rad_y_angle = Math.cos(rad_y_angle);
        var sin_rad_y_angle = Math.sin(rad_y_angle);
        var cos_rad_z_angle = Math.cos(rad_z_angle);
        var sin_rad_z_angle = Math.sin(rad_z_angle);
               
        var _v = 
            $scope.vertexRotateX(
                $scope.vertexRotateY(
                    $scope.vertexRotateZ(
                        v,
                        cos_rad_z_angle,
                        sin_rad_z_angle
                    ),
                    cos_rad_y_angle,
                    sin_rad_y_angle
                ),
                cos_rad_x_angle,
                sin_rad_x_angle
            );

        return _v;
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
        $scope.obj.type = $scope.selectedObject.type;
        $scope.obj.fragments = $scope.selectedObject.fragments;
        $scope.obj.color = $scope.selectedObject.color;
        if ($scope.selectedObject.radius)
            $scope.obj.radius = $scope.selectedObject.radius;
        if ($scope.selectedObject.top_radius)
            $scope.obj.top_radius = $scope.selectedObject.top_radius;
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