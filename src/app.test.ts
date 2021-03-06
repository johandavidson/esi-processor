import { ESI } from './app';
import nock = require('nock');
import httpMocks = require('node-mocks-http');
import axios from 'axios';

let requestSpy;

describe('Test app', () => {

    beforeEach(() => {
        requestSpy = jest.spyOn(axios, 'get') as jest.Mock;
    });

    afterEach(() => {
        jest.restoreAllMocks();
        jest.resetAllMocks();
        jest.resetModules();
    });

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
        const testjsonurl = 'http://testjsonurl.com';
        const testqueryurl = 'http://testquerystring.com';
        const queryparam = '$(QUERY_STRING{query})';
        const resolvedQueryparam = 'testparam';

        const req = httpMocks.createRequest({
            method: 'GET',
            cookies: { name: 'testname', type: 'testtype' },
            headers: {
                Cookie: 'Test=test; name=test; type=gif;'
            },
            query: {
                query: resolvedQueryparam
            }
        });

        nock(testurl)
            .get('/')
            .times(2)
            .reply(200, '<p>included</p><p>also included</p>');

        nock(testjsonurl)
          .defaultReplyHeaders({
            'Content-Type': 'application/json',
          })
            .get('/test.json')
            .reply(200, '{"test": true}');

        nock(alttesturl)
            .get('/')
            .reply(200, '<p>alt included</p>');

        nock(testqueryurl)
            .get('/')
            .query({ query: resolvedQueryparam })
            .reply(200, '<p>query included</p>');

        const html = `
<esi:include src="${testurl}" alt="${alttesturl}" onerror="continue" />
<esi:include src="${testjsonurl}/test.json"/>
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
-->
<esi:vars>
  <img src="http://www.example.com/$(HTTP_COOKIE{type})/hello.gif" />
</esi:vars>`;

        // when
        const processed = await ESI(html, {
            IgnoreEsiChooseTags: true,
            XmlMode: true,
            Headers: { 'X-Custom-Header': 'x-custom-value' }
        }, req);

        // then
        expect(processed).toEqual('\n<p>included</p><p>also included</p>\n{"test":true}\n<p>query included</p>\n<!--esi:choose-->\n<!--esi:comment-->\n<!--esi:remove-->\n\n<p>Hello, test!</p>\n\n\n  <img src="http://www.example.com/gif/hello.gif">\n');
        expect(requestSpy).toBeCalledTimes(3);
        expect(requestSpy).toHaveBeenNthCalledWith(1, 'http://testinclude.com', {
            'headers': { 'X-Custom-Header': 'x-custom-value' }
        });
        expect(requestSpy).toHaveBeenNthCalledWith(2, 'http://testjsonurl.com/test.json', {
            'headers': { 'X-Custom-Header': 'x-custom-value' }
        });
        expect(requestSpy).toHaveBeenNthCalledWith(3, 'http://testquerystring.com?query=testparam', {
            'headers': { 'X-Custom-Header': 'x-custom-value' }
        });
    });
});
