import { FieldNode, GraphQLOutputType, GraphQLResolveInfo, SelectionNode } from 'graphql';

import { getNamedType, isCompositeType, GraphQLObjectType, GraphQLUnionType } from 'graphql';
import { getArgumentValues } from 'graphql/execution/values';
import { ITreeTypes } from '.';
import { IArgument, IField, ITreeNode, ITypeCondition } from './models';

function getArgVal(resolveInfo: GraphQLResolveInfo, argument: IArgument) {
    if (argument.kind === 'Variable') {
        return resolveInfo.variableValues[argument.name.value];
    }
    if (argument.kind === 'BooleanValue') {
        return argument.value;
    }

    return null;
}

function firstKey(obj: { [key: string]: any }) {
    for (const key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) {
            return key;
        }
    }

    return null;
}

function getType(resolveInfo: GraphQLResolveInfo, typeCondition: ITypeCondition) {
    const { schema } = resolveInfo;
    const { kind, name } = typeCondition;
    if (kind === 'NamedType') {
        const typeName = name.value;
        return schema.getType(typeName);
    }

    return null;
}

function skipField(resolveInfo: GraphQLResolveInfo, { directives }: SelectionNode) {
    let skip = false;
    (directives ?? []).forEach(directive => {
        const directiveName = directive.name.value;
        if (Array.isArray(directive.arguments)) {
            const ifArgumentAst = directive.arguments.find(
                arg => arg.name && arg.name.value === 'if',
            );
            if (ifArgumentAst) {
                const argumentValueAst = ifArgumentAst.value;
                if (directiveName === 'skip') {
                    skip = skip || getArgVal(resolveInfo, argumentValueAst);
                } else if (directiveName === 'include') {
                    skip = skip || !getArgVal(resolveInfo, argumentValueAst);
                }
            }
        }
    });
    return skip;
}

function getFieldFromAST(ast: FieldNode, parentType: GraphQLObjectType) {
    if (ast.kind === 'Field') {
        const fieldNode = ast;
        const fieldName = fieldNode.name.value;
        if (!(parentType instanceof GraphQLUnionType)) {
            const type = parentType;
            return type.getFields()[fieldName];
        }
        // XXX: TODO: Handle GraphQLUnionType
    }
    return undefined;
}

