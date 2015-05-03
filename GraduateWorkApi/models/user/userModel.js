/**
 * Created by Mihajlovski on 26.04.2015.
 */
var validator = require("validator");
var db_manager = require("../../models/db_manager.js");

exports.doesUserExist = doesUserExist;
exports.validRegisterInput = validateRegisterInput;
exports.addNewUser = addNewUser;

function doesUserExist(email, postback){
    db_manager.users.findOne({ Email: email}, function(err, doc){
        if(doc == null)
            postback(false);
        else
            postback(true);
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
