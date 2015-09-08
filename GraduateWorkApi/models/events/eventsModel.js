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

exports.aplicantExistOnEvent = aplicantExistOnEvent;

function getAllEvents(count, offset, filter, req, postback){
    generateGetAllEventsQuery(filter, req, function(query, sort){
        db_manager.events.find(query).count(function(err, numberOfEvents){
            if(err == null && numberOfEvents > 0){
                var data = {};
                data.Total = numberOfEvents;
                db_manager.events.find(query).limit(count).skip(offset).sort(sort).toArray(function(err, events){
                    if(err==null && events.length > 0) {
                        addFavoritedProperty(events, req, function(events){
                            var managersIDs = utilities.generateArrayOfProps(events, 'Manager');
                            model.user.getUsersInfo(managersIDs, function(err, users){
                                data.Events =
                                    mergeUsersInfo(utilities.clearPropertiesForMultipleObjects(events, ["Favorited_by"]), users);
                                postback(null, data);
                            });

                        });
                    } else
                        postback(err, null);
                });
            } else {
                postback("No events in database", null);
            }
        });
    });
}

function mergeUsersInfo(events, users){
    for(var i = 0, event; event = events[i]; i++){
        for(var j = 0, user; user = users[j]; j++){
            if(event.Manager.toString === user._id.toString) {
                event.Manager_info = user;
                break;
            }
        }
    }
    return events;
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
    var sort = {Date: 1};
    if(filter==0){
        //get all events that happen in future
        query.Date = {$gt: moment().valueOf()};
        return postback(query, sort);
    } else
    if(filter==1) {
        //get events by user if token exist or userid provided
        query.Manager = "";
        if(req.query.hasOwnProperty('userid') && req.query.userid != ""){
            query.Manager = new ObjectID(req.query.userid);
            return postback(query, sort);
        } else
        if(req.headers.hasOwnProperty('authtoken') && req.headers.authtoken != "") {
            model.user.getUserByAuthToken(req.headers.authtoken, function (err, user) {
                if (err == null)
                    query.Manager = user._id;
                return postback(query, sort);
            });
        } else
            return postback(query, sort);
    } else
    if(filter==2){
        //get popular events
        sort = {View_count: -1};
        return postback(query, sort);
    } else
    if(filter==3){
        //get events by keyword
        var keyword = req.query.keyword;
        //query.Date = {$gt: moment().valueOf()};
        query.Keywords = keyword.toLowerCase();
        return postback(query, sort);
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
        Keywords: obj.Keywords,
        Artist_type: obj.Artist_type
    }
}

function getEventByID(id, postback){
    db_manager.events.find({'_id': new ObjectID(id)}).toArray(function(err, event){
        if(err==null && event.length > 0) {
            db_manager.users.find({'_id': new ObjectID(event[0].Manager)}).toArray(function(err, manager){
                if(err==null && manager.length > 0){
                    event[0].Manager_info = manager[0];
                }
                postback(null, event[0]);
            });
        } else
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

function aplicantExistOnEvent(aplicants, artistID, postback){
    for(var i = 0, aplicant; aplicant = aplicants[i]; i++){
        if(aplicant.ArtistID === artistID)
            return postback(true)
    }
    return postback(false);
}