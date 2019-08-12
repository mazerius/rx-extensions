import {OrchestratorSubject} from '/Users/stefanos/Projects/rxextensions/rxjs-master/dist/cjs/internal/time-mgmt/OrchestratorSubject'
import {ConstraintSubscriber} from '/Users/stefanos/Projects/rxextensions/rxjs-master/dist/cjs/internal/time-mgmt/ConstraintSubscriber'
import { map } from '/Users/stefanos/Projects/rxextensions/rxjs-master/dist/cjs/internal/time-mgmt/operators/map'
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
            + getElementByID(queue,displayL1.getID()).toDisplay 
            + ' '.repeat(22-getElementByID(queue,displayL1.getID()).text.length) + ' | ' + getElementByID(queue,displayL2.getID()).toDisplay
            + ' '.repeat(22-getElementByID(queue,displayL2.getID()).text.length) +  ' | ' + getElementByID(queue,displayL3.getID()).toDisplay + ' '.repeat(22-getElementByID(queue,displayL3.getID()).text.length)
            +  ' |');
        clearQueues();
    }
}

function clearQueues(){
    nextQueue = [];
    timeoutQueue = [];
    violationQueue = [];
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

// callbacks
function addToNextQueue(m){
    filterQueues(m.id);
    nextQueue.push(m);
    updateDisplay();
}

function addToTimeOutQueue(m){
    filterQueues(m.id);
    timeoutQueue.push(m);
    updateDisplay();
}

function addToViolationQueue(m){
    filterQueues(m.id);
    violationQueue.push(m);
    updateDisplay();
}

// issue a write to the database for given argument, based on its source
function writeDataToDB(message, measurement){
    var point = {};
    console.log('message: ' + JSON.stringify(message) );
    point.measurement = measurement;
    point.tags = {id: message.id};
    point.fields = {completeness: message.completeness, timeout: message.timeOut}
    if (message.value != null){
        point.fields.value = message.value;
    }
    try {
      influx_client.writePoint(point, {database: influxdb_database});
    } catch (e) {ß
      console.error(e);
    }
}

// Initialization
var nextQueue = [];
var timeoutQueue = [];
var violationQueue = [];
var lastValue = {};
var nbInputs = 3;
var displayL1 = new ConstraintSubscriber("3303/5702:00-17-0D-00-00-30-E7-2D|Temperature", 0.5, 0.95, 
    function(v){addToNextQueue(v, nextQueue)}, 
    function(err) { console.error(moment().format("dddd, MMMM Do YYYY, h:mm:ss.SSS ") 
        + 'displayL1' + err)},
    function() {console.log(moment().format("dddd, MMMM Do YYYY, h:mm:ss.SSS") 
        + 'displayL1 Completed!')},
    function(v){addToTimeOutQueue(v, timeoutQueue)}, 
    function(v){addToViolationQueue(v, violationQueue)});   
var displayL2 = new ConstraintSubscriber("3303/5702:00-17-0D-00-00-30-DA-DF|Temperature", 0.9, 0.95, 
    function(v){addToNextQueue(v, nextQueue)}, 
    function(err) { console.error(moment().format("dddd, MMMM Do YYYY, h:mm:ss.SSS ") 
        + 'displayL2' + err)},
    function() {console.log(moment().format("dddd, MMMM Do YYYY, h:mm:ss.SSS") 
        + 'displayL2 Completed!')},
    function(v){addToTimeOutQueue(v, timeoutQueue)}, 
    function(v){addToViolationQueue(v, violationQueue)});  
var displayL3 = new ConstraintSubscriber("3303/5702:00-17-0D-00-00-30-E3-A0|Temperature", 0.9, 0.95, 
    function(v){addToNextQueue(v, nextQueue)}, 
    function(err) { console.error(moment().format("dddd, MMMM Do YYYY, h:mm:ss.SSS ") 
        + 'displayL3' + err)},
    function() {console.log(moment().format("dddd, MMMM Do YYYY, h:mm:ss.SSS") 
        + 'displayL3 Completed!')},
    function(v){addToTimeOutQueue(v, timeoutQueue)}, 
    function(v){addToViolationQueue(v, violationQueue)});  
    
var logL1 = new ConstraintSubscriber("3303/5702:00-17-0D-00-00-30-E7-2D|Temperature", 0.99, 0.95, 
    function(v){writeDataToDB(v, 'Processing Rate L1')}, 
    function(err) { console.error(moment().format("dddd, MMMM Do YYYY, h:mm:ss.SSS ") 
        + 'log L1' + err)},
    function() {console.log(moment().format("dddd, MMMM Do YYYY, h:mm:ss.SSS") 
        + 'log L1 Completed!')},
    function(v){writeDataToDB(v, 'Timeout logL1')}, 
    function(v){writeDataToDB(v, 'Violation logL1')});   
var logL2 = new ConstraintSubscriber("3303/5702:00-17-0D-00-00-30-DA-DF|Temperature", 0.99, 0.95, 
    function(v){writeDataToDB(v, 'Processing Rate L2')}, 
    function(err) { console.error(moment().format("dddd, MMMM Do YYYY, h:mm:ss.SSS ") 
        + 'log L2' + err)},
    function() {console.log(moment().format("dddd, MMMM Do YYYY, h:mm:ss.SSS") 
        + 'log L2 Completed!')},
    function(v){writeDataToDB(v, 'Timeout logL2')}, 
    function(v){writeDataToDB(v, 'Violation logL2')});  
var logL3 = new ConstraintSubscriber("3303/5702:00-17-0D-00-00-30-E3-A0|Temperature", 0.99, 0.95, 
    function(v){writeDataToDB(v, 'Processing Rate L3')}, 
    function(err) { console.error(moment().format("dddd, MMMM Do YYYY, h:mm:ss.SSS ") 
        + 'logL3' + err)},
    function() {console.log(moment().format("dddd, MMMM Do YYYY, h:mm:ss.SSS") 
        + 'logL3 Completed!')},
    function(v){writeDataToDB(v, 'Processing Rate L3')}, 
    function(v){writeDataToDB(v, 'Violation L3')}); 

var orchestrator = new OrchestratorSubject();
var chainDisplay = orchestrator.pipeNext(map(x => addVisualNext(x)), map(x => storeValue(x)));
var chainDisplay = chainDisplay.pipeTimeOut(map(x => addVisualTimeout(x)));
var chainDisplay = chainDisplay.pipeViolation(map(x => addVisualViolation(x)));

chainDisplay.subscribe(displayL1);
chainDisplay.subscribe(displayL2);
chainDisplay.subscribe(displayL3);
orchestrator.subscribe(logL1);
orchestrator.subscribe(logL2);
orchestrator.subscribe(logL3);
initializeDisplay();


