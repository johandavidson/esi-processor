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
        expect(processed).toEqual('\n<p>included</p><p>also included</p>\n{"test": true}\n<p>query included</p>\n<!--esi:choose-->\n<!--esi:comment-->\n<!--esi:remove-->\n\n<p>Hello, test!</p>\n\n\n  <img src="http://www.example.com/gif/hello.gif">\n');
        expect(requestSpy).toBeCalledTimes(3);
        expect(requestSpy).toHaveBeenNthCalledWith(1, 'http://testinclude.com', {
            'headers': { 'X-Custom-Header': 'x-custom-value' },
            'responseType': 'text'
        });
        expect(requestSpy).toHaveBeenNthCalledWith(2, 'http://testjsonurl.com/test.json', {
            'headers': { 'X-Custom-Header': 'x-custom-value' },
            'responseType': 'text'
        });
        expect(requestSpy).toHaveBeenNthCalledWith(3, 'http://testquerystring.com?query=testparam', {
            'headers': { 'X-Custom-Header': 'x-custom-value' },
            'responseType': 'text'
        });
    });

    test('Vars should handle missing headers', async () => {
        // given
        const req = httpMocks.createRequest({
            method: 'GET',
            query: {}
        });
        const html = '<esi:vars>$(HTTP_ACCEPT_LANGUAGE{sv})$(HTTP_COOKIE{name})$(QUERY_STRING{query})</esi:vars>';

        // when
        const processed = await ESI(html, undefined, req);

        // then
        expect(processed).toEqual('false');
    });

    test('Vars should not throw on malformed cookie variable', async () => {
        // given
        const req = httpMocks.createRequest({
            method: 'GET',
            headers: {
                Cookie: 'name=test;'
            }
        });
        const html = '<esi:vars>$(HTTP_COOKIE{[})</esi:vars>';

        // when
        const processed = await ESI(html, undefined, req);

        // then
        expect(processed).toEqual('');
    });

    test('Vars should resolve variables without key when supported', async () => {
        // given
        const req = httpMocks.createRequest({
            method: 'GET',
            headers: {
                Host: 'www.test.se',
                Referrer: 'https://example.com',
                'User-Agent': 'esi-test-agent'
            }
        });
        const html = '<esi:vars>$(HTTP_HOST)|$(HTTP_REFERER)|$(HTTP_USER_AGENT)</esi:vars>';

        // when
        const processed = await ESI(html, undefined, req);

        // then
        expect(processed).toEqual('www.test.se|https://example.com|esi-test-agent');
    });

    test('Vars should resolve nested variables inside esi:vars descendants', async () => {
        // given
        const req = httpMocks.createRequest({
            method: 'GET',
            headers: {
                Cookie: 'name=test-cookie;'
            }
        });
        const html = '<esi:vars><div data-name="$(HTTP_COOKIE{name})"><span>$(HTTP_COOKIE{name})</span></div></esi:vars>';

        // when
        const processed = await ESI(html, undefined, req);

        // then
        expect(processed).toContain('data-name="test-cookie"');
        expect(processed).toContain('<span>test-cookie</span>');
    });

    test('Esi:choose should not allow query injection through variable substitution', async () => {
        // given
        const req = httpMocks.createRequest({
            method: 'GET',
            query: {
                q: 'x\' || \'a\'==\'a'
            }
        });
        const html = `
<esi:choose>
  <esi:when test="'$(QUERY_STRING{q})'=='zzz'">
    <p>injected</p>
  </esi:when>
  <esi:otherwise>
    <p>safe</p>
  </esi:otherwise>
</esi:choose>`;

        // when
        const processed = await ESI(html, undefined, req);

        // then
        expect(processed).toContain('<p>safe</p>');
        expect(processed).not.toContain('<p>injected</p>');
    });

    test('Esi:choose should support unquoted variable comparisons', async () => {
        // given
        const req = httpMocks.createRequest({
            method: 'GET',
            headers: {
                Cookie: 'name=bob;'
            }
        });
        const html = `
<esi:choose>
  <esi:when test="$(HTTP_COOKIE{name})=='bob'">
    <p>included</p>
  </esi:when>
  <esi:otherwise>
    <p>fallback</p>
  </esi:otherwise>
</esi:choose>`;

        // when
        const processed = await ESI(html, undefined, req);

        // then
        expect(processed).toContain('<p>included</p>');
        expect(processed).not.toContain('<p>fallback</p>');
    });

    test('Esi:choose should preserve numeric semantics for interpolated variables', async () => {
        // given
        const req = httpMocks.createRequest({
            method: 'GET',
            query: {
                n: '10'
            }
        });
        const html = `
<esi:choose>
  <esi:when test="$(QUERY_STRING{n})===10">
    <p>included</p>
  </esi:when>
  <esi:otherwise>
    <p>fallback</p>
  </esi:otherwise>
</esi:choose>`;

        // when
        const processed = await ESI(html, undefined, req);

        // then
        expect(processed).toContain('<p>included</p>');
        expect(processed).not.toContain('<p>fallback</p>');
    });

    test('Esi:choose should preserve boolean semantics for interpolated variables', async () => {
        // given
        const req = httpMocks.createRequest({
            method: 'GET',
            query: {
                flag: 'true'
            }
        });
        const html = `
<esi:choose>
  <esi:when test="$(QUERY_STRING{flag})==true">
    <p>included</p>
  </esi:when>
  <esi:otherwise>
    <p>fallback</p>
  </esi:otherwise>
</esi:choose>`;

        // when
        const processed = await ESI(html, undefined, req);

        // then
        expect(processed).toContain('<p>included</p>');
        expect(processed).not.toContain('<p>fallback</p>');
    });

    test('Esi:choose should not treat missing interpolated values as zero', async () => {
        // given
        const req = httpMocks.createRequest({
            method: 'GET',
            query: {}
        });
        const html = `
<esi:choose>
  <esi:when test="$(QUERY_STRING{missing})===0">
    <p>included</p>
  </esi:when>
  <esi:otherwise>
    <p>fallback</p>
  </esi:otherwise>
</esi:choose>`;

        // when
        const processed = await ESI(html, undefined, req);

        // then
        expect(processed).toContain('<p>fallback</p>');
        expect(processed).not.toContain('<p>included</p>');
    });

    test('Vars should not be substituted outside esi:vars', async () => {
        // given
        const req = httpMocks.createRequest({
            method: 'GET',
            headers: {
                Host: 'www.test.se'
            }
        });
        const html = '<p data-host="$(HTTP_HOST)">$(HTTP_HOST)</p>';

        // when
        const processed = await ESI(html, undefined, req);

        // then
        expect(processed).toEqual(html);
    });

    test('Unknown variables should be left untouched', async () => {
        // given
        const req = httpMocks.createRequest({
            method: 'GET',
            headers: {
                Host: 'www.test.se'
            }
        });
        const script = '<script>$(document).ready(function () { $(".x").hide(); });</script>';
        const html = `${script}<a onclick="$(this).hide()">x</a><p>Price $(5)</p><esi:vars>${script}$(HTTP_HOST)</esi:vars>`;

        // when
        const processed = await ESI(html, undefined, req);

        // then
        expect(processed).toEqual(`${script}<a onclick="$(this).hide()">x</a><p>Price $(5)</p>${script}www.test.se`);
    });

    test('Unknown variables should be left untouched without a request', async () => {
        // given
        const html = '<script>$(document).ready(function () {});</script>';

        // when
        const processed = await ESI(html);

        // then
        expect(processed).toEqual(html);
    });

    test('Object prototype keys should not resolve as variables', async () => {
        // given
        const req = httpMocks.createRequest({ method: 'GET' });
        const html = `
<esi:choose>
  <esi:when test="'$(constructor)'=='$(toString)'">
    <p>included</p>
  </esi:when>
</esi:choose>
<esi:vars>$(constructor)</esi:vars>`;

        // when
        const processed = await ESI(html, undefined, req);

        // then
        expect(processed).toContain('$(constructor)');
        expect(processed).toContain('<p>included</p>');
    });
});
