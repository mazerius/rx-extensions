"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var noop_1 = require("./noop");
function pipe() {
    var fns = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        fns[_i] = arguments[_i];
    }
    return pipeFromArray(fns);
}
exports.pipe = pipe;
function pipeFromArray(fns) {
    for (var i = 0; i < fns.length; i++) {
    }
    if (!fns) {
        return noop_1.noop;
    }
    if (fns.length === 1) {
        return fns[0];
    }
    return function piped(input, context) {
        return fns.reduce(function (prev, fn) { return fn(prev, context); }, input);
    };
}
exports.pipeFromArray = pipeFromArray;
//# sourceMappingURL=pipe.js.map