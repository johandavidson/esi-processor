import { Middleware } from '../middleware/middleware';
import { EsiDocument } from './esi-document';

export class Processor {
    Middleware: Middleware;
    ProcessorOptions: ProcessorOptions;

    constructor(options?: ProcessorOptions) {
        this.ProcessorOptions = options;
    }

    async Process(html: string): Promise<string> {
        return await this.ProcessHtml(html);
    }

    private async ProcessHtml(html: string): Promise<string> {
        const esi = new EsiDocument(html);
        await esi.Process();
        return esi.ToString();
    }
}

export interface ProcessorOptions {

}
