import { DomElement } from "domhandler";
import { EsiProcessorOptions } from "./processHtml";
import { ProcessEsiRemove } from "./processEsiRemove";
import { ProcessOther } from "./processOther";
import { ProcessEsiRenderWithoutProcessing } from "./processEsiRemoveWithoutProcessing";
import { ProcessEsiChoose } from "./processEsiChoose";
import { ProcessEsiInclude } from "./processEsiInclude";
import { ProcessEsiComment } from "./processEsiComment";

export const Process = async (options?: EsiProcessorOptions, ...elements: DomElement[]): Promise<DomElement[]> => {
    const returnvalue: DomElement[] = [];
    for(let i = 0; i < elements.length; i++) {
        if (options && options.Verbose) {
            console.log('Process: Processing ' + (elements[i].name || elements[i].type));
        }
        returnvalue.push(...await _process(elements[i], options));
    }
    return returnvalue;
}

const _process = async (element: DomElement, options?: EsiProcessorOptions): Promise<DomElement[]> => {
    switch(element.name) {
        case 'esi:include':
            return await ProcessEsiInclude(element, options);
        case 'esi:comment':
            return ProcessEsiComment(element);
        case 'esi:remove':
            return ProcessEsiRemove(element);
        case 'esi:rwp':
            return await ProcessEsiRenderWithoutProcessing(element, options);
        case 'esi:choose':
            return await ProcessEsiChoose(element, options);
        default:
            return await ProcessOther(element);
    }
}
