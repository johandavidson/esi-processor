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
  data: string;
  contentType: string;
}

export interface HttpRequestOptions {
    headers?: object;
}
