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
        expect(requestSpy).toHaveBeenNthCalledWith(1, 'http://www.test.se', {});
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
        expect(requestSpy).toHaveBeenNthCalledWith(1, 'http://www.incorrecturl.se', {});
        expect(requestSpy).toHaveBeenNthCalledWith(2, 'http://www.test.se', {});
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
    expect(requestSpy).toHaveBeenNthCalledWith(1, 'http://localhost:ttt', {});
  });
});
