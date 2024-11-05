export type StrapiTypesenseConfig = {
  apiKey: string;
  nodes: any[];
  indexPrefix?: string;
  contentTypes: {
    name: string;
    index: string;
    idPrefix?: string;
    schema: any;
    populate: any;
    hideFields?: string[];
    transformToBooleanFields?: string[];
  }[];
};
