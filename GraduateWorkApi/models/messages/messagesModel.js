/**
 * Created by aleks_000 on 30.07.2015.
 */

var db_manager = require("../../models/db_manager.js");

exports.saveMessage = saveMessage;

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
        "Type": params.Type,
        "Receiver_id": params.Receiver_id,
        "Sender_id": params.Sender_id,
        "Text": params.Text,
        "Subject": params.Subject,
        "Event_id": params.hasOwnProperty('Event_id') ? params.Event_id : null,
        "Event_name": params.hasOwnProperty('Event_name') ? params.Event_name : null,
        "Read": false
    }
}