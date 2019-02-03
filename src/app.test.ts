import { ESI } from './app';

describe('Test app', () => {

    test('Test document without esi tags', () => {
        // given
        const html = `<div></div>`;
        const esi = new ESI();

        // when
        const processed = esi.Process(html);

        // then
        expect(processed).toMatch(`<div></div>`);
    });

    test('Test esi:comment', () => {
        // given
        const html = `<div><esi:comment text="This is an esi comment." /></div>`;
        const html2 = '<div><esi:comment>Test comment</esi:comment></div>';
        const esi = new ESI();

        // when
        const processed = esi.Process(html);
        const processed2 = esi.Process(html2);

        // then
        expect(processed).toMatch('<div></div>');
        expect(processed2).toMatch('<div></div>');
    });

    test('Test esi:remove', () => {
        // given
        const html = `<div><esi:remove><p>Whatever</p></esi:remove></div>`;
        const esi = new ESI();

        // when
        const processed = esi.Process(html);

        // then
        expect(processed).toMatch(`<div></div>`);
    });

    test('Test render without processing', () => {
        // given
        const html = `
        <div>
            <!--esi
                <p>Test</p>
            -->
        </div>`;
        const esi = new ESI();

        // when
        const processed = esi.Process(html);

        // then
        expect(processed).toMatch(`
        <div>
            <p>Test</p>
        </div>`);
    });

    test('Test choose', () => {
        // given
        const html = `
        <div>
            <esi:choose>
                <esi:when test="1==1">
                    <p>Test</p>
                </esi:when>
            </esi:choose>
        </div>`;
        const esi = new ESI();

        // when
        const processed = esi.Process(html);

        // then
        expect(processed).toMatch(`
        <div>
                    <p>Test</p>
                </div>`);
    });

    test('Test choose with multiple when', () => {
        // given
        const html = `
        <div>
            <esi:choose>
                <esi:when test="1==0">
                    <p>Nope!</p>
                </esi:when>
                <esi:when test="1==1">
                    <p>Test1</p>
                </esi:when>
                <esi:when test="1==1">
                    <p>Nope!</p>
                </esi:when>
            </esi:choose>
        </div>`;
        const esi = new ESI();

        // when
        const processed = esi.Process(html);

        // then
        expect(processed).toMatch(`
        <div>
                    <p>Test1</p>
                </div>`);
    });

    test('Test otherwise', () => {
        // given
        const html = `
        <div>
            <esi:choose>
                <esi:when test="1==0">
                    <p>Nope!</p>
                </esi:when>
                <esi:otherwise>
                    <p>Test</p>
                </esi:otherwise>
            </esi:choose>
        </div>`;
        const esi = new ESI();

        // when
        const processed = esi.Process(html);

        // then
        expect(processed).toMatch(`
        <div>
                    <p>Test</p>
                </div>`);
    });
});
