import { Middleware } from '../middleware/middleware';
import { EsiDocument } from './esi-document';

export class Processor {
    Middleware: Middleware;
    ProcessorOptions: ProcessorOptions;

    EsiIncludeTagRegex = /<esi:include(?:(?!\/).)*?\/>/gm;
    EsiTryTagRegex = /<esi:try>[\s\S]{0,}<\/esi:try>/gm;
    EsiAttemptTagRegex = /<esi:attempt>[\s\S]{0,}<\/esi:attempt>/gm;
    EsiExceptTagRegex = /<esi:except>[\s\S]{0,}<\/esi:except>/gm;
    EsiVarsTagRegex = /<esi:vars>[\s\S]{0,}<\/esi:vars>/gm;

    constructor(options?: ProcessorOptions) {
        this.ProcessorOptions = options;
    }

    Process(html: string): string {
        return this.ProcessHtml(html);
    }

    private ProcessHtml(html: string): string {
        const esi = new EsiDocument(html);
        if(!esi.HasEsiTags(html)) {
            return html;
        }

        esi.ProcessEsiRemoveableTags();
        esi.ProcessEsiRenderWithoutProcessing();
        esi.ProcessEsiChooseWhenOtherwiseTags();
        // html = this.ProcessEsiChooseWhenOtherwiseTags(html);
        return esi.ToString();
    }
}

export interface ProcessorOptions {

}
