import { DomElement, isDataNode, isTagNode } from './dom';
import { Request } from 'express';
import { ESIVARIABLES } from './constants';

const esivarregex = /\$\([^)]*\)/gm;
const esivarskeyregex = /\{[^}]*\}/m;
const esivarstart = '$(';

export const ParseVars = (element: DomElement, request?: Request): DomElement => {
    const _resolveVar = (_var: string) => resolveVar(_var, request);
    if (isTagNode(element)) {
        element.attribs = _parseAttribs(element.attribs, request) || element.attribs;
    }
    if (isDataNode(element) && element.data.includes(esivarstart)) {
        element.data = element.data.replace(esivarregex, _resolveVar);
    }
    return element;
};

const _parseAttribs = (items?: Record<string, string>, req?: Request): Record<string, string> | undefined => {
    if (!items) {
        return undefined;
    }
    const _resolveVar = (_var: string) => resolveVar(_var, req);
    for (const prop in items) {
        if (items[prop].includes(esivarstart)) {
            items[prop] = items[prop].replace(esivarregex, _resolveVar);
        }
    }
    return items;
};

const resolveVar = (_var: string, req?: Request): string => {
    if (!req) {
        return '';
    }
    _var = _var.replace(/[$()]/gm, '');
    const matches = _var.match(esivarskeyregex);
    if (!matches) {
        return '';
    }
    const varkey = matches[0].replace(/[{}]/gm, '');
    const varname = _var.replace(esivarskeyregex, '');
    const resolver = ESIVARIABLES[varname];
    if (!resolver) {
        return '';
    }
    let value: unknown;
    try {
        value = resolver(req, varkey || undefined);
    } catch (error) {
        console.error('ESI variable resolution failed: ' + (error instanceof Error ? error.message : String(error)));
        return '';
    }
    if (value === undefined || value === null) {
        return '';
    }
    return String(value);
};
