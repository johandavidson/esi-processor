import { DomElement } from 'domhandler';
import { Request } from 'express';
import { ESIVARIABLES } from './constants';

const esivarregex = /\$\([^)]*\)/gm;
const esivarskeyregex = /\{[^}]*\}/gm;

export const ParseVars = (element: DomElement, request?: Request): DomElement => {
    const _resolveVar = (_var) => resolveVar(_var, request);
    element.attribs = _parseAttribs(element.attribs, request);
    if (element.data) {
        element.data = element.data.replace(esivarregex, _resolveVar);
    }
    return element;
};

const _parseAttribs = (items: Record<string, string>, req?: Request): Record<string, string> => {
    const _resolveVar = (_var) => resolveVar(_var, req);
    for (const prop in items) {
        items[prop] = items[prop].replace(esivarregex, _resolveVar);
    }
    return items;
};

const resolveVar = (_var: string, req?: Request): string => {
    try {
        if (!req) {
            return '';
        }
        _var = _var.replace(/[$()]/gm, '');
        const matches = esivarskeyregex.exec(_var);
        if (!matches) {
            return '';
        }
        const varkey = matches[0].replace(/[{}]/gm, '');
        const varname = _var.replace(esivarskeyregex, '');
        return ESIVARIABLES[varname](req, varkey || undefined);
    } catch (e) {
        console.error(e);
        return '';
    }
};
