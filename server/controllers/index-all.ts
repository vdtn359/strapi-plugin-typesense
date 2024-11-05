import { Strapi } from '@strapi/strapi';
import Koa from 'koa';
import { StrapiTypesenseConfig } from '../../utils/config';

export default ({ strapi }: { strapi: Strapi }) => ({
  async index(
    ctx: Koa.Context & {
      request: {
        body?: unknown;
        rawBody: string;
      };
    },
  ) {
    const {
      indexPrefix = '',
      contentTypes,
      apiKey,
      nodes,
    } = strapi.config.get(
      'plugin.strapi-typesense',
    ) as StrapiTypesenseConfig;

    if (!contentTypes) {
      return;
    }

    const strapiTypesense = strapi.plugin('strapi-typesense');
    const typesenseService = strapiTypesense.service('typesense');
    const strapiService = strapiTypesense.service('strapi');
    const utilsService = strapiTypesense.service('utils');

    const client = await typesenseService.getTypesenseClient({
      nodes,
      apiKey,
    });
    const body = ctx.request.body as any;

    if (!body.name) {
      return ctx.throw(400, `Missing name in body`);
    }

    const contentType = contentTypes.find(
      (contentType) => contentType.name === body.name,
    );

    if (!contentType) {
      return ctx.throw(
        400,
        `Content type not found in config with ${body.name}`,
      );
    }

    const {
      name,
      index,
      idPrefix = '',
      populate = '*',
      hideFields = [],
      transformToBooleanFields = [],
    } = contentType;

    const indexName = `${indexPrefix}${index ?? name}`;

    const allLocales =
      await strapi.plugins?.i18n?.services?.locales?.find();
    const localeFilter = allLocales?.map(
      (locale: any) => locale.code,
    );
    const findManyBaseOptions = { populate };
    const findManyOptions = localeFilter
      ? {
        ...findManyBaseOptions,
        locale: localeFilter,
      }
      : { ...findManyBaseOptions };

    const articlesStrapi = await strapi.entityService?.findMany(
      name as any,
      findManyOptions,
    );
    const articles = (articlesStrapi ?? []).map((article: any) =>
      utilsService.filterProperties(article, hideFields),
    );

    await strapiService.afterUpdateAndCreateAlreadyPopulate(
      articles,
      idPrefix,
      client,
      indexName,
      transformToBooleanFields,
    );

    return ctx.send({
      message: `Indexing articles type ${name} to index ${indexName}`,
    });
  },
});
