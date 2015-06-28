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
exports.favoriteEvent = favoriteEvent;

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

function favoriteEvent(req, res){
    var requiredProperties = ["eventID"];
    var requestValid = utilities.checkValidRequestProperties(requiredProperties, req, false);
    if(requestValid){
        var eventID = req.params.eventID;
        model.event.getEventByID(eventID, function(err, event){
            if(err==null){
                if(!event.hasOwnProperty('Favorited_by'))
                    event.Favorited_by = [];
                if(event.Favorited_by.indexOf(req.User_id.toString())===-1){
                    event.Favorited_by.push(req.User_id.toString());
                    updateEventDocument(event, res);
                } else {
                    var pos = event.Favorited_by.indexOf(req.User_id.toString());
                    event.Favorited_by.splice(pos, 1);
                    updateEventDocument(event, res);
                }
            } else {
                return res.json(utilities.generateInvalidResponse(error_messages.content.RESPONSE_ERROR_EVENTS_NOT_FOUND));
            }
        });
    } else {
        return res.json(utilities.generateInvalidResponse(error_messages.content.RESPONSE_ERROR_WRONG_PARAMETERS));
    }
}

function updateEventDocument(eventDoc, res){
    model.event.updateEvent(eventDoc, function(err, event){
        if(err == null){
            return res.json(utilities.generateValidResponse());
        } else {
            return res.json(utilities.generateInvalidResponse(error_messages.content.RESPONSE_ERROR_UNKNOWN));
        }
    });
}