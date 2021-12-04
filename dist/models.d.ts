import { GraphQLObjectType, GraphQLSchema } from "graphql";
export interface ILookup {
    collection: string;
    localField: string;
    foreignField: string;
    preserveNull: string;
    conds: string;
    sort: string;
    limit: string;
}
export interface IField {
    alias: string;
    apongo?: {
        lookup?: ILookup;
        compose?: string[];
        expr?: string;
    };
    fieldsByTypeName: {
        [key: string]: {
            [key: string]: IField;
        };
    };
}
export interface IResolverInfo {
    variableValues: {
        [key: string]: any;
    };
    schema: GraphQLSchema;
    fragments: {
        [key: string]: any;
    };
    fieldNodes: IAbstractSyntaxTree[];
    fieldASTs: IAbstractSyntaxTree[];
    parentType: GraphQLObjectType;
    returnType: undefined;
}
export interface IArgument {
    name: {
        value: string;
    };
    kind: 'Variable' | 'BooleanValue';
    value: any;
}
export interface ITypeCondition {
    name: {
        value: string;
    };
    kind: 'NamedType';
}
export interface IDirective {
    name: {
        value: string;
    };
    arguments: IArgument[];
}
export interface IAbstractSyntaxTree {
    name: {
        value: string;
    };
    alias: {
        value: string;
    };
    kind: 'Field';
    directives: IDirective[];
    selectionSet: {
        selections: IAbstractSyntaxTree[];
    };
    typeCondition: ITypeCondition;
}
