import { ApolloError } from 'apollo-server-core';
import { GraphQLResolveInfo } from 'graphql';
import { ITreeNode } from '.';
import { IField } from './models';
import { Logger } from 'pino';
import { parseResolveInfo, simplifyParsedResolveInfoFragmentWithType } from './parse-resolve-info';
import { createRemoveEmptyObjectStagesForNestedPath } from './stage-creators';

async function fillPipeline<TCondArg = any>(
    fields: { [key: string]: IField },
    pipeline: Array<{}>,
    condArg?: TCondArg,
    path = '',
    log?: Logger,
    oneToMany = false,
) {
    for (const fieldName of Object.keys(fields)) {
        const field = fields[fieldName];
        const { alias, apongo = {} } = field;

        // `lookup` performs a lookup stage
        if (apongo.lookup) {
            if (oneToMany) {
                throw new ApolloError(
                    `Apongo: Cannot use lookup on a one-to-many field at: ${path}.${alias}`,
                );
            }
            let lookup;
            const { collection, localField, foreignField, preserveNull, conds, sort, limit } =
                apongo.lookup;
            oneToMany = !!apongo.lookup.oneToMany || (limit ?? 0) > 1 || (!!sort && !limit);
            const simple = !conds && !sort && !limit;

            if (simple) {
                lookup = {
                    from: collection,
                    localField: `${path}${localField}`,
                    foreignField: foreignField,
                };
            } else {
                lookup = {
                    from: collection,
                    let: { localField: `$${path}${localField}` },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $and: [
                                        { $eq: [`$${foreignField}`, '$$localField'] },
                                        ...(conds ? await conds(condArg) : []),
                                    ],
                                },
                            },
                        },

                        ...(sort ? [{ $sort: JSON.parse(sort) }] : []),
                        ...(limit ? [{ $limit: limit }] : []),
                    ],
                };
            }

            const preserveNullAndEmptyArrays = preserveNull !== undefined ? preserveNull : true;

            pipeline.push({ $lookup: { ...lookup, as: `${path}${alias}` } });

            if (!oneToMany) {
                pipeline.push({ $unwind: { path: `$${path}${alias}`, preserveNullAndEmptyArrays } });
                pipeline.push(...createRemoveEmptyObjectStagesForNestedPath(`${path}${alias}`));
            }
        }

        // // `compose` concatenates the arguments passed in.
        // // Auguments prefixed by $ are modified to include the ancestor path
        // if (apongo.compose && apongo.compose.length > 0) {
        //     pipeline.push({
        //         $project: {
        //             [`${path}${alias}`]: {
        //                 $ifNull: [
        //                     {
        //                         $concat: apongo.compose.map((str: string) =>
        //                             str.startsWith('$')
        //                                 ? `$${path}${str.slice(1, str.length)}`
        //                                 : str,
        //                         ),
        //                     },
        //                     '$$REMOVE',
        //                 ],
        //             },
        //         },
        //     });
        // }

        // // Assigns the result of a mongo expression to the field
        // // Occurrences of `@path.` in the argument are replaced with ancestor path.
        // if (apongo.expr) {
        //     const e = JSON.parse(apongo.expr.replace('@path.', path));
        //     pipeline.push({
        //         $project: {
        //             [`${path}${alias}`]: { $ifNull: [e, '$$REMOVE'] },
        //         },
        //     });
        // }

        const fieldsByTypeNameKeys = Object.keys(field.fieldsByTypeName);
        if (fieldsByTypeNameKeys.length > 0) {
            if (fieldsByTypeNameKeys.length > 1)
                throw new ApolloError(
                    `Unable to handle join return type with multiple types (${fieldsByTypeNameKeys.join(
                        ', ',
                    )})`,
                );
            // if (oneToMany) {
            //     pipeline.push({
            //         $unwind: { path: `$${path}${alias}`, preserveNullAndEmptyArrays: true },
            //     });
            // }
            const subFields = field.fieldsByTypeName[fieldsByTypeNameKeys[0]];
            await fillPipeline(subFields, pipeline, condArg, `${path}${alias}.`, log, oneToMany);
            // if (oneToMany) {
            //     pipeline.push({
            //         $group: {},
            //     });
            // }
        }

        // // If the parent didn't exist at all before compose or expr was called then we'll end up with an empty object.
        // // If that's the case then we remove it.
        // if ((apongo.lookup || apongo.compose || apongo.expr) && path) {
        //     const parent = path.slice(0, -1);
        //     pipeline.push({
        //         $project: {
        //             [parent]: { $cond: [{ $ne: [`$${parent}`, {}] }, `$${parent}`, null] },
        //         },
        //     });
        // }
    }
}

export async function createPipeline<TCondArg = any>(
    mainField: string,
    resolveInfo: GraphQLResolveInfo,
    condArg?: TCondArg,
    log?: Logger,
) {
    const parsedResolveInfoFragment = parseResolveInfo(resolveInfo);

    let { fields } = simplifyParsedResolveInfoFragmentWithType(
        parsedResolveInfoFragment as ITreeNode,
        resolveInfo.returnType,
    );

    if (mainField) {
        const field = fields[mainField];
        const fieldsByTypeNameKeys = Object.keys(field.fieldsByTypeName);
        if (fieldsByTypeNameKeys.length === 0) return [];
        if (fieldsByTypeNameKeys.length > 1)
            throw new ApolloError(
                `Unable to handle join return type with multiple types (${fieldsByTypeNameKeys.join(
                    ', ',
                )})`,
            );
        fields = field.fieldsByTypeName[fieldsByTypeNameKeys[0]];
    }

    const pipeline = [] as Array<{}>;
    await fillPipeline(fields, pipeline, condArg, undefined, log);
    if (log) log.debug({ pipeline, fields }, 'Apongo: createPipeline');

    return pipeline;
}
