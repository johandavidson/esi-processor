
export class EsiDocument {
    html: string;
    private readonly EsiRemoveTagRegex = /<esi:remove>[\s\S]{0,}<\/esi:remove>/gm;
    private readonly EsiCommentTagRegex = /<esi:comment(?:(?!\/).)*?\/>|<esi:comment>[\s\S]{0,}<\/esi:comment>/gm;
    private readonly EsiTagsExistsRegEx = /<esi:|<!--esi/m;
    private readonly EsiRenderWithoutProcessingRegex = /[\s]{0,}<!--esi(?:(?!-->)[\s\S])*?-->[\s]{0,}/gm;
    private readonly EsiChooseTagRegex = /[\s]{0,}<esi:choose>[\s\S]{0,}<\/esi:choose>[\s]{0,}/gm;
    private readonly EsiWhenTagRegex = /<esi:when>?(?:(?!<\/esi:when>)[\s\S])*<\/esi:when>/gm;
    private readonly EsiOtherwiseTagRegex = /<esi:otherwise>[\s\S]{0,}<\/esi:otherwise>/m;

    constructor(html: string) {
        this.html = html;
    }
    HasEsiTags(html:string): boolean {
        return this.EsiTagsExistsRegEx.test(html);
    }

    ToString(): string {
        return this.html;
    }

    ProcessEsiRemoveableTags(): void {
        this.html = this.html.replace(this.EsiCommentTagRegex, '');
        this.html = this.html.replace(this.EsiRemoveTagRegex, '');
    }
    
    ProcessEsiRenderWithoutProcessing(): void {
        const tags = this.EsiRenderWithoutProcessingRegex.exec(this.html);
        if(tags) {
            for (let i = 0, len = tags.length; i < len; i++) {
                this.html = this.html.replace(tags[i], tags[i].replace(/<!--esi[\s]{0,}/gm, '').replace(/[\s]{0,}-->/gm, ''));
            }
        }
    }
    
    ProcessEsiChooseWhenOtherwiseTags(): void {
        this.html = this.html.replace(this.EsiChooseTagRegex, (match) => this.ProcessEsiChooseWhenOtherwiseTag(match));
    }

    private ProcessEsiChooseWhenOtherwiseTag(tag: string): string {
        const whens = tag.match(this.EsiWhenTagRegex);
        if (whens) {
            for (let i = 0, len = whens.length; i < len; i++) {
                const testAttributeRegEx = /test=["']{0,1}[^>\s]{0,}/m;
                const testAttribute = testAttributeRegEx.exec(whens[i])[0].replace(/\"/gm, '').replace('test=', '');
                if (Function('"use strict;";return (' + testAttribute + ')')()) {
                    return whens[i].replace(/[\s]{0,}<esi:when[^>]{0,}>/gm, '').replace(/<\/esi:when>[\s]{0,}/gm, '');
                }
            }
        }
        const otherwise = this.EsiOtherwiseTagRegex.exec(tag);
        if (otherwise && otherwise.length > 0) {
            return otherwise[0].replace(/<esi:otherwise[^>]{0,}>/gm, '').replace(/<\/esi:otherwise>/gm, '');
        }
    }
}
