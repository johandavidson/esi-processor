import { DomElement } from "domhandler";

export const ProcessEsiRemove = (element: DomElement): DomElement[] => {
    return [{ type: 'comment', data: 'esi:remove' }];
}