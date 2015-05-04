/**
 * Created by Mihajlovski on 26.04.2015.
 */
var validator = require("validator");
var moment = require("moment");
var guid = require("guid");
var db_manager = require("../../models/db_manager.js");

exports.doesUserExist = doesUserExist;
exports.validRegisterInput = validateRegisterInput;
exports.addNewUser = addNewUser;
exports.validateLoginInput = validateLoginInput;
exports.createTokenData = createTokenData;
exports.generateTokenData = generateTokenData;

function doesUserExist(email, password, postback){
    var query = password==null ? { Email: email } : { Email: email, Password: password};
    db_manager.users.findOne(query, function(err, doc){
        if(doc == null)
            postback(false, null);
        else
            postback(true, doc);
    });
}

function validateRegisterInput(user){
    if(user.hasOwnProperty("Name") && user.hasOwnProperty("Surname") && user.hasOwnProperty("Email") && user.hasOwnProperty("Password"))
        return !validator.isNull(user.Name) && !validator.isNull(user.Surname) && !validator.isNull(user.Email) && validator.isEmail(user.Email) && !validator.isNull(user.Password);
    return false;
}

function addNewUser(req, postback){
    var userInfo = req.body;
    var isArtist = req.isArtist;
    var isManager = req.isManager;
    db_manager.users.insert(createUserDocument(userInfo, isArtist, isManager), function(err, user){
        if(err==null)
            postback(null, user);
        else
            postback(err, null);
    })
}

function createUserDocument(user, isArtist, isManager){
    return {
        "Type": "user",
        "Manager": isManager,
        "Artist": isArtist,
        "Name": user.Name,
        "Surname": user.Surname,
        "Email": user.Email,
        "Password": user.Password
    };
}

function validateLoginInput(user){
    if(user.hasOwnProperty("Email") && user.hasOwnProperty("Password"))
        return !validator.isNull(user.Email) && validator.isEmail(user.Email) && !validator.isNull(user.Password);
    return false;
}

function generateTokenData(user, postback){
    if(!user.hasOwnProperty("Tokens"))
        user.Tokens = [];
    var tokenObj = createTokenData();
    user.Tokens.push(tokenObj);
    db_manager.users.update({_id: user._id}, {$set: {Tokens: user.Tokens}}, function(err, token){
        if(err==null)
            postback(false, tokenObj);
        else
            postback(true, null);
    });
}

function createTokenData(){
    return {
        Expiration: moment().add(1, "hour").valueOf(),
        Info: guid.create().value
    };
}
