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
var StaticTimeoutSubscriber = (function (_super) {
    __extends(StaticTimeoutSubscriber, _super);
    function StaticTimeoutSubscriber(device_key, static_timeout, destinationOrNext, error, complete, timeOut) {
        var _this = this;
        function branch(value, context) {
            if (context == 'timeout') {
                timeOut(value);
            }
            else {
                destinationOrNext(value);
            }
        }
        _this = _super.call(this, branch, error, complete) || this;
        _this.static_timeout = static_timeout;
        _this.device_key = device_key;
        _this.khronos_url = 'http://' + config_1.default['khronos']['address'] + ':' + config_1.default['khronos']['port'];
        _this.registerStaticTimeout();
        return _this;
    }
    StaticTimeoutSubscriber.prototype.registerStaticTimeout = function () {
        var self = this;
        var r = request({ url: self.khronos_url + '/registerTimeout/' + self.convertDeviceKeyToURL() + '/' + self.getStaticTimeout(), method: 'PUT' }, function (err, res, data) {
            if (!err && res.statusCode == 200) {
                self.setID(data);
            }
        });
    };
    StaticTimeoutSubscriber.prototype.getStaticTimeout = function () {
        return this.static_timeout;
    };
    StaticTimeoutSubscriber.prototype.setID = function (id) {
        this.id = id;
    };
    StaticTimeoutSubscriber.prototype.getID = function () {
        return this.id;
    };
    StaticTimeoutSubscriber.prototype.convertDeviceKeyToURL = function () {
        var pid1 = this.device_key.split('/')[0];
        var pid2 = this.device_key.split('/')[1].split(':')[0];
        var mac = this.device_key.split(':')[1].split('|')[0];
        var measurement = this.device_key.split('|')[1];
        return pid1 + '/' + pid2 + '/' + mac + '/' + measurement;
    };
    return StaticTimeoutSubscriber;
}(Subscriber_1.Subscriber));
exports.StaticTimeoutSubscriber = StaticTimeoutSubscriber;
//# sourceMappingURL=StaticTimeoutSubscriber.js.map