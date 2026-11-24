import { DomElement, isTagNode } from '../common/dom';
import { ProcessEsiRemove } from './processEsiRemove';
import { ProcessOther } from './processOther';
import { ProcessEsiRenderWithoutProcessing } from './processEsiRemoveWithoutProcessing';
import { ProcessEsiChoose } from './processEsiChoose';
import { ProcessEsiInclude } from './processEsiInclude';
import { ProcessEsiComment } from './processEsiComment';
import { EsiProcessorOptions } from '../common/types';
import { ProcessEsiVars } from './processEsiVars';
import { Request } from 'express';
import { ParseVars } from '../common/parseVars';
import { ProcessEsiTry } from './processEsiTry';

export const Process = async (options?: EsiProcessorOptions, request?: Request, ...elements: DomElement[]): Promise<DomElement[]> => {
    const maxConcurrency = resolveMaxConcurrency(elements.length, options);
    if (maxConcurrency > 1 && elements.length > 1) {
        return await processInParallel(elements, options, request, maxConcurrency);
    }

    const returnvalue: DomElement[] = [];
    for (let i = 0; i < elements.length; i++) {
        const currentElement = elements[i];
        if (options && options.Verbose) {
            console.log('Process: Processing ' + (isTagNode(currentElement) ? currentElement.name : currentElement.type));
        }
        returnvalue.push(...await _process(currentElement, options, request));
    }
    return returnvalue;
};

const resolveMaxConcurrency = (elementCount: number, options?: EsiProcessorOptions): number => {
    if (!options || !options.ParallelProcessing) {
        return 1;
    }
    if (!options.ParallelProcessingMaxConcurrency || options.ParallelProcessingMaxConcurrency < 1) {
        return elementCount;
    }
    return Math.floor(options.ParallelProcessingMaxConcurrency);
};

const processInParallel = async (elements: DomElement[], options: EsiProcessorOptions, request: Request | undefined, maxConcurrency: number): Promise<DomElement[]> => {
    const results: DomElement[][] = new Array(elements.length);
    const workerCount = Math.min(maxConcurrency, elements.length);
    let nextIndex = 0;

    const workers: Promise<void>[] = [];
    for (let workerIndex = 0; workerIndex < workerCount; workerIndex++) {
        workers.push((async () => {
            while (nextIndex < elements.length) {
                const currentIndex = nextIndex;
                nextIndex++;
                const currentElement = elements[currentIndex];
                if (options.Verbose) {
                    console.log('Process: Processing ' + (isTagNode(currentElement) ? currentElement.name : currentElement.type));
                }
                results[currentIndex] = await _process(currentElement, options, request);
            }
        })());
    }

    await Promise.all(workers);
    return results.flat();
};

const _process = async (element: DomElement, options?: EsiProcessorOptions, request?: Request): Promise<DomElement[]> => {
    element = ParseVars(element, request);
    if (!isTagNode(element)) {
        return await ProcessOther(element, options, request);
    }

    switch (element.name) {
        case 'esi:include':
            return await ProcessEsiInclude(element, options, request);
        case 'esi:comment':
            return ProcessEsiComment(element);
        case 'esi:remove':
            return ProcessEsiRemove(element);
        case 'esi:rwp':
            return await ProcessEsiRenderWithoutProcessing(element, options, request);
        case 'esi:choose':
            return await ProcessEsiChoose(element, options, request);
        case 'esi:try':
            return await ProcessEsiTry(element, options, request);
        case 'esi:vars':
            return ProcessEsiVars(element, options, request);
        default:
            return await ProcessOther(element, options, request);
    }
};
