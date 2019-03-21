import { DomElement } from 'domhandler';
import { EsiProcessorOptions } from '../common/types';
import { Request } from 'express';
import { ParseVars } from '../common/parseVars';

export const ProcessEsiVars = (element: DomElement, options?: EsiProcessorOptions, request?: Request): DomElement[] => {
    for (let i = 0; i < element.children.length; i++) {
        element.children[i] = ParseVars(element.children[i], request);
    }
    return element.children;
};

