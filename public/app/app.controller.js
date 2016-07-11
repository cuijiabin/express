/**
 * Created by cuijiabin on 2016/7/10.
 */
angular.module('myApp').controller('AppCtrl', function($scope,$http) {
    $scope.message = 'Hello World!';

    $scope.serch = function(){
        $http({
            method: 'GET',
            url: '/rap'
        }).then(function successCallback(response) {
            alert(response);
        }, function errorCallback(response) {
            alert(response);
        });
    }

});