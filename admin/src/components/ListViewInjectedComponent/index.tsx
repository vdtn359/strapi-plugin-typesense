import { useRBAC } from '@strapi/helper-plugin';
import { useRouteMatch } from 'react-router-dom';
import strapiTypesensePermissions from '../../permissions';
import IndexAllButton from '../IndexAllButton';

const ListViewInjectedComponent = () => {
  const routeMatch = useRouteMatch<any>(
    '/content-manager/:kind/:slug?'
  );
  const { allowedActions } = useRBAC(strapiTypesensePermissions);

  if (!allowedActions.canIndex) {
    return null;
  }

  return <IndexAllButton contentType={routeMatch?.params.slug} />;
};

export default ListViewInjectedComponent;
