import { createCommentNode, DomElement } from '../common/dom';

export const ProcessEsiRemove = (element: DomElement): DomElement[] => {
    return [createCommentNode('esi:remove')];
};