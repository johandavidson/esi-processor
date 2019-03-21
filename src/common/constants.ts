import { Request } from 'express';

export const ESIVARIABLES = {
    HTTP_ACCEPT_LANGUAGE: (req: Request, language: string) => req.header('accept-language').includes(language),
    HTTP_COOKIE: (req: Request, cookie: string) => req.header('cookie').replace(new RegExp(`(?:(?:^|.*;\\s*)${cookie}\\s*\\=\\s*([^;]*).*$)|^.*$`), '$1'),
    HTTP_HOST: (req: Request) => req.header('host'),
    HTTP_REFERER: (req: Request) => req.header('referrer'),
    HTTP_USER_AGENT: (req: Request) => req.header('user-agent'),
    QUERY_STRING: (req: Request, query: string) => req.query[query]
};
