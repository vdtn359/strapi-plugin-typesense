export default {
  type: 'admin',
  routes: [
    {
      method: 'POST',
      path: '/index-all-articles',
      handler: 'strapi-typesense-index-articles.index',
      config: {
        policies: ['admin::isAuthenticatedAdmin'],
      },
    },
    {
      method: 'GET',
      path: '/config/content-types',
      handler: 'strapi-typesense-config.contentTypes',
      config: {
        policies: ['admin::isAuthenticatedAdmin'],
      },
    },
  ],
};
