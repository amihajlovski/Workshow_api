/**
 * Created by Mihajlovski on 26.04.2015.
 */
var utilities = require("../../utilities/utilities_common.js");
var error_messages = require("../../configuration/error_messages.js");
var model = require("../../models/models.js");

//Manager
exports.managerRegister = managerRegister;

//Artist
exports.artistRegister = artistRegister;

//Common
exports.userLogin = userLogin;

function userLogin(req, res){
    processLogin(req, res);
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
                model.user.addNewUser(req, function(err, user){
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

function processLogin(req, res){
    if(model.user.validateLoginInput(req.body)){
        model.user.doesUserExist(req.body.Email, req.body.Password, function(userExist, userDoc){
            if(!userExist)
                return res.json(utilities.generateInvalidResponse(error_messages.content.RESPONSE_ERROR_USER_DOESNT_EXIST));
            else {
                model.user.generateTokenData(userDoc, function(err, token){
                    if(err == false && token != null)
                        return res.json(utilities.generateValidResponse(token));
                    else
                        return res.json(utilities.generateInvalidResponse(error_messages.content.RESPONSE_ERROR_UNKNOWN));
                });
            }
        });
    } else {
        return res.json(utilities.generateInvalidResponse(error_messages.content.RESPONSE_ERROR_WRONG_PARAMETERS));
    }
}