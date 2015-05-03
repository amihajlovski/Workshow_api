/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */

var bodyParser = require('body-parser');
var express = require('express');
var router = express.Router();
var controller = require("../controllers/controllers.js");

module.exports = function(app) {
    app.use(bodyParser.urlencoded({ extended: false }));
    app.use(bodyParser.json({limit: '50mb'}));
    app.use('/public', express.static(__dirname + '/../public'));
    app.use('/api', router);
    
    router.use(function(req, res, next) {
        console.log("Input: " + req.body);
        next(); 
    });
    setUpRoutes(router);
};

function setUpRoutes(router){

    router.route('/artist/register').post(controller.user.artistRegister);

}