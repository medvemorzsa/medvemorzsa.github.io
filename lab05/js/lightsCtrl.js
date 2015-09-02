app.controller("webGlLab05LightsCtrl", function($scope) {
        
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
});
