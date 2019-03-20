import { DomElement } from 'domhandler';
import { Process } from './process';
import { EsiProcessorOptions } from '../common/types';

export const ProcessEsiChoose = async (chooseElement: DomElement, options?: EsiProcessorOptions): Promise<DomElement[]> => {
    if (!(options && options.IgnoreEsiChooseTags)) {
        const contentElement =
            chooseElement.children.find((element) => (_processEsiWhenTag(element)) !== undefined) ||
            chooseElement.children.find((element) => element.name === 'esi:otherwise');
        if (contentElement) {
            await Process(options, ...contentElement.children);
            return contentElement.children;
        }
    }
    else {
        return [{ type: 'comment', data: 'esi:choose'}];
    }
};

const _processEsiWhenTag = (whenElement: DomElement): DomElement[] => {
    try {
        return whenElement.attribs && whenElement.attribs['test'] ?
            Function('"use strict";return (' + whenElement.attribs['test'] + ')')() ? whenElement.children : undefined
            : undefined;
    } catch {
        return undefined;
    }
};
