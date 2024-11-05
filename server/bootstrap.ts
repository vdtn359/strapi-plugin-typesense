import { Strapi } from '@strapi/strapi';
import { permissionsActions } from './permissions-actions';

export default async ({ strapi }: { strapi: Strapi }) => {
  const strapiTypesense = strapi.plugin('typesense');

  try {
    await strapi.admin?.services.permission.actionProvider.registerMany(
      permissionsActions
    );
  } catch (error) {
    strapi.log.error(
      `'typesense' permissions bootstrap failed. ${error.message}`
    );
  }

  try {
    await strapiTypesense.service('lifecycles').loadLifecycleMethods();
  } catch (error) {
    strapi.log.error(
      `'typesense' plugin bootstrap lifecycles failed. ${error.message}`
    );
  }
};
