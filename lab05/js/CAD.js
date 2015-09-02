var app = angular.module("webGlLab05App", ['ngRoute']);

app.controller("webGlLab05Ctrl", function($scope) {
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
                if (e.target.result.objects) {
                    var temp_objects = angular.fromJson(e.target.result.objects);
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
                
                if (e.target.result.lights) {
                    var temp_lights = angular.fromJson(e.target.result.lights);
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

                $scope.loadObject();   
                $scope.loadLight();
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
    
    if ($scope.initWebGL()) {   
        console.log("Bubu");
        /*
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
        */
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

app.config(['$routeProvider',
    function($routeProvider) {
        $routeProvider.
            when('/objects', {
                controller : 'webGlLab05ObjectsCtrl',
                templateUrl: './templates/objects.html'
            }).
            when('/lights', {
                controller : 'webGlLab05LightsCtrl',
                templateUrl: './templates/lights.html'
            }).
            when('/fileUpload', {
                controller : 'webGlLab05Ctrl',
                templateUrl: './templates/fileUpload.html'
            }).
            otherwise({
                controller : 'webGlLab05Ctrl',
                redirectTo: '/objects'
            });
    }
]);