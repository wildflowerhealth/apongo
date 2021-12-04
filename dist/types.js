"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.apongoDirective = void 0;
const utils_1 = require("@graphql-tools/utils");
const graphql_tag_1 = __importDefault(require("graphql-tag"));
const _apongoTypes = (0, graphql_tag_1.default) `
    input ApongoLookup {
        collection: String!
        localField: String!
        foreignField: String!
        preserveNull: Boolean
        conds: String
        sort: String
        limit: Int
    }

    directive @apongo(lookup: ApongoLookup, compose: [String!], expr: String) on FIELD_DEFINITION
`;
function apongoDirective(directiveName = 'apongo') {
    return {
        apongoDirectiveTypeDefs: `
            input ApongoLookup {
                collection: String!
                localField: String!
                foreignField: String!
                preserveNull: Boolean
                conds: String
                sort: String
                limit: Int
            }
            
            directive @${directiveName}(lookup: ApongoLookup, compose: [String!], expr: String) on FIELD_DEFINITION
        `,
        apongoDirectiveTransformer: (schema) => (0, utils_1.mapSchema)(schema, {
            [utils_1.MapperKind.OBJECT_FIELD]: (fieldConfig, _fieldName, typeName) => {
                var _a;
                const apongoDirective = (_a = (0, utils_1.getDirective)(schema, fieldConfig, 'apongo')) === null || _a === void 0 ? void 0 : _a[0];
                if (apongoDirective && fieldConfig.astNode) {
                    fieldConfig.astNode.apongo = apongoDirective;
                }
                return fieldConfig;
            },
        }),
    };
}
exports.apongoDirective = apongoDirective;
//# sourceMappingURL=types.js.map