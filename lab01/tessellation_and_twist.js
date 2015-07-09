function App(maxSubdivision) {
    // Constants
    this.styles = {
        WIREFRAMED: 0,
        PARTIALLY_FILLED: 1,
        FILLED: 2
    }
    
    if (Object.freeze)
        Object.freeze(this.styles);
    
    var maxSubdivision = (typeof maxSubdivision !== 'undefined') ?  maxSubdivision : 10;
    
    // User-modifiable parameters
    var subdivision = 5;
    var angle = 0;
    var tessellation = true;
    var style = this.styles.WIREFRAMED;
    var color = vec4( 0.0, 0.0, 0.0, 1.0 );    
    
    // Getter for subdivision parameter
    this.__defineGetter__("subdivision", function() {
        return subdivision;
    });
    
    // Setter for subdivision parameter
    this.__defineSetter__("subdivision", function(value) {
        if (typeof value === "undefined")
            throw "Number of subdivision is required!";
        if ((isNaN(value)) || (!(Number.isInteger(value))))
            throw "Number of subdivision must be integer value!";
        if ((value < 0) || (value > maxSubdivision))
            throw "Number of subdivision must be between 0 and " + maxSubdivision + "!";
        subdivision = value;
    });
    
    // Getter for angle parameter
    this.__defineGetter__("angle", function() {
        return angle;
    });
    
    // Setter for angle parameter
    this.__defineSetter__("angle", function(value) {
        if (typeof value === "undefined")
            throw "Angle is required!";
        if ((isNaN(value)) || (!(Number.isInteger(value))))
            throw "Angle must be integer value!";
        if ((value < 0) || (value > 359))
            throw "Angle must be between 0 and 359!";
        angle = value;
    });

    // Setter for tessellation parameter
    this.__defineGetter__("tessellation", function() {
        return tessellation;
    });
    
    // Getter for tessellation parameter
    this.__defineSetter__("tessellation", function(value) {
        if (typeof value === "undefined")
            throw "Tessellation is required!";
        if (typeof value !== "boolean")
            throw "Tessellation must be boolean value!"
        tessellation = value;
    });    

    // Getter for style parameter
    this.__defineGetter__("style", function() {
        return style;
    });
    
    // Setter for style parameter
    this.__defineSetter__("style", function(value) {
        if (typeof value === "undefined")
            throw "Style is required!";
        if ((isNaN(value)) || (!(Number.isInteger(value))))
            throw "Style must be one of WIREFRAMED, PARTIALLY_FILLED, FILLED constants!"
        validProp = false;
        for (var prop in this.styles) { 
            if ((this.styles.hasOwnProperty(prop)) && (this.styles[prop] == value))
                validProp = true;
        }
        if (!(validProp))
            throw "Style must be one of WIREFRAMED, PARTIALLY_FILLED, FILLED constants!"
        style = value;
    }); 

    // Getter for color parameter
    this.__defineGetter__("color", function() {
        _red = (color[0] * 255).toString(16);
        if (_red.length == 1)
            _red = "0" + _red
        _green = (color[1] * 255).toString(16);
        if (_green.length == 1)
            _green = "0" + _green
        _blue = (color[2] * 255).toString(16);
        if (_blue.length == 1)
            _blue = "0" + _blue
        return "#" + _red + _green + _blue;
    });
    
    // Setter for color parameter
    this.__defineSetter__("color", function(value) {
        if (typeof value === "undefined")
            throw "Color is required!";
        if (typeof value !== "string")
            throw "Color must be filled #RRGGBB format!";
        if (!(/^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.test(value)))
            throw "Color must be filled #RRGGBB format!";
        var components = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(value);
        color = vec4(parseInt(components[1], 16) / 255.0, parseInt(components[2], 16) / 255.0, parseInt(components[3], 16) / 255.0, 1.0);
    });
}

Number.isInteger = Number.isInteger || function(value) {
    return ((typeof value === "number") && 
           (isFinite(value)) && 
           (Math.floor(value) === value));
};

$(document).ready(function(){
    document.app = new App();
});