var app = angular.module("webGlLab05App", ['ngRoute']);

app
    .controller("webGlLab05Ctrl", function($scope) {
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
            
            $scope.program = initShaders($scope.gl, "vertex-shader", "fragment-shader");
            $scope.gl.useProgram($scope.program);
            
            $scope.nBuffer = $scope.gl.createBuffer();
            $scope.gl.bindBuffer($scope.gl.ARRAY_BUFFER, $scope.nBuffer);

            $scope.vNormal = $scope.gl.getAttribLocation($scope.program, "vNormal");
            $scope.gl.vertexAttribPointer($scope.vNormal, 3, $scope.gl.FLOAT, false, 0, 0 );
            $scope.gl.enableVertexAttribArray($scope.vNormal);
            
            $scope.vBuffer = $scope.gl.createBuffer();
            $scope.gl.bindBuffer($scope.gl.ARRAY_BUFFER, $scope.vBuffer);

            $scope.vPosition = $scope.gl.getAttribLocation($scope.program, "vPosition");
            $scope.gl.vertexAttribPointer($scope.vPosition, 4, $scope.gl.FLOAT, false, 0, 0);
            $scope.gl.enableVertexAttribArray($scope.vPosition);
            
            $scope.modelViewMatrixLoc = $scope.gl.getUniformLocation($scope.program, "modelViewMatrix");
            $scope.projectionMatrixLoc = $scope.gl.getUniformLocation($scope.program, "projectionMatrix");
            
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
            
            angular.forEach($scope.scene.objects, function(object) {
                $scope.renderObject(object);
            });      
        };

        $scope.renderObject = function(object) {
            $scope.gl.bindBuffer($scope.gl.ARRAY_BUFFER, $scope.nBuffer);
            $scope.gl.bufferData($scope.gl.ARRAY_BUFFER, flatten(object.normals), $scope.gl.STATIC_DRAW);

            $scope.gl.bindBuffer($scope.gl.ARRAY_BUFFER, $scope.vBuffer);
            $scope.gl.bufferData($scope.gl.ARRAY_BUFFER, flatten(object.vertices), $scope.gl.STATIC_DRAW);

            $scope.gl.uniform1i($scope.gl.getUniformLocation($scope.program, "texEnabled"), false);
            
            var hasLight = false;
            for (var i = 0; i < $scope.MAX_NUM_LIGHTS; i++) {
                if (i < $scope.scene.lights.length) {
                    var ambientProduct = mult($scope.scene.lights[i].vAmbient, object.vAmbient);
                    var diffuseProduct = mult($scope.scene.lights[i].vDiffuse, object.vDiffuse);
                    var specularProduct = mult($scope.scene.lights[i].vSpecular, object.vSpecular);                
                    
                    $scope.gl.uniform4fv($scope.gl.getUniformLocation($scope.program, "lights[" + i + "].ambientProduct"), flatten(ambientProduct));
                    $scope.gl.uniform4fv($scope.gl.getUniformLocation($scope.program, "lights[" + i + "].diffuseProduct"), flatten(diffuseProduct));
                    $scope.gl.uniform4fv($scope.gl.getUniformLocation($scope.program, "lights[" + i + "].specularProduct"), flatten(specularProduct));
                    $scope.gl.uniform4fv($scope.gl.getUniformLocation($scope.program, "lights[" + i + "].position"), flatten($scope.scene.lights[i].pos));
                    $scope.gl.uniform3fv($scope.gl.getUniformLocation($scope.program, "lights[" + i + "].attenuation"), flatten($scope.scene.lights[i].attenuation));
                    $scope.gl.uniform1i($scope.gl.getUniformLocation($scope.program, "lights[" + i + "].enabled"), $scope.scene.lights[i].enabled);
                    hasLight = hasLight || $scope.scene.lights[i].enabled;
                } else {
                    $scope.gl.uniform1i($scope.gl.getUniformLocation($scope.program, "lights[" + i + "].enabled"), false);
                }
            }
            if (!(hasLight)) {
                var ambientProduct = mult($scope.baseLight.vAmbient, object.vAmbient);
                var diffuseProduct = mult($scope.baseLight.vDiffuse, object.vDiffuse);
                var specularProduct = mult($scope.baseLight.vSpecular, object.vSpecular);                
                
                $scope.gl.uniform4fv($scope.gl.getUniformLocation($scope.program, "lights[0].ambientProduct"), flatten(ambientProduct));
                $scope.gl.uniform4fv($scope.gl.getUniformLocation($scope.program, "lights[0].diffuseProduct"), flatten(diffuseProduct));
                $scope.gl.uniform4fv($scope.gl.getUniformLocation($scope.program, "lights[0].specularProduct"), flatten(specularProduct));
                $scope.gl.uniform4fv($scope.gl.getUniformLocation($scope.program, "lights[0].position"), flatten($scope.baseLight.pos));
                $scope.gl.uniform3fv($scope.gl.getUniformLocation($scope.program, "lights[0].attenuation"), flatten($scope.baseLight.attenuation));
                $scope.gl.uniform1i($scope.gl.getUniformLocation($scope.program, "lights[0].enabled"), true);
            }
            
            $scope.gl.uniform1f($scope.gl.getUniformLocation($scope.program, "shininess"), object.shininess);

            $scope.gl.drawArrays($scope.gl.TRIANGLES, 0, object.vertices.length);
        }
        
        // Return hexa formatted color as rgba components
        $scope.toRGB = function(value) {
            var components = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(value);
            return vec4(parseInt(components[1], 16) / 255.0, parseInt(components[2], 16) / 255.0, parseInt(components[3], 16) / 255.0, 1.0);
        }
               
        // Return rgba componets as hexa formatted color
        $scope.toHex = function(value) {
            var r = Math.round(value[0] * 255);
            var g = Math.round(value[1] * 255);
            var b = Math.round(value[2] * 255);
            
            return "#" + ((r < 16) ? "0" : "") + r.toString(16) + ((g < 16) ? "0" : "") + g.toString(16) + ((b < 16) ? "0" : "") + b.toString(16);
        }
            
        // Reset object modification
        $scope.reset = function(form) {
            if (form) {
                form.$setPristine();
                form.$setUntouched();
            }
            if (form.$name == "object_form") {
                if ($scope.oldSelectedObject != null) {
                    $scope.selectedObject = $scope.oldSelectedObject;
                    $scope.oldSelectedObject = null;
                }
                if ($scope.selectedObject != null) {
                    $scope.selectable_objects = $scope.selectedObject;
                    $scope.loadObject();
                }
                else {
                    $scope.obj = angular.copy($scope.baseObj);
                }
            }
            if (form.$name == "light_form") {
                if ($scope.oldSelectedLight != null) {
                    $scope.selectedLight = $scope.oldSelectedLight;
                    $scope.oldSelectedLight = null;
                }
                if ($scope.selectedLight != null) {
                    $scope.selectable_lights = $scope.selectedLight;
                    $scope.loadLight();
                }
                else {
                    $scope.light = angular.copy($scope.baseLight);
                }
            }
                
            $scope.editMode=false;
        };    
         
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
        
        // Normal for triangle
        $scope.normal = function(p1, p2, p3) {
             var t1 = subtract(p2, p1);
             var t2 = subtract(p3, p1);
             var normal = cross(t1, t2);
             var normal = vec3(normal);
             normal = normalize(normal);

             return normal;
        }
        
        // Start creating new object
        $scope.newObject = function() {
            $scope.editMode = true;
            $scope.oldSelectedObject = $scope.selectedObject;
            $scope.selectedObject = null;
            $scope.obj = angular.copy($scope.baseObj);
            $scope.obj.name = $scope.types[parseInt($scope.obj.type)] + "_" + String($scope.numObj);
        }
        
        // Start editing selected object
        $scope.editObject = function() {
            $scope.editMode = true;         
        }
        
        // Delete selected object
        $scope.deleteObject = function() {
            if ($scope.selectedObject == null) return;
            
            if (confirm("Are you sure you want to delete the selected object?")) {
                $scope.scene.objects.splice($scope.scene.objects.indexOf($scope.selectedObject), 1);
                $scope.selectedObject = null;
                if ($scope.scene.objects.length > 0)
                    $scope.selectedObject = $scope.scene.objects[0];            
                $scope.selectable_objects = $scope.selectedObject;
                $scope.loadObject();
                $scope.render();
            }
        }
        
        // Auto rename current object when its name has never changed
        $scope.autoRename = function() {
            if ($scope.obj.name_changed) return;
            $scope.obj.name = $scope.types[parseInt($scope.obj.type)] + "_" + String($scope.numObj);
        }
        
        // Check renaming
        $scope.checkRenaming = function($event) {
            $scope.obj.name_changed = ($scope.obj.name != $scope.types[parseInt($scope.obj.type)] + '_' + String($scope.numObj));
        }
        
        // Save object modification
        $scope.saveObject = function(form) {
            if (form.$valid) {
                if ($scope.selectedObject == null) {
                    $scope.selectedObject = $scope.createObject();
                    $scope.scene.objects.push($scope.selectedObject);
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
            $scope.obj.type = String($scope.selectedObject.type);
            $scope.obj.fragments = $scope.selectedObject.fragments;
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
            $scope.obj.ambient = $scope.selectedObject.ambient;
            $scope.obj.diffuse = $scope.selectedObject.diffuse;
            $scope.obj.specular = $scope.selectedObject.specular;
            $scope.obj.vAmbient = $scope.selectedObject.vAmbient;
            $scope.obj.vDiffuse = $scope.selectedObject.vDiffuse;
            $scope.obj.vSpecular = $scope.selectedObject.vSpecular;
            $scope.obj.shininess = $scope.selectedObject.shininess;
            $scope.obj.pos_x = $scope.selectedObject.pos[0];
            $scope.obj.pos_y = $scope.selectedObject.pos[1];
            $scope.obj.pos_z = $scope.selectedObject.pos[2];
            $scope.obj.rot_x = $scope.selectedObject.rotation[0];
            $scope.obj.rot_y = $scope.selectedObject.rotation[1];
            $scope.obj.rot_z = $scope.selectedObject.rotation[2];
        }
        
        // Create object
        $scope.createObject = function() {
            if ($scope.selectedObject != null) return;
            switch (parseInt($scope.obj.type)) {
                case (0): {
                    return $scope.createCone(
                        $scope.obj.name, 
                        parseInt($scope.obj.fragments), 
                        $scope.obj.radius, 
                        $scope.obj.height, 
                        $scope.obj.closed, 
                        $scope.obj.ambient,
                        $scope.obj.diffuse,
                        $scope.obj.specular,
                        parseFloat($scope.obj.shininess),
                        vec3($scope.obj.pos_x, $scope.obj.pos_y, $scope.obj.pos_z), 
                        vec3($scope.obj.rot_x, $scope.obj.rot_y, $scope.obj.rot_z)
                    ).generate();
                    break;
                }
                case (1): {
                    return $scope.createCylinder(
                        $scope.obj.name, 
                        parseInt($scope.obj.fragments), 
                        $scope.obj.top_radius, 
                        $scope.obj.bottom_radius, 
                        $scope.obj.height, 
                        $scope.obj.closed, 
                        $scope.obj.ambient,
                        $scope.obj.diffuse,
                        $scope.obj.specular,
                        parseFloat($scope.obj.shininess),
                        vec3($scope.obj.pos_x, $scope.obj.pos_y, $scope.obj.pos_z), 
                        vec3($scope.obj.rot_x, $scope.obj.rot_y, $scope.obj.rot_z)
                    ).generate();
                    break;
                }
                case (2): {
                    return $scope.createSphere(
                        $scope.obj.name, 
                        parseInt($scope.obj.fragments), 
                        $scope.obj.radius, 
                        $scope.obj.ambient,
                        $scope.obj.diffuse,
                        $scope.obj.specular,
                        parseFloat($scope.obj.shininess),
                        vec3($scope.obj.pos_x, $scope.obj.pos_y, $scope.obj.pos_z), 
                        vec3($scope.obj.rot_x, $scope.obj.rot_y, $scope.obj.rot_z)
                    ).generate();
                    break;
                }
            }
            
            return null;
        }
        
        // Create cone object 
        $scope.createCone = function(_name, _fragments, _radius, _height, _closed, _ambient, _diffuse, _specular, _shininess, _pos, _rotation) {
            return {  
                name: _name,
                fragments: _fragments,
                type: 0,
                radius: _radius,
                height: _height,
                closed: _closed,
                ambient: (typeof _ambient === "string") ? _ambient : $scope.toHex(_ambient),
                diffuse: (typeof _diffuse === "string") ? _diffuse : $scope.toHex(_diffuse),
                specular: (typeof _specular === "string") ? _specular : $scope.toHex(_specular),
                vAmbient: (typeof _ambient === "string") ? $scope.toRGB(_ambient) : _ambient,
                vDiffuse: (typeof _diffuse === "string") ? $scope.toRGB(_diffuse) : _diffuse,
                vSpecular: (typeof _specular === "string") ? $scope.toRGB(_specular) : _specular,
                shininess: _shininess,
                pos: _pos,
                rotation: _rotation,
                vertices: [],
                normals: [],
                
                update: function() {
                    this.name = $scope.obj.name;
                    this.fragments = parseInt($scope.obj.fragments);
                    this.radius = $scope.obj.radius;
                    this.height = $scope.obj.height;
                    this.closed = $scope.obj.closed;
                    this.ambient = $scope.obj.ambient;
                    this.diffuse = $scope.obj.diffuse;
                    this.specular = $scope.obj.specular;
                    this.vAmbient = $scope.obj.vAmbient;
                    this.vDiffuse = $scope.obj.vDiffuse;
                    this.vSpecular = $scope.obj.vSpecular;
                    this.shininess = parseFloat($scope.obj.shininess);
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
                        var p2 = $scope.vertexTranslate($scope.vertexRotate(datas[(i + 1) % this.fragments], this.rotation[0], this.rotation[1], this.rotation[2]), this.pos[0], this.pos[1], this.pos[2]);
                        var p3 = $scope.vertexTranslate($scope.vertexRotate(datas[i], this.rotation[0], this.rotation[1], this.rotation[2]), this.pos[0], this.pos[1], this.pos[2]);
                        this.vertices.push(p1, p2, p3);                     
                        var normal = $scope.normal(p1, p2, p3);
                        for (var k = 0; k < 3; k++)
                            this.normals.push(normal);
                    }
                    if (this.closed) {
                        for (var i = 0; i < this.fragments; i++)  {                  
                            var p1 = $scope.vertexTranslate($scope.vertexRotate(bottom_vertex, this.rotation[0], this.rotation[1], this.rotation[2]), this.pos[0], this.pos[1], this.pos[2]);
                            var p2 = $scope.vertexTranslate($scope.vertexRotate(datas[i], this.rotation[0], this.rotation[1], this.rotation[2]), this.pos[0], this.pos[1], this.pos[2]);
                            var p3 = $scope.vertexTranslate($scope.vertexRotate(datas[(i + 1) % this.fragments], this.rotation[0], this.rotation[1], this.rotation[2]), this.pos[0], this.pos[1], this.pos[2]);
                            this.vertices.push(p1, p2, p3);
                            var normal = $scope.normal(p1, p2, p3);
                            for (var k = 0; k < 3; k++)
                                this.normals.push(normal);
                        }
                    }
                    
                    return this;
                }
            }
        }
        
        // Create cylinder object 
        $scope.createCylinder = function(_name, _fragments, _top_radius, _bottom_radius, _height, _closed, _ambient, _diffuse, _specular, _shininess, _pos, _rotation) {
            return {  
                name: _name,
                fragments: _fragments,
                type: 1,
                top_radius: _top_radius,
                bottom_radius: _bottom_radius,
                height: _height,
                closed: _closed,
                ambient: (typeof _ambient === "string") ? _ambient : $scope.toHex(_ambient),
                diffuse: (typeof _diffuse === "string") ? _diffuse : $scope.toHex(_diffuse),
                specular: (typeof _specular === "string") ? _specular : $scope.toHex(_specular),
                vAmbient: (typeof _ambient === "string") ? $scope.toRGB(_ambient) : _ambient,
                vDiffuse: (typeof _diffuse === "string") ? $scope.toRGB(_diffuse) : _diffuse,
                vSpecular: (typeof _specular === "string") ? $scope.toRGB(_specular) : _specular,
                shininess: _shininess,
                pos: _pos,
                rotation: _rotation,
                vertices: [],
                normals: [],
                
                update: function() {
                    this.name = $scope.obj.name;
                    this.fragments = parseInt($scope.obj.fragments);
                    this.bottom_radius = $scope.obj.bottom_radius;
                    this.top_radius = $scope.obj.top_radius;
                    this.height = $scope.obj.height;
                    this.closed = $scope.obj.closed;
                    this.ambient = $scope.obj.ambient;
                    this.diffuse = $scope.obj.diffuse;
                    this.specular = $scope.obj.specular;
                    this.vAmbient = $scope.obj.vAmbient;
                    this.vDiffuse = $scope.obj.vDiffuse;
                    this.vSpecular = $scope.obj.vSpecular;
                    this.shininess = parseFloat($scope.obj.shininess);
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
                        var p2 = $scope.vertexTranslate($scope.vertexRotate(datas[i + this.fragments], this.rotation[0], this.rotation[1], this.rotation[2]), this.pos[0], this.pos[1], this.pos[2]);
                        var p3 = $scope.vertexTranslate($scope.vertexRotate(datas[(i + 1) % this.fragments], this.rotation[0], this.rotation[1], this.rotation[2]), this.pos[0], this.pos[1], this.pos[2]);
                        this.vertices.push(p1, p2, p3);
                        var normal = $scope.normal(p1, p3, p2);
                        for (var k = 0; k < 3; k++)
                            this.normals.push(normal);
                        
                        p1 = $scope.vertexTranslate($scope.vertexRotate(datas[(i + 1) % this.fragments], this.rotation[0], this.rotation[1], this.rotation[2]), this.pos[0], this.pos[1], this.pos[2]);
                        p2 = $scope.vertexTranslate($scope.vertexRotate(datas[i + this.fragments], this.rotation[0], this.rotation[1], this.rotation[2]), this.pos[0], this.pos[1], this.pos[2]);
                        p3 = $scope.vertexTranslate($scope.vertexRotate(datas[(i + 1) % this.fragments + this.fragments], this.rotation[0], this.rotation[1], this.rotation[2]), this.pos[0], this.pos[1], this.pos[2]);
                        this.vertices.push(p1, p2, p3);
                        var normal = $scope.normal(p1, p3, p2);
                        for (var k = 0; k < 3; k++)
                            this.normals.push(normal);
                    }
                    
                    if (this.closed) {
                        for (var i = 0; i < this.fragments; i++)  {
                            var p1 = $scope.vertexTranslate($scope.vertexRotate(top_vertex, this.rotation[0], this.rotation[1], this.rotation[2]), this.pos[0], this.pos[1], this.pos[2]);
                            var p2 = $scope.vertexTranslate($scope.vertexRotate(datas[(i + 1) % this.fragments], this.rotation[0], this.rotation[1], this.rotation[2]), this.pos[0], this.pos[1], this.pos[2]);
                            var p3 = $scope.vertexTranslate($scope.vertexRotate(datas[i], this.rotation[0], this.rotation[1], this.rotation[2]), this.pos[0], this.pos[1], this.pos[2]);
                            this.vertices.push(p1, p2, p3);
                            var normal = $scope.normal(p1, p2, p3);
                            for (var k = 0; k < 3; k++)
                                this.normals.push(normal);
                        }
                        for (var i = 0; i < this.fragments; i++) {
                            var p1 = $scope.vertexTranslate($scope.vertexRotate(bottom_vertex, this.rotation[0], this.rotation[1], this.rotation[2]), this.pos[0], this.pos[1], this.pos[2]);
                            var p2 = $scope.vertexTranslate($scope.vertexRotate(datas[i + this.fragments], this.rotation[0], this.rotation[1], this.rotation[2]), this.pos[0], this.pos[1], this.pos[2]);
                            var p3 = $scope.vertexTranslate($scope.vertexRotate(datas[(i + 1) % this.fragments + this.fragments], this.rotation[0], this.rotation[1], this.rotation[2]), this.pos[0], this.pos[1], this.pos[2]);
                            this.vertices.push(p1, p2, p3);
                            var normal = $scope.normal(p1, p2, p3);
                            for (var k = 0; k < 3; k++)
                                this.normals.push(normal);
                        }
                    }
                    
                    return this;
                }
            }
        }

        // Create sphere object 
        $scope.createSphere = function(_name, _fragments, _radius, _ambient, _diffuse, _specular, _shininess, _pos, _rotation) {
            return {  
                name: _name,
                fragments: _fragments,
                type: 2,
                radius: _radius,
                ambient: (typeof _ambient === "string") ? _ambient : $scope.toHex(_ambient),
                diffuse: (typeof _diffuse === "string") ? _diffuse : $scope.toHex(_diffuse),
                specular: (typeof _specular === "string") ? _specular : $scope.toHex(_specular),
                vAmbient: (typeof _ambient === "string") ? $scope.toRGB(_ambient) : _ambient,
                vDiffuse: (typeof _diffuse === "string") ? $scope.toRGB(_diffuse) : _diffuse,
                vSpecular: (typeof _specular === "string") ? $scope.toRGB(_specular) : _specular,
                shininess: _shininess,
                pos: _pos,
                rotation: _rotation,
                vertices: [],
                normals: [],
                
                update: function() {
                    this.name = $scope.obj.name;
                    this.fragments = parseInt($scope.obj.fragments);
                    this.radius = $scope.obj.radius;
                    this.ambient = $scope.obj.ambient;
                    this.diffuse = $scope.obj.diffuse;
                    this.specular = $scope.obj.specular;
                    this.vAmbient = $scope.obj.vAmbient;
                    this.vDiffuse = $scope.obj.vDiffuse;
                    this.vSpecular = $scope.obj.vSpecular;
                    this.shininess = parseFloat($scope.obj.shininess);
                    this.pos = vec3($scope.obj.pos_x, $scope.obj.pos_y, $scope.obj.pos_z);
                    this.rotation = vec3($scope.obj.rot_x, $scope.obj.rot_y, $scope.obj.rot_z);
                    
                    this.generate();
                },

                generate: function() {               
                    this.vertices = [];
                    this.normals = [];
                    
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
                        var p2 = $scope.vertexTranslate($scope.vertexRotate(datas[(j + 1) % this.fragments], this.rotation[0], this.rotation[1], this.rotation[2]), this.pos[0], this.pos[1], this.pos[2]);
                        var p3 = $scope.vertexTranslate($scope.vertexRotate(datas[j], this.rotation[0], this.rotation[1], this.rotation[2]), this.pos[0], this.pos[1], this.pos[2]);
                        this.vertices.push(p1, p2, p3);
                        var normal = $scope.normal(p1, p2, p3);
                        for (var k = 0; k < 3; k++)
                            this.normals.push(normal);
                    }
                    for (var i = 0; i < this.fragments - 2; i++)
                        for (var j = 0; j < this.fragments; j++) {
                            var p1 = $scope.vertexTranslate($scope.vertexRotate(datas[i * this.fragments + j], this.rotation[0], this.rotation[1], this.rotation[2]), this.pos[0], this.pos[1], this.pos[2]);
                            var p2 = $scope.vertexTranslate($scope.vertexRotate(datas[(i + 1) * this.fragments + j], this.rotation[0], this.rotation[1], this.rotation[2]), this.pos[0], this.pos[1], this.pos[2]);
                            var p3 = $scope.vertexTranslate($scope.vertexRotate(datas[i * this.fragments + (j + 1) % this.fragments], this.rotation[0], this.rotation[1], this.rotation[2]), this.pos[0], this.pos[1], this.pos[2]);
                            this.vertices.push(p1, p2, p3);
                            var normal = $scope.normal(p1, p3, p2);
                            for (var k = 0; k < 3; k++)
                                this.normals.push(normal);
                            
                            p1 = $scope.vertexTranslate($scope.vertexRotate(datas[i * this.fragments + (j + 1) % this.fragments], this.rotation[0], this.rotation[1], this.rotation[2]), this.pos[0], this.pos[1], this.pos[2]);
                            p2 = $scope.vertexTranslate($scope.vertexRotate(datas[(i + 1) * this.fragments + j], this.rotation[0], this.rotation[1], this.rotation[2]), this.pos[0], this.pos[1], this.pos[2]);
                            p3 = $scope.vertexTranslate($scope.vertexRotate(datas[(i + 1) * this.fragments + (j + 1) % this.fragments], this.rotation[0], this.rotation[1], this.rotation[2]), this.pos[0], this.pos[1], this.pos[2]);
                            this.vertices.push(p1, p2, p3);
                            var normal = $scope.normal(p1, p3, p2);
                            for (var k = 0; k < 3; k++)
                                this.normals.push(normal);
                        }
                    
                    for (var j = 0; j < this.fragments; j++) {
                        var p1 = $scope.vertexTranslate($scope.vertexRotate(bottom_vertex, this.rotation[0], this.rotation[1], this.rotation[2]), this.pos[0], this.pos[1], this.pos[2]);
                        var p2 = $scope.vertexTranslate($scope.vertexRotate(datas[(this.fragments - 2) * this.fragments + j], this.rotation[0], this.rotation[1], this.rotation[2]), this.pos[0], this.pos[1], this.pos[2]);
                        var p3 = $scope.vertexTranslate($scope.vertexRotate(datas[(this.fragments - 2) * this.fragments + (j + 1) % this.fragments], this.rotation[0], this.rotation[1], this.rotation[2]), this.pos[0], this.pos[1], this.pos[2]);
                        this.vertices.push(p1, p2, p3);
                        var normal = $scope.normal(p1, p2, p3);
                        for (var k = 0; k < 3; k++)
                            this.normals.push(normal);
                    }
                    
                    return this;
                }
            }
        }
                
        // Start creating new light
        $scope.newLight = function() {
            $scope.editMode = true;
            $scope.oldSelectedLight = $scope.selectedLight;
            $scope.selectedLight = null;
            $scope.light = angular.copy($scope.baseLight);
            $scope.light.name = "Light_" + String($scope.numLight);
        }
        
        // Start editing selected light
        $scope.editLight = function() {
            $scope.editMode = true;         
        }
        
        // Delete selected object
        $scope.deleteLight = function() {
            if ($scope.selectedLight == null) return;
            
            if (confirm("Are you sure you want to delete the selected light?")) {
                $scope.scene.lights.splice($scope.scene.lights.indexOf($scope.selectedLight), 1);
                $scope.selectedLight = null;
                if ($scope.scene.lights.length > 0)
                    $scope.selectedLight = $scope.scene.lights[0];            
                $scope.selectable_lights = $scope.selectedLight;
                $scope.loadLight();
                $scope.render();
            }
        }

        // Check renaming
        $scope.checkRenamingLight = function($event) {
            $scope.light.name_changed = ($scope.light.name != 'Light_' + String($scope.numLight));
        }
            
        // Save light modification
        $scope.saveLight = function(form) {
            if (form.$valid) {
                if ($scope.selectedLight == null) {
                    $scope.selectedLight = $scope.createLight(
                        $scope.light.name, 
                        $scope.light.enabled, 
                        $scope.light.ambient,
                        $scope.light.diffuse,
                        $scope.light.specular,
                        vec3($scope.light.attenuation[0], $scope.light.attenuation[1], $scope.light.attenuation[2]),
                        vec4($scope.light.pos[0], $scope.light.pos[1], $scope.light.pos[2], 0.0)
                    );
                    $scope.scene.lights.push($scope.selectedLight);
                    $scope.numLight++;
                }
                else {
                    $scope.updateLight();
                }
                $scope.render();
                $scope.selectable_lights = $scope.selectedLight;
                $scope.loadLight();
                $scope.editMode = false;
            }
        }
        
        // Update light
        $scope.updateLight = function() {
            if ($scope.selectedLight == null) return;

            if ($scope.selectedLight.update)
                $scope.selectedLight.update();
        }
        
        // Create light object 
        $scope.createLight = function(_name, _enabled, _ambient, _diffuse, _specular, _attenuation, _pos) {
            return {  
                name: _name,
                enabled: _enabled,
                ambient: (typeof _ambient === "string") ? _ambient : $scope.toHex(_ambient),
                diffuse: (typeof _diffuse === "string") ? _diffuse : $scope.toHex(_diffuse),
                specular: (typeof _specular === "string") ? _specular : $scope.toHex(_specular),
                vAmbient: (typeof _ambient === "string") ? $scope.toRGB(_ambient) : _ambient,
                vDiffuse: (typeof _diffuse === "string") ? $scope.toRGB(_diffuse) : _diffuse,
                vSpecular: (typeof _specular === "string") ? $scope.toRGB(_specular) : _specular,
                attenuation: _attenuation,
                pos: _pos,
                
                update: function() {
                    this.name = $scope.light.name;
                    this.enabled = $scope.light.enabled;
                    this.ambient = $scope.light.ambient;
                    this.diffuse = $scope.light.diffuse;
                    this.specular = $scope.light.specular;
                    this.vAmbient = $scope.light.vAmbient;
                    this.vDiffuse = $scope.light.vDiffuse;
                    this.vSpecular = $scope.light.vSpecular;
                    this.attenuation = vec3($scope.light.attenuation[0], $scope.light.attenuation[1], $scope.light.attenuation[2]);
                    this.pos = vec4($scope.light.pos[0], $scope.light.pos[1], $scope.light.pos[2], 0.0);
                }
            }
        };
        
        // Load datas of light into UI components
        $scope.loadLight = function(o) {
            if (($scope.selectable_lights == null) || (typeof $scope.selectable_lights === "undefined")) {
                $scope.light = angular.copy($scope.baseLight);
                return;
            }
            
            $scope.selectedLight = $scope.selectable_lights;
            
            $scope.light.name = $scope.selectedLight.name;
            $scope.light.enabled = $scope.selectedLight.enabled;
            $scope.light.ambient = $scope.selectedLight.ambient;
            $scope.light.diffuse = $scope.selectedLight.diffuse;
            $scope.light.specular = $scope.selectedLight.specular;
            $scope.light.vAmbient = $scope.selectedLight.vAmbient;
            $scope.light.vDiffuse = $scope.selectedLight.vDiffuse;
            $scope.light.vSpecular = $scope.selectedLight.vSpecular;
            $scope.light.attenuation = $scope.selectedLight.attenuation;
            $scope.light.pos_x = $scope.selectedLight.pos[0];
            $scope.light.pos_y = $scope.selectedLight.pos[1];
            $scope.light.pos_z = $scope.selectedLight.pos[2];
        }

        // Switch lights
        $scope.switchLight = function($event) {
            if ($scope.selectedLight == null) return;
            $scope.selectedLight.enabled = !$scope.selectedLight.enabled;
            
            $scope.render();
        }
        
        // Download scene
        $scope.downloadScene = function() {
            try {
                angular.forEach($scope.scene.objects, function(object) {
                    object.ambient = undefined;
                    object.diffuse = undefined;
                    object.specular = undefined;
                    object.vertices = undefined;
                    object.normals = undefined;
                    /*
                    delete object.vertices;
                    delete object.normals;
                    */
                });
            }
            catch (err) {
                console.log(err);
            }
            try {
                angular.forEach($scope.scene.lights, function(light) {
                    light.ambient = undefined;
                    light.diffuse = undefined;
                    light.specular = undefined;
                });
            }
            catch (err) {
                console.log(err);
            }
            var jsonData = angular.toJson($scope.scene, 4);
            
            angular.forEach($scope.scene.objects, function(object) {
                if (object.generate) {
                    object.ambient = $scope.toHex(object.vAmbient);
                    object.diffuse = $scope.toHex(object.vDiffuse);
                    object.specular = $scope.toHex(object.vSpecular);
                    object.vertices = [];
                    object.normals = [];
                    object.generate();
                }
            });
            angular.forEach($scope.scene.lights, function(light) {
                light.ambient = $scope.toHex(light.vAmbient);
                light.diffuse = $scope.toHex(light.vDiffuse);
                light.specular = $scope.toHex(light.vSpecular);
            });
            
            var jsonDataWindow = window.open("data:text/json," + encodeURIComponent(jsonData), "_blank");
            if (jsonDataWindow) jsonDataWindow.focus();                
        }
        
        // Upload scene
        $scope.uploadScene = function($event) {
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
                    var temp_scene = angular.fromJson(e.target.result);
                    
                    if (temp_scene.objects) {
                        var temp_objects = temp_scene.objects;
                        $scope.scene.objects = [];                
                        angular.forEach(temp_objects, function(temp_object) {
                            if (typeof temp_object.type !== "undefined") {
                                switch (parseInt(temp_object.type)) {
                                    case (0) : { 
                                        var ok = true;
                                        ok = ok && (typeof temp_object.name !== "undefined");
                                        ok = ok && (typeof temp_object.fragments !== "undefined")
                                        ok = ok && (typeof temp_object.radius !== "undefined");
                                        ok = ok && (typeof temp_object.height !== "undefined");
                                        ok = ok && (typeof temp_object.closed !== "undefined");
                                        ok = ok && (typeof temp_object.vAmbient !== "undefined");
                                        ok = ok && (typeof temp_object.vDiffuse !== "undefined");
                                        ok = ok && (typeof temp_object.vSpecular !== "undefined");
                                        ok = ok && (typeof temp_object.shininess !== "undefined");
                                        ok = ok && (typeof temp_object.pos !== "undefined");
                                        ok = ok && (typeof temp_object.rotation !== "undefined");
                                        if (ok) 
                                            $scope.scene.objects.push(
                                                $scope.createCone(
                                                    temp_object.name,
                                                    temp_object.fragments,
                                                    temp_object.radius,
                                                    temp_object.height,
                                                    temp_object.closed,
                                                    vec4(temp_object.vAmbient[0], temp_object.vAmbient[1], temp_object.vAmbient[2], temp_object.vAmbient[3]),
                                                    vec4(temp_object.vDiffuse[0], temp_object.vDiffuse[1], temp_object.vDiffuse[2], temp_object.vDiffuse[3]),
                                                    vec4(temp_object.vSpecular[0], temp_object.vSpecular[1], temp_object.vSpecular[2], temp_object.vSpecular[3]),
                                                    temp_object.shininess,
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
                                        ok = ok && (typeof temp_object.top_radius !== "undefined");
                                        ok = ok && (typeof temp_object.bottom_radius !== "undefined");
                                        ok = ok && (typeof temp_object.height !== "undefined");
                                        ok = ok && (typeof temp_object.closed !== "undefined");
                                        ok = ok && (typeof temp_object.vAmbient !== "undefined");
                                        ok = ok && (typeof temp_object.vDiffuse !== "undefined");
                                        ok = ok && (typeof temp_object.vSpecular !== "undefined");
                                        ok = ok && (typeof temp_object.shininess !== "undefined");
                                        ok = ok && (typeof temp_object.pos !== "undefined");
                                        ok = ok && (typeof temp_object.rotation !== "undefined");
                                        if (ok) 
                                            $scope.scene.objects.push(
                                                $scope.createCylinder(
                                                    temp_object.name,
                                                    temp_object.fragments,
                                                    temp_object.top_radius,
                                                    temp_object.bottom_radius,
                                                    temp_object.height,
                                                    temp_object.closed,
                                                    vec4(temp_object.vAmbient[0], temp_object.vAmbient[1], temp_object.vAmbient[2], temp_object.vAmbient[3]),
                                                    vec4(temp_object.vDiffuse[0], temp_object.vDiffuse[1], temp_object.vDiffuse[2], temp_object.vDiffuse[3]),
                                                    vec4(temp_object.vSpecular[0], temp_object.vSpecular[1], temp_object.vSpecular[2], temp_object.vSpecular[3]),
                                                    temp_object.shininess,
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
                                        ok = ok && (typeof temp_object.radius !== "undefined");
                                        ok = ok && (typeof temp_object.vAmbient !== "undefined");
                                        ok = ok && (typeof temp_object.vDiffuse !== "undefined");
                                        ok = ok && (typeof temp_object.vSpecular !== "undefined");
                                        ok = ok && (typeof temp_object.shininess !== "undefined");
                                        ok = ok && (typeof temp_object.pos !== "undefined");
                                        ok = ok && (typeof temp_object.rotation !== "undefined");
                                        if (ok) 
                                            $scope.scene.objects.push(
                                                $scope.createSphere(
                                                    temp_object.name,
                                                    temp_object.fragments,
                                                    temp_object.radius,
                                                    vec4(temp_object.vAmbient[0], temp_object.vAmbient[1], temp_object.vAmbient[2], temp_object.vAmbient[3]),
                                                    vec4(temp_object.vDiffuse[0], temp_object.vDiffuse[1], temp_object.vDiffuse[2], temp_object.vDiffuse[3]),
                                                    vec4(temp_object.vSpecular[0], temp_object.vSpecular[1], temp_object.vSpecular[2], temp_object.vSpecular[3]),
                                                    temp_object.shininess,
                                                    vec3(temp_object.pos[0], temp_object.pos[1], temp_object.pos[2]),
                                                    vec3(temp_object.rotation[0], temp_object.rotation[1], temp_object.rotation[2])
                                                ).generate()
                                            );
                                        break;
                                    }
                                }
                            }
                        });
                    }
                    
                    if (temp_scene.lights) {
                        var temp_lights = temp_scene.lights;
                        $scope.scene.lights = [];                
                        angular.forEach(temp_lights, function(temp_light) {
                            var ok = true;
                            ok = ok && (typeof temp_light.name !== "undefined");
                            ok = ok && (typeof temp_light.enabled !== "undefined")
                            ok = ok && (typeof temp_light.vAmbient !== "undefined");
                            ok = ok && (typeof temp_light.vDiffuse !== "undefined");
                            ok = ok && (typeof temp_light.vSpecular !== "undefined");
                            ok = ok && (typeof temp_light.attenuation !== "undefined");
                            ok = ok && (typeof temp_light.pos !== "undefined");
                            if (ok) 
                                $scope.scene.lights.push(
                                    $scope.createLight(
                                        temp_light.name,
                                        temp_light.enabled,
                                        vec4(temp_light.vAmbient[0], temp_light.vAmbient[1], temp_light.vAmbient[2], temp_light.vAmbient[3]),
                                        vec4(temp_light.vDiffuse[0], temp_light.vDiffuse[1], temp_light.vDiffuse[2], temp_light.vDiffuse[3]),
                                        vec4(temp_light.vSpecular[0], temp_light.vSpecular[1], temp_light.vSpecular[2], temp_light.vSpecular[3]),
                                        vec3(temp_light.attenuation[0], temp_light.attenuation[1], temp_light.attenuation[2]),
                                        vec4(temp_light.pos[0], temp_light.pos[1], temp_light.pos[2], temp_light.pos[3])
                                    )
                                );
                        });
                        
                        $scope.selectedLight = null;
                        if ($scope.scene.lights.length > 0) {
                            $scope.selectedLight = $scope.scene.lights[0];
                        }
                        $scope.numLigths = $scope.scene.lights.length;
                        $scope.selectable_lights = $scope.selectedLight;
                    }

                    console.log($scope.scene);
                    $scope.render();
                    
                    return true;
                }
                catch(err) {
                    console.log(err);
                    alert("The loading or processing of file failed.\n\n" + err);
                    
                    return false;
                }    
                finally {
                    $scope.loading = false;
                    $location.path("/objects");
                }
            };
            reader.readAsText(file);
            
            return true;
        }        
        
        // Initialization
        $scope.init = function($event) {
            $scope.varLoading = true;
            
            $scope.types = ["Cone", "Cylinder", "Sphere"];
            
            $scope.scene = {
                objects : [],
                lights: []
            };
            $scope.editMode = false;
            $scope.numObj = 1;
            $scope.numLight = 1;
            $scope.MAX_NUM_LIGHTS = 16;
            $scope.selectedObject = null;
            $scope.selectedLight = null;
            
            $scope.baseObj = {
                name: "Untitled",
                name_changed: false,
                type: "0",
                fragments: 12,
                radius: 1.0,
                bottom_radius: 1.0,
                top_radius: 1.0,
                height: 1.0,
                closed: false,
                ambient: "#000000",
                diffuse: "#000000",
                specular: "#000000",
                vAmbient: vec4(0.0, 0.0, 0.0, 1.0),
                vDiffuse: vec4(0.0, 0.0, 0.0, 1.0),
                vSpecular: vec4(0.0, 0.0, 0.0, 1.0),
                shininess: 100.0,
                pos_x: 0.0,
                pos_y: 0.0,
                pos_z: 0.0,
                rot_x: 0.0,
                rot_y: 0.0,
                rot_z: 0.0        
            };
            $scope.obj = angular.copy($scope.baseObj);
            
            $scope.baseLight = {
                name: "Untitled",
                pos: vec4(0.0, 0.0, 30.0, 0.0),
                ambient: "#808080",
                diffuse: "#808080",
                specular: "#000000",
                vAmbient: vec4(0.5, 0.5, 0.5, 1.0),
                vDiffuse: vec4(0.5, 0.5, 0.5, 1.0),
                vSpecular: vec4(0.0, 0.0, 0.0, 1.0),
                attenuation: vec3(1.0, 0.0, 0.0),
                enabled: true
            }
            $scope.light = angular.copy($scope.baseLight);
            
            $scope.canvas = null;
            $scope.gl = null;
            $scope.nBuffer = null;
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

            if ($scope.initWebGL()) {   
                
                $scope.scene.objects.push(
                    $scope.createCone(
                        "Cone #01",
                        48,
                        2.0,
                        4.0,
                        true,
                        vec4(1.0, 1.0, 1.0, 1.0),
                        vec4(0.4, 0.4, 0.0, 1.0),
                        vec4(0.4, 0.4, 0.4, 1.0),
                        10.0,
                        vec3(-4.0, 0.0, 0.0),
                        vec3(0.0, 0.0, 0.0)
                    ).generate()
                );        
                $scope.scene.objects.push(
                    $scope.createCylinder(
                        "Cylinger #01",
                        48,
                        1.0,
                        2.0,
                        4.0,
                        true,
                        vec4(0.5, 0.5, 0.5, 1.0),
                        vec4(1.0, 0.0, 0.0, 1.0),
                        vec4(0.2, 0.2, 0.2, 1.0),
                        60.0,
                        vec3(0.0, 0.0, 0.0),
                        vec3(0.0, 0.0, 0.0)
                    ).generate()
                );        
                $scope.scene.objects.push(
                    $scope.createSphere(
                        "Sphere #01",
                        48,
                        2.0,
                        vec4(0.6, 0.6, 0.6, 1.0),
                        vec4(0.0, 1.0, 0.0, 1.0),
                        vec4(1.0, 1.0, 1.0, 1.0),
                        100.0,
                        vec3(4.0, 0.0, 0.0),
                        vec3(0.0, 0.0, 0.0)
                    ).generate()
                );
                
                $scope.scene.lights.push($scope.createLight("Light #01", true, vec4(0.0, 0.0, 0.0, 1.0), vec4(1.0, 1.0, 1.0, 1.0), vec4(0.0, 0.0, 0.0, 1.0), vec3(1.0, 0.0, 0.0), vec4(-50.0, 50.0, 50.0, 0.0)));
                $scope.scene.lights.push($scope.createLight("Light #02", true, vec4(0.0, 0.0, 0.0, 1.0), vec4(0.4, 0.4, 0.4, 1.0), vec4(1.0, 1.0, 1.0, 1.0), vec3(1.0, 0.0, 0.0), vec4(0.0, -20.0, 150.0, 0.0)));
                
                $scope.numObj = $scope.scene.objects.length;
                $scope.numLight = $scope.scene.lights.length;        
                
                $scope.render();
                
                $scope.varLoading = false;                
            }
        }
    })

    // Resize canvas
    .directive('resize', function ($window) {
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
    })

    // Route provider
    .config(['$routeProvider',
        function($routeProvider) {
            $routeProvider.
                when('/objects', {
                    controller : 'webGlLab05Ctrl',
                    templateUrl: './templates/objects.html'
                }).
                when('/lights', {
                    controller : 'webGlLab05Ctrl',
                    templateUrl: './templates/lights.html'
                }).
                when('/sceneUpload', {
                    controller : 'webGlLab05Ctrl',
                    templateUrl: './templates/sceneUpload.html'
                }).
                otherwise({
                    controller : 'webGlLab05Ctrl',
                    redirectTo: '/objects'
                });
        }
    ]);