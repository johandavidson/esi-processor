import { Request } from 'express';

const escapeRegExp = (value: string): string => {
    return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

export const ESIVARIABLES = {
    HTTP_ACCEPT_LANGUAGE: (req: Request, language?: string) => {
        const header = req.header('accept-language') || '';
        if (!language) {
            return header;
        }
        return header.includes(language);
    },
    HTTP_COOKIE: (req: Request, cookie?: string) => {
        const header = req.header('cookie') || '';
        if (!cookie) {
            return header;
        }
        const safeCookieName = escapeRegExp(cookie);
        return header
            .replace(new RegExp(`(?:(?:^|.*;\\s*)${safeCookieName}\\s*\\=\\s*([^;]*).*$)|^.*$`), '$1');
    },
    HTTP_HOST: (req: Request) => req.header('host') || '',
    HTTP_REFERER: (req: Request) => req.header('referrer') || '',
    HTTP_USER_AGENT: (req: Request) => req.header('user-agent') || '',
    QUERY_STRING: (req: Request, query?: string) => {
        if (query) {
            return req.query[query];
        }
        const url = req.originalUrl || req.url || '';
        const queryStart = url.indexOf('?');
        return queryStart === -1 ? '' : url.slice(queryStart + 1);
    }
};
