import { default as configuration } from '/Users/stefanos/Projects/rxextensions/rxjs-master/dist/cjs/internal/time-mgmt/config';
import { Subject } from '/Users/stefanos/Projects/rxextensions/rxjs-master/dist/cjs/internal/Subject'
import { map } from '/Users/stefanos/Projects/rxextensions/rxjs-master/dist/cjs/internal/operators/map'
var moment = require('moment'); 
const chalk = require('chalk');
let request = require('request');
const fs = require('fs');

// ==== Scheduling ====

//accidental
function getElementByID(q, id){
    for (var i = 0; i < q.length; i++){
        if (q[i].id == id){
            return q[i];
        }
    }
}

// accidental
function filterQueue(q, on){
    var result = []
    for (var i = 0; i < q.length; i++){
        if (q[i].id != on){
            result.push(q[i]);
        }
    }
    return result;
}

//accidental
function filterQueues(id){
    nextQueue = filterQueue(nextQueue, id);
    timeoutQueue = filterQueue(timeoutQueue, id);
    violationQueue = filterQueue(violationQueue, id);
}

// accidental
function clearQueues(){
    nextQueue = [];
    timeoutQueue = [];
    violationQueue = [];
}

// essential
function addToNextQueue(m){
    filterQueues(m.id)
    nextQueue.push(m);
    updateDisplay();
}

// essential
function addToTimeoutQueue(m){
    filterQueues(m.id)
    timeoutQueue.push(m);
    updateDisplay();
}

// essential
function addToViolationQueue(m){
    filterQueues(m.id)
    violationQueue.push(m);
    updateDisplay();
}

// ==== Display ====

//essential
function initializeDisplay(){
    console.log('|          Date            | Machine Temperature' + ' | ' 
        + 'Lower Body | Middle Body | Upper Body |');
}

//essential
function readyToUpdate(){
    if (parseFloat(nextQueue.length) + parseFloat(timeoutQueue.length) 
        + parseFloat(violationQueue.length) == nbInputs){
            return true;
    }
    else{
        return false;
    }
}

//essential
function getFinalColor(){
    if (parseFloat(violationQueue.length) != 0){
        return 'red';
    }
    else if (parseFloat(timeoutQueue.length) != 0){
        return 'orange';
    }
    else{
        return 'green';
    }
}

//essential
function updateDisplay(){
    if (readyToUpdate()){
        var result = 0;
        var queue = nextQueue.concat(timeoutQueue.concat(violationQueue)); 
        for (var i = 0; i < parseFloat(queue.length); i++){
            if (queue[i].value != null){
                result += queue[i].value;
            }
            else{
                result += lastValue[queue[i].id];
            }
        }
        // compute average
        result = Math.round(100*(result/nbInputs))/100;
        result = JSON.stringify(result) + '°C';
        console.log('| ' + new Date().toISOString() + ' | ' + chalk.keyword(getFinalColor())(result) 
            + ' '.repeat(19 - result.length) +  ' | ' 
            + getElementByID(queue,deviceKeyToID["3303/5702:00-17-0D-00-00-30-E7-2D|Temperature"]).toDisplay 
            + ' '.repeat(9) + ' | ' 
            + getElementByID(queue,deviceKeyToID["3303/5702:00-17-0D-00-00-30-DA-DF|Temperature"]).toDisplay 
            + ' '.repeat(10) +  ' | ' 
            + getElementByID(queue,deviceKeyToID["3303/5702:00-17-0D-00-00-30-E3-A0|Temperature"]).toDisplay 
            + ' '.repeat(9) +  ' |');
        clearQueues();
    }
}

// ==== Operator Functions ====

//essential
function storeValue(m){
    lastValue[m.id] = m.value;
    return m;
}

//essential
// converts sensor output (e.g. voltage) to temperature
function convertToTemperature(message){
  // dummy formula
  message.value = message.value*2
  return message;
}

//essential
function calibrateTemperature(message){
    // dummy formula
    message.value = message.value/2
    return message;
  }

//essential
// assigns visual representation for given message (green check mark) to be used on display
function addVisualNext(message){
    //console.log('next event: ' + JSON.stringify(message))
    message.toDisplay = chalk.keyword('green')('\u2713');
    return message;
}

//essential
// assigns visual representation for given message (orange cross mark) to be used on display
function addVisualTimeout(message){
    message.toDisplay = chalk.keyword('orange')('\u2717');
    return message;
}

//essential
// assigns visual representation for given message (red check/cross mark) to be used on display
function addVisualViolation(message){
    if (message.value == null){ 
        message.toDisplay = chalk.keyword('red')('\u2717')
    } else {
        message.toDisplay = chalk.keyword('red')('\u2713')
    }
    return message;
}

//essential
function log(m){
    fs.appendFile("logs.txt", m.text, function(err) {
        if(err) {
            return console.log(err);
        }
    });
    return m; 
}

//essential
function prettifyTimeoutEvent(m){
    m.text = '[' + 'TIMEOUT' + ']: ' + 'occurred at ' + m.timestamp + ' with completeness ' 
        + m.completeness + 'and timeout ' + m.timeOut + 's.\n';
    return m;
}

//essential
function prettifyViolationEvent(m){
    m.text = '[' + 'VIOLATION' + ']: ' + 'occurred at ' + m.timestamp + ' with completeness ' 
        + m.completeness + 'and timeout ' + m.timeOut + 's.\n';
    return m;
}

