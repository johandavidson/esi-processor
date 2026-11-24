import { createCommentNode, DomElement } from '../common/dom';

export const ProcessEsiComment = (element: DomElement): DomElement[] => {
    return [createCommentNode('esi:comment')];
};