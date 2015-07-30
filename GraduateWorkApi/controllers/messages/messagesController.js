/**
 * Created by aleks_000 on 30.07.2015.
 */

var utilities = require("../../utilities/utilities_common.js");
var error_messages = require("../../configuration/error_messages.js");
var model = require("../../models/models.js");

exports.postMessage = postMessage;

function postMessage(req, res){
    var importantProperties = ['Receiver_id', 'Sender_id', 'Text', 'Subject', 'Type'];
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