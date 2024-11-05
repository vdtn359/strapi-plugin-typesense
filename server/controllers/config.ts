import { Strapi } from '@strapi/strapi';
import Koa from 'koa';
import { StrapiTypesenseConfig } from '../../utils/config';

export default ({ strapi }: { strapi: Strapi }) => ({
  async contentTypes(
    ctx: Koa.Context & {
      request: {
        body?: unknown;
        rawBody: string;
      };
    }
  ) {
    const { contentTypes } = strapi.config.get(
      'plugin.strapi-typesense'
    ) as StrapiTypesenseConfig;

    if (!contentTypes) {
      return;
    }

    ctx.body = {
      contentTypes: contentTypes.map(
        (contentType) => contentType.name
      ),
    };
  },
});
