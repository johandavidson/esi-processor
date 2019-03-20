import { ESI } from './app';
import nock = require('nock');

describe('Test app', () => {

    test('Test document without esi tags', async () => {
        // given
        const html = `
<div>
    <p>Test</p>
</div>`;

        // when
        const processed = await ESI(html);

        // then
        expect(processed).toEqual('\n<div>\n    <p>Test</p>\n</div>');
    });

    test('Test esi document', async () => {
        // given
        const testurl = 'http://testinclude.com';
        const alttesturl = 'http://alttestinclude.com';
        const testqueryurl = 'http://testquerystring.com';
        const queryparam = '$(QUERY_STRING{query})';

        nock(testurl)
          .get('/')
          .times(2)
          .reply(200, '<p>included</p><p>also included</p>');

        nock(alttesturl)
          .get('/')
          .reply(200, '<p>alt included</p>');

        nock(testqueryurl)
          .get('/')
          .query({ query: queryparam})
          .reply(200, '<p>query included</p>');

          const html = `
<esi:include src="${testurl}" alt="${alttesturl}" onerror="continue" />
<esi:include src="${testqueryurl}?query=${queryparam}"/>
<esi:choose>
  <esi:when test="1==0">
    <esi:include src="${testurl}"/>
  </esi:when>
  <esi:when test="0==1">
    <esi:include src="${testurl}"/>
  </esi:when>
  <esi:otherwise>
    <esi:include src="${testurl}"/>
  </esi:otherwise>
</esi:choose>
<esi:comment text="the following animation will have a 24 hr TTL." />
<esi:remove>
  <a href="http://www.example.com">www.example.com</a>
</esi:remove>
<!--esi
<p><esi:vars>Hello, $(HTTP_COOKIE{name})!</esi:vars></p>
-->`;

        // when
        const processed = await ESI(html, { IgnoreEsiChooseTags: true, XmlMode: true });

        // then
        expect(processed).toEqual('\n<p>included</p><p>also included</p>\n<p>query included</p>\n<!--esi:choose-->\n<!--esi:comment-->\n<!--esi:remove-->\n\n<p><esi:vars>Hello, $(HTTP_COOKIE{name})!</esi:vars></p>\n');
    });
});
