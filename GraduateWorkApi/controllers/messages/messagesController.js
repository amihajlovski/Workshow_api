/**
 * Created by aleks_000 on 30.07.2015.
 */

var utilities = require("../../utilities/utilities_common.js");
var error_messages = require("../../configuration/error_messages.js");
var model = require("../../models/models.js");

exports.postMessage = postMessage;
exports.getMessages = getMessages;
exports.getMessageByID = getMessageByID;

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