import { DomElement } from 'domhandler';
import { Process } from './process';
import { EsiProcessorOptions } from '../common/types';
import { Request } from 'express';

export const ProcessEsiRenderWithoutProcessing = async (rwpElement: DomElement, options?: EsiProcessorOptions, req?: Request): Promise<DomElement[]> => {
    await Process(options, req, ...rwpElement.children);
    return rwpElement.children;
};
