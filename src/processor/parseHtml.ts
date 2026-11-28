import { DomElement } from '../common/dom';
import { DomHandler } from 'domhandler';
import { Parser } from 'htmlparser2';
import { EsiProcessorOptions } from '../common/types';

export const ParseHtml = async (html: string, options?: EsiProcessorOptions): Promise<DomElement[]> => {
    return new Promise((resolve, reject) => {
        const dh = new DomHandler((err, dom) => {
            if (err) {
                reject(err);
            }
            resolve(dom);
        });
        const parser = new Parser(dh, { xmlMode: options ? options.XmlMode !== false : true, decodeEntities: false });
        parser.write(html);
        parser.end();
    });
};
