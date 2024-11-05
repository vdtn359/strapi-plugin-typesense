import { Strapi } from '@strapi/strapi';
import { Client } from 'typesense';
import { transformNullToBoolean } from '../../utils/utils';

export default ({ strapi }: { strapi: Strapi }) => ({
  getTypesenseClient: async (nodes: any[], apiKey: string) => {
    return new Client({
      nodes,
      apiKey,
      connectionTimeoutSeconds: 10,
    });
  },

  createOrDeleteObjects: async (
    objectsToSave: any[],
    objectsIdsToDelete: string[],
    typesenseClient: Client,
    collectionName: string,
    transformToBooleanFields: string[] = [],
  ) => {
    const strapiTypesense = strapi.plugin('strapi-typesense');
    const utilsService = strapiTypesense.service('utils');

    if (objectsIdsToDelete.length) {
      for (const id of objectsIdsToDelete) {
        try {
          await typesenseClient.collections(collectionName).documents(id).delete();
        } catch (error) {
          console.error(`Error deleting document with id ${id}:`, error);
        }
      }
    }

    // Handle upserts (create or update documents)
    if (objectsToSave.length) {
      const chunkedObjectsToSave: any[][] = utilsService.getChunksRequests(objectsToSave);

      for (const chunk of chunkedObjectsToSave) {
        const cleanedChunk = chunk.map((c) =>
          transformNullToBoolean(c, transformToBooleanFields),
        );

        try {
          // Convert objects to Typesense upsert format
          const documentImportPayload = cleanedChunk.map((doc) => JSON.stringify(doc)).join('\n');

          await typesenseClient
            .collections(collectionName)
            .documents()
            .import(documentImportPayload, { action: 'upsert' });
        } catch (error) {
          console.error('Error upserting documents:', error);
        }
      }
    }
  },
  async deleteObjects(
    typesenseClient: Client,
    collectionName: string,
    objectIDs: string[],
  ) {
    if (objectIDs.length) {
      for (const id of objectIDs) {
        try {
          await typesenseClient.collections(collectionName).documents(id).delete();
        } catch (error) {
          console.error(`Error deleting document with id ${id}:`, error);
        }
      }
    }
  },
});
