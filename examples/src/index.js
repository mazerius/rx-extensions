import { default as configuration } from '/Users/stefanos/Projects/rx-extensions/cjs/internal/time-mgmt/config';
import { Subject } from '/Users/stefanos/Projects/rx-extensions/cjs/internal/Subject'
import { map } from '/Users/stefanos/Projects/rx-extensions/cjs/internal/operators/map'

// Database

var influxdb = require('influx')
var influxdb_protocol = (process.env.INFLUXDB_PROTOCOL ||'http');
var influxdb_addr = (process.env.INFLUXDB_ADDRESS || 'localhost');
var influxdb_port = (process.env.INFLUXDB_PORT || 8086);
var influxdb_database = (process.env.INFLUXDB_DATABASE ||'Manufacturing_Plant');
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
function writeDataToDB(message, measurement){
    var points = []
    var point = {};
    point.measurement = measurement;
    point.tags = {id: message.id, name: message.name};
    point.fields = {completeness: message.completeness, timeout: message.timeOut, name: message.name}
    if (message.value != null){
        point.fields.value = message.value;
    }
    points.push(point);
    try {
      influx_client.writePoints(points, {database: influxdb_database});
    } catch (e) {
      console.error(e);
    }
}
function writeValueToDB(value, measurement){
    var points = [];
    var point = {};
    point.measurement = measurement;
    point.fields = {value: value};
    points.push(point);
    try {
        influx_client.writePoints(points, {database: influxdb_database});
      } catch (e) {
        console.error(e);
      }
}


// Scheduling 
var nextQueue = [];
var timeoutQueue = [];
var violationQueue = [];
var lastValue = {};
var nbInputs = 6;
var threshold = 3;
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
function readyToUpdate(){
    if (parseFloat(nextQueue.concat(timeoutQueue.concat(violationQueue)).length) == nbInputs){
        return true;
    }
    return false;
}

// Reactive Constructs
    // Callbacks


function addToNextQueue(m){
    filterQueues(m.id)
    nextQueue.push(m);
    updateOE();
}
function addToTimeoutQueue(m){
    filterQueues(m.id)
    timeoutQueue.push(m);
    updateOE();
}
function addToViolationQueue(m){
    filterQueues(m.id)
    violationQueue.push(m);
    updateOE();
}
function updateOE(){
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
        result = Math.round(100*(result/nbInputs))/100;
        writeValueToDB(result, 'Operational_Efficiency');
        clearQueues();
    }
}
function nextProductionLine(value){
    if (deviceKeyToIdProductionLine['productionLine1'].includes(JSON.stringify(value.id))){
        value.name = 'L1';
    }
    if (deviceKeyToIdProductionLine['productionLine2'].includes(JSON.stringify(value.id))){
        value.name = 'L2';
    }
    if (deviceKeyToIdProductionLine['productionLine3'].includes(JSON.stringify(value.id))){
        value.name = 'L3';
    }
    if (deviceKeyToIdProductionLine['productionLine4'].includes(JSON.stringify(value.id))){
        value.name = 'L4';
    }
    if (deviceKeyToIdProductionLine['productionLine5'].includes(JSON.stringify(value.id))){
        value.name = 'L5';
    }
    if (deviceKeyToIdProductionLine['productionLine6'].includes(JSON.stringify(value.id))){
        value.name = 'L6';
    }
    if (Object.values(deviceKeyToIdProductionLine).includes(JSON.stringify(value.id))){
        writeDataToDB(value, 'Processing_Rate');
        addToNextQueue(value);
    };
}
function timeoutProductionLine(value){
    console.log('deviceKeyToIdProductionLine: ' + JSON.stringify(deviceKeyToIdProductionLine))
    if (deviceKeyToIdProductionLine['productionLine1'].includes(JSON.stringify(value.id))){
        value.name = 'L1';
    }
    if (deviceKeyToIdProductionLine['productionLine2'].includes(JSON.stringify(value.id))){
        value.name = 'L2';
    }
    if (deviceKeyToIdProductionLine['productionLine3'].includes(JSON.stringify(value.id))){
        value.name = 'L3';
    }
    if (deviceKeyToIdProductionLine['productionLine4'].includes(JSON.stringify(value.id))){
        value.name = 'L4';
    }
    if (deviceKeyToIdProductionLine['productionLine5'].includes(JSON.stringify(value.id))){
        value.name = 'L5';
    }
    if (deviceKeyToIdProductionLine['productionLine6'].includes(JSON.stringify(value.id))){
        value.name = 'L6';
    }
    if (Object.values(deviceKeyToIdProductionLine).includes(JSON.stringify(value.id))){
        writeDataToDB(value, 'Timeout_Production_Line');
        addToTimeoutQueue(value);
    }
}
function violationProductionLine(value){
    if (deviceKeyToIdProductionLine['productionLine1'].includes(JSON.stringify(value.id))){
        value.name = 'L1';
    }
    if (deviceKeyToIdProductionLine['productionLine2'].includes(JSON.stringify(value.id))){
        value.name = 'L2';
    }
    if (deviceKeyToIdProductionLine['productionLine3'].includes(JSON.stringify(value.id))){
        value.name = 'L3';
    }
    if (deviceKeyToIdProductionLine['productionLine4'].includes(JSON.stringify(value.id))){
        value.name = 'L4';
    }
    if (deviceKeyToIdProductionLine['productionLine5'].includes(JSON.stringify(value.id))){
        value.name = 'L5';
    }
    if (deviceKeyToIdProductionLine['productionLine6'].includes(JSON.stringify(value.id))){
        value.name = 'L6';
    }
    if (Object.values(deviceKeyToIdProductionLine).includes(JSON.stringify(value.id))){
        writeDataToDB(value, 'Violation_Production_Line');
        addToViolationQueue(value);
    }
}
function nextTrashAisle(value){
    if (deviceKeyToIdTrashAisle['trashAisle'].includes(JSON.stringify(value.id))){
        value.name = 'TA';
        writeDataToDB(value, 'Number_of_Defects');
        if (value.value > threshold){
            notifyTechnician(value, 'Threshold Exceeded')
        }
    }
}
function timeoutTrashAisle(m){
    writeDataToDB(m, 'Timeout_Trash_Aisle');
    notifyTechnician(m, 'Timeout');
}
function violationTrashAisle(m){
    writeDataToDB(m, 'Violation_Trash_Aisle');
    notifyTechnician(m, 'Violation');
}
function notifyTechnician(m, eventType){
    //pass
}

    // Operators

