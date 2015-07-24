/**
 * Created by Mihajlovski on 23.05.2015.
 */
var utilities = require("../utilities/utilities_common.js");
var error_messages = require("../configuration/error_messages");
var model = require("../models/models.js");
var guid = require("guid");

exports.check = authenticate;
exports.checkIfManager = checkIfManager;
exports.checkIfArtist = checkIfArtist;
exports.authenticateSocket = authenticateSocket;

function authenticate(req, res, next){
    req.User_id = "";
    if(!req.headers.hasOwnProperty("authtoken") || !guid.isGuid(req.headers.authtoken) || req.headers.authtoken == undefined)
        return res.json(utilities.generateInvalidResponse(error_messages.content.RESPONSE_ERROR_INVALID_TOKEN));

    var token = req.headers.authtoken;
    model.user.getUserByAuthToken(token, function(err, user){
        if(err && user==null){
            return res.json(utilities.generateInvalidResponse(error_messages.content.RESPONSE_ERROR_INVALID_TOKEN));
        } else {
            model.user.updateUserToken(user, token, function(err, doc){
                req.User_id = user._id;
                next();
            });
        }
    });
}

function checkIfArtist(req, res, next){
    if(!req.hasOwnProperty('User_id'))
        return res.json(utilities.generateInvalidResponse(error_messages.content.RESPONSE_ERROR_MISSING_USER_ID));
    model.user.getUsersInfo([req.User_id], function(err, userDoc){
        if(err==null && userDoc.length>0){
            var user = userDoc[0];
            if(user.hasOwnProperty('Artist') && user.Artist==true)
                next();
            else
                return res.json(utilities.generateInvalidResponse(error_messages.content.RESPONSE_ERROR_MISSING_USER_ID));
        } else {
            return res.json(utilities.generateInvalidResponse(error_messages.content.RESPONSE_ERROR_MISSING_USER_ID));
        }
    });
}

function checkIfManager(req, res, next){
    if(!req.hasOwnProperty('User_id'))
        return res.json(utilities.generateInvalidResponse(error_messages.content.RESPONSE_ERROR_MISSING_USER_ID));
    model.user.getUsersInfo([req.User_id], function(err, userDoc){
        if(err==null && userDoc.length>0){
            var user = userDoc[0];
            if(user.hasOwnProperty('Manager') && user.Manager==true)
                next();
            else
                return res.json(utilities.generateInvalidResponse(error_messages.content.RESPONSE_ERROR_MISSING_USER_ID));
        } else {
            return res.json(utilities.generateInvalidResponse(error_messages.content.RESPONSE_ERROR_MISSING_USER_ID));
        }
    });
}

function authenticateSocket(socket, postback){
    if(!socket.request.hasOwnProperty('_query') || !socket.request._query.hasOwnProperty('authtoken')){
        socket.emit('authenticationError', {Message:'Given authentication token is invalid or has expired.'});
        socket.disconnect();
        return postback();// callback();
    } else {
        model.user.getUserByAuthToken(socket.request._query.authtoken, function(err, user){
            if(err == null && user){
                socket.userID = user._id;
                postback();
            } else {
                socket.emit('authenticationError', error_messages.content.RESPONSE_ERROR_ACCOUNT_DISABLED);
            }
        });
    }
}