import { Request } from 'express';

const escapeRegExp = (value: string): string => {
    return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

export const ESIVARIABLES = {
    HTTP_ACCEPT_LANGUAGE: (req: Request, language?: string) => {
        if (!language) {
            return false;
        }
        return (req.header('accept-language') || '').includes(language);
    },
    HTTP_COOKIE: (req: Request, cookie?: string) => {
        if (!cookie) {
            return '';
        }
        const safeCookieName = escapeRegExp(cookie);
        return (req.header('cookie') || '')
            .replace(new RegExp(`(?:(?:^|.*;\\s*)${safeCookieName}\\s*\\=\\s*([^;]*).*$)|^.*$`), '$1');
    },
    HTTP_HOST: (req: Request) => req.header('host') || '',
    HTTP_REFERER: (req: Request) => req.header('referrer') || '',
    HTTP_USER_AGENT: (req: Request) => req.header('user-agent') || '',
    QUERY_STRING: (req: Request, query?: string) => query ? req.query[query] : ''
};
