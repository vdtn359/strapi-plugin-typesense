import { Common, Strapi } from '@strapi/strapi';
import { Client } from 'typesense';
import { HookEvent } from '../../utils/event';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export default ({ strapi }: { strapi: Strapi }) => ({
  getStrapiObject: async (
    event: HookEvent,
    populate: any,
    hideFields: string[],
  ) => {
    const strapiTypesense = strapi.plugin('typesense');
    const utilsService = strapiTypesense.service('utils');

    const { model } = event;
    const modelUid = model.uid as Common.UID.ContentType;
    const entryId = utilsService.getEntryId(event);

    if (!entryId) {
      throw new Error(`No entry id found in event.`);
    }

    const strapiObject = await strapi.entityService?.findOne(
      modelUid,
      entryId,
      { populate },
    );

    if (!strapiObject) {
      throw new Error(
        `No entry found for ${modelUid} with ID ${entryId}`,
      );
    }

    return utilsService.filterProperties(strapiObject, hideFields);
  },
  afterUpdateAndCreate: async (
    _events: any[],
    populate: any,
    hideFields: string[],
    transformToBooleanFields: string[],
    idPrefix: string,
    typesenseClient: Client,
    indexName: string,
  ) => {
    const strapiTypesense = strapi.plugin('typesense');
    const typesenseService = strapiTypesense.service('typesense');
    const strapiService = strapiTypesense.service('strapi');
    const utilsService = strapiTypesense.service('utils');

    const objectsToSave: any[] = [];
    const objectsIdsToDelete: string[] = [];
    const events = _events as HookEvent[];

    for (const event of events) {
      try {
        const entryId = `${idPrefix}${utilsService.getEntryId(
          event,
        )}`;
        const strapiObject = await strapiService.getStrapiObject(
          event,
          populate,
          hideFields,
        );

        if (strapiObject.publishedAt === null) {
          objectsIdsToDelete.push(entryId);
        } else if (strapiObject.publishedAt !== null) {
          objectsToSave.push({
            objectID: entryId,
            ...strapiObject,
          });
        }
      } catch (error) {
        console.error(
          `Error while updating Typesense index: ${JSON.stringify(
            error,
          )}`,
        );
      }
    }

    await typesenseService.createOrDeleteObjects(
      objectsToSave,
      objectsIdsToDelete,
      typesenseClient,
      indexName,
      transformToBooleanFields,
    );
  },
  afterUpdateAndCreateAlreadyPopulate: async (
    articles: any[],
    idPrefix: string,
    typesenseClient: Client,
    indexName: string,
    transformToBooleanFields: string[] = [],
  ) => {
    const strapiTypesense = strapi.plugin('typesense');
    const typesenseService = strapiTypesense.service('typesense');

    const objectsToSave: any[] = [];
    const objectsIdsToDelete: string[] = [];

    for (const article of articles) {
      try {
        const entryId = article.id;
        const entryIdWithPrefix = `${idPrefix}${entryId}`;

        if (article.publishedAt === null) {
          objectsIdsToDelete.push(entryIdWithPrefix);
        } else if (article.publishedAt !== null) {
          objectsToSave.push({
            objectID: entryIdWithPrefix,
            ...article,
          });
        }
      } catch (error) {
        console.error(
          `Error while updating Typesense index: ${JSON.stringify(
            error,
          )}`,
        );
      }
    }

    await typesenseService.createOrDeleteObjects(
      objectsToSave,
      objectsIdsToDelete,
      typesenseClient,
      indexName,
      transformToBooleanFields,
    );
  },
  afterDeleteOneOrMany: async (
    _event: any,
    idPrefix: string,
    typesenseClient: Client,
    indexName: string,
    many: boolean,
  ) => {
    try {
      const strapiTypesense = strapi.plugin('typesense');
      const typesenseService = strapiTypesense.service('typesense');
      const event = _event as HookEvent;
      const strapiIds = many
        ? event?.params?.where?.['$and'][0]?.id['$in']
        : [event.params.where.id];
      const objectIDs = strapiIds.map(
        (id: string) => `${idPrefix}${id}`,
      );

      await typesenseService.deleteObjects(typesenseClient, indexName, objectIDs);
    } catch (error) {
      console.error(
        `Error while deleting object(s) from Typesense index: ${error}`,
      );
    }
  },
});
