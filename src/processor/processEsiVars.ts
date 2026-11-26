import { DomElement, getChildNodes, setChildNodes } from '../common/dom';
import { EsiProcessorOptions } from '../common/types';
import { Request } from 'express';
import { ParseVars } from '../common/parseVars';

export const ProcessEsiVars = (element: DomElement, options?: EsiProcessorOptions, request?: Request): DomElement[] => {
    const children = getChildNodes(element);
    for (let i = 0; i < children.length; i++) {
        children[i] = parseVarsRecursively(children[i], request);
    }
    return children;
};

const parseVarsRecursively = (element: DomElement, request?: Request): DomElement => {
    const parsedElement = ParseVars(element, request);
    const children = getChildNodes(parsedElement);
    if (children.length === 0) {
        return parsedElement;
    }

    const parsedChildren = children.map((childElement) => parseVarsRecursively(childElement, request));
    setChildNodes(parsedElement, parsedChildren);
    return parsedElement;
};
