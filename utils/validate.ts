import { yup } from '@strapi/utils';

export const validateConfig = (config: unknown) => {
  try {
    yup
      .object()
      .shape({
        host: yup.string().required(),
        port: yup.number().required(),
        protocol: yup.string().required(),
        apiKey: yup.string().required(),
        indexPrefix: yup.string(),
        contentTypes: yup.array().of(
          yup.object().shape({
            name: yup.string().required(),
            index: yup.string(),
            idPrefix: yup.string(),
            // https://docs.strapi.io/dev-docs/api/entity-service/populate
            populate: yup.object(),
            hideFields: yup.array().of(yup.string()),
            transformToBooleanFields: yup.array().of(yup.string()),
            schema: yup.object(),
          })
        ),
      })
      .validateSync(config);
  } catch (error) {
    throw new Error(
      `Typesense plugin configuration error: ${error.errors}`
    );
  }
};
