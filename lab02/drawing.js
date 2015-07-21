var app = angular.module("webGlLab02App", []);

app.controller("webGlLab02Ctrl", function($scope) {
    $scope.varLoading = true;
    $scope.varLoading = false;
});
    
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
            scope.genScene();
        }, true);

        w.bind('resize', function () {
            scope.$apply();
        });
    }
});
