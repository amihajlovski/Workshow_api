/**
 * Created by aleks_000 on 30.07.2015.
 */

var db_manager = require("../../models/db_manager.js");
var moment = require("moment");
var ObjectID = require("mongodb").ObjectId;

exports.saveMessage = saveMessage;
exports.getMessages = getMessages;
exports.getMessageByID = getMessageByID;

function saveMessage(message, postback){
    db_manager.messages.insert(createMessageDocument(message), function(err, msg){
        if(err==null)
            postback(null, msg);
        else
            postback(err, null);
    });
}

function createMessageDocument(params){
    return {
        "Artist_id": params.hasOwnProperty('Artist_id') ? params.Artist_id : null,
        "Artist_name": params.hasOwnProperty('Artist_name') ? params.Artist_name : null,
        "From": "Workshow",
        "Type": params.Type,
        "Receiver_id": params.Receiver_id,
        "Text": params.Text,
        "Subject": params.Subject,
        "Event_id": params.hasOwnProperty('Event_id') ? params.Event_id : null,
        "Event_name": params.hasOwnProperty('Event_name') ? params.Event_name : null,
        "Read": false,
        "Sent_at": moment().valueOf()
    }
}

function getMessages(params, postback){
    var data = new Object();
    var query = new Object();
    query.Receiver_id = params.userID.toString();
    if(params.hasOwnProperty('filter'))
        query.Read = params.filter == 'unread' ? false : true;
    db_manager.messages.find(query).count(function(err, numberOfMessages){
        if(err==null && numberOfMessages>0){
            data.Total = numberOfMessages;
            db_manager.messages.find(query).limit(params.count).skip(params.offset).toArray(function(err, messages){
                if(err==null && messages.length>0){
                    data.Messages = messages;
                    postback(null, data);
                } else {
                    postback("No messages in database", null);
                }
            });
        } else {
            postback("No messages in database", null);
        }
    });
}

function getMessageByID(id, receiverID, postback){
    var query = new Object();
    query._id = new ObjectID(id);
    query.Receiver_id = receiverID.toString();
    db_manager.messages.findOne(query, function(err, message){
        if(err==null && message)
            postback(null, message)
        else
            postback("Message not found", null);
    });
}