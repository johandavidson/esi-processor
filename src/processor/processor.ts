import { Middleware } from '../middleware/middleware';

export class Processor {
    Middleware: Middleware;
    ProcessorOptions: ProcessorOptions;

    constructor(options?: ProcessorOptions) {
        this.ProcessorOptions = options;
    }

    Process(html: String): String {
        return this.ProcessHtml(html);
    }

    private ProcessHtml(html: String): String {
        return html;
    }
}

export interface ProcessorOptions {

}