import axios from 'axios';
import urljoin from 'url-join';
import { createCommentNode, createTextNode, DomElement, isTagNode } from '../common/dom';
import { EsiFile, EsiProcessorOptions, HttpRequestOptions } from '../common/types';
import { Process } from './process';
import { ParseHtml } from './parseHtml';
import { Request } from 'express';

const isAbsoluteHttpUrl = (url: string): boolean => {
    try {
        const parsed = new URL(url);
        return parsed.protocol === 'http:' || parsed.protocol === 'https:';
    } catch {
        return false;
    }
};

export const ProcessEsiInclude = async (esiElement: DomElement, options?: EsiProcessorOptions, req?: Request): Promise<DomElement[]> => {
    if (!isTagNode(esiElement)) {
        return [createCommentNode('esi:include without content')];
    }

    const attribs = esiElement.attribs || {};
    let content = await _processUrl(attribs.src, options, req);
    if (!content && attribs.alt) {
        try {
            content = await _processUrl(attribs.alt, options, req);
        } catch {
            if (!attribs.onerror && attribs.src) {
                throw new Error('Couldn\'t get requested url: ' + attribs.src);
            } else if (!attribs.onerror) {
                throw new Error('Couldn\'t get requested url.');
            } else if (attribs.onerror && attribs.onerror.toLowerCase() === 'continue') {
                return [createCommentNode('esi:include continued on error')];
            }
        }
    }

    if (content && content.length > 0) {
        return content;
    }
    return [createCommentNode('esi:include without content')];
};

const _processUrl = async (url: string, options?: EsiProcessorOptions, req?: Request): Promise<DomElement[] | undefined> => {
    if (!url || url === '') {
        return undefined;
    }
    if (options && options.BaseUrl && !isAbsoluteHttpUrl(url)) {
        url = urljoin(options.BaseUrl, url);
    }
    const requestOptions: HttpRequestOptions = {};
    if (options && options.Headers) {
        requestOptions['headers'] = options.Headers;
    }
    try {
        const file: EsiFile = await _request(url, requestOptions);
        if (_isJsonContentType(file.contentType)) {
            const jsonText = typeof file.data === 'string' ? file.data : JSON.stringify(file.data);
            return await Process(options, req, createTextNode(jsonText));
        }
        return await Process(options, req, ...await ParseHtml(typeof file.data === 'string' ? file.data : String(file.data)));
    } catch (e) {
        console.error('Esi-document:ProcessUrl: ' + (e instanceof Error ? e.message : String(e)), 'Url:' + url);
        return undefined;
    }
};

const _isJsonContentType = (contentType: string): boolean => {
    return contentType.split(';')[0].trim().toLowerCase() === 'application/json';
};

const _request = async (url: string, options: HttpRequestOptions): Promise<EsiFile> => {
    try {
        const response = await axios.get(url, options);
        const contentTypeHeader = response.headers['content-type'];
        const contentType = typeof contentTypeHeader === 'string'
            ? contentTypeHeader
            : Array.isArray(contentTypeHeader) && contentTypeHeader.length > 0
                ? contentTypeHeader[0]
                : '';
        return { data: response.data, contentType };
    } catch (error) {
        if (axios.isAxiosError(error) && error.response) {
            throw new Error('Request failed with status ' + error.response.status);
        }
        throw error instanceof Error ? error : new Error(String(error));
    }
};
