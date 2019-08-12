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
var WebSocketListenerSubject = (function (_super) {
    __extends(WebSocketListenerSubject, _super);
    function WebSocketListenerSubject(address, port, path, protocol) {
        var _this = _super.call(this) || this;
        _this.address = address;
        _this.port = port;
        _this.protocol = protocol;
        var WebSocketClient = require('websocket').client;
        var client = new WebSocketClient();
        var input = _this;
        client.on('connect', function (connection) {
            connection.on('error', function (error) {
                console.log("Connection Error: " + error.toString());
            });
            connection.on('close', function () {
                console.log('echo-protocol Connection Closed');
            });
            connection.on('message', function (message) {
                input.next(message);
            });
        });
        client.on('connectFailed', function (error) {
            console.log('Connect Error: ' + error.toString());
            input.error(error);
        });
        client.connect(_this.protocol + '://' + _this.address + ':' + _this.port + path);
        return _this;
    }
    return WebSocketListenerSubject;
}(Subject_1.Subject));
exports.WebSocketListenerSubject = WebSocketListenerSubject;
//# sourceMappingURL=WebSocketListenerSubject.js.map