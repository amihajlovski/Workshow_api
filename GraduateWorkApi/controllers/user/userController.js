/**
 * Created by Mihajlovski on 26.04.2015.
 */
var utilities = require("../../utilities/utilities_common.js");
var error_messages = require("../../configuration/error_messages.js");
var model = require("../../models/models.js");
var configuration = require("../../configuration/configuration.js");
var unirest = require('unirest');

//Manager
exports.managerRegister = managerRegister;
exports.managerLogin = managerLogin;

//Artist
exports.artistRegister = artistRegister;
exports.artistLogin = artistLogin;

function artistLogin(req, res){
    req.isArtist = true;
    req.isManager = false;
    userLogin(req, res);
}

function managerLogin(req, res){
    req.isArtist = false;
    req.isManager = true;
    userLogin(req, res);
}

function userLogin(req, res){
    if(model.user.validateLogin(req.body, "Fb_token")){
        loginWithFacebook(req, res);
    } else
    if(model.user.validateLogin(req.body, "G_token")){

    } else
    if(model.user.validateLogin(req.body, "Email")){
        processLogin(req.body, res);
    } else {
        return res.json(utilities.generateInvalidResponse(error_messages.content.RESPONSE_ERROR_WRONG_PARAMETERS));
    }
}

function managerRegister(req, res){
    req.isArtist = false;
    req.isManager = true;
    userRegister(req, res);
}

function artistRegister(req, res){
    req.isArtist = true;
    req.isManager = false;
    userRegister(req, res);
}

function userRegister(req, res){
    if(model.user.validRegisterInput(req.body)){
        model.user.doesUserExist(req.body.Email, null, function(userExist, userDoc){
            if(userExist)
                return res.json(utilities.generateInvalidResponse(error_messages.content.RESPONSE_ERROR_USER_EXIST));
            else {
                var newUser = req.body;
                newUser.isArtist = req.isArtist;
                newUser.isManager = req.isManager;
                model.user.addNewUser(newUser, function(err, user){
                    if(err==null)
                        return res.json(utilities.generateValidResponse({}));
                    else
                        return res.json(utilities.generateInvalidResponse(error_messages.content.RESPONSE_ERROR_UNKNOWN));
                });
            }
        });
    } else {
        return res.json(utilities.generateInvalidResponse(error_messages.content.RESPONSE_ERROR_WRONG_PARAMETERS));
    }
}

function processLogin(user, res){
    if(model.user.validateLoginInput(user)){
        model.user.doesUserExist(user.Email, user.Password, function(userExist, userDoc){
            if(!userExist)
                return res.json(utilities.generateInvalidResponse(error_messages.content.RESPONSE_ERROR_USER_DOESNT_EXIST));
            else {
                generateAuthTokenSession(userDoc, res);
            }
        });
    } else {
        return res.json(utilities.generateInvalidResponse(error_messages.content.RESPONSE_ERROR_WRONG_PARAMETERS));
    }
}

function loginWithFacebook(req, res){
    var newuser = req.body;
    var fb_url = configuration.content.FACEBOOK_GRAPH_API.replace("$token", newuser.Fb_token);
    var get_fb_url_request = unirest.get(fb_url);
    get_fb_url_request.headers({
        'Accepts': 'application/json'
    }).end(function(response) {
        var fb_response = JSON.parse(response.body);
        if(fb_response.hasOwnProperty("error"))
            return res.json(utilities.generateInvalidResponse(error_messages.content.RESPONSE_ERROR_UNKNOWN));
        else {
            model.user.doesUserExist(fb_response.email, null, function(userExist, userDoc){
                if(userExist){
                    generateAuthTokenSession(userDoc, res);
                } else {
                    fb_response.isArtist = req.isArtist;
                    fb_response.isManager = req.isManager;
                    model.user.addNewUser(fb_response, function(err, newUserDoc){
                        if(err==null) {
                            generateAuthTokenSession(newUserDoc.ops[0], res);
                        } else
                            return res.json(utilities.generateInvalidResponse(error_messages.content.RESPONSE_ERROR_UNKNOWN));
                    });
                }
            });
        }
    });
}

function generateAuthTokenSession(newUserDoc, res){
    model.user.generateTokenData(newUserDoc, function(err, token){
        if(err == false && token != null)
            return res.json(utilities.generateValidResponse(token));
        else
            return res.json(utilities.generateInvalidResponse(error_messages.content.RESPONSE_ERROR_UNKNOWN));
    });
}