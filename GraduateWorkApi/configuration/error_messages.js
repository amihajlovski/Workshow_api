var content = {}
exports.content = content;

content.RESPONSE_ERROR_UNKNOWN = { "Code" : -1, "Message" : "Unknown server error." };
content.RESPONSE_ERROR_WRONG_PARAMETERS = { "Code" : -2, "Message" : "Wrong parameters." };

//USER
content.RESPONSE_ERROR_USER_EXIST = { "Code" : -3, "Message" : "User already exist." };
content.RESPONSE_ERROR_USER_DOESNT_EXIST = { "Code" : -4, "Message" : "User doesn't exist. Wrong e-mail or password." };
content.RESPONSE_ERROR_NO_USERS_FOUND = { "Code" : -5, "Message" : "No users found satisfying search criteria." };
content.RESPONSE_ERROR_INVALID_TOKEN = { "Code" : -6, "Message" : "Invalid authentication token." };
content.RESPONSE_ERROR_MISSING_USER_ID = { "Code" : -7, "Message" : "User ID is missing." };

//MANAGER
content.RESPONSE_ERROR_USER_NOT_MANAGER = { "Code" : -50, "Message" : "This is allowed only for managers." };

//Common
content.RESPONSE_ERROR_EVENTS_NOT_FOUND = { "Code" : -100, "Message" : "No events found in database." };
content.RESPONSE_ERROR_ALREADY_FAVORITED = { "Code" : -101, "Message" : "Event is already favorited by user." };