//accidental
function next(value){
    if (Object.values(deviceKeyToID).includes(JSON.stringify(value.id))){
        value = convertToTemperature(calibrateTemperature(value));
        addToNextQueue(value);
    };
}

//accidental
function timeout(value){
    if (Object.values(deviceKeyToID).includes(JSON.stringify(value.id))){
        addToTimeoutQueue(value);
    }
}

//accidental
function violation(value){
    if (Object.values(deviceKeyToID).includes(JSON.stringify(value.id))){
        addToViolationQueue(value);
    }
}

// ==== Communication

//accidental
function convertDeviceKeyToURL(deviceKey){
    var pid1 = deviceKey.split('/')[0];
    var pid2 = deviceKey.split('/')[1].split(':')[0];
    var mac = deviceKey.split(':')[1].split('|')[0];
    var measurement = deviceKey.split('|')[1];
    return pid1 + '/' + pid2 + '/' + mac + '/' + measurement;
}

//accidental
function registerConstraint(deviceKey, constraint, threshold){
    let r = request({ url: khronos_url + '/registerCompletenessConstraint/' + convertDeviceKeyToURL(deviceKey) 
    + '/' +constraint.toString() + '/' + threshold.toString(), method: 'PUT'}, function(err, res, data) {
        if (!err && res.statusCode == 200) {
            deviceKeyToID[deviceKey] = data.replace(/\n$/, '')
            data;
        } else {
          console.log('ERROR: Registering constraint ' + constraint + ' for ' + deviceKey + ' failed.');
        }
    });
   }

//accidental
function prepareConnection(client, nextSubject, timeoutSubject, violationSubject){
    client.on('connect', function(connection) {
        connection.on('error', function(error) {
            console.log("Connection Error: " + error.toString());
        });
        connection.on('close', function() {
            console.log('echo-protocol Connection Closed');
        });
        connection.on('message', function(message) {
            message = parseMessage(message);
            if (message.type == 'violation'){
                violationSubject.next(message);  
            }   
            else if (message.type == 'timeout'){
                timeoutSubject.next(message);
            }  
            else{
                nextSubject.next(message);
            }   
        });      
    });
    client.on('connectFailed', function(error) {
        console.log('Connect Error: ' + error.toString());
        nextSubject.error(error);
        timeoutSubject.error(error);
        violationSubject.error(error);
    });
}

//accidental
function parseMessage(message){
    let tmp = {};
    let data = JSON.parse(message.utf8Data);
    for (let key in data) {
      if (data.hasOwnProperty(key)) {
        let new_key = key.replace(/\\"/g, '"');
        tmp[new_key] = data[key];
      }
    }
    let result = {id: tmp['id'], value: tmp['value'], completeness: tmp['completeness'], 
        timeOut: tmp['timeOut'], timestamp: tmp['timestamp'], type: tmp['type']};
    return result;
  }

// ==== Initialization ====

//accidental
var deviceKeyToID = {}
var khronos_url = 'http://' + configuration['khronos']['address'] + ':' + configuration['khronos']['port'];
var nextQueue = [];
var timeoutQueue = [];
var violationQueue = [];
var lastValue = {};
var WebSocketClient = require('websocket').client;
var khronosAddress = configuration['khronos']['address']
var khronosPort = configuration['khronos']['port']
var protocol =  'ws'
var nbInputs = 3;
registerConstraint("3303/5702:00-17-0D-00-00-30-E7-2D|Temperature", 0.5, 0.9);
registerConstraint("3303/5702:00-17-0D-00-00-30-DA-DF|Temperature", 0.9, 0.9);
registerConstraint("3303/5702:00-17-0D-00-00-30-E3-A0|Temperature", 0.9, 0.9);
var client = new WebSocketClient();
client.connect(protocol + '://' + khronosAddress + ':' + khronosPort + '/khronos');                 
var nextSubject = new Subject();
var timeoutSubject = new Subject();
var violationSubject = new Subject();
var nextChain = nextSubject.pipe(map(x => addVisualNext(x)), map(x =>  convertToTemperature(x)), 
    map(x =>  calibrateTemperature(x)), map(x => storeValue(x)));
var timeoutChain = timeoutSubject.pipe(map(x => addVisualTimeout(x)), map(x => prettifyTimeoutEvent(x)), 
    map(x => log(x)));
var violationChain = violationSubject.pipe(map(x => addVisualViolation(x)), 
    map(x => prettifyViolationEvent(x)), map(x => log(x)));
prepareConnection(client, nextChain, timeoutChain, violationChain);;
initializeDisplay()
nextChain.subscribe(next, 
    function(err) {console.error(moment().format("dddd, MMMM Do YYYY, h:mm:ss.SSS ") 
    + 'nextSubscriber' + err)},
    function() {console.log(moment().format("dddd, MMMM Do YYYY, h:mm:ss.SSS") 
    + 'nextSubscriber Completed!')});
timeoutChain.subscribe(timeout, 
    function(err) {console.error(moment().format("dddd, MMMM Do YYYY, h:mm:ss.SSS ") 
    + 'timeoutSubscriber' + err)},
    function() {console.log(moment().format("dddd, MMMM Do YYYY, h:mm:ss.SSS") 
    + 'timeoutSubscriber Completed!')});
violationChain.subscribe(violation, 
    function(err) {console.error(moment().format("dddd, MMMM Do YYYY, h:mm:ss.SSS ") 
    + 'violationSubscriber' + err)},
    function() {console.log(moment().format("dddd, MMMM Do YYYY, h:mm:ss.SSS") 
    + 'violationSubscriber Completed!')});

