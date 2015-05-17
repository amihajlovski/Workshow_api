'use strict';

var app = angular.module('graduateApp', [
    'ngRoute',
    'oc.lazyLoad'
]);

app.config(['$routeProvider', function ($routeProvider) {
    $routeProvider.
        when('/', {
            templateUrl: 'ngCommon/home/home.html',
            controller: 'HomeController',
            resolve: {
                loadController: ['$ocLazyLoad', function ($ocLazyLoad) {
                    return $ocLazyLoad.load('ngCommon/home/homeController.js');
                }]
            }
        }).
        otherwise({redirectTo: '/'});
}]);