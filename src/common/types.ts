export enum EsiFileExt {
  JSON = 'json'
}

export interface EsiProcessorOptions {
    Headers?: object;
    BaseUrl?: string;
    IgnoreEsiChooseTags?: boolean;
    XmlMode?: boolean;
    Verbose?: boolean;
}

export interface EsiFile {
  data: string;
  contentType: string;
}

export interface HttpRequestOptions {
    headers?: object;
}
