export enum EsiFileExt {
  JSON = 'json'
}

export interface EsiProcessorOptions {
    Headers?: object;
    BaseUrl?: string;
    IgnoreEsiChooseTags?: boolean;
    XmlMode?: boolean;
    Verbose?: boolean;
    ParallelProcessing?: boolean;
    ParallelProcessingMaxConcurrency?: number;
}

export interface EsiFile {
  data: unknown;
  contentType: string;
}

export interface HttpRequestOptions {
    headers?: object;
}
