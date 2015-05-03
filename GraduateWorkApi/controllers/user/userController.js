/**
 * Created by Mihajlovski on 26.04.2015.
 */
var validator = require("validator");
var utilities = require("../../utilities/utilities_common.js");
var error_messages = require("../../configuration/error_messages.js");
var configuration = require("../../configuration/configuration");
var model = require("../../models/models.js");

//Manager
exports.managerLogin = managerLogin;
exports.managerRegister = managerRegister;

//Artist
exports.artistLogin = artistLogin;
exports.artistRegister = artistRegister;

function managerLogin(){

}

function managerRegister(){
    req.isArtist = false;
    req.isManager = true;
    userRegister(req, res);
}

function artistLogin(req, res){
    req.isArtist = true;
    req.isManager = false;
    userLogin(req, res);
}

function artistRegister(req, res){
    req.isArtist = true;
    req.isManager = false;
    userRegister(req, res);
}

function userRegister(req, res){
    if(model.user.validRegisterInput(req.body)){
        model.user.doesUserExist(req.body.Email, function(userExist){
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

function userLogin(req, res){

}