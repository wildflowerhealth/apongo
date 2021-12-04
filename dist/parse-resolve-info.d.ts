import { GraphQLOutputType, GraphQLResolveInfo } from 'graphql';
import { IField, ITreeNode } from './models';
export declare function parseResolveInfo(resolveInfo: GraphQLResolveInfo, options?: {
    deep?: boolean;
    keepRoot?: boolean;
}): ITreeNode | null;
export declare function simplifyParsedResolveInfoFragmentWithType(parsedResolveInfoFragment: ITreeNode, type: GraphQLOutputType): {
    fields: {
        [key: string]: IField;
    };
    name?: string | undefined;
    alias?: string | undefined;
    args?: {
        [arg: string]: any;
    } | undefined;
    apongo?: import("./models").IApongo | undefined;
    fieldsByTypeName?: ITreeNode | undefined;
    types: {
        [typeName: string]: {
            fields: {
                [fieldName: string]: ITreeNode;
            };
        };
    };
};
