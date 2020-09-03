import axios from 'axios';
import mime from 'mime';
import urljoin from 'url-join';
import { DomElement } from 'domhandler';
import { EsiFile, EsiFileExt, EsiProcessorOptions, HttpRequestOptions } from '../common/types';
import { Process } from './process';
import { ParseHtml } from './parseHtml';
import { Request } from 'express';
import { ParseJson } from './parseJson';

const isValidUrlRegEx = /^https?:\/\/\w+(\.[-\w]+)*(:[0-9]+)?\/?(\/[.-\w]*)*(\?[.-\w]*\=)*$/;

export const ProcessEsiInclude = async (esiElement: DomElement, options?: EsiProcessorOptions, req?: Request): Promise<DomElement[]> => {
    let content = await _processUrl(esiElement.attribs.src, options);
    if (!content && esiElement.attribs.alt) {
        try {
            content = await _processUrl(esiElement.attribs.alt, options);
        } catch {
            if (esiElement.attribs && !esiElement.attribs.onerror && esiElement.attribs.src) {
                throw new Error('Couldn\'t get requested url: ' + esiElement.attribs.src);
            } else if (esiElement.attribs && !esiElement.attribs.onerror) {
                throw new Error('Couldn\'t get requested url.');
            } else if (esiElement.attribs && esiElement.attribs.onerror && esiElement.attribs.onerror.toLowerCase() === 'continue') {
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
    const requestOptions = {};
    if (options && options.Headers) {
        requestOptions['headers'] = options.Headers;
    }
    try {
        const file: EsiFile = await _request(url, requestOptions);
        switch (mime.getExtension(file.contentType)) {
            case EsiFileExt.JSON:
               return await Process(options, req, ...await ParseJson(file.data));
            default:
               return await Process(options, req, ...await ParseHtml(file.data));
        }
    } catch (e) {
        console.error('Esi-document:ProcessUrl: ' + e, 'Url:' + url);
        return undefined;
    }
};

const _request = async (url: string, options: HttpRequestOptions): Promise<EsiFile> => {
    return new Promise((resolve, reject) => {
        axios.get(url, options).then(response => {
          const contentType = response.headers['content-type'];
            resolve({data: response.data, contentType: contentType || ''});
        }).catch(error => {
            if ((error.response && error.response.status > 299) || error) {
              reject(error || error.response.statusText || error.response.status);
            }
        });
    });
};
