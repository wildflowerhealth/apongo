import { mapSchema, getDirective, MapperKind } from '@graphql-tools/utils';
import { GraphQLSchema } from 'graphql';
import gql from 'graphql-tag';

const _apongoTypes = gql`
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

export function apongoDirective(directiveName = 'apongo') {
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

        apongoDirectiveTransformer: (schema: GraphQLSchema) =>
            mapSchema(schema, {
                [MapperKind.OBJECT_FIELD]: (fieldConfig, _fieldName, typeName) => {
                    const apongoDirective = getDirective(schema, fieldConfig, 'apongo')?.[0];
                    if (apongoDirective && fieldConfig.astNode) {
                        (fieldConfig.astNode as any).apongo = apongoDirective;
                    }
                    return fieldConfig;
                },
            }),
    };
}
