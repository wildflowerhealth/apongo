import { IField, IResolverInfo } from './models';
export declare function parseResolveInfo(resolveInfo: IResolverInfo, options?: {
    deep?: boolean;
    keepRoot?: boolean;
}): any;
export declare function simplifyParsedResolveInfoFragmentWithType(parsedResolveInfoFragment: {
    fieldsByTypeName: any;
}, type: undefined): {
    fields: {
        [key: string]: IField;
    };
    fieldsByTypeName: any;
};
