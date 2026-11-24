import { DomElement, getChildNodes } from '../common/dom';
import { Process } from './process';
import { EsiProcessorOptions } from '../common/types';
import { Request } from 'express';

export const ProcessEsiRenderWithoutProcessing = async (rwpElement: DomElement, options?: EsiProcessorOptions, req?: Request): Promise<DomElement[]> => {
    const children = getChildNodes(rwpElement);
    await Process(options, req, ...children);
    return children;
};
