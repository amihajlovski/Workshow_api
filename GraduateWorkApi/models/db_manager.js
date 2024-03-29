
var MongoClient = require('mongodb').MongoClient;
var config = require("../configuration/configuration.js");

// Connect to the db
exports.connectToDatabase = connectToDatabase;

function connectToDatabase(){
    MongoClient.connect(config.content.DB.URL, function(err, db) {
        if (!err) {
            console.log("Connected to \"" + db.databaseName + "\" database.");
            createMongoDBCollections(db);
            exports.db = db;
        }
    });
}

function createMongoDBCollections(db){
    db.createCollection("users", function(err,usersCollection){
        console.log("Created collection \"users\".");
        exports.users = usersCollection;
        db.createCollection("events", function(err,eventsCollection){
            console.log("Created collection \"events\".");
            exports.events = eventsCollection;
            db.createCollection("messages", function(err,messagesCollection){
                console.log("Created collection \"messages\".");
                exports.messages = messagesCollection;
            });
        });
    });

}