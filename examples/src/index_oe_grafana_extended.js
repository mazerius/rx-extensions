import {OrchestratorSubject} from '/Users/stefanos/Projects/rxextensions/rxjs-master/dist/cjs/internal/time-mgmt/OrchestratorSubject'
import {ConstraintSubscriber} from '/Users/stefanos/Projects/rxextensions/rxjs-master/dist/cjs/internal/time-mgmt/ConstraintSubscriber'
import { map } from '/Users/stefanos/Projects/rxextensions/rxjs-master/dist/cjs/internal/time-mgmt/operators/map'

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
    console.log('message: ' + JSON.stringify(message));
    var points = []
    var point = {};
    point.measurement = measurement;
    point.tags = {id: message.id, name: message.name};
    point.fields = {completeness: message.completeness, timeout: message.timeOut, name: message.name}
    if (message.value != null){
        point.fields.value = message.value;
    }
    points.push(point);
    console.log('points: ' + JSON.stringify(points));
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
function readyToUpdate(){
    if (parseFloat(nextQueue.concat(timeoutQueue.concat(violationQueue)).length) == nbInputs){
        return true;
    }
    return false;
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

// Reactive Constructs
    // Callbacks

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

function nextProductionLine(m, name){
    m.value = Math.floor(Math.random() * 10) + 5  
    m.name = name;
    writeDataToDB(m, 'Processing_Rate');
    addToNextQueue(m);
}
function timeoutProductionLine(m, name){
    m.name = name;
    writeDataToDB(m, 'Timeout_Production_Line');
    addToTimeOutQueue(m);
}
function violationProductionLine(m, name){
    m.name = name;
    writeDataToDB(m, 'Violation_Production_Line');
    addToViolationQueue(m);
}
function nextTrashAisle(m){
    m.name = 'TA';
    writeDataToDB(m, 'Number_of_Defects');
    if (m.value > threshold){
        notifyTechnician(m, 'Threshold Exceeded')
    }
}
function timeoutTrashAisle(m){
    m.name = 'TA';
    writeDataToDB(m, 'Timeout_Trash_Aisle');
    notifyTechnician(m, 'Timeout');
}
function violationTrashAisle(m){
    m.name = 'TA';
    writeDataToDB(m, 'Violation_Trash_Aisle');
    notifyTechnician(m, 'Violation');
}
function addToNextQueue(m){
    filterQueues(m.id);
    nextQueue.push(m);
    updateOE();
}
function addToTimeOutQueue(m){
    filterQueues(m.id);
    timeoutQueue.push(m);
    updateOE();
}
function addToViolationQueue(m){
    filterQueues(m.id);
    violationQueue.push(m);
    updateOE();
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

    // Initialization
var productionLine1 = new ConstraintSubscriber("3303/5702:00-17-0D-00-00-30-E7-2D|Temperature", 0.5, 0.95,function(v){nextProductionLine(v,'L1')}, function(err) {console.error('L1 ' + err)},function() {console.log('L1 Completed!')},function(v){timeoutProductionLine(v,'L1')},function(v){violationProductionLine(v, 'L1')});   
var productionLine2 = new ConstraintSubscriber("3303/5702:00-17-0D-00-00-30-DA-DF|Temperature", 0.5, 0.95, function(v){nextProductionLine(v,'L2')}, function(err){console.error('L2 ' + err)},function() {console.log('L2 Completed!')},function(v){timeoutProductionLine(v,'L2')},function(v){violationProductionLine(v, 'L2')});   
var productionLine3 = new ConstraintSubscriber("3303/5702:00-17-0D-00-00-30-E3-A0|Temperature", 0.5, 0.95, function(v){nextProductionLine(v,'L3')}, function(err) {console.error('L3 ' + err)},function() {console.log('L3 Completed!')},function(v){timeoutProductionLine(v,'L3')},function(v){violationProductionLine(v, 'L3')});   
var productionLine4 = new ConstraintSubscriber("9803/9805:00-17-0D-00-00-30-E9-5E|Light", 0.5, 0.95, function(v){nextProductionLine(v,'L4')}, function(err) {console.error('L4 ' + err)},function() {console.log('L4 Completed!')},function(v){timeoutProductionLine(v,'L4')},function(v){violationProductionLine(v, 'L4')});   
var productionLine5 = new ConstraintSubscriber("9803/9805:00-17-0D-00-00-30-E3-CA|Light", 0.5, 0.95, function(v){nextProductionLine(v,'L5')}, function(err) {console.error('L5 ' + err)},function() {console.log('L5 Completed!')},function(v){timeoutProductionLine(v,'L5')},function(v){violationProductionLine(v, 'L5')});   
var productionLine6 = new ConstraintSubscriber("9803/9805:00-17-0D-00-00-30-DF-E8|Light", 0.5, 0.95, function(v){nextProductionLine(v,'L6')}, function(err) {console.error('L6 ' + err)},function() {console.log('L6 Completed!')},function(v){timeoutProductionLine(v,'L6')},function(v){violationProductionLine(v, 'L6')});
var trashAisle = new ConstraintSubscriber("3303/5702:00-17-0D-00-00-30-E7-2D|Temperature", 0.5, 0.95, function(v){nextTrashAisle(v)},function(err) {console.error('TA' + err)},function() {console.log('TA Completed!')},function(v){timeoutTrashAisle(v)},function(v){violationTrashAisle(v)});
var orchestrator = new OrchestratorSubject();
var chainDisplay = orchestrator.pipeNext(map(x => log('Sensor data received: ', x)), map(x => storeValue(x)));
var chainDisplay = chainDisplay.pipeTimeOut(map(x => log('Timeout event received: ', x)));
var chainDisplay = chainDisplay.pipeViolation(map(x => log('Violation event received: ', x)));
chainDisplay.subscribe(productionLine1);
chainDisplay.subscribe(productionLine2);
chainDisplay.subscribe(productionLine3);
chainDisplay.subscribe(productionLine4);
chainDisplay.subscribe(productionLine5);
chainDisplay.subscribe(productionLine6);
chainDisplay.subscribe(trashAisle);

