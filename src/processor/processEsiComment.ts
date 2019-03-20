import { DomElement } from "domhandler";

export const ProcessEsiComment = (element: DomElement): DomElement[] => {
    return [{ type: 'comment', data: 'esi:comment' }];
}