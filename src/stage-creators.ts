function createRemoveEmptyObjectStage(path: string) {
    return {
        $addFields: {
            [path]: {
                $cond: {
                    if: { $eq: [{}, `$${path}`] },
                    then: '$$REMOVE',
                    else: `$${path}`,
                },
            },
        },
    }
}

export function createRemoveEmptyObjectStagesForNestedPath(path: string) {
    const stages = [];
    const pathParts = path.split('.');

    for (let i = pathParts.length; i > 0; i--) {
        const partialPath = pathParts.slice(0, i).join('.');
        const stage = createRemoveEmptyObjectStage(partialPath);
        stages.push(stage);
    }

    return stages;
}