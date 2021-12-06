import { mapSchema, getDirective, MapperKind } from '@graphql-tools/utils';
import { Extensions } from 'type-graphql';
import { IApongoLookup } from './models';

/** add apongo metadata to an entity */
export function Apongo(lookup: IApongoLookup, compose: string[] = [], expr?: string): Function {
    // factory returns the actual decoration function.
    return function (target: Function): void {
        Extensions({
            apongo: {
                lookup,
                compose,
                expr,
            },
        })(target);
    };
}
