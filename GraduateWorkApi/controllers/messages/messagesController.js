/**
 * Created by aleks_000 on 30.07.2015.
 */

var utilities = require("../../utilities/utilities_common.js");
var error_messages = require("../../configuration/error_messages.js");
var model = require("../../models/models.js");
var ObjectID = require("mongodb").ObjectId;

exports.postMessage = postMessage;
exports.getMessages = getMessages;
exports.getMessageByID = getMessageByID;
exports.rateArtist = rateArtist;
exports.markReadMessage = markReadMessage;

function markReadMessage(req, res){
    var importantInfo = ['Read'];
    var validRequest = utilities.checkValidRequestProperties(importantInfo, req, true);
    if(!validRequest)
        return res.json(utilities.generateInvalidResponse(error_messages.content.RESPONSE_ERROR_WRONG_PARAMETERS));
    model.messages.getMessageByID(req.params.msgID, req.User_id, function(err, msg){
        if(err==null) {
            msg.Read = req.body.Read;
            model.messages.updateMessageDocument(msg, function(err, message){
                if(err==null)
                    return res.json(utilities.generateValidResponse({}));
                else
                    return res.json(utilities.generateInvalidResponse(error_messages.content.RESPONSE_ERROR_UNKNOWN));
            });
        } else
            return res.json(utilities.generateInvalidResponse(error_messages.content.RESPONSE_ERROR_MESSAGE_NOT_FOUND))
    });
}

function rateArtist(req, res){
    var importantInfo = ['Message_id', 'Rating'];
    var validRequest = utilities.checkValidRequestProperties(importantInfo, req, true);
    if(!validRequest)
        return res.json(utilities.generateInvalidResponse(error_messages.content.RESPONSE_ERROR_WRONG_PARAMETERS));
    var artistID = new ObjectID(req.params.artistID);
    model.user.getUsersInfo([artistID], function(err, artistDoc){
        if(err == null && artistDoc.length > 0){
            var artist = artistDoc[0];
            if(!artist.hasOwnProperty('Ratings')){
                artist.Ratings = new Array();
                doRating(req, res, artist);
            } else {
                if(!isAlreadyRated(req, artist))
                    doRating(req, res, artist);
                else
                    return res.json(utilities.generateInvalidResponse(error_messages.content.RESPONSE_ERROR_ARTIST_ALREADY_RATED));
            }
        } else
            return res.json(utilities.generateInvalidResponse(error_messages.content.RESPONSE_ERROR_UNKNOWN));
    });
}

function isAlreadyRated(req, artist){
    var msgID = req.body.Message_id;
    var rated = false;
    for(var i = 0, rating; rating = artist.Ratings[i]; i++){
        if(rating.Message_id === msgID){
            rated = true;
            break;
        }
    }
    return rated;
}

function doRating(req, res, artist){
    var rating = new Object();
    rating.Message_id = req.body.Message_id;
    rating.Rating = req.body.Rating;
    rating.Manager_id = req.User_id;
    artist.Ratings.push(rating);
    model.user.updateUser(artist, function(err, user){
        if(err == null) {
            var message = new Object();
            message._id = req.body.Message_id;
            message.Rated = true;
            message.Rating = rating.Rating;
            model.messages.updateMessageDocument(message, function(err, doc){
            });
            return res.json(utilities.generateValidResponse({}));
        } else
            return res.json(utilities.generateInvalidResponse(error_messages.content.RESPONSE_ERROR_UNKNOWN))
    });
}

function getMessageByID(req, res){
    var importantInfo = ['msgID'];
    var validRequest = utilities.checkValidRequestProperties(importantInfo, req, false);
    if(!validRequest)
        return res.json(utilities.generateInvalidResponse(error_messages.content.RESPONSE_ERROR_WRONG_PARAMETERS));
    model.messages.getMessageByID(req.params.msgID, req.User_id, function(err, msg){
        if(err==null)
            return res.json(utilities.generateValidResponse(msg));
        else
            return res.json(utilities.generateInvalidResponse(error_messages.content.RESPONSE_ERROR_MESSAGE_NOT_FOUND))
    });
}

function postMessage(req, res){
    var importantProperties = ['Receiver_id', 'Text', 'Subject', 'Type'];
    if(!utilities.checkValidRequestProperties(importantProperties, req, true))
        return res.json(utilities.generateInvalidResponse(error_messages.content.RESPONSE_ERROR_WRONG_PARAMETERS));
    model.messages.saveMessage(req.body, function(err, msg){
        if(err == null) {
            return res.json(utilities.generateValidResponse({}));
        } else {
            return res.json(utilities.generateInvalidResponse(error_messages.content.RESPONSE_ERROR_UNKNOWN));
        }
    });
}

function getMessages(req, res){
    if(!req.hasOwnProperty('User_id'))
        return res.json(utilities.generateInvalidResponse(error_messages.content.RESPONSE_ERROR_WRONG_PARAMETERS));
    var count = req.body.hasOwnProperty('count') ? req.body.count : 10;
    var offset = req.body.hasOwnProperty('offset') ? req.body.offset : 0;
    var params = new Object();
    params.count = count;
    params.offset = offset;
    params.userID = req.User_id;
    if(req.body.hasOwnProperty('filter'))
        params.filter = req.body.filter;
    model.messages.getMessages(params, function(err, messages){
        if(err == null) {
            return res.json(utilities.generateValidResponse(messages));
        } else {
            return res.json(utilities.generateInvalidResponse(err));
        }
    });
}