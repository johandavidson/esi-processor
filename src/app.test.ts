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
        nock.cleanAll();
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

    test('Esi tags nested in esi:vars should be processed', async () => {
        // given
        const url = 'http://varsinclude.com';
        const n = nock(url)
            .get('/www.test.se')
            .reply(200, '<p>included</p>');
        const req = httpMocks.createRequest({
            method: 'GET',
            headers: {
                Host: 'www.test.se',
                Cookie: 'name=bob;'
            }
        });
        const html = `<esi:vars><esi:include src="${url}/$(HTTP_HOST)"/>`
            + `<esi:choose><esi:when test="$(HTTP_COOKIE{name})=='bob'"><span>$(HTTP_HOST)</span></esi:when></esi:choose>`
            + '<esi:remove><p>removed</p></esi:remove></esi:vars>';

        // when
        const processed = await ESI(html, undefined, req);

        // then
        expect(n.isDone()).toBeTruthy();
        expect(processed).toEqual('<p>included</p><span>www.test.se</span><!--esi:remove-->');
    });

    test('Esi tag attributes inside esi:vars should only be substituted once', async () => {
        // given
        const url = 'http://varsonce.com';
        const n = nock(url)
            .get('/')
            .query({ v: '$(HTTP_HOST)' })
            .reply(200, '<p>included</p>');
        const req = httpMocks.createRequest({
            method: 'GET',
            headers: {
                Host: 'www.test.se',
                Cookie: 'v=$(HTTP_HOST);'
            }
        });
        const html = `<esi:vars><esi:include src="${url}/?v=$(HTTP_COOKIE{v})"/></esi:vars>`;

        // when
        const processed = await ESI(html, undefined, req);

        // then
        expect(n.isDone()).toBeTruthy();
        expect(processed).toEqual('<p>included</p>');
    });

    test('Nested esi:vars should only substitute once', async () => {
        // given
        const req = httpMocks.createRequest({
            method: 'GET',
            headers: {
                Host: 'www.test.se',
                Cookie: 'c=$(HTTP_HOST);'
            }
        });
        const html = '<esi:vars><p>$(HTTP_COOKIE{c})</p><esi:vars><p>$(HTTP_COOKIE{c})</p></esi:vars></esi:vars>';

        // when
        const processed = await ESI(html, undefined, req);

        // then
        expect(processed).toEqual('<p>$(HTTP_HOST)</p><p>$(HTTP_HOST)</p>');
    });

    test('Esi:choose should only match esi:when children', async () => {
        // given
        const html = `
<esi:choose>
  <div test="1==1"><p>not a when</p></div>
  <esi:when test="1==1">
    <p>included</p>
  </esi:when>
</esi:choose>`;

        // when
        const processed = await ESI(html);

        // then
        expect(processed).toContain('<p>included</p>');
        expect(processed).not.toContain('not a when');
    });

    test('Vars without a key should return the whole value', async () => {
        // given
        const req = httpMocks.createRequest({
            method: 'GET',
            url: '/page?a=1&b=2',
            headers: {
                'Accept-Language': 'sv,en;q=0.8',
                Cookie: 'a=1; b=2'
            }
        });
        const html = '<esi:vars>$(HTTP_ACCEPT_LANGUAGE)|$(HTTP_COOKIE)|$(QUERY_STRING)</esi:vars>';

        // when
        const processed = await ESI(html, undefined, req);

        // then
        expect(processed).toEqual('sv,en;q=0.8|a=1; b=2|a=1&b=2');
    });

    test('Vars without a key should be empty when the value is missing', async () => {
        // given
        const req = httpMocks.createRequest({ method: 'GET', url: '/page' });
        const html = '<esi:vars>$(HTTP_ACCEPT_LANGUAGE)|$(HTTP_COOKIE)|$(QUERY_STRING)</esi:vars>';

        // when
        const processed = await ESI(html, undefined, req);

        // then
        expect(processed).toEqual('||');
    });
});
