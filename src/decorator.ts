import { mapSchema, getDirective, MapperKind } from '@graphql-tools/utils';
import { Extensions } from 'type-graphql';
import { IApongoLookup } from './models';

/** add apongo metadata to an entity */
export function Apongo(lookup: IApongoLookup, compose: string[] = [], expr?: string) {
    // factory returns the actual decoration function.
    return function (target: Object, propertyKey: string | symbol, descriptor: TypedPropertyDescriptor<unknown>): void {
        Extensions({
            apongo: {
                lookup,
                compose,
                expr,
            },
        })(target, propertyKey, descriptor);
    };
}
