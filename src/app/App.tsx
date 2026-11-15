import { Route, Routes } from 'react-router';
import { Layout } from './Layout';
import { routeDefs } from './routes';

export function AppRoutes() {
  return (
    <Routes>
      <Route element={<Layout />}>
        {routeDefs.map(({ id, path, Component }) =>
          path === '/' ? <Route key={id} index element={<Component />} /> : <Route key={id} path={path} element={<Component />} />,
        )}
      </Route>
    </Routes>
  );
}
