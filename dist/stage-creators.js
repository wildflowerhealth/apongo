"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createRemoveEmptyObjectStagesForNestedPath = void 0;
function createRemoveEmptyObjectStage(path) {
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
    };
}
function createRemoveEmptyObjectStagesForNestedPath(path) {
    const stages = [];
    const pathParts = path.split('.');
    for (let i = pathParts.length; i > 0; i--) {
        const partialPath = pathParts.slice(0, i).join('.');
        const stage = createRemoveEmptyObjectStage(partialPath);
        stages.push(stage);
    }
    return stages;
}
exports.createRemoveEmptyObjectStagesForNestedPath = createRemoveEmptyObjectStagesForNestedPath;
//# sourceMappingURL=stage-creators.js.map