function storeValue(message){
    lastValue[message.id] = message.value;
    return message;
}

function log(message, m){
    console.log(message + JSON.stringify(m));
    return m;
}

// Communication

let request = require('request');
function convertDeviceKeyToURL(deviceKey){
    var pid1 = deviceKey.split('/')[0];
    var pid2 = deviceKey.split('/')[1].split(':')[0];
    var mac = deviceKey.split(':')[1].split('|')[0];
    var measurement = deviceKey.split('|')[1];
    return pid1 + '/' + pid2 + '/' + mac + '/' + measurement;
}
function registerConstraintProductionLine(id, deviceKey, constraint, threshold){
    let r = request({ url: khronos_url + '/registerCompletenessConstraint/' + convertDeviceKeyToURL(deviceKey) 
    + '/' +constraint.toString() + '/' + threshold.toString(), method: 'PUT'}, function(err, res, data) {
        if (!err && res.statusCode == 200) {
            deviceKeyToIdProductionLine[id] = data.replace(/\n$/, '')
            data;
        } else {
          console.log('ERROR: Registering constraint ' + constraint + ' for ' + deviceKey + ' failed.');
        }
    });
   }
function registerConstraintTrashAisle(id, deviceKey, constraint, threshold){
    let r = request({ url: khronos_url + '/registerCompletenessConstraint/' + convertDeviceKeyToURL(deviceKey) 
    + '/' +constraint.toString() + '/' + threshold.toString(), method: 'PUT'}, function(err, res, data) {
        if (!err && res.statusCode == 200) {
            deviceKeyToIdTrashAisle[id] = data.replace(/\n$/, '')
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

// Initialization
var deviceKeyToIdProductionLine = {}
var deviceKeyToIdTrashAisle = {}
var khronos_url = 'http://' + configuration['khronos']['address'] + ':' + configuration['khronos']['port'];
var nextQueue = [];
var timeoutQueue = [];
var violationQueue = [];
var lastValue = {};
var WebSocketClient = require('websocket').client;
var khronosAddress = configuration['khronos']['address']
var khronosPort = configuration['khronos']['port']
var protocol =  'ws'
var nbInputs = 6;
var threshold = 3;

registerConstraintProductionLine('productionLine1',"3303/5702:00-17-0D-00-00-30-E7-2D|Temperature", 0.75, 0.99);
registerConstraintProductionLine('productionLine2',"3303/5702:00-17-0D-00-00-30-DA-DF|Temperature", 0.75, 0.99);
registerConstraintProductionLine('productionLine3',"3303/5702:00-17-0D-00-00-30-E3-A0|Temperature", 0.75, 0.99);
registerConstraintProductionLine('productionLine4',"9803/9805:00-17-0D-00-00-30-E9-5E|Light", 0.75, 0.99);
registerConstraintProductionLine('productionLine5',"9803/9805:00-17-0D-00-00-30-E3-CA|Light", 0.75, 0.99);
registerConstraintProductionLine('productionLine6',"9803/9805:00-17-0D-00-00-30-DF-E8|Light", 0.75, 0.99);
registerConstraintTrashAisle('trashAisle',"3303/5702:00-17-0D-00-00-30-E7-2D|Temperature", 0.9999, 0.99);

var nextSubject = new Subject();
var timeoutSubject = new Subject();
var violationSubject = new Subject();
var nextChain = nextSubject.pipe(map(x => log('Sensor data received: ', x)), map(x => storeValue(x)));
var timeoutChain = timeoutSubject.pipe(map(x => log('Timeout received: ', x)));
var violationChain = violationSubject.pipe(map(x => log(new Date() + 'Violation received: ', x)));

var client = new WebSocketClient();
client.connect(protocol + '://' + khronosAddress + ':' + khronosPort + '/khronos');                 
prepareConnection(client, nextChain, timeoutChain, violationChain);;


nextChain.subscribe(nextProductionLine, 
    function(err) {console.log('nextSubscriber' + err)},
    function() {console.log('nextSubscriber Completed!')});
timeoutChain.subscribe(timeoutProductionLine, 
    function(err) {console.error('timeoutSubscriber' + err)},
    function() {console.log('timeoutSubscriber Completed!')});
violationChain.subscribe(violationProductionLine, 
    function(err) {console.error('violationSubscriber' + err)},
    function() {console.log('violationSubscriber Completed!')});

nextSubject.subscribe(nextTrashAisle, 
    function(err) {console.error('nextSubscriber' + err)},
    function() {console.log('nextSubscriber Completed!')});
timeoutSubject.subscribe(timeoutTrashAisle, 
    function(err) {console.error('nextSubscriber' + err)},
    function() {console.log('nextSubscriber Completed!')});
violationSubject.subscribe(violationTrashAisle, 
    function(err) {console.error('nextSubscriber' + err)},
    function() {console.log('nextSubscriber Completed!')});

