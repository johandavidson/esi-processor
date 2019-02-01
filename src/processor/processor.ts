import { Middleware } from '../middleware/middleware';

export class Processor {
    Middleware: Middleware;
    ProcessorOptions: ProcessorOptions;

    EsiRemoveTagRegex = /<esi:remove>[\s\S]{0,}<\/esi:remove>/gm;
    EsiCommentTagRegex = /<esi:comment(?:(?!\/).)*?\/>|<esi:comment>[\s\S]{0,}<\/esi:comment>/gm;
    EsiIncludeTagRegex = /<esi:include(?:(?!\/).)*?\/>/gm;
    EsiChooseTagRegex = /<esi:choose>[\s\S]{0,}<\/esi:choose>/gm;
    EsiWhenTagRegex = /<esi:when>[\s\S]{0,}<\/esi:when>/gm;
    EsiOtherwiseTagRegex = /<esi:otherwise>[\s\S]{0,}<\/esi:otherwise>/gm;
    EsiTryTagRegex = /<esi:try>[\s\S]{0,}<\/esi:try>/gm;
    EsiAttemptTagRegex = /<esi:attempt>[\s\S]{0,}<\/esi:attempt>/gm;
    EsiExceptTagRegex = /<esi:except>[\s\S]{0,}<\/esi:except>/gm;
    EsiVarsTagRegex = /<esi:vars>[\s\S]{0,}<\/esi:vars>/gm;
    EsiRenderWithoutProcessingRegex = /[\s]{0,}<!--esi(?:(?!-->)[\s\S])*?-->[\s]{0,}/gm;

    constructor(options?: ProcessorOptions) {
        this.ProcessorOptions = options;
    }

    Process(html: string): string {
        return this.ProcessHtml(html);
    }

    private ProcessHtml(html: string): string {
        html = this.ProcessEsiRemoveableTags(html);
        html = this.ProcessEsiRenderWithoutProcessing(html);
        return html;
    }

    private ProcessEsiRemoveableTags(html: string): string {
        html = html.replace(this.EsiCommentTagRegex, '');
        html = html.replace(this.EsiRemoveTagRegex, '');
        return html;
    }

    private ProcessEsiRenderWithoutProcessing(html: string): string {
        const tags = this.EsiRenderWithoutProcessingRegex.exec(html);
        if(tags) {
            for (let i = 0, len = tags.length; i < len; i++) {
                html = html.replace(tags[i], tags[i].replace(/<!--esi[\s]{0,}/gm, '').replace(/[\s]{0,}-->/gm, ''));
            }
        }
        return html;
    }
}

export interface ProcessorOptions {

}
