import { ProcessHtml } from './processHtml';
import nock from 'nock';
import axios from 'axios';

let requestSpy;

describe('Test esi-document', () => {

    beforeEach(() => {
        requestSpy = jest.spyOn(axios, 'get') as jest.Mock;
    });

    afterEach(() => {
        jest.restoreAllMocks();
        jest.resetAllMocks();
        jest.resetModules();
        nock.cleanAll();
    });

    afterAll(() => {
        nock.restore();
    });

    test('Esi:include', async () => {
        // given
        const url = 'http://www.test.se';
        nock(url)
            .get('/')
            .reply(200, '<p>included</p>');
        const html = `
<div>
    <esi:include src="${url}" />
</div>`;

        // when
        const result = await ProcessHtml(html);

        // then
        expect(result).toMatch('\n<div>\n    <p>included</p>\n</div>');
        expect(requestSpy).toBeCalledTimes(1);
        expect(requestSpy).toHaveBeenNthCalledWith(1, 'http://www.test.se', { responseType: 'text' });
    });

    test('recursive Esi:include', async () => {
        // given
        const url = 'http://www.test.se';
        const url2 = 'http://www.test2.se';

        const n = nock(url)
            .persist()
            .get('/')
            .reply(200, `<esi:include onerror='continue' src="${url2}"></esi:include>`);
        const n2 = nock(url2)
            .persist()
            .get('/')
            .reply(200, '<p>included</p>');
        const html = `
<div>
    <esi:include onerror='continue' src="${url}"></esi:include>
</div>`;

        // when
        const result = await ProcessHtml(html);

        // then
        expect(nock.isActive()).toBeTruthy();
        expect(n.isDone()).toBeTruthy();
        expect(n2.isDone()).toBeTruthy();
        expect(result).toMatch('\n<div>\n    <p>included</p>\n</div>');
    });

    test('ParallelProcessing should process sibling includes', async () => {
        // given
        const urlOne = 'http://www.parallel-1.se';
        const urlTwo = 'http://www.parallel-2.se';
        nock(urlOne)
            .get('/')
            .reply(200, '<p>included 1</p>');
        nock(urlTwo)
            .get('/')
            .reply(200, '<p>included 2</p>');
        const html = `
<div>
    <esi:include src="${urlOne}" />
    <esi:include src="${urlTwo}" />
</div>`;

        // when
        const result = await ProcessHtml(html, { ParallelProcessing: true });

        // then
        expect(result).toMatch('\n<div>\n    <p>included 1</p>\n    <p>included 2</p>\n</div>');
        expect(requestSpy).toBeCalledTimes(2);
    });

    test('ParallelProcessingMaxConcurrency should support bounded parallel processing', async () => {
        // given
        const urlOne = 'http://www.parallel-max-1.se';
        const urlTwo = 'http://www.parallel-max-2.se';
        nock(urlOne)
            .get('/')
            .reply(200, '<p>included 1</p>');
        nock(urlTwo)
            .get('/')
            .reply(200, '<p>included 2</p>');
        const html = `
<div>
    <esi:include src="${urlOne}" />
    <esi:include src="${urlTwo}" />
</div>`;

        // when
        const result = await ProcessHtml(html, { ParallelProcessing: true, ParallelProcessingMaxConcurrency: 1 });

        // then
        expect(result).toMatch('\n<div>\n    <p>included 1</p>\n    <p>included 2</p>\n</div>');
        expect(requestSpy).toBeCalledTimes(2);
    });


    test('Esi:include with alt', async () => {
        // given
        const url = 'http://www.test.se';
        nock(url)
            .get('/')
            .reply(200, '<p>included</p>')
            .persist();
        const fake = 'http://www.incorrecturl.se';
        nock(fake)
            .get('/')
            .reply(404)
            .persist();
        const html = `
<div>
    <esi:include src="${fake}" alt="${url}" />
</div>`;

        // when
        const result = await ProcessHtml(html);

        // then
        expect(result).toMatch('\n<div>\n    <p>included</p>\n</div>');
        expect(requestSpy).toBeCalledTimes(2);
        expect(requestSpy).toHaveBeenNthCalledWith(1, 'http://www.incorrecturl.se', { responseType: 'text' });
        expect(requestSpy).toHaveBeenNthCalledWith(2, 'http://www.test.se', { responseType: 'text' });
    });

    test('Esi:remove', async () => {
        // given
        const html = `
<div>
    <esi:remove>
        Whatever!
    </esi:remove>
</div>`;

        // when
        const result = await ProcessHtml(html);

        // then
        expect(result).toMatch('\n<div>\n    <!--esi:remove-->\n</div>');
    });

    test('Multiple Esi:remove', async () => {
        // given
        const html = `
<div>
    <esi:remove>
        Whatever!
    </esi:remove>
    <esi:remove>
        Whatever!
    </esi:remove>
</div>`;

        // when
        const result = await ProcessHtml(html);

        // then
        expect(result).toMatch('\n<div>\n    <!--esi:remove-->\n    <!--esi:remove-->\n</div>');
    });

    test('Esi:comment', async () => {
        // given
        const html = `
<div>
    <esi:comment>
        Whatever!
    </esi:comment>
</div>`;

        // when
        const result = await ProcessHtml(html);

        // then
        expect(result).toMatch('\n<div>\n    <!--esi:comment-->\n</div>');
    });

    test('Multiple Esi:comment', async () => {
        // given
        const html = `
<div>
    <esi:comment>
        Whatever!
    </esi:comment>
    <esi:comment>
        Whatever!
    </esi:comment>
</div>`;

        // when
        const result = await ProcessHtml(html);

        // then
        expect(result).toMatch('\n<div>\n    <!--esi:comment-->\n    <!--esi:comment-->\n</div>');
    });

    test('Esi:rwp', async () => {
        // given
        const html = `
<div>
    <!--esi
        <p>included</p>
    -->
</div>`;

        // when
        const result = await ProcessHtml(html);

        // then
        expect(result).toMatch('\n<div>\n    \n        <p>included</p>\n    \n</div>');
    });

    test('Esi:rwp should process direct include children', async () => {
        // given
        const url = 'http://www.rwp-include.se';
        nock(url)
            .get('/')
            .reply(200, '<p>included from rwp</p>');
        const html = `
<div>
    <!--esi
        <esi:include src="${url}" />
    -->
</div>`;

        // when
        const result = await ProcessHtml(html);

        // then
        expect(result).toContain('<p>included from rwp</p>');
        expect(result).not.toContain('<esi:include');
    });

    test('Multiple Esi:rwp', async () => {
        // given
        const html = `
<div>
    <!--esi
        <p>included</p>
    -->
    <!--esi
        <p>included</p>
    -->
</div>`;

        // when
        const result = await ProcessHtml(html);

        // then
        expect(result).toMatch('\n<div>\n    \n        <p>included</p>\n    \n    \n        <p>included</p>\n    \n</div>');
    });

    test('Esi:choose', async () => {
        // given
        const html = `
<div>
    <esi:choose>
        <esi:when test="1==1">
            <p>included</p>
        </esi:when>
    </esi:choose>
</div>`;

        // when
        const result = await ProcessHtml(html);

        // then
        expect(result).toMatch('\n<div>\n    \n            <p>included</p>\n        \n</div>');
    });

    test('Esi:choose without any match', async () => {
        // given
        const html = `
<div>
    <esi:choose>
        <esi:when test="1==0">
            <p>included</p>
        </esi:when>
    </esi:choose>
</div>`;

        // when
        const result = await ProcessHtml(html);

        // then
        expect(result).toMatch('\n<div>\n    <!--esi:choose without match-->\n</div>');
    });

    test('Multiple Esi:choose', async () => {
        // given
        const html = `
<div>
    <esi:choose>
        <esi:when test="1==0">
            <p>Should not be included</p>
        </esi:when>
        <esi:when test="1==1" something="testattribute that should be removed">
            <p>included</p>
        </esi:when>
    </esi:choose>
</div>`;

        // when
        const result = await ProcessHtml(html);

        // then
        expect(result).toMatch('\n<div>\n    \n            <p>included</p>\n        \n</div>');
    });

    test('Esi:choose should support parenthesized expressions', async () => {
        // given
        const html = `
<div>
    <esi:choose>
        <esi:when test="(1==1)">
            <p>included</p>
        </esi:when>
    </esi:choose>
</div>`;

        // when
        const result = await ProcessHtml(html);

        // then
        expect(result).toMatch('\n<div>\n    \n            <p>included</p>\n        \n</div>');
    });

    test('Esi:choose should not execute arbitrary code', async () => {
        // given
        const html = `
<div>
    <esi:choose>
        <esi:when test="this.constructor.constructor('return true')()">
            <p>included</p>
        </esi:when>
    </esi:choose>
</div>`;

        // when
        const result = await ProcessHtml(html);

        // then
        expect(result).toMatch('\n<div>\n    <!--esi:choose without match-->\n</div>');
    });

    test('Esi:try should render attempt when present', async () => {
        // given
        const html = `
<div>
    <esi:try>
        <esi:attempt>
            <p>attempt</p>
        </esi:attempt>
        <esi:except>
            <p>except</p>
        </esi:except>
    </esi:try>
</div>`;

        // when
        const result = await ProcessHtml(html);

        // then
        expect(result).toMatch('\n<div>\n    \n            <p>attempt</p>\n        \n</div>');
    });

    test('Esi:try should render except when attempt is missing', async () => {
        // given
        const html = `
<div>
    <esi:try>
        <esi:except>
            <p>except</p>
        </esi:except>
    </esi:try>
</div>`;

        // when
        const result = await ProcessHtml(html);

        // then
        expect(result).toMatch('\n<div>\n    \n            <p>except</p>\n        \n</div>');
    });

    test('Esi:try should render except when attempt include fails', async () => {
        // given
        const failingUrl = 'http://www.try-fail.se';
        nock(failingUrl)
            .get('/')
            .reply(500);
        const html = `
<div>
    <esi:try>
        <esi:attempt>
            <esi:include src="${failingUrl}" />
        </esi:attempt>
        <esi:except>
            <p>except</p>
        </esi:except>
    </esi:try>
</div>`;

        // when
        const result = await ProcessHtml(html);

        // then
        expect(result).toContain('<p>except</p>');
        expect(result).not.toContain('esi:include without content');
    });

    test('Esi:try should render comment without attempt/except content', async () => {
        // given
        const html = '<esi:try></esi:try>';

        // when
        const result = await ProcessHtml(html);

        // then
        expect(result).toEqual('<!--esi:try without content-->');
    });

    test('XmlMode should support false', async () => {
        // given
        const html = '<div><img src="x" /></div>';

        // when
        const result = await ProcessHtml(html, { XmlMode: false });

        // then
        expect(result).toContain('<img src="x">');
    });

    test('Escaped entities should stay escaped', async () => {
        // given
        const html = '<div>&lt;script&gt;alert(1)&lt;/script&gt;&amp;amp;</div>';

        // when
        const result = await ProcessHtml(html);

        // then
        expect(result).toEqual('<div>&lt;script&gt;alert(1)&lt;/script&gt;&amp;amp;</div>');
    });

    test('Include should preserve raw text payload that looks like json', async () => {
        // given
        const textUrl = 'http://www.text-json-like.se';
        nock(textUrl)
            .defaultReplyHeaders({ 'Content-Type': 'text/plain' })
            .get('/')
            .reply(200, '{"test": true}');
        const html = `<esi:include src="${textUrl}" />`;

        // when
        const result = await ProcessHtml(html);

        // then
        expect(result).toEqual('{"test": true}');
    });


  test('Esi:include should handle HTTP errors', async () => {
    // given
    const url = 'http://localhost:ttt';

    const html = `
<div>
    <esi:include src="${url}" />
</div>`;

    // when
    const result = await ProcessHtml(html);

    // then
    expect(result).toMatch('\n<div>\n    <!--esi:include without content-->');
    expect(requestSpy).toHaveBeenNthCalledWith(1, 'http://localhost:ttt', { responseType: 'text' });
  });
});
