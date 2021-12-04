export interface IApongo {
    lookup?: IApongoLookup;
    compose?: string[];
    expr?: string;
}
export interface IApongoLookup {
    collection: string;
    localField: string;
    foreignField: string;
    preserveNull?: boolean;
    conds?: string;
    sort?: string;
    limit?: number;
}
export interface ITreeNode {
    name?: string;
    alias?: string;
    args?: {
        [arg: string]: any;
    };
    apongo?: IApongo;
    fieldsByTypeName?: ITreeNode;
    types: {
        [typeName: string]: {
            fields: {
                [fieldName: string]: ITreeNode;
            };
        };
    };
}
export interface IField {
    alias: string;
    apongo?: IApongo;
    fieldsByTypeName: {
        [key: string]: {
            [key: string]: IField;
        };
    };
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
