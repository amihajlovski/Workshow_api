/**
 * Created by Mihajlovski on 20.06.2015.
 */

var utilities = require("../../utilities/utilities_common.js");
var error_messages = require("../../configuration/error_messages.js");
var model = require("../../models/models.js");
var configuration = require("../../configuration/configuration.js");
var validator = require("validator");

exports.postEvent = postEvent;
exports.getManagerEvents = getManagerEvents;
exports.getAllEvents = getAllEvents;

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

function getAllEvents(req, res){
    var count = req.query.hasOwnProperty('count') && validator.isNumeric(req.query.count) ? parseInt(req.query.count) : 6;
    var offset = req.query.hasOwnProperty('offset') && validator.isNumeric(req.query.offset) ? parseInt(req.query.offset) : 0;
    //0-all, 1-by manager, 2-popular, 3-keywords
    var filter = req.query.hasOwnProperty('filter') && validator.isNumeric(req.query.filter) ? parseInt(req.query.filter)  : 0;
    model.event.getAllEvents(count, offset, filter, req, function(err, data){
        if(err == null && data != null){
            return res.json(utilities.generateValidResponse(data));
        } else {
            return res.json(utilities.generateInvalidResponse(error_messages.content.RESPONSE_ERROR_EVENTS_NOT_FOUND));
        }
    });
}