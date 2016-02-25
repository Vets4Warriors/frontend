/**
 * Created by jeffm on 2/24/2016.
 */



(function(){
    var app = angular.module('main',[]);

    app.controller('MainController',function(){
        this.btn = callBtn;
    });

    var callBtn = {
        name: 'Take a Call'
    }
});