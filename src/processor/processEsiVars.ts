import { DomElement, getChildNodes, isTagNode } from '../common/dom';
import { EsiProcessorOptions } from '../common/types';
import { Request } from 'express';
import { isEsiTag, ParseVars } from '../common/parseVars';
import { Process } from './process';

export const ProcessEsiVars = async (element: DomElement, options?: EsiProcessorOptions, request?: Request): Promise<DomElement[]> => {
    const children = getChildNodes(element);
    children.forEach((child) => parseVarsRecursively(child, request));
    return await Process(options, request, ...children);
};

const parseVarsRecursively = (element: DomElement, request?: Request): void => {
    // A nested esi:vars substitutes its own content when it is processed.
    if (isTagNode(element) && element.name === 'esi:vars') {
        return;
    }
    // Leave ESI tag attributes alone. Tags handled by Process (esi:include etc.) substitute
    // their own attributes, so doing it here would expand values twice. esi:when tests are
    // evaluated safely by esi:choose. The remaining wrapper tags (esi:when, esi:otherwise,
    // esi:attempt, esi:except) have no other attributes that use variables.
    if (!isEsiTag(element)) {
        ParseVars(element, request);
    }
    getChildNodes(element).forEach((child) => parseVarsRecursively(child, request));
};
