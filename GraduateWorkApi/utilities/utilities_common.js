
var ObjectID = require("mongodb").ObjectId;
var fs = require('fs');
var path = require('path');
var http = require('http');
var https = require('https');

exports.generateValidResponse = generateValidResponse;
exports.generateInvalidResponse = generateInvalidResponse;
exports.generateObjectIDArray = generateObjectIDArray;
exports.filterData = filterData;
exports.makeRequest = makeRequest;

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

function makeRequest(url, fileName){
    mkDirRecursive(path.normalize((path.dirname(fileName))));
    var req = (url.indexOf('https')>-1)?https:http;
    req.get(url, function(res) {
        if (res.statusCode === 302) {
            makeRequest(res.headers.location, fileName);
        } else {
            var imagedata = '';
            res.setEncoding('binary');

            res.on('data', function(chunk) {
                imagedata += chunk;
            });

            res.on('end', function() {
                fs.writeFile(fileName, imagedata, 'binary', function(err) {
                    if (err)
                        throw err
                });
            });
        }
    });
}

function mkDirRecursive(dirpath) {
    dirpath = path.normalize(dirpath);
    var parts = dirpath.split(path.sep);
    for (var i = 1; i <= parts.length; i++) {
        if (!fs.existsSync(path.join.apply(null, parts.slice(0, i))))
            try {
                fs.mkdirSync(path.join.apply(null, parts.slice(0, i)));
            }
            catch (e) {
                //dir wasn't made, something went wrong
                if (!fs.statSync(root).isDirectory())
                    throw new Error(e);
            }
    }
}