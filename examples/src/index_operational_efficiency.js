import { default as configuration } from '/Users/stefanos/Projects/rxextensions/rxjs-master/dist/cjs/internal/time-mgmt/config';
import { Subject } from '/Users/stefanos/Projects/rxextensions/rxjs-master/dist/cjs/internal/Subject'
import { map } from '/Users/stefanos/Projects/rxextensions/rxjs-master/dist/cjs/internal/operators/map'
var moment = require('moment'); 
const chalk = require('chalk');
var influxdb = require('influx')

var influxdb_protocol = (process.env.INFLUXDB_PROTOCOL ||'http');
var influxdb_addr = (process.env.INFLUXDB_ADDRESS || 'localhost');
var influxdb_port = (process.env.INFLUXDB_PORT || 8086);
var influxdb_database = (process.env.INFLUXDB_DATABASE ||'Packaging Plant');
var influxdb_user = (process.env.INFLUXDB_USER ||'admin');
var influxdb_password = (process.env.INFLUXDB_PASSWORD ||'admin');

var influxdb_options = {
  username: influxdb_user,
  password: influxdb_password,
  host: influxdb_addr,
  port: influxdb_port,
  protocol: influxdb_protocol
};

var influx_client = new influxdb.InfluxDB(influxdb_options);

// ==== Scheduling ====

function getElementByID(q, id){
    for (var i = 0; i < q.length; i++){
        if (q[i].id == id){
            return q[i];
        }
    }
}

function filterQueue(q, on){
    var result = []
    for (var i = 0; i < q.length; i++){
        if (q[i].id != on){
            result.push(q[i]);
        }
    }
    return result;
}

function filterQueues(id){
    nextQueue = filterQueue(nextQueue, id);
    timeoutQueue = filterQueue(timeoutQueue, id);
    violationQueue = filterQueue(violationQueue, id);
}

function clearQueues(){
    nextQueue = [];
    timeoutQueue = [];
    violationQueue = [];
}

function addToNextQueue(m){
    filterQueues(m.id)
    nextQueue.push(m);
    updateDisplay();
}

function addToTimeoutQueue(m){
    filterQueues(m.id)
    timeoutQueue.push(m);
    updateDisplay();
}

function addToViolationQueue(m){
    filterQueues(m.id)
    violationQueue.push(m);
    updateDisplay();
}

// ==== Display ====

function initializeDisplay(){
    console.log('|          Date            | Overall Efficiency' + ' | ' 
        + 'Line L1 (Completeness) | Line L2 (Completeness) | Line L3 (Completeness) |');
}

function readyToUpdate(){
    if (parseFloat(nextQueue.concat(timeoutQueue.concat(violationQueue)).length) == nbInputs){
        return true;
    }
    return false;
}

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
        result = Math.round(100*(result/nbInputs))/100 + Math.floor(Math.random() * 9) - 10;
        result = JSON.stringify(Math.ceil(result)) + ' items/min';
        console.log('| ' + new Date().toISOString() + ' | ' + chalk.keyword(getFinalColor())(result) 
            + ' '.repeat(18 - result.length) +  ' | ' 
            + getElementByID(queue,parseFloat(deviceKeyToIdDisplay['displayL1'])).toDisplay
            + ' '.repeat(22-getElementByID(queue,parseFloat(deviceKeyToIdDisplay['displayL1']))['text'].length) + ' | ' + getElementByID(queue,parseFloat(deviceKeyToIdDisplay['displayL2']))['toDisplay']
            + ' '.repeat(22-getElementByID(queue,parseFloat(deviceKeyToIdDisplay['displayL2']))['text'].length) +  ' | ' + getElementByID(queue,parseFloat(deviceKeyToIdDisplay['displayL3']))['toDisplay'] + ' '.repeat(22-getElementByID(queue,parseFloat(deviceKeyToIdDisplay['displayL3']))['text'].length)
            +  ' |');
        clearQueues();
    }
}
// ==== Operator Functions ====

function storeValue(message){
    lastValue[message.id] = message.value;
    return message;
}

// assigns visual representation for given message (green check mark) to be used on display
function addVisualNext(message){
    message.text = '\u2713' + ' (' + JSON.stringify(message.completeness*100) + '%)'
    message.toDisplay = chalk.keyword('green')(message.text);
    return message;
}

