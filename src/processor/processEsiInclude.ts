import { DomElement } from "domhandler";
import { EsiProcessorOptions } from "./processHtml";
import request = require("request-promise-native");
import { Process } from "./process";
import { ParseHtml } from "./parseHtml";

export const ProcessEsiInclude = async (esiElement: DomElement, options?: EsiProcessorOptions): Promise<DomElement[]> => {
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
        }
    };
    
    if (content && content.length > 0) {
        return content;
    }
    else if (esiElement.attribs && esiElement.attribs.onerror && esiElement.attribs.onerror.toLowerCase() === 'continue') {
        return [{ type: 'comment', data: 'esi:include' }];
    }
}

const _processUrl = async (url: string, options?: EsiProcessorOptions): Promise<DomElement[]> => {
    if (!url || url === '') {
        return undefined;
    }
    if (options && options.BaseUrl && url.startsWith('/')) {
        url = options.BaseUrl.toString() + url;
    }
    try {
        const html = await request(url);
        const doc = await ParseHtml(html);
        return await Process(options, ...doc);
    }
    catch (e) {
        console.error('Esi-document:ProcessUrl: ' + e, 'Url:' + url);
        return undefined;
    }
}
