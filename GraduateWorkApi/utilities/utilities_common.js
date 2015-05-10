
var ObjectID = require("mongodb").ObjectId;

exports.generateValidResponse = generateValidResponse;
exports.generateInvalidResponse = generateInvalidResponse;
exports.generateObjectIDArray = generateObjectIDArray;
exports.filterData = filterData;

function generateValidResponse(data){
    return {
         "Status":{ "Is_valid" : "true" , "Error" : { "Code" : "", "Message" : "" }},
         "Data": data
    };
}

function generateInvalidResponse(err_obj){
    return {
        "Status":{ "Is_valid" : "false" , "Error" : err_obj},
        "Data": null
    };
}

function generateObjectIDArray(ids){
    var newObjectIDArray = [];
    for(var i = 0, id; id = ids[i]; i++){
        newObjectIDArray.push(ObjectID(id));
    }
    return newObjectIDArray;
}

function filterData(docs, filters){
    for(var i = 0, item; item = docs[i]; i++){
        for(var j = 0, filter; filter = filters[j]; j++){
            if(item.hasOwnProperty(filter))
                delete item[filter];
        }
    }
    return docs;
}