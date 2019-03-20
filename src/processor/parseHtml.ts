import { DomElement } from "domhandler";
import htmlparser = require('htmlparser2');
import { EsiProcessorOptions } from "./processHtml";

export const ParseHtml = async (html: string, options?: EsiProcessorOptions): Promise<DomElement[]> => {
    return new Promise((resolve, reject) => {
        const dh = new htmlparser.DomHandler((err, dom) => {
            if(err) {
                reject(err);
            }
            resolve(dom);
        });
        const parser = new htmlparser.Parser(dh, { xmlMode: options && options.XmlMode || true });
        parser.write(html);
        parser.end();
    });
}
