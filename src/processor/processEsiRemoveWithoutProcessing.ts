import { DomElement } from "domhandler";
import { EsiProcessorOptions } from "./processHtml";
import { Process } from "./process";

export const ProcessEsiRenderWithoutProcessing = async (rwpElement: DomElement, options?: EsiProcessorOptions): Promise<DomElement[]> => {
    await Process(options, ...rwpElement.children);
    return rwpElement.children;
}
