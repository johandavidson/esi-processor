import { DomElement, getChildNodes, setChildNodes } from '../common/dom';
import { Process } from './process';
import { EsiProcessorOptions } from '../common/types';
import { Request } from 'express';

export const ProcessOther = async (element: DomElement, options?: EsiProcessorOptions, req?: Request): Promise<DomElement[]> => {
    const children = getChildNodes(element);
    if (children.length > 0) {
        setChildNodes(element, await Process(options, req, ...children));
    }
    return [element];
};
