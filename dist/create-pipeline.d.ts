import { GraphQLResolveInfo } from 'graphql';
import { Logger } from 'pino';
export declare function createPipeline(mainField: string, resolveInfo: GraphQLResolveInfo, replaceTokens?: (str: string) => Promise<string>, log?: Logger): Promise<{}[]>;
