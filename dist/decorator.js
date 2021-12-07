"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Apongo = void 0;
const type_graphql_1 = require("type-graphql");
function Apongo(lookup, compose = [], expr) {
    // factory returns the actual decoration function.
    return function (target, propertyKey, descriptor) {
        (0, type_graphql_1.Extensions)({
            apongo: {
                lookup,
                compose,
                expr,
            },
        })(target, propertyKey, descriptor);
    };
}
exports.Apongo = Apongo;
//# sourceMappingURL=decorator.js.map