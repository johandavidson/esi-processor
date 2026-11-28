import { DomElement, isDataNode, isTagNode } from './dom';
import { Request } from 'express';
import { ESIVARIABLES } from './constants';

const esivarregex = /\$\([^)]*\)/gm;
const esivarskeyregex = /\{[^}]*\}/m;
const esivarstart = '$(';

/**
 * Resolves a `$(NAME)` or `$(NAME{key})` token.
 * Returns `undefined` when NAME is not a supported ESI variable, so callers can decide
 * whether to keep the token (e.g. `$(document)` in inline scripts) or drop it.
 */
const resolveVariable = (token: string, req?: Request): string | undefined => {
    const normalizedToken = token.replace(/[$()]/gm, '');
    const matches = normalizedToken.match(esivarskeyregex);
    const varkey = matches ? matches[0].replace(/[{}]/gm, '') : undefined;
    const varname = matches ? normalizedToken.replace(esivarskeyregex, '') : normalizedToken;
    if (!Object.prototype.hasOwnProperty.call(ESIVARIABLES, varname)) {
        return undefined;
    }
    if (!req) {
        return '';
    }
    let value: unknown;
    try {
        value = ESIVARIABLES[varname](req, varkey || undefined);
    } catch (error) {
        console.error('ESI variable resolution failed: ' + (error instanceof Error ? error.message : String(error)));
        return '';
    }
    if (value === undefined || value === null) {
        return '';
    }
    return String(value);
};

/**
 * Replaces every `$(...)` token in `value`. Tokens that are not supported ESI variables
 * are kept as written, or replaced with '' when `dropUnknown` is set.
 */
export const substituteVariables = (value: string, req?: Request, dropUnknown = false): string => {
    if (!value.includes(esivarstart)) {
        return value;
    }
    return value.replace(esivarregex, (token) => {
        const resolved = resolveVariable(token, req);
        if (resolved === undefined) {
            return dropUnknown ? '' : token;
        }
        return resolved;
    });
};

export const isEsiTag = (element: DomElement): boolean => {
    return isTagNode(element) && element.name.startsWith('esi:');
};

export const ParseVars = (element: DomElement, request?: Request): DomElement => {
    if (isTagNode(element) && element.attribs) {
        for (const prop in element.attribs) {
            element.attribs[prop] = substituteVariables(element.attribs[prop], request);
        }
    }
    if (isDataNode(element)) {
        element.data = substituteVariables(element.data, request);
    }
    return element;
};
