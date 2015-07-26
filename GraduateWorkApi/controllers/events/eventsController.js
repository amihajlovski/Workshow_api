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
exports.getEventDetails = getEventDetails;
exports.increaseViewCount = increaseViewCount;
exports.applyAsArtist = applyAsArtist;
exports.chooseArtist = chooseArtist;

function postEvent(req, res){
    var requiredProperties = ['Title', 'Salary', 'Date', 'Location', 'Description', 'Image', 'Keywords', "Artist_type"];
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

function getEventDetails(req, res){
    var valid = utilities.checkValidRequestProperties(['id'], req, false);
    if(!valid)
        return res.json(utilities.generateInvalidResponse(error_messages.content.RESPONSE_ERROR_WRONG_PARAMETERS));
    var id = req.params.id;
    model.event.getEventByID(id, function(err, event){
        if(err == null){
            return res.json(utilities.generateValidResponse(event));
        } else {
            return res.json(utilities.generateInvalidResponse(error_messages.content.RESPONSE_ERROR_EVENTS_NOT_FOUND));
        }
    });
}

function increaseViewCount(req, res){
    var valid = utilities.checkValidRequestProperties(['eventID'], req, false);
    if(!valid)
        return res.json(utilities.generateInvalidResponse(error_messages.content.RESPONSE_ERROR_WRONG_PARAMETERS));
    var id = req.params.eventID;
    model.event.getEventByID(id, function(err, event){
        if(err == null){
            var viewCount = !event.hasOwnProperty('View_count') ? 1 : event.View_count + 1;
            event['View_count'] = viewCount;
            if(event.hasOwnProperty('Manager_info'))
                delete event['Manager_info'];
            updateEventDocument(event, res);
        } else {
            return res.json(utilities.generateInvalidResponse(error_messages.content.RESPONSE_ERROR_EVENTS_NOT_FOUND));
        }
    });
}

function applyAsArtist(req, res){
    var importantInfo = ['artistID', 'eventID'];
    var valid = utilities.checkValidRequestProperties(importantInfo, req, false);
    if(!valid)
        return res.json(utilities.generateInvalidResponse(error_messages.content.RESPONSE_ERROR_WRONG_PARAMETERS));
    var artistID = req.params.artistID;
    var eventID = req.params.eventID;
    model.event.getEventByID(eventID, function(err, event){
        if(err == null){
            if(!event.hasOwnProperty('Aplicants'))
                event['Aplicants'] = [];
            model.event.aplicantExistOnEvent(event.Aplicants, artistID, function(exist){
                if(!exist){
                    event.Aplicants.push({ArtistID: artistID});
                    if(event.hasOwnProperty('Manager_info'))
                        delete event['Manager_info'];
                    updateEventDocument(event, res);
                } else {
                    return res.json(utilities.generateInvalidResponse(error_messages.content.RESPONSE_ERROR_ARTIST_ALREADY_EXIST));
                }
            });
        } else {
            return res.json(utilities.generateInvalidResponse(error_messages.content.RESPONSE_ERROR_EVENTS_NOT_FOUND));
        }
    });
}

function chooseArtist(req, res){
    var importantInfo = ['Artist_id', 'Event_id'];
    var valid = utilities.checkValidRequestProperties(importantInfo, req, true);
    if(!valid)
        return res.json(utilities.generateInvalidResponse(error_messages.content.RESPONSE_ERROR_WRONG_PARAMETERS));
    var artistID = req.body.Artist_id;
    var eventID = req.body.Event_id;
    model.event.getEventByID(eventID, function(err, event){
        if(err == null){
            if(!event.hasOwnProperty('Artist')) {
                event['Artist'] = {};
                event.State = "finished";
                event.Artist = {
                    ArtistID: artistID
                };
                if(event.hasOwnProperty('Manager_info'))
                    delete event['Manager_info'];
                updateEventDocument(event, res);
            } else {
                return res.json(utilities.generateInvalidResponse(error_messages.content.RESPONSE_ERROR_ARTIST_ALREADY_CHOSEN));
            }
        } else {
            return res.json(utilities.generateInvalidResponse(error_messages.content.RESPONSE_ERROR_EVENTS_NOT_FOUND));
        }
    });
}