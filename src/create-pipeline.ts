import { ApolloError } from 'apollo-server-core';
import { GraphQLResolveInfo } from 'graphql';
import { ITreeNode } from '.';
import { IField } from './models';

import {
    parseResolveInfo,
    simplifyParsedResolveInfoFragmentWithType,
} from './parse-resolve-info';

function fillPipeline(fields: { [key: string]: IField }, pipeline: Array<{  }>, context: {}, path = '') {
    Object.keys(fields).forEach(fieldName => {
        const field = fields[fieldName];
        const { alias, apongo = {} } = field;

        // `lookup` performs a lookup stage
        if (apongo.lookup) {
            let lookup;
            const { collection, localField, foreignField, preserveNull, conds, sort, limit } =
                apongo.lookup;
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
                                        ...(conds ? JSON.parse(conds) : []),
                                    ],
                                },
                            },
                        },

                        ...(sort ? [{ $sort: JSON.parse(sort) }] : []),
                        ...(limit ? [{ $limit: limit }] : []),
                    ],
                };
            }

            const preserveNullAndEmptyArrays = preserveNull !== undefined ? preserveNull : false;

            pipeline.push({ $lookup: { ...lookup, as: `${path}${alias}` } });
            pipeline.push({ $unwind: { path: `$${path}${alias}`, preserveNullAndEmptyArrays } });
        }

        // `compose` concatenates the arguments passed in.
        // Auguments prefixed by $ are modified to include the ancestor path
        if (apongo.compose && apongo.compose.length > 0) {
            pipeline.push({
                $addFields: {
                    [`${path}${alias}`]: {
                        $ifNull: [
                            {
                                $concat: apongo.compose.map((str: string) =>
                                    str.startsWith('$')
                                        ? `$${path}${str.slice(1, str.length)}`
                                        : str,
                                ),
                            },
                            '$$REMOVE',
                        ],
                    },
                },
            });
        }

        // Assigns the result of a mongo expression to the field
        // Occurrences of `@path.` in the argument are replaced with ancestor path.
        if (apongo.expr) {
            const e = JSON.parse(apongo.expr.replace('@path.', path));
            pipeline.push({
                $addFields: {
                    [`${path}${alias}`]: { $ifNull: [e, '$$REMOVE'] },
                },
            });
        }

        const fieldsByTypeNameKeys = Object.keys(field.fieldsByTypeName);
        if (fieldsByTypeNameKeys.length > 0) {
            if (fieldsByTypeNameKeys.length > 1)
                throw new ApolloError(
                    `Unable to handle join return type with multiple types (${fieldsByTypeNameKeys.join(
                        ', ',
                    )})`,
                );
            const subFields = field.fieldsByTypeName[fieldsByTypeNameKeys[0]];
            fillPipeline(subFields, pipeline, context, `${path}${alias}.`);
        }

        // FIXME: figure out what this is supposed to do, and arrange for it, now it just borks the results
        // // If the parent didn't exist at all before compose or expr was called then we'll end up with an empty object.
        // // If that's the case then we remove it.
        // if ((apongo.lookup || apongo.compose || apongo.expr) && path) {
        //     const parent = path.slice(0, -1);
        //     pipeline.push({
        //         $addFields: {
        //             [parent]: { $cond: [{ $ne: [`$${parent}`, {}] }, `$${parent}`, '$$REMOVE'] },
        //         },
        //     });
        // }
    });
}

export function createPipeline(mainField: string, resolveInfo: GraphQLResolveInfo, context: {}) {
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

    const pipeline = [] as Array<{  }>;
    fillPipeline(fields, pipeline, context);

    return pipeline;
}
