/**
 * Created by Mihajlovski on 20.06.2015.
 */

var validator = require("validator");
var moment = require("moment");
var utilities = require('../../utilities/utilities_common.js');
var db_manager = require("../../models/db_manager.js");
var model = require('../models.js');
var ObjectID = require("mongodb").ObjectId;

exports.saveEvent = saveEvent;
exports.updateEvent = updateEvent;

exports.getUserEvents = getUserEvents;
exports.getAllEvents = getAllEvents;
exports.getEventByID = getEventByID;

function getAllEvents(count, offset, filter, req, postback){
    generateGetAllEventsQuery(filter, req, function(query){
        db_manager.events.find(query).count(function(err, numberOfEvents){
            if(err == null && numberOfEvents > 0){
                var data = {};
                data.Total = numberOfEvents;
                db_manager.events.find(query).limit(count).skip(offset).sort({'Date': 1}).toArray(function(err, events){
                    if(err==null && events.length > 0) {
                        addFavoritedProperty(events, req, function(events){
                            data.Events = utilities.clearPropertiesForMultipleObjects(events, ["Favorited_by"]);
                            postback(null, data);
                        })
                    } else
                        postback(err, null);
                });
            } else {
                postback("No events in database", null);
            }
        });
    });
}

function addFavoritedProperty(events, req, postback){
    if(req.headers.hasOwnProperty('authtoken') && req.headers.authtoken !== ''){
        model.user.getUserByAuthToken(req.headers.authtoken, function(err, user){
            if(err==null){
                for(var i = 0, event; event = events[i]; i++)
                    event.Favorited = event.hasOwnProperty('Favorited_by') && event.Favorited_by.indexOf(user._id.toString())!=-1 ? true : false;
                return postback(events);
            }
        });
    } else {
        for(var i = 0, event; event = events[i]; i++)
            event.Favorited = false;
        return postback(events);
    }
}

function generateGetAllEventsQuery(filter, req, postback){
    var query = {};
    if(filter==0){
        query.Date = {$gt: moment().valueOf()};
        return postback(query);
    } else
    if(filter==1) {
        query.Manager = "";
        model.user.getUserByAuthToken(req.headers.authtoken, function(err, user){
            if(err==null)
                query.Manager = user._id;
            return postback(query);
        });
    } else
    if(filter==2){
        //get popular events
    } else
    if(filter==3){
        var keyword = req.query.keyword;
        query.Date = {$gt: moment().valueOf()};
        query.Keywords = keyword;
        return postback(query);
    }
}

function getUserEvents(id, postback){
    db_manager.events.find({'Manager': new ObjectID(id)}).toArray(function(err, events){
        if(err==null && events.length > 0)
            postback(null, events);
        else
            postback(err, null);
    });
}

function saveEvent(reqObject, postback){
    var doc = generateEventDocument(reqObject);
    db_manager.events.insert(doc, function(err, event){
        if(err==null) {
            postback(null, {eventID: event["ops"][0]["_id"]});
        } else
            postback(err, null);
    });
}

function generateEventDocument(obj){
    return {
        Type: "event",
        State: "active",
        Title: obj.Title,
        Date: obj.Date,
        Image: obj.Image,
        Description: obj.Description,
        Salary: obj.Salary,
        Location: obj.Location.toLowerCase(),
        Manager: obj.Manager,
        Keywords: obj.Keywords
    }
}

function getEventByID(id, postback){
    db_manager.events.find({'_id': new ObjectID(id)}).toArray(function(err, event){
        if(err==null && event.length > 0)
            postback(null, event[0]);
        else
            postback(err, null);
    });
}

function updateEvent(eventDoc, postback){
    db_manager.events.update({
        '_id': new ObjectID(eventDoc._id)
    }, {
        $set: eventDoc
    }, function(err, event){
        if(err==null)
            postback(null, event);
        else
            postback(err, null);
    });
}