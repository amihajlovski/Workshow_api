/**
 * Created by Mihajlovski on 20.06.2015.
 */

var utilities = require("../../utilities/utilities_common.js");
var error_messages = require("../../configuration/error_messages.js");
var model = require("../../models/models.js");
var configuration = require("../../configuration/configuration.js");

exports.postEvent = postEvent;
exports.getManagerEvents = getManagerEvents;

function postEvent(req, res){
    var requiredProperties = ['Title', 'Salary', 'Date', 'Location', 'Description', 'Image', 'Keywords'];
    var requestValid = utilities.checkValidRequestProperties(requiredProperties, req, true);
    if(requestValid){
        var eventDoc = req.body;
        eventDoc.Manager = req.User_id;
        model.event.saveEvent(eventDoc, function(err, event){
            if(err == null){
                return res.json(utilities.generateValidResponse(event));
            } else {
                return res.json(utilities.generateInvalidResponse(error_messages.content.RESPONSE_ERROR_UNKNOWN));
            }
        });
    } else {
        return res.json(utilities.generateInvalidResponse(error_messages.content.RESPONSE_ERROR_WRONG_PARAMETERS));
    }
}

function getManagerEvents(req, res){
    var requiredProperties = ['managerID'];
    var requestValid = utilities.checkValidRequestProperties(requiredProperties, req, false);
    if(requestValid){
        var managerID = req.params.managerID;
        console.log(managerID);
        model.event.getUserEvents(managerID, function(err, events){
            console.log(err, events);
        });
    } else {
        return res.json(utilities.generateInvalidResponse(error_messages.content.RESPONSE_ERROR_WRONG_PARAMETERS));
    }
}