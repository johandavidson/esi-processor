import request = require('request');
import urljoin = require('url-join');
import { DomElement } from 'domhandler';
import { EsiProcessorOptions } from '../common/types';
import { Process } from './process';
import { ParseHtml } from './parseHtml';
import { Request } from 'express';
const isValidUrlRegEx = /^https?:\/\/\w+(\.[-\w]+)*(:[0-9]+)?\/?(\/[.-\w]*)*(\?[.-\w]*\=)*$/;

export const ProcessEsiInclude = async (esiElement: DomElement, options?: EsiProcessorOptions, req?: Request): Promise<DomElement[]> => {
    let content = await _processUrl(esiElement.attribs.src, options);
    if (!content && esiElement.attribs.alt) {
        try {
            content = await _processUrl(esiElement.attribs.alt, options);
        }
        catch {
            if (esiElement.attribs && !esiElement.attribs.onerror && esiElement.attribs.src) {
                throw new Error('Couldn\'t get requested url: ' + esiElement.attribs.src);
            }
            else if (esiElement.attribs && !esiElement.attribs.onerror) {
                throw new Error('Couldn\'t get requested url.');
            }
            else if (esiElement.attribs && esiElement.attribs.onerror && esiElement.attribs.onerror.toLowerCase() === 'continue') {
                return [{ type: 'comment', data: 'esi:include continued on error' }];
            }
        }
    }

    if (content && content.length > 0) {
        return content;
    }
    return [{ type: 'comment', data: 'esi:include without content' }];
};

const _processUrl = async (url: string, options?: EsiProcessorOptions, req?: Request): Promise<DomElement[]> => {
    if (!url || url === '') {
        return undefined;
    }
    if (options && options.BaseUrl && !isValidUrlRegEx.test(url)) {
        url = urljoin(options.BaseUrl, url);
    }
    try {
        const html = await _request(url);
        const doc = await ParseHtml(html);
        return await Process(options, req, ...doc);
    }
    catch (e) {
        console.error('Esi-document:ProcessUrl: ' + e, 'Url:' + url);
        return undefined;
    }
};

const _request = async (url: string): Promise<string> => {
    return new Promise((resolve, reject) => {
        request(url, (error, response, body) => {
            if (error || response.statusCode > 299) {
                return reject(error || response.statusMessage || response.statusCode);
            }
            return resolve(body);
        });
    });
};
