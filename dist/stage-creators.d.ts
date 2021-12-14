export declare function createRemoveEmptyObjectStagesForNestedPath(path: string): {
    $addFields: {
        [x: string]: {
            $cond: {
                if: {
                    $eq: {}[];
                };
                then: string;
                else: string;
            };
        };
    };
}[];
