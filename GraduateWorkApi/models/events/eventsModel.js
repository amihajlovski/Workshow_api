/**
 * Created by Mihajlovski on 20.06.2015.
 */

var validator = require("validator");
var moment = require("moment");
var utilities = require('../../utilities/utilities_common.js');
var db_manager = require("../../models/db_manager.js");
var ObjectID = require("mongodb").ObjectId;

exports.saveEvent = saveEvent;
exports.getUserEvents = getUserEvents;

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

