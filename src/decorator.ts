import { mapSchema, getDirective, MapperKind } from '@graphql-tools/utils';
import { Extensions } from 'type-graphql';
import { IApongoLookup } from './models';

/** add apongo metadata to an entity */
export function Apongo<TCondArg = any>(lookup: IApongoLookup<TCondArg>, compose?: string[]): PropertyDecorator;
export function Apongo<TCondArg = any>(lookup: IApongoLookup<TCondArg>, compose: string[] = [], expr?: string): MethodDecorator {
    // factory returns the actual decoration function.
    return function (target, propertyKey, descriptor): void {
        Extensions({
            apongo: {
                lookup,
                compose,
                expr,
            },
        })(target, propertyKey, descriptor);
    };
}
