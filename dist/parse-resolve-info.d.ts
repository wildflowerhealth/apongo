import { GraphQLOutputType, GraphQLResolveInfo } from 'graphql';
import { ITreeTypes } from '.';
import { IField, ITreeNode } from './models';
export declare function parseResolveInfo(resolveInfo: GraphQLResolveInfo, options?: {
    deep?: boolean;
    keepRoot?: boolean;
}): ITreeNode | ITreeTypes | null;
export declare function simplifyParsedResolveInfoFragmentWithType(parsedResolveInfoFragment: ITreeNode, type: GraphQLOutputType): {
    fields: {
        [key: string]: IField;
    };
    name?: string | undefined;
    alias?: string | undefined;
    args?: {
        [arg: string]: any;
    } | undefined;
    apongo?: import("./models").IApongo<any> | undefined;
    fieldsByTypeName?: ITreeTypes | undefined;
};
