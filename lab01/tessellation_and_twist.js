function App(maxSubdivision) {
    // Constants
    this.types = {
        WIREFRAMED: 0,
        PARTIALLY_FILLED: 1,
        FILLED: 2
    }
    
    if (Object.freeze)
        Object.freeze(this.types);
    
    var maxSubdivision = (typeof maxSubdivision !== 'undefined') ?  maxSubdivision : 10;
    
    // User-modifiable parameters
    var subdivision = 5;
    var angle = 0;
    var tessellation = true;
    var style = this.types.WIREFRAMED;
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
    
}

Number.isInteger = Number.isInteger || function(value) {
    return ((typeof value === "number") && 
           (isFinite(value)) && 
           (Math.floor(value) === value));
};

$(document).ready(function(){
    document.app = new App();
});