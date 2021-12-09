import { IApongoLookup } from './models';
/** add apongo metadata to an entity */
export declare function Apongo<TCondArg = any>(lookup: IApongoLookup<TCondArg>, compose?: string[]): PropertyDecorator;
