import { ESI } from './app';

describe('Test app', () => {

    test('Test document without esi tags', async () => {
        // given
        const html = `
<div>
    <p>Test</p>
</div>`;
        const esi = new ESI();

        // when
        const processed = await esi.Process(html);

        // then
        expect(processed).toMatch('\n<div>\n    <p>Test</p>\n</div>');
    });

});
