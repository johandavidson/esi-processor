import { DomElement } from 'domhandler';
import { Process } from './process';
import { EsiProcessorOptions } from '../common/types';

export const ProcessOther = async (element: DomElement, options?: EsiProcessorOptions): Promise<DomElement[]> => {
    if (element.children && element.children.length > 0) {
        element.children = await Process(options, ...element.children);
    }
    return [element];
};
