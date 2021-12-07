import { IApongoLookup } from './models';
/** add apongo metadata to an entity */
export declare function Apongo(lookup: IApongoLookup, compose?: string[], expr?: string): (target: Object, propertyKey: string | symbol, descriptor: TypedPropertyDescriptor<unknown>) => void;
