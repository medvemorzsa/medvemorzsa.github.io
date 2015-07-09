function App(maxSubdivision) {
    this.types = {
        WIREFRAMED: 0,
        PARTIALLY_FILLED: 1,
        FILLED: 2
    }
    
    if (Object.freeze)
        Object.freeze(this.types);
    
    var maxSubdivision = (typeof maxSubdivision !== 'undefined') ?  maxSubdivision : 10;
    
    var subdivision = 5;
    var angle = 0;
    var tessellation = true;
    var style = this.types.WIREFRAMED;
    var color = vec4( 0.0, 0.0, 0.0, 1.0 );    
}

Number.isInteger = Number.isInteger || function(value) {
    return ((typeof value === "number") && 
           (isFinite(value)) && 
           (Math.floor(value) === value));
};

$(document).ready(function(){
    document.app = new App();
});