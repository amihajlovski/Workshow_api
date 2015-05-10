/**
 * Created by Mihajlovski on 26.04.2015.
 */
var utilities = require("../../utilities/utilities_common.js");
var error_messages = require("../../configuration/error_messages.js");
var model = require("../../models/models.js");
var configuration = require("../../configuration/configuration.js");
var unirest = require('unirest');

var sensitiveInfo = ["_id", "Type", "Password", "Tokens"];

//Manager
exports.managerRegister = managerRegister;
exports.managerLogin = managerLogin;

//Artist
exports.artistRegister = artistRegister;
exports.artistLogin = artistLogin;

//Common
exports.getUserInfoByUserIDs = getUserInfoByUserIDs;

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
        loginWithGoogle(req,res);
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
                createNewUserAndProcessAuthToken(newUser, req, res);
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
    processSocialLoginRequest(fb_url, "facebook", req, res)
}

function loginWithGoogle(req, res){
    var newuser = req.body;
    var g_url = configuration.content.GOOGLE_URL.replace("$token", newuser.G_token);
    processSocialLoginRequest(g_url, "google", req, res)
}

function generateAuthTokenSession(newUserDoc, res){
    model.user.generateTokenData(newUserDoc, function(err, token){
        if(err == false && token != null)
            return res.json(utilities.generateValidResponse(token));
        else
            return res.json(utilities.generateInvalidResponse(error_messages.content.RESPONSE_ERROR_UNKNOWN));
    });
}

function processSocialLoginRequest(url, social, req, res){
    var get_url_request = unirest.get(url);
    get_url_request.headers({
        'Accepts': 'application/json'
    }).end(function(response) {
        var slResponse = social == "facebook" ? JSON.parse(response.body) : response.body;
        if(slResponse.hasOwnProperty("error") || !slResponse)
            return res.json(utilities.generateInvalidResponse(error_messages.content.RESPONSE_ERROR_UNKNOWN));
        else {
            model.user.doesUserExist(slResponse.email, null, function(userExist, userDoc){
                if(userExist){
                    generateAuthTokenSession(userDoc, res);
                } else {
                    createNewUserAndProcessAuthToken(slResponse, req, res);
                }
            });
        }
    });
}

function createNewUserAndProcessAuthToken(newUser, req, res){
    newUser.isArtist = req.isArtist;
    newUser.isManager = req.isManager;
    model.user.addNewUser(newUser, function(err, user){
        if(err==null)
            generateAuthTokenSession(user.ops[0], res);
        else
            return res.json(utilities.generateInvalidResponse(error_messages.content.RESPONSE_ERROR_UNKNOWN));
    });
}

function getUserInfoByUserIDs(req, res){
    if(!req.params.hasOwnProperty("userIDs"))
        return res.json(utilities.generateInvalidResponse(error_messages.content.RESPONSE_ERROR_WRONG_PARAMETERS));
    else {
        var userIDs = utilities.generateObjectIDArray(req.params.userIDs.split(','));
        model.user.getUsersInfo(userIDs, function(err, docs){
            if(err==null && docs)
                return res.json(utilities.generateValidResponse(utilities.filterData(docs, sensitiveInfo)));
            else
                return res.json(utilities.generateInvalidResponse(error_messages.content.RESPONSE_ERROR_NO_USERS_FOUND));
        })
    }
}