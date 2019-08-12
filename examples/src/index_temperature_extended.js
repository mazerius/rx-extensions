import {OrchestratorSubject} from '/Users/stefanos/Projects/rxextensions/rxjs-master/dist/cjs/internal/time-mgmt/OrchestratorSubject'
import {ConstraintSubscriber} from '/Users/stefanos/Projects/rxextensions/rxjs-master/dist/cjs/internal/time-mgmt/ConstraintSubscriber'
import { map } from '/Users/stefanos/Projects/rxextensions/rxjs-master/dist/cjs/internal/time-mgmt/operators/map'
var moment = require('moment'); 
const chalk = require('chalk');
const fs = require('fs');

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

function addToNextQueue(m){
    //console.log('next: ' + JSON.stringify(m));
    filterQueues(m.id);
    nextQueue.push(m);
    updateDisplay();
}

function addToTimeOutQueue(m){
    //console.log('timeout: ' + JSON.stringify(m));
    filterQueues(m.id);
    timeoutQueue.push(m);
    updateDisplay();
}

function addToViolationQueue(m){
    //console.log('viol: ' + JSON.stringify(m));
    filterQueues(m.id);
    violationQueue.push(m);
    updateDisplay();
}


// ==== Display ====

function initializeDisplay(){
    console.log('|          Date            | Machine Temperature' + ' | ' 
        + 'Lower Body | Middle Body | Upper Body |');
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
        result = Math.round(100*(result/nbInputs))/100;
        result = JSON.stringify(result) + '°C';
        console.log('| ' + new Date().toISOString() + ' | ' + chalk.keyword(getFinalColor())(result) 
            + ' '.repeat(19 - result.length) +  ' | ' 
            + getElementByID(queue,lowerBodyTemperature.getID()).toDisplay 
            + ' '.repeat(9) + ' | ' + getElementByID(queue,middleBodyTemperature.getID()).toDisplay 
            + ' '.repeat(10) +  ' | ' + getElementByID(queue,upperBodyTemperature.getID()).toDisplay + ' '.repeat(9) 
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

function storeValue(m){
    lastValue[m.id] = m.value;
    return m;
}

// converts sensor output (e.g. voltage) to temperature
function convertToTemperature(message){
  // dummy formula
  message.value = message.value*2
  return message;
}

function calibrateTemperature(message){
    // dummy formula
    message.value = message.value/2
    return message;
  }

// assigns visual representation for given message (green check mark) to be used on display
function addVisualNext(message){
    //console.log('next event: ' + JSON.stringify(message))
    message.toDisplay = chalk.keyword('green')('\u2713');
    return message;
}

// assigns visual representation for given message (orange cross mark) to be used on display
function addVisualTimeout(message){
    message.toDisplay = chalk.keyword('orange')('\u2717');
    return message;
}

// assigns visual representation for given message (red check/cross mark) to be used on display
function addVisualViolation(message){
    if (message.value == null){ 
        message.toDisplay = chalk.keyword('red')('\u2717')
    } else {
        message.toDisplay = chalk.keyword('red')('\u2713')
    }
    return message;
}

function log(m){
    fs.appendFile("logs.txt", m.text, function(err) {
        if(err) {
            return console.log(err);
        }
    });
    return m; 
}

function prettifyTimeoutEvent(m){
    m.text = '[' + 'TIMEOUT' + ']: ' + 'occurred at ' + m.timestamp + ' with completeness ' + m.completeness 
        + 'and timeout ' + m.timeOut + 's.\n';
    return m;
}

function prettifyViolationEvent(m){
    m.text = '[' + 'VIOLATION' + ']: ' + 'occurred at ' + m.timestamp + ' with completeness ' + m.completeness 
        + 'and timeout ' + m.timeOut + 's.\n';
    return m;
}

// Initialization
var nextQueue = [];
var timeoutQueue = [];
var violationQueue = [];
var lastValue = {};
var nbInputs = 3;
var lowerBodyTemperature = new ConstraintSubscriber("3303/5702:00-17-0D-00-00-30-E7-2D|Temperature", 0.5, 0.95, 
    function(v){addToNextQueue(v, nextQueue)}, 
    function(err) { console.error(moment().format("dddd, MMMM Do YYYY, h:mm:ss.SSS ") 
        + 'lowerBodyTemperature' + err)},
    function() {console.log(moment().format("dddd, MMMM Do YYYY, h:mm:ss.SSS") 
        + 'lowerBodyTemperature Completed!')},
    function(v){addToTimeOutQueue(v, timeoutQueue)}, 
    function(v){addToViolationQueue(v, violationQueue)});   
var middleBodyTemperature = new ConstraintSubscriber("3303/5702:00-17-0D-00-00-30-DA-DF|Temperature", 0.9, 0.95, 
    function(v){addToNextQueue(v, nextQueue)}, 
    function(err) { console.error(moment().format("dddd, MMMM Do YYYY, h:mm:ss.SSS ") 
        + 'middleBodyTemperature' + err)},
    function() {console.log(moment().format("dddd, MMMM Do YYYY, h:mm:ss.SSS") 
        + 'middleBodyTemperature Completed!')},
    function(v){addToTimeOutQueue(v, timeoutQueue)}, 
    function(v){addToViolationQueue(v, violationQueue)});  
var upperBodyTemperature = new ConstraintSubscriber("3303/5702:00-17-0D-00-00-30-E3-A0|Temperature", 0.9, 0.95, 
    function(v){addToNextQueue(v, nextQueue)}, 
    function(err) { console.error(moment().format("dddd, MMMM Do YYYY, h:mm:ss.SSS ") 
        + 'upperBodyTemperature' + err)},
    function() {console.log(moment().format("dddd, MMMM Do YYYY, h:mm:ss.SSS") 
        + 'upperBodyTemperature Completed!')},
    function(v){addToTimeOutQueue(v, timeoutQueue)}, 
    function(v){addToViolationQueue(v, violationQueue)});  
var orchestrator = new OrchestratorSubject();
var chain = orchestrator.pipeNext(map(x => addVisualNext(x)), map(x =>  convertToTemperature(x)), 
    map(x =>  calibrateTemperature(x)), map(x => storeValue(x)));
var chain = chain.pipeTimeOut(map(x => addVisualTimeout(x)), map(x => prettifyTimeoutEvent(x)), 
    map(x => log(x)));
var chain = chain.pipeViolation(map(x => addVisualViolation(x)), map(x => prettifyViolationEvent(x)), 
    map(x => log(x)));
initializeDisplay();
chain.subscribe(lowerBodyTemperature);
chain.subscribe(middleBodyTemperature);
chain.subscribe(upperBodyTemperature);

