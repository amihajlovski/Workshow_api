/*
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */
var fs = require('fs');
var path = require('path');
var utilities = require('../utilities/utilities_common.js');
var authenticate = require('../controllers/authtentication.js');

var Files = {};
var usersFolder = __dirname + '/../public/data/users/';
var usersFolderRelative = '/./public/data/users/';
var avatarFolder = '/avatar/';
var eventsFolder = '/events/';
var eventImages = '/images/';

var tempFolder = __dirname + '/../public/temp/';
var relativeTempFolder = '/public/temp/';
var imageFolder = __dirname + '/../public/image/';
var relativeImageFolder = '/public/image/';

var allowedVideoTypes = ['.mp4', '.flv', '.mov'];
var allowedImageTypes = ['.jpg', '.jpeg', '.png'];
var allowedDocumentTypes = ['.pdf'];

exports.setupFileUpload = function (io) {

    //set up authentication
    io.use(function (socket, next) {
        authenticate.authenticateSocket(socket, function () {
            return next();
        });
    });
    setupDirectories();
    io.sockets.on('connection', onConnection);
};

function setupDirectories() {
    utilities.mkDirRecursive(relativeTempFolder);
}

function onConnection(socket) {
    socket.on('UploadTemp', function (data) {
        onSocketUpload(data, socket);
    });
    socket.on('MoveTemp', function (data) {
        onSocketMoveTemp(data, socket);
    });
    //socket.on('DeleteTemp', function (data) {
    //    onSocketDeleteTemp(data, socket);
    //});
}

function openTempFolderLocation(imageName, postback) {
    fs.open(tempFolder + imageName, 'a', 0755, function (err, fd) {
        if (err) {
            return postback(err, null);
        } else {
            return postback(null, fd);
        }
    });
}

function onSocketUpload(data, socket) {
    var Name = data['Name'];
    var imageName = socket.userID + Name;
    openTempFolderLocation(imageName, function (err, fd) {
        if (err == null) {
            Files[socket.userID + Name] = {
                Handler: fd,
                FileSize: data['Size'],
                Data: "",
                Downloaded: 0,
                type: data['type'],
                keepInTemp: (data.keepInTemp) ? data.keepInTemp : false,
                conversionState: 'none'
            };
            Files[socket.userID + Name] = setDataPathAndName(Files[socket.userID + Name], data, socket);
            Files[socket.userID + Name]['Downloaded'] += data['Data'].length;
            Files[socket.userID + Name]['Data'] += data['Data'];
            fs.write(Files[socket.userID + Name]['Handler'], Files[socket.userID + Name]['Data'], null, 'Binary', function (err, Writen) {
                if(err==null){
                    console.log('File ' + socket.userID + Name + ' written to "temp" dir.');
                    socket.emit('Done', {Image: relativeTempFolder + socket.userID + Name, Name: Name});
                } else {
                    socket.emit('Error', {Message: 'Error writing file.'});
                }
            });
        } else {
            socket.emit('Error', {Message: 'Error opening directory.'});
        }
    });
}

function onSocketMoveTemp(data, socket) {
    var Name = data['Name'];
    console.log('moving file ', Name, ' from temp to proper location');
    if (Files[socket.userID + Name] && utilities.safeCheckIfFileExists(tempFolder + socket.userID + Name)) {
        Files[socket.userID + Name].keepInTemp = false;
        if(data.eventID){
            Files[socket.userID + Name].serverPath = Files[socket.userID + Name].serverPath.replace('/undefined/', '/' + data.eventID + '/');
            Files[socket.userID + Name].serverRelativePath = Files[socket.userID + Name].serverRelativePath.replace('/undefined/', '/' + data.eventID + '/');
            Files[socket.userID + Name].eventID = data.eventID;
        }
        utilities.mkDirRecursive(Files[socket.userID + Name].serverRelativePath);
        var err = function (err) {
        };
        var writen = function () {
        };
        uploadToProperFolder(err, writen, Name, socket);
        //fileUploadComplete(err, writen, Name, socket, data);
    } else {
        console.log('There no such file in temporary buffer.');
        socket.emit('Error', {Message: 'There no such file in temporary buffer.'});
    }
}

