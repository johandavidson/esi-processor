import { DomElement } from '../common/dom';
import { getOuterHTML } from 'domutils';
import { Process } from './process';
import { ParseHtml } from './parseHtml';
import { EsiProcessorOptions } from '../common/types';
import { Request } from 'express';

const ProcessHtml = async (html: string, options?: EsiProcessorOptions, req?: Request): Promise<string> => {
    // we need to find all <!--esi --> tags and replace them otherwise they are dropped in the parsing
    html = html.replace(/<!--esi(?:(?!-->)[\s\S])*?-->/gm, (tag) => tag.replace(/<!--esi/, '<esi:rwp>').replace(/-->/, '</esi:rwp>'));
    try {
        let _dom = await ParseHtml(html, options);
        _dom = await Process(options, req, ..._dom);
        return _parseDom(_dom);
    }
    catch (e) {
        throw e instanceof Error ? e : new Error(String(e));
    }
};

const _parseDom = (dom: DomElement[]): string => {
    return getOuterHTML(dom, { encodeEntities: false });
};

export { ProcessHtml };
