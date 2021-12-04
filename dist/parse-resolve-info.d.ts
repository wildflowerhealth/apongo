import { GraphQLOutputType, GraphQLResolveInfo } from 'graphql';
import { IField } from './models';
export declare function parseResolveInfo(resolveInfo: GraphQLResolveInfo, options?: {
    deep?: boolean;
    keepRoot?: boolean;
}): any;
export declare function simplifyParsedResolveInfoFragmentWithType(parsedResolveInfoFragment: {
    fieldsByTypeName: any;
}, type: GraphQLOutputType): {
    fields: {
        [key: string]: IField;
    };
    fieldsByTypeName: any;
};