// assigns visual representation for given message (orange cross mark) to be used on display
function addVisualTimeout(message){
    message.text = '\u2717'+ ' (' + JSON.stringify(message.completeness*100) + '%)';
    message.toDisplay = chalk.keyword('orange')(message.text);
    return message;
}

// assigns visual representation for given message (red check/cross mark) to be used on display
function addVisualViolation(message){
    if (message.value == null){ 
        message.text = '\u2717' + ' (' + JSON.stringify(message.completeness*100) + '%)'
    } else {
        message.text = '\u2713'+ ' (' + JSON.stringify(message.completeness*100) + '%)'
    }
    message.toDisplay = chalk.keyword('red')(message.text);
    return message;
}

function writeDataToDB(message, measurement){
    var point = {};
    point.measurement = measurement;
    point.tags = {id: message.id};
    point.fields = {completeness: message.completeness, timeout: message.timeout}
    if (message.value != null){
        point.fields.value = message.value;
    }
    try {
      influx_client.writePoint(point, {database: influxdb_database});
    } catch (e) {
      console.error(e);
    }
}

function nextDisplay(value){
    if (Object.values(deviceKeyToIdDisplay).includes(JSON.stringify(value.id))){
        addToNextQueue(value);
    };
}

function timeoutDisplay(value){
    if (Object.values(deviceKeyToIdDisplay).includes(JSON.stringify(value.id))){
        addToTimeoutQueue(value);
    }
}

function violationDisplay(value){
    if (Object.values(deviceKeyToIdDisplay).includes(JSON.stringify(value.id))){
        addToViolationQueue(value);
    }
}

// issue a write to the database for given argument, based on its source
function nextLog(value){
    if (deviceKeyToIdLog['logL1'].includes(JSON.stringify(value.id))){
        writeDataToDB(value, 'Processing Rate L1');
    }

    else if (deviceKeyToIdLog['logL2'].includes(JSON.stringify(value.id))){
        writeDataToDB(value, 'Processing Rate L2');
    }
    
    else if (deviceKeyToIdLog['logL3'].includes(JSON.stringify(value.id))){
        writeDataToDB(value, 'Processing Rate L3');
    }
}

function timeoutLog(value){
    if (deviceKeyToIdLog['logL1'].includes(JSON.stringify(value.id))){
        writeDataToDB(value, 'Timeout L1');
    }

    else if (deviceKeyToIdLog['logL2'].includes(JSON.stringify(value.id))){
        writeDataToDB(value, 'Timeout L2');
    }
    
    else if (deviceKeyToIdLog['logL3'].includes(JSON.stringify(value.id))){
        writeDataToDB(value, 'Timeout L3');
    }
}

function violationLog(value){
    if (deviceKeyToIdLog['logL1'].includes(JSON.stringify(value.id))){
        writeDataToDB(value, 'Violation L1');
    }

    else if (deviceKeyToIdLog['logL2'].includes(JSON.stringify(value.id))){
        writeDataToDB(value, 'Violation L2');
    }
    
    else if (deviceKeyToIdLog['logL3'].includes(JSON.stringify(value.id))){
        writeDataToDB(value, 'Violation L3');
    }
}

// ==== Communication

let request = require('request');

function convertDeviceKeyToURL(deviceKey){
    var pid1 = deviceKey.split('/')[0];
    var pid2 = deviceKey.split('/')[1].split(':')[0];
    var mac = deviceKey.split(':')[1].split('|')[0];
    var measurement = deviceKey.split('|')[1];
    return pid1 + '/' + pid2 + '/' + mac + '/' + measurement;
}

function registerConstraintDisplay(id, deviceKey, constraint, threshold){
    let r = request({ url: khronos_url + '/registerCompletenessConstraint/' + convertDeviceKeyToURL(deviceKey) 
    + '/' +constraint.toString() + '/' + threshold.toString(), method: 'PUT'}, function(err, res, data) {
        if (!err && res.statusCode == 200) {
            deviceKeyToIdDisplay[id] = data.replace(/\n$/, '')
            data;
        } else {
          console.log('ERROR: Registering constraint ' + constraint + ' for ' + deviceKey + ' failed.');
        }
    });
   }

