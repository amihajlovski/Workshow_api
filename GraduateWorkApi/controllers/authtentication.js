/**
 * Created by Mihajlovski on 23.05.2015.
 */
var utilities = require("../utilities/utilities_common.js");
var error_messages = require("../configuration/error_messages");
var model = require("../models/models.js");
var guid = require("guid");

exports.check = authenticate;

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