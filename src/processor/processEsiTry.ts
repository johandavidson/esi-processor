import { createCommentNode, DomElement, getChildNodes, isTagNode } from '../common/dom';
import { EsiProcessorOptions } from '../common/types';
import { Request } from 'express';
import { Process } from './process';

export const ProcessEsiTry = async (tryElement: DomElement, options?: EsiProcessorOptions, req?: Request): Promise<DomElement[]> => {
    const children = getChildNodes(tryElement);
    const attemptElement = children.find((element) => isTagNode(element) && element.name === 'esi:attempt');
    const exceptElement = children.find((element) => isTagNode(element) && element.name === 'esi:except');

    if (attemptElement) {
        try {
            const attemptResult = await Process(options, req, ...getChildNodes(attemptElement));
            if (attemptResult.length > 0) {
                return attemptResult;
            }
        } catch {
            // fallback to esi:except
        }
    }

    if (exceptElement) {
        return await Process(options, req, ...getChildNodes(exceptElement));
    }

    return [createCommentNode('esi:try without content')];
};
