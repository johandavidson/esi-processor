import { DomElement, getChildNodes } from '../common/dom';
import { EsiProcessorOptions } from '../common/types';
import { Request } from 'express';
import { ParseVars } from '../common/parseVars';

export const ProcessEsiVars = (element: DomElement, options?: EsiProcessorOptions, request?: Request): DomElement[] => {
    const children = getChildNodes(element);
    for (let i = 0; i < children.length; i++) {
        children[i] = ParseVars(children[i], request);
    }
    return children;
};
