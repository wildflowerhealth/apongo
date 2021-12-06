"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Apongo = void 0;
const type_graphql_1 = require("type-graphql");
/** add apongo metadata to an entity */
function Apongo(lookup, compose = [], expr) {
    // factory returns the actual decoration function.
    return function (target) {
        (0, type_graphql_1.Extensions)({
            apongo: {
                lookup,
                compose,
                expr,
            },
        })(target);
    };
}
exports.Apongo = Apongo;
//# sourceMappingURL=decorator.js.map