function onSocketDeleteTemp(data, socket) {
    var Name = "";
    if (data['Name']) {
        Name = data['Name'].replace(socket.userID, '');
    }
    if (Files[socket.userID + Name] && utilities.safeCheckIfFileExists(tempVideoFolder + socket.userID + Name)) {
        try {
            fs.unlinkSync(path.normalize(tempVideoFolder + socket.userID + Name));
            socket.emit('Done', {Code: 5, Message: 'Temporary file has been deleted'});
        } catch (exception) {
            socket.emit('Error', {Code: 6, Message: 'File deletion failed.'});
        }
    } else {
        socket.emit('Error', {Message: 'There no such file in temporary buffer.'});
    }
}

function fileUploadComplete(err, Writen, Name, socket) {
    if (Files[socket.userID + Name].keepInTemp == false) {
        uploadToProperFolder(err, Writen, Name, socket);
    } else {
        uploadToTempFolder(Name, socket);
    }
}

function generateThumbnail(input, postback) {
    console.log('Generating thumbnail for', input);
    var proc = new ffmpeg({source: input}).output(input + '.jpg').noAudio().seek('0:5').on('error', function (err) {
        console.log('Thumbnail generation error:', err);
    }).run();
}

function convertVideo(inputFileName, outputFileName, Name, socket) {
    console.info('Converting video ', Name);
    Files[socket.userID + Name].isConverting = true;
    updatePerformanceInfo(socket, Files[socket.userID + Name]);
    var conversion = new ffmpeg({source: inputFileName})
        .videoCodec('libx264')
        .audioCodec('libmp3lame')
        .on('error', function (err) {
            console.log('An error occurred: ' + err.message);
        })
        .on('end', function () {
            if (Files[socket.userID + Name].conversionState !== 'done') {
                console.log('Video conversion finished !');
                Files[socket.userID + Name].conversionState = 'done';
                Files[socket.userID + Name].isConverting = false;
                if (Files[socket.userID + Name].keepInTemp === false) {
                    Files[socket.userID + Name].originalName = path.normalize(Files[socket.userID + Name].serverFileName);
                    Files[socket.userID + Name].serverFileName = path.normalize(Files[socket.userID + Name].serverFileName.replace(path.extname(Name), '.mp4'));
                    fileUploadComplete(null, null, Name, socket);
                } else {
                    Files[socket.userID + Name].serverFileName = path.normalize(Files[socket.userID + Name].serverFileName.replace(path.extname(Name), '.mp4'));
                }
            }
        })
        .save(outputFileName, function (output, error) {
            console.log(output, error);
        });
}

var uploadToProperFolder = function (err, Writen, Name, socket) {
    var inputFile = path.normalize(tempFolder + socket.userID + Name);
    fs.rename(inputFile, path.normalize(Files[socket.userID + Name].serverPath + Files[socket.userID + Name].serverFileName), function (err) {
        utilities.removeFileIfExists(path.normalize(tempFolder) + socket.userID + Name);
        console.log('file moved to proper folder')
        socket.emit('Done', {Image: Files[socket.userID + Name].serverRelativePath.substring(2) + Name});
        //updateUserInfo(socket, Files[socket.userID + Name]);
    });
};

var uploadToTempFolder = function (Name, socket) {
    if (Files[socket.userID + Name].type == 'performanceVideo') {
        socket.emit('Done', {
            Image: (relativeTempFolder + socket.userID) + Name + '.jpg',
            tempName: socket.userID + Name
        });
    } else {
        socket.emit('Done', {'Image': (relativeTempFolder + socket.userID) + Name, tempName: socket.userID + Name});
    }
};