function registerConstraintLog(id, deviceKey, constraint, threshold){
    let r = request({ url: khronos_url + '/registerCompletenessConstraint/' + convertDeviceKeyToURL(deviceKey) 
    + '/' +constraint.toString() + '/' + threshold.toString(), method: 'PUT'}, function(err, res, data) {
        if (!err && res.statusCode == 200) {
            deviceKeyToIdLog[id] = data.replace(/\n$/, '')
            data;
        } else {
            console.log('ERROR: Registering constraint ' + constraint + ' for ' + deviceKey + ' failed.');
        }
    });
}

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
var deviceKeyToIdDisplay = {}
var deviceKeyToIdLog = {}
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

//accidental
registerConstraintDisplay('displayL1',"3303/5702:00-17-0D-00-00-30-E7-2D|Temperature", 0.5, 0.9);
registerConstraintDisplay('displayL2',"3303/5702:00-17-0D-00-00-30-DA-DF|Temperature", 0.9, 0.9);
registerConstraintDisplay('displayL3',"3303/5702:00-17-0D-00-00-30-E3-A0|Temperature", 0.9, 0.9);
registerConstraintLog('logL1',"3303/5702:00-17-0D-00-00-30-E7-2D|Temperature", 0.5, 0.99);
registerConstraintLog('logL2',"3303/5702:00-17-0D-00-00-30-DA-DF|Temperature", 0.9, 0.99);
registerConstraintLog('logL3',"3303/5702:00-17-0D-00-00-30-E3-A0|Temperature", 0.9, 0.99);
var client = new WebSocketClient();
client.connect(protocol + '://' + khronosAddress + ':' + khronosPort + '/khronos');                 
prepareConnection(client, nextChain, timeoutChain, violationChain);;

var nextSubject = new Subject();
var timeoutSubject = new Subject();
var violationSubject = new Subject();
var nextChain = nextSubject.pipe(map(x => addVisualNext(x)), map(x => storeValue(x)));
var timeoutChain = timeoutSubject.pipe(map(x => addVisualTimeout(x)));
var violationChain = violationSubject.pipe(map(x => addVisualViolation(x)));
initializeDisplay()
nextChain.subscribe(nextDisplay, 
    function(err) {console.error(moment().format("dddd, MMMM Do YYYY, h:mm:ss.SSS ") 
    + 'nextSubscriber' + err)},
    function() {console.log(moment().format("dddd, MMMM Do YYYY, h:mm:ss.SSS") 
    + 'nextSubscriber Completed!')});
timeoutChain.subscribe(timeoutDisplay, 
    function(err) {console.error(moment().format("dddd, MMMM Do YYYY, h:mm:ss.SSS ") 
    + 'timeoutSubscriber' + err)},
    function() {console.log(moment().format("dddd, MMMM Do YYYY, h:mm:ss.SSS") 
    + 'timeoutSubscriber Completed!')});
violationChain.subscribe(violationDisplay, 
    function(err) {console.error(moment().format("dddd, MMMM Do YYYY, h:mm:ss.SSS ") 
    + 'violationSubscriber' + err)},
    function() {console.log(moment().format("dddd, MMMM Do YYYY, h:mm:ss.SSS") 
    + 'violationSubscriber Completed!')});

nextSubject.subscribe(nextLog, 
    function(err) {console.error(moment().format("dddd, MMMM Do YYYY, h:mm:ss.SSS ") 
    + 'nextSubscriber' + err)},
    function() {console.log(moment().format("dddd, MMMM Do YYYY, h:mm:ss.SSS") 
    + 'nextSubscriber Completed!')});
timeoutSubject.subscribe(timeoutLog, 
    function(err) {console.error(moment().format("dddd, MMMM Do YYYY, h:mm:ss.SSS ") 
    + 'nextSubscriber' + err)},
    function() {console.log(moment().format("dddd, MMMM Do YYYY, h:mm:ss.SSS") 
    + 'nextSubscriber Completed!')});
violationSubject.subscribe(violationLog, 
    function(err) {console.error(moment().format("dddd, MMMM Do YYYY, h:mm:ss.SSS ") 
    + 'nextSubscriber' + err)},
    function() {console.log(moment().format("dddd, MMMM Do YYYY, h:mm:ss.SSS") 
    + 'nextSubscriber Completed!')});

