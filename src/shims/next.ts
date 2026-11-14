export type Metadata = Record<string, any>;
export type Viewport = Record<string, any>;
export namespace MetadataRoute {
  export type Sitemap = Array<{
    url: string;
    lastModified?: string | Date;
    changeFrequency?: string;
    priority?: number;
  }>;
}