function fieldTreeFromAST(
    inASTs: readonly SelectionNode[],
    resolveInfo: GraphQLResolveInfo,
    initTree: ITreeTypes = {},
    options: { deep?: boolean } = {},
    parentType: GraphQLObjectType,
) {
    console.log(JSON.stringify({ level: 40, fieldTreeFromAST: parentType?.name }));
    const { variableValues } = resolveInfo;
    const fragments = resolveInfo.fragments || {};
    const asts: readonly SelectionNode[] = Array.isArray(inASTs) ? inASTs : [inASTs];

    initTree[parentType.name] = initTree[parentType.name] || {};

    return asts.reduce((tree, selectionVal) => {
        if (!skipField(resolveInfo, selectionVal)) {
            if (selectionVal.kind === 'Field') {
                const val = selectionVal;
                const name = val.name && val.name.value;
                const isReserved = name && name !== '__id' && name.substr(0, 2) === '__';
                if (!isReserved) {
                    const alias = val.alias && val.alias.value ? val.alias.value : val.name.value;
                    const field = getFieldFromAST(val, parentType);
                    if (!field) {
                        return tree;
                    }

                    const fieldGqlTypeOrUndefined = getNamedType(field.type);
                    if (!fieldGqlTypeOrUndefined) {
                        return tree;
                    }
                    const fieldGqlType = fieldGqlTypeOrUndefined;
                    const args = getArgumentValues(field, val, variableValues) || {};
                    if (parentType.name && !tree[parentType.name][alias]) {
                        console.log(`field ${field.name} extensions`, parentType.getFields()[field.name].extensions)
                        const { apongo } = parentType.getFields()[field.name].extensions ?? {};
                        const newTreeRoot = {
                            name,
                            alias,
                            args,
                            apongo,
                            fieldsByTypeName: isCompositeType(fieldGqlType)
                                ? { [fieldGqlType.name]: {} }
                                : {},
                        };

                        tree[parentType.name][alias] = newTreeRoot;
                    }

                    const { selectionSet } = val;
                    if (selectionSet != null && options.deep && isCompositeType(fieldGqlType)) {
                        const newParentType = fieldGqlType;
                        fieldTreeFromAST(
                            selectionSet.selections,
                            resolveInfo,
                            tree[parentType.name][alias].fieldsByTypeName,
                            options,
                            newParentType as GraphQLObjectType,
                        );
                    }
                }
            } else if (selectionVal.kind === 'FragmentSpread' && options.deep) {
                const val = selectionVal;
                const name = val.name && val.name.value;
                const fragment = fragments[name];
                let fragmentType = parentType;
                if (fragment.typeCondition) {
                    fragmentType = getType(
                        resolveInfo,
                        fragment.typeCondition,
                    ) as GraphQLObjectType;
                }

                if (fragmentType && isCompositeType(fragmentType)) {
                    const newParentType = fragmentType;
                    fieldTreeFromAST(
                        fragment.selectionSet.selections,
                        resolveInfo,
                        tree,
                        options,
                        newParentType,
                    );
                }
            } else if (selectionVal.kind === 'InlineFragment' && options.deep) {
                const val = selectionVal;
                const fragment = val;
                let fragmentType = parentType;
                if (fragment.typeCondition) {
                    fragmentType = getType(
                        resolveInfo,
                        fragment.typeCondition,
                    ) as GraphQLObjectType;
                }

                if (fragmentType && isCompositeType(fragmentType)) {
                    const newParentType = fragmentType;
                    fieldTreeFromAST(
                        fragment.selectionSet.selections,
                        resolveInfo,
                        tree,
                        options,
                        newParentType,
                    );
                }
            }
        }

        return tree;
    }, initTree);
}

export function parseResolveInfo(
    resolveInfo: GraphQLResolveInfo,
    options: { deep?: boolean; keepRoot?: boolean } = {},
) {
    const fieldNodes =
        resolveInfo.fieldNodes ||
        // is this needed 🤨
        (resolveInfo as unknown as { fieldASTs: readonly FieldNode[] }).fieldASTs;

    const { parentType } = resolveInfo;
    if (!fieldNodes) {
        throw new Error('No fieldNodes provided!');
    }

    if (options.keepRoot == null) {
        options.keepRoot = false;
    }

    if (options.deep == null) {
        options.deep = true;
    }

    const tree = fieldTreeFromAST(fieldNodes, resolveInfo, undefined, options, parentType);

    if (!options.keepRoot) {
        const typeKey = firstKey(tree);
        if (!typeKey) {
            return null;
        }
        console.log(JSON.stringify({ level: 40, tree, typeKey }));
        const fields = tree[typeKey];
        const fieldKey = firstKey(fields);
        if (!fieldKey) {
            return null;
        }

        return fields[fieldKey];
    }
    return tree;
}

export function simplifyParsedResolveInfoFragmentWithType(
    parsedResolveInfoFragment: ITreeNode,
    type: GraphQLOutputType,
) {
    const { fieldsByTypeName } = parsedResolveInfoFragment;
    const fields = {} as { [key: string]: IField };
    const strippedType = getNamedType(type);
    if (isCompositeType(strippedType)) {
        Object.assign(fields, fieldsByTypeName?.[strippedType.name]);
        if (strippedType instanceof GraphQLObjectType) {
            const objectType = strippedType;
            // GraphQL ensures that the subfields cannot clash, so it's safe to simply overwrite them
            objectType.getInterfaces().forEach(anInterface => {
                Object.assign(fields, fieldsByTypeName?.[anInterface.name]);
            });
        }
    }

    return {
        ...parsedResolveInfoFragment,
        fields,
    };
}
