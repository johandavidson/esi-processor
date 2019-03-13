import { EsiDocument } from './esi-document';
import nock from 'nock';

describe('Test esi-document', () => {

    afterEach(()=> {
        jest.restoreAllMocks();
        jest.resetAllMocks();
        jest.resetModules();
        nock.cleanAll();
    });

    afterAll(() => {
        nock.restore();
    })

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
        const document = new EsiDocument(html);

        // when
        await document.Process();

        // then
        expect(document.ToString()).toMatch('\n<div>\n    <p>included</p></div>');
        //expect(request).toBeCalledTimes(1);
    });

    test('Esi:include with alt', async () => {
        // given
        const url = 'http://www.test.se';
        nock(url)
            .get('/')
            .reply(200, '<p>included</p>');
        const fake = 'http://www.incorrecturl.se';
        nock(fake)
            .get('/')
            .reply(404);
        const html = `
<div>
    <esi:include src="${fake}" alt="${url}" />
</div>`;
        const document = new EsiDocument(html);

        // when
        await document.Process();

        // then
        expect(document.ToString()).toMatch('\n<div>\n    <p>included</p></div>');
        //expect(request).toBeCalledTimes(2);
    });

    test('Esi:remove', async () => {
        // given
        const html = `
<div>
    <esi:remove>
        Whatever!
    </esi:remove>
</div>`;
        const document = new EsiDocument(html);

        // when
        await document.Process();

        // then
        expect(document.ToString()).toMatch('\n<div>\n    \n</div>');
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
        const document = new EsiDocument(html);

        // when
        await document.Process();

        // then
        expect(document.ToString()).toMatch('\n<div>\n    \n    \n</div>');
    });

    test('Esi:comment', async () => {
        // given
        const html = `
<div>
    <esi:comment>
        Whatever!
    </esi:comment>
</div>`;
        const document = new EsiDocument(html);

        // when
        await document.Process();

        // then
        expect(document.ToString()).toMatch('\n<div>\n    \n</div>');
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
        const document = new EsiDocument(html);

        // when
        await document.Process();

        // then
        expect(document.ToString()).toMatch('\n<div>\n    \n    \n</div>');
    });

    test('Esi:rwp', async () => {
        // given
        const html = `
<div>
    <!--esi
        <p>included</p>
    -->
</div>`;
        const document = new EsiDocument(html);

        // when
        await document.Process();

        // then
        expect(document.ToString()).toMatch('\n<div>\n    \n        <p>included</p>\n    \n</div>');
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
        const document = new EsiDocument(html);

        // when
        await document.Process();

        // then
        expect(document.ToString()).toMatch(`
<div>
    
        <p>included</p>
    
    
        <p>included</p>
    
</div>`);
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
        const document = new EsiDocument(html);

        // when
        await document.Process();

        // then
        expect(document.ToString()).toMatch('\n<div>\n            <p>included</p>\n        \n    \n</div>');
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
        const document = new EsiDocument(html);

        // when
        await document.Process();

        // then
        expect(document.ToString()).toMatch('\n<div>\n            <p>included</p>\n        \n    \n</div>');
    });
});
