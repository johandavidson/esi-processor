import { DomElement } from 'domhandler';
import htmlparser from 'htmlparser2';
import { Process } from './process';
import { ParseHtml } from './parseHtml';
import { EsiProcessorOptions } from '../common/types';

const ProcessHtml = async (html: string, options?: EsiProcessorOptions): Promise<string> => {
    // we need to find all <!--esi --> tags and replace them otherwise they are dropped in the parsing
    html = html.replace(/<!--esi(?:(?!-->)[\s\S])*?-->/gm, (tag) => tag.replace(/<!--esi/, '<esi:rwp>').replace(/-->/, '</esi:rwp>'));
    try {
        let _dom = await ParseHtml(html, options);
        _dom = await Process(options, ..._dom);
        return _parseDom(_dom);
    }
    catch (e) {
        throw new Error(e);
    }
};

const _parseDom = (dom: DomElement[]): string => {
    return htmlparser.DomUtils.getOuterHTML(dom);
};

export { ProcessHtml };
