import { DomElement } from 'domhandler';
import { Process } from './process';
import { EsiProcessorOptions } from '../common/types';
import { Request } from 'express';

export const ProcessOther = async (element: DomElement, options?: EsiProcessorOptions, req?: Request): Promise<DomElement[]> => {
    if (element.children && element.children.length > 0) {
        element.children = await Process(options, req, ...element.children);
    }
    return [element];
};
