import { DomElement } from 'domhandler';
import { Process } from './process';
import { EsiProcessorOptions } from '../common/types';

export const ProcessEsiRenderWithoutProcessing = async (rwpElement: DomElement, options?: EsiProcessorOptions): Promise<DomElement[]> => {
    await Process(options, ...rwpElement.children);
    return rwpElement.children;
};