function updateUserInfo(socket, data) {
    if (data.type.indexOf('performance') != -1) {
        updatePerformanceInfo(socket, data);
    } else {
        var newData = {};
        switch (data.type) {
            case 'portfolio':
                newData = {Portfolio: data.serverFileName};
                break;
            case 'avatar':
                newData = {Avatar: data.serverFileName};
                break;
        }
        model_amuser.postAmuserInfo(socket.userID, newData, function (err, doc) {
            if (err == null) {
                delete Files[socket.userID + data.Name];
            }
        });
    }
    return;
}

function updatePerformanceInfo(socket, data) {
    model_amuser_performance.getAmuserPerformance(socket.userID, data.performanceID, function (err, doc) {
        var newData = {};
        switch (data.type) {
            case 'performanceVideo':
                newData = updatePerformanceArrayByProperty(doc, data, 'Videos');
                break;
            case 'performanceImage':
                newData = updatePerformanceArrayByProperty(doc, data, 'Images');
                break;
            case 'performanceCoverImage':
                newData = {Cover_image: data.serverFileName};
                break;
        }
        if (newData) {
            model_amuser_performance.updateAmuserPerformance(socket.userID, data.performanceID, newData, function (err, doc) {
            });
        }
    });
    return;
}

function updatePerformanceArrayByProperty(doc, data, property) {
    var newData = {};
    var exists = false;
    var pos = -1;
    doc = doc[0].value;
    if (!doc[property]) {
        doc[property] = [];
    } else {
        pos = objectPositionInArray(doc[property], 'Name', data.serverFileName);
        if (pos === -1 && data.originalName) {
            pos = objectPositionInArray(doc[property], 'Name', data.originalName);
        }
        if (pos > -1) {
            exists = true;
        }
    }
    if (!exists) {
        newData[property] = doc[property];
        if (data.type.indexOf('Video') > -1)
            newData[property].push({
                Name: data.serverFileName,
                isConverting: (data.isConverting) ? data.isConverting : false
            });
        else
            newData[property].push({Name: data.serverFileName});
    } else {
        if (data.type.indexOf('Video') > -1 && (data.originalName)) {
            newData[property] = doc[property];
            newData[property].splice(pos, 1);
            newData[property].push({Name: data.serverFileName, isConverting: data.isConverting});
        } else {
            newData = null;
        }
    }
    return newData;
}

function objectPositionInArray(dataArray, key, value) {
    for (var i = 0, item; item = dataArray[i]; i++) {
        if (item[key] === value) {
            return i;
        }
    }
    return -1;
}

function setDataPathAndName(file, data, socket) {
    switch (data.type) {
        case 'eventCover':
            file.serverPath = usersFolder + socket.userID + eventsFolder + data.performanceID + eventImages;
            file.serverRelativePath = usersFolderRelative + socket.userID + eventsFolder + data.performanceID + eventImages;
            file.serverFileName = data['Name'];
            break;
        case 'avatar':
            file.serverPath = usersFolder + socket.userID + avatarFolder;
            file.serverRelativePath = usersFolderRelative + socket.userID + avatarFolder;
            file.serverFileName = 'avatar.jpg';
    }
    return file;
}

function isTypeAllowed(data) {
    var ext = path.extname(data['Name']).toLowerCase();
    switch (data.type) {
        case 'portfolio':
            if (allowedDocumentTypes.indexOf(ext) === -1)
                return false;
            break;
        case 'avatar':
            if (allowedImageTypes.indexOf(ext) === -1)
                return false;
            break;
        case  'performanceImage':
            if (allowedImageTypes.indexOf(ext) === -1)
                return false;
            break;
        case  'performanceCoverImage':
            if (allowedImageTypes.indexOf(ext) === -1)
                return false;
            break;
        case 'performanceVideo':
            if (allowedVideoTypes.indexOf(ext) === -1)
                return false;
            break;
    }
    return true;
}