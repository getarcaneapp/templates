export interface TemplateSummary {
  id: string;
  name: string;
  description: string;
  version: string;
  author: string;
  icon_url?: string;
  tags: string[];
}

export interface ServiceSummary {
  name: string;
  image: string | null;
  ports: string[];
}

export interface TemplateDetail extends TemplateSummary {
  documentationUrl: string;
  composeRaw: string;
  composeHtml: string;
  envRaw: string;
  envHtml: string;
  readmeHtml: string | null;
  urls: string[];
  services: ServiceSummary[];
}

export interface TagInfo {
  tag: string;
  description: string;
  count: number;
}
