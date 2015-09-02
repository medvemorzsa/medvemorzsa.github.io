app.controller("webGlLab05ObjectsCtrl", function($scope) {
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
    
});
