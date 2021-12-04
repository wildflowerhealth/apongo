import { GraphQLSchema } from 'graphql';
export declare function apongoDirective(directiveName?: string): {
    apongoDirectiveTypeDefs: string;
    apongoDirectiveTransformer: (schema: GraphQLSchema) => GraphQLSchema;
};
