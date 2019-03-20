import { DomElement } from "domhandler";
import { EsiProcessorOptions } from "./processHtml";
import { Process } from "./process";

export const ProcessOther = async (element: DomElement, options?: EsiProcessorOptions): Promise<DomElement[]> => {
    if (element.children && element.children.length > 0) {
        element.children = await Process(options, ...element.children);
    }
    return [element];
}
