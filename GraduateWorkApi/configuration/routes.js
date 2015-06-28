/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */

var bodyParser = require('body-parser');
var express = require('express');
var router = express.Router();
var controller = require("../controllers/controllers.js");
var authenticate = require("../controllers/authtentication.js");

module.exports = function(app) {
    app.use(bodyParser.urlencoded({ extended: false }));
    app.use(bodyParser.json({limit: '50mb'}));
    app.use('/public', express.static(__dirname + '/../public'));
    app.use('/api', router);
    
    router.use(function(req, res, next) {
        next();
    });
    setUpRoutes(router);
};

function setUpRoutes(router){

    //Artist
    router.route('/artist/register').post(controller.user.artistRegister);
    router.route('/artist/login').post(controller.user.artistLogin);

    //Manager
    router.route('/manager/register').post(controller.user.managerRegister);
    router.route('/manager/login').post(controller.user.managerLogin);
    router.route('/manager/event/').post(authenticate.check, authenticate.checkIfManager, controller.event.postEvent);
    router.route('/manager/:managerID/events').get(authenticate.check, authenticate.checkIfManager, controller.event.getManagerEvents);

    //Common
    router.route('/events').get(controller.event.getAllEvents);
    router.route('/events/:eventID/favorite').get(authenticate.check, controller.event.favoriteEvent);
    router.route('/user/info').get(authenticate.check, controller.user.getUserByToken);

    //router.route('/user/:userIDs').get(authenticate.check, controller.user.getUserInfoByUserIDs);


}