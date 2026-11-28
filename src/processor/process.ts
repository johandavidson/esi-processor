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
import { isEsiTag, ParseVars } from '../common/parseVars';
import { ProcessEsiTry } from './processEsiTry';
import { AsyncLocalStorage } from 'async_hooks';

interface ProcessContext {
    maxConcurrency: number;
    activeWorkers: number;
    queue: Array<() => void>;
}

interface ProcessExecutionState {
    context: ProcessContext;
    insideWorker: boolean;
}

const processStateStorage = new AsyncLocalStorage<ProcessExecutionState>();

export const Process = async (options?: EsiProcessorOptions, request?: Request, ...elements: DomElement[]): Promise<DomElement[]> => {
    const processState = processStateStorage.getStore();
    if (!processState) {
        const rootContext: ProcessContext = {
            maxConcurrency: resolveMaxConcurrency(options),
            activeWorkers: 0,
            queue: []
        };
        return await processStateStorage.run({ context: rootContext, insideWorker: false }, async () => {
            return await processElements(elements, options, request);
        });
    }

    return await processElements(elements, options, request);
};

const resolveMaxConcurrency = (options?: EsiProcessorOptions): number => {
    if (!options || !options.ParallelProcessing) {
        return 1;
    }
    if (!options.ParallelProcessingMaxConcurrency || options.ParallelProcessingMaxConcurrency < 1) {
        return Number.MAX_SAFE_INTEGER;
    }
    return Math.floor(options.ParallelProcessingMaxConcurrency);
};

const processElements = async (elements: DomElement[], options?: EsiProcessorOptions, request?: Request): Promise<DomElement[]> => {
    const processState = processStateStorage.getStore();
    const shouldParallelize = !!options && options.ParallelProcessing && elements.length > 1 &&
        !!processState && !processState.insideWorker && processState.context.maxConcurrency > 1;

    if (shouldParallelize && processState) {
        const tasks = elements.map(async (currentElement) => {
            return await runWithLimiter(processState.context, async () => {
                return await processStateStorage.run({ context: processState.context, insideWorker: true }, async () => {
                    if (options.Verbose) {
                        console.log('Process: Processing ' + (isTagNode(currentElement) ? currentElement.name : currentElement.type));
                    }
                    return await _process(currentElement, options, request);
                });
            });
        });

        const taskResults = await Promise.allSettled(tasks);
        const firstRejection = taskResults.find((taskResult) => taskResult.status === 'rejected') as PromiseRejectedResult | undefined;
        if (firstRejection) {
            throw firstRejection.reason;
        }
        return taskResults
            .filter((taskResult): taskResult is PromiseFulfilledResult<DomElement[]> => taskResult.status === 'fulfilled')
            .flatMap((taskResult) => taskResult.value);
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

const runWithLimiter = async (context: ProcessContext, worker: () => Promise<DomElement[]>): Promise<DomElement[]> => {
    await acquireWorkerSlot(context);
    try {
        return await worker();
    } finally {
        releaseWorkerSlot(context);
    }
};

const acquireWorkerSlot = async (context: ProcessContext): Promise<void> => {
    if (context.activeWorkers < context.maxConcurrency) {
        context.activeWorkers++;
        return;
    }

    await new Promise<void>((resolve) => {
        context.queue.push(() => {
            context.activeWorkers++;
            resolve();
        });
    });
};

const releaseWorkerSlot = (context: ProcessContext): void => {
    context.activeWorkers--;
    const nextWorker = context.queue.shift();
    if (nextWorker) {
        nextWorker();
    }
};

const _process = async (element: DomElement, options?: EsiProcessorOptions, request?: Request): Promise<DomElement[]> => {
    // Outside esi:vars, variables are only substituted in ESI tag attributes (e.g. esi:include src).
    if (isEsiTag(element)) {
        element = ParseVars(element, request);
    }
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
            return await ProcessEsiVars(element, options, request);
        default:
            return await ProcessOther(element, options, request);
    }
};
