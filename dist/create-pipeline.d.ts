import { GraphQLResolveInfo } from 'graphql';
import { Logger } from 'pino';
export declare function createPipeline<TCondArg = any>(mainField: string, resolveInfo: GraphQLResolveInfo, condArg?: TCondArg, log?: Logger): Promise<{}[]>;
