/**
 * Created by Mihajlovski on 26.04.2015.
 */
var validator = require("validator");
var moment = require("moment");
var guid = require("guid");
var utilities = require('../../utilities/utilities_common.js');
var db_manager = require("../../models/db_manager.js");
var ObjectID = require("mongodb").ObjectId;

exports.doesUserExist = doesUserExist;
exports.validRegisterInput = validateRegisterInput;
exports.addNewUser = addNewUser;
exports.validateLoginInput = validateLoginInput;
exports.createTokenData = createTokenData;
exports.generateTokenData = generateTokenData;
exports.validateLogin  = validateLogin;
exports.getUsersInfo = getUsersInfo;
exports.getUserByAuthToken = getUserByAuthToken;
exports.updateUserToken = updateUserToken;
exports.getNewestManagers = getNewestManagers;
exports.updateUser = updateUser;

var sensitiveData = ["_id", "Password", "Type", "Tokens"];

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

function addNewUser(userInfo, postback){
    var isArtist = userInfo.isArtist;
    var isManager = userInfo.isManager;
    db_manager.users.insert(createUserDocument(userInfo, isArtist, isManager), function(err, user){
        if(err==null)
            postback(null, user);
        else
            postback(err, null);
    });
}

function createUserDocument(user, isArtist, isManager){
    return {
        "Type": "user",
        "Manager": isManager,
        "Artist": isArtist,
        "Name": user.Name || user.first_name || user.given_name,
        "Surname": user.Surname || user.last_name || user.family_name,
        "Email": user.Email || user.email,
        "Password": user.Password || null,
        "Date_created": moment().valueOf()
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

function validateLogin(user, type){
    if(user.hasOwnProperty(type))
        return user[type] != "" && !validator.isNull(user[type]);
    return false;
}

function getUsersInfo(ids, postback){
    db_manager.users.find({'_id': {$in: ids}}).toArray(function(err, users){
        if(err==null && users.length > 0)
            postback(null, users);
        else
            postback(err, null);
    });
}

function getUserByAuthToken(token, postback){
    db_manager.users.find({
        "Tokens": {
            $elemMatch : {
                "Info": token,
                "Expiration": { $gt: moment().valueOf()}
            }
        }
    }).toArray(function(err, user){
        if(err == null && user.length > 0){
            user[0].Token = token;
            postback(null, user[0]);
        } else
            postback(true, null);
    })
}

function updateUserToken(user, token, postback){
    db_manager.users.update({
        _id: user._id,
        Tokens: {
            $elemMatch: {Info: { $eq:token}}
        }
    }, {$set: { "Tokens.$.Expiration": moment().add(1, "hour").valueOf() }
    }, function(err, doc){
        postback(false, true);
    });
}

function getNewestManagers(count, postback){
    db_manager.users.find({'Manager': true}).limit(count).sort({'Date_created': -1}).toArray(function(err, users){
        if(err==null && users.length > 0)
            postback(null, users);
        else
            postback(err, null);
    });
};

function updateUser(userDoc, postback){
    if(!userDoc.hasOwnProperty('_id'))
        return postback("Missing document ID.", null);
    var id = userDoc._id;
    delete userDoc._id;
    db_manager.users.update({'_id': new ObjectID(id)}, {
        $set: userDoc
    }, function(err, user){
        if(err==null)
            postback(null, user);
        else
            postback(err, null);
    });
}