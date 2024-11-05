import { Strapi } from '@strapi/strapi';
import { StrapiTypesenseConfig } from '../../utils/config';

export default ({ strapi }: { strapi: Strapi }) => ({
  async loadLifecycleMethods() {
    const {
      indexPrefix = '',
      contentTypes,
      nodes,
      apiKey,
    } = strapi.config.get(
      'plugin.strapi-typesense',
    ) as StrapiTypesenseConfig;

    if (!contentTypes) {
      return;
    }

    const strapiTypesense = strapi.plugin('strapi-typesense');
    const typesenseService = strapiTypesense.service('typesense');
    const strapiService = strapiTypesense.service('strapi');

    const client = await typesenseService.getTypesenseClient(
      nodes,
      apiKey,
    );

    for (const contentType of contentTypes) {
      const {
        name,
        index,
        idPrefix = '',
        populate = '*',
        hideFields = [],
        transformToBooleanFields = [],
      } = contentType;

      if (strapi.contentTypes[name]) {
        const indexName = `${indexPrefix}${index ?? name}`;

        strapi.db?.lifecycles.subscribe({
          models: [name],
          afterCreate: async (event) => {
            await strapiService.afterUpdateAndCreate(
              [event],
              populate,
              hideFields,
              transformToBooleanFields,
              idPrefix,
              client,
              indexName,
            );
          },
          afterUpdate: async (event) => {
            await strapiService.afterUpdateAndCreate(
              [event],
              populate,
              hideFields,
              transformToBooleanFields,
              idPrefix,
              client,
              indexName,
            );
          },
          afterDelete: async (event) => {
            await strapiService.afterDeleteOneOrMany(
              event,
              idPrefix,
              client,
              indexName,
              false,
            );
          },
          afterDeleteMany: async (event) => {
            await strapiService.afterDeleteOneOrMany(
              event,
              idPrefix,
              client,
              indexName,
              true,
            );
          },
        });
      }
    }
  },
});
