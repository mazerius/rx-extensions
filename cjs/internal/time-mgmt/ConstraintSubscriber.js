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
var Subscriber_1 = require("../Subscriber");
var config_1 = require("./config");
var request = require('request');
var ConstraintSubscriber = (function (_super) {
    __extends(ConstraintSubscriber, _super);
    function ConstraintSubscriber(device_key, constraint, threshold, destinationOrNext, error, complete, timeOut, violation) {
        if (threshold === void 0) { threshold = 0.99999; }
        var _this = this;
        function branch(value) {
            var context = value.type;
            if (context == 'timeout') {
                timeOut(value);
            }
            else if (context == 'violation') {
                violation(value);
            }
            else {
                destinationOrNext(value);
            }
        }
        _this = _super.call(this, branch, error, complete) || this;
        _this.constraint = constraint;
        _this.device_key = device_key;
        _this.threshold = threshold;
        _this.khronos_url = 'http://' + config_1.default['khronos']['address'] + ':' + config_1.default['khronos']['port'];
        _this.registerConstraint();
        return _this;
    }
    ConstraintSubscriber.prototype.registerConstraint = function () {
        var self = this;
        var r = request({ url: self.khronos_url + '/registerCompletenessConstraint/' + self.convertDeviceKeyToURL() + '/' + self.getConstraint().toString() + '/' + self.getThreshold().toString(), method: 'PUT' }, function (err, res, data) {
            if (!err && res.statusCode == 200) {
                self.setID(data);
            }
            else {
                console.error(err);
                console.log('ERROR: Registering constraint ' + self.getConstraint() + ' for ' + self.getDeviceKey() + ' failed.');
            }
        });
    };
    ConstraintSubscriber.prototype.getConstraint = function () {
        return this.constraint;
    };
    ConstraintSubscriber.prototype.getDeviceKey = function () {
        return this.device_key;
    };
    ConstraintSubscriber.prototype.getThreshold = function () {
        return this.threshold;
    };
    ConstraintSubscriber.prototype.getID = function () {
        return this.id;
    };
    ConstraintSubscriber.prototype.setID = function (id) {
        this.id = id;
    };
    ConstraintSubscriber.prototype.convertDeviceKeyToURL = function () {
        var pid1 = this.device_key.split('/')[0];
        var pid2 = this.device_key.split('/')[1].split(':')[0];
        var mac = this.device_key.split(':')[1].split('|')[0];
        var measurement = this.device_key.split('|')[1];
        return pid1 + '/' + pid2 + '/' + mac + '/' + measurement;
    };
    return ConstraintSubscriber;
}(Subscriber_1.Subscriber));
exports.ConstraintSubscriber = ConstraintSubscriber;
//# sourceMappingURL=ConstraintSubscriber.js.map