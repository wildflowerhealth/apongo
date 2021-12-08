"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createPipeline = void 0;
const apollo_server_core_1 = require("apollo-server-core");
const parse_resolve_info_1 = require("./parse-resolve-info");
function fillPipeline(fields, pipeline, context, path = '', log, oneToMany = false) {
    Object.keys(fields).forEach(fieldName => {
        const field = fields[fieldName];
        const { alias, apongo = {} } = field;
        // `lookup` performs a lookup stage
        if (apongo.lookup) {
            if (oneToMany) {
                throw new apollo_server_core_1.ApolloError(`Apongo: Cannot use lookup on a one-to-many field at: ${path}.${alias}`);
            }
            let lookup;
            const { collection, localField, foreignField, preserveNull, conds, sort, limit, } = apongo.lookup;
            oneToMany = !!apongo.lookup.oneToMany;
            const simple = !conds && !sort && !limit;
            if (simple) {
                lookup = {
                    from: collection,
                    localField: `${path}${localField}`,
                    foreignField: foreignField,
                };
            }
            else {
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
            const preserveNullAndEmptyArrays = preserveNull !== undefined ? preserveNull : true;
            pipeline.push({ $lookup: Object.assign(Object.assign({}, lookup), { as: `${path}${alias}` }) });
            if (!oneToMany) {
                pipeline.push({ $unwind: { path: `$${path}${alias}`, preserveNullAndEmptyArrays } }, {
                    $project: {
                        [`${path}${alias}`]: {
                            $cond: [
                                { $eq: [`$${path}${alias}`, {}] },
                                null,
                                `$${path}${alias}`,
                            ],
                        },
                    },
                });
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
                throw new apollo_server_core_1.ApolloError(`Unable to handle join return type with multiple types (${fieldsByTypeNameKeys.join(', ')})`);
            // if (oneToMany) {
            //     pipeline.push({
            //         $unwind: { path: `$${path}${alias}`, preserveNullAndEmptyArrays: true },
            //     });
            // }
            const subFields = field.fieldsByTypeName[fieldsByTypeNameKeys[0]];
            fillPipeline(subFields, pipeline, context, `${path}${alias}.`, log, oneToMany);
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
    });
}
function createPipeline(mainField, resolveInfo, context, log) {
    const parsedResolveInfoFragment = (0, parse_resolve_info_1.parseResolveInfo)(resolveInfo);
    let { fields } = (0, parse_resolve_info_1.simplifyParsedResolveInfoFragmentWithType)(parsedResolveInfoFragment, resolveInfo.returnType);
    if (mainField) {
        const field = fields[mainField];
        const fieldsByTypeNameKeys = Object.keys(field.fieldsByTypeName);
        if (fieldsByTypeNameKeys.length === 0)
            return [];
        if (fieldsByTypeNameKeys.length > 1)
            throw new apollo_server_core_1.ApolloError(`Unable to handle join return type with multiple types (${fieldsByTypeNameKeys.join(', ')})`);
        fields = field.fieldsByTypeName[fieldsByTypeNameKeys[0]];
    }
    const pipeline = [];
    fillPipeline(fields, pipeline, context, undefined, log);
    if (log)
        log.debug({ pipeline, fields }, 'Apongo: createPipeline');
    return pipeline;
}
exports.createPipeline = createPipeline;
//# sourceMappingURL=create-pipeline.js.map