"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    }
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var Subject_1 = require("../Subject");
var WebSocketListenerSubject_1 = require("./WebSocketListenerSubject");
var ObjectUnsubscribedError_1 = require("../util/ObjectUnsubscribedError");
var ConstraintSubscriber_1 = require("./ConstraintSubscriber");
var StaticTimeoutSubscriber_1 = require("./StaticTimeoutSubscriber");
var Subscription_1 = require("../Subscription");
var SubjectSubscription_1 = require("../SubjectSubscription");
var config_1 = require("./config");
var request = require('request');
var OrchestratorSubject = (function (_super) {
    __extends(OrchestratorSubject, _super);
    function OrchestratorSubject() {
        var _this = _super.call(this) || this;
        _this.observers = [];
        var ws_subject = new WebSocketListenerSubject_1.WebSocketListenerSubject(config_1.default['khronos']['address'], config_1.default['khronos']['port'], '/khronos', 'ws');
        var self = _this;
        ws_subject.subscribe({
            next: function (v) { self.next(v); }
        });
        return _this;
    }
    OrchestratorSubject.prototype.next = function (message) {
        if (this.closed) {
            throw new ObjectUnsubscribedError_1.ObjectUnsubscribedError();
        }
        if (!this.isStopped) {
            var observers = this.observers;
            var len = observers.length;
            var copy = observers.slice();
            message = this.parseMessage(message);
            for (var i = 0; i < len; i++) {
                if (this.containsID(copy[i], message.id)) {
                    copy[i].next(message);
                }
            }
        }
    };
    OrchestratorSubject.prototype.containsID = function (subscriber, id) {
        if (subscriber instanceof ConstraintSubscriber_1.ConstraintSubscriber || subscriber instanceof StaticTimeoutSubscriber_1.StaticTimeoutSubscriber) {
            return subscriber.getID() == id;
        }
        if (subscriber.getDestination() == undefined) {
            return false;
        }
        else {
            return this.containsID(subscriber.getDestination(), id);
        }
    };
    OrchestratorSubject.prototype.parseMessage = function (message) {
        var tmp = {};
        var data = JSON.parse(message.utf8Data);
        for (var key in data) {
            if (data.hasOwnProperty(key)) {
                var new_key = key.replace(/\\"/g, '"');
                tmp[new_key] = data[key];
            }
        }
        var result = { id: tmp['id'], value: tmp['value'], completeness: tmp['completeness'], timeOut: tmp['timeOut'], timestamp: tmp['timestamp'], type: tmp['type'] };
        return result;
    };
    OrchestratorSubject.prototype._subscribe = function (subscriber) {
        if (this.closed) {
            throw new ObjectUnsubscribedError_1.ObjectUnsubscribedError();
        }
        else if (this.hasError) {
            subscriber.error(this.thrownError);
            return Subscription_1.Subscription.EMPTY;
        }
        else if (this.isStopped) {
            subscriber.complete();
            return Subscription_1.Subscription.EMPTY;
        }
        else {
            this.observers.push(subscriber);
        }
        return new SubjectSubscription_1.SubjectSubscription(this, subscriber);
    };
    OrchestratorSubject.prototype.convertDeviceKeyToURL = function (device_key) {
        var pid1 = device_key.split('/')[0];
        var pid2 = device_key.split('/')[1].split(':')[0];
        var mac = device_key.split(':')[1].split('|')[0];
        var measurement = device_key.split('|')[1];
        return pid1 + '/' + pid2 + '/' + mac + '/' + measurement;
    };
    return OrchestratorSubject;
}(Subject_1.Subject));
exports.OrchestratorSubject = OrchestratorSubject;
//# sourceMappingURL=OrchestratorSubject.js.map