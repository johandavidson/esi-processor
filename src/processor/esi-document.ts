import request from 'request-promise-native';
import htmlparser, { DomElement } from 'htmlparser2';


export class EsiDocument {
    private xml: DomElement[];

    constructor(html: string) {
        // we need to find all <!--esi --> tags and replace them otherwise they are dropped in the parsing
        html = html.replace(/<!--esi(?:(?!-->)[\s\S])*?-->/gm, (tag) => tag.replace(/<!--esi/, '<esi:rwp>').replace(/-->/,'</esi:rwp>'));

        const dh = new htmlparser.DomHandler((err, dom) => {
            if(err) {
                throw new Error(err);
            }
            this.xml = dom;
        });
        const parser = new htmlparser.Parser(dh);
        parser.write(html);
        parser.end();
    }

    async Process(): Promise<void> {
        this.xml = await this.ProcessEsiTag(this.xml);
    }

    private async ProcessEsiTag(elements: DomElement[]): Promise<DomElement[]> {
        for(let element of elements.filter((e) => e.type === 'tag')) {
            switch(element.name) {
                case 'esi:include':
                    await this.ProcessEsiIncludeTag(element);
                    break;
                case 'esi:comment':
                case 'esi:remove':
                    this.ProcessEsiRemovableTag(element);
                    break;
                case 'esi:rwp':
                    await this.ProcessEsiRenderWithoutProcessingTag(element);
                    break;
                case 'esi:choose':
                    await this.ProcessEsiChooseTag(element);
                    break;
                default:
                    if (element.children) {
                        element.children = await this.ProcessEsiTag(element.children);
                    }
                    break;
            }
        }
        return elements;
    }

    private ProcessEsiRemovableTag(element: DomElement): void {
        htmlparser.DomUtils.removeElement(element);
    }

    private async ProcessEsiIncludeTag(esiElement: DomElement): Promise<void> {
        const content = (await this.ProcessUrl(esiElement.attribs.src)) || (await this.ProcessUrl(esiElement.attribs.alt));
        
        if (content) {
            this.PrependElements(content, esiElement);
            htmlparser.DomUtils.removeElement(esiElement);
            return;
        }

        if (esiElement.attribs && !esiElement.attribs.onerror && esiElement.attribs.src) {
            throw new Error('Couldn\'t get requested url: ' + esiElement.attribs.src);
        }
        else if (esiElement.attribs && !esiElement.attribs.onerror) {
            throw new Error('Couldn\'t get requested url.');
        }
    }

    private async ProcessUrl(url: string): Promise<DomElement[]> {
        try {
            const html = await request(url);
            const doc = new EsiDocument(html);
            await doc.Process();
            return doc.ToObject();
        }
        catch {
            return undefined;
        }
    }

    private async ProcessEsiRenderWithoutProcessingTag(rwpElement: DomElement): Promise<void> {
        this.PrependElements(rwpElement.children, rwpElement);
        htmlparser.DomUtils.removeElement(rwpElement);
    }

    private PrependElements(elements: DomElement[], prev: DomElement): void {
        elements.forEach((element) => {
            element.parent = prev.parent;
            htmlparser.DomUtils.prepend(prev, element);
        });
    }
    
    private async ProcessEsiChooseTag(chooseElement: DomElement): Promise<void> {
        
        const contentElement = chooseElement.children.find((element) => (this.ProcessEsiWhenTag(element)) !== undefined) || chooseElement.children.find((element) => element.name === 'esi:otherwise');
        if (contentElement) {
            this.PrependElements(await this.ProcessEsiTag(contentElement.children), chooseElement.prev);
            htmlparser.DomUtils.removeElement(chooseElement)
        }
    }

    private ProcessEsiWhenTag(whenElement: DomElement): DomElement[] {
        return whenElement.attribs && whenElement.attribs['test'] ? 
            Function('"use strict";return (' + whenElement.attribs['test'] + ')')() ? whenElement.children : undefined
            : undefined;
    }

    ToString(): string {
        if (!this.xml) {
            return '';
        }

        return htmlparser.DomUtils.getOuterHTML(this.xml);
    }

    ToObject(): DomElement[] {
        return this.xml;
    }
}
