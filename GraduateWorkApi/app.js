/*
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */

var express = require('express');
var io = require('socket.io');
var app = express();
var port = process.env.PORT || 1337;
var fileUpload = require('./utilities/file_upload.js');
var socketIOServer = null;

allowCors();

// START THE SERVER
// ==============================================

console.log('Service running on port ' + port + ".");

//Set up the routes
require("./configuration/routes")(app);
socketIOServer = io.listen(app.listen(port));
fileUpload.setupFileUpload(socketIOServer);

function allowCors(){
    app.all('*', function(req, res, next) {
        res.header("Access-Control-Allow-Origin", "*");
        res.header("Access-Control-Allow-Headers", "X-Requested-With");
        res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
        res.header("Access-Control-Allow-Headers", "Content-Type, authtoken");
        next();
    });
}
