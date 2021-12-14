export interface IApongo<TCondArg = any> {
    lookup?: IApongoLookup<TCondArg>;
    compose?: string[];
    expr?: string;
}
export interface IApongoLookup<TCondArg = any> {
    collection: string;
    localField: string;
    foreignField: string;
    oneToMany?: boolean;
    preserveNull?: boolean;
    conds?: (arg: TCondArg) => object[];
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
    fieldsByTypeName?: ITreeTypes;
}
export interface ITreeTypes {
    [typeName: string]: {
        [fieldName: string]: ITreeNode;
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
