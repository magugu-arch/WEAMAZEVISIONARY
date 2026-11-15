import { StrictMode } from 'react';
import { createRoot, hydrateRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router';
import '@fontsource-variable/geist/wght.css';
import '@fontsource-variable/geist-mono/wght.css';
import '@fontsource/cormorant-garamond/400.css';
import '@fontsource/cormorant-garamond/400-italic.css';
import '@fontsource/cormorant-garamond/500.css';
import './styles/index.css';
import { AppRoutes } from './app/App';
import { preloadPathname } from './app/routes';

const container = document.getElementById('root')!;
const app = (
  <StrictMode>
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  </StrictMode>
);

// Load the current route's chunk before hydrating so the first client render
// matches the prerendered HTML exactly (no Suspense fallback, no flash).
void preloadPathname(window.location.pathname).finally(() => {
  if (container.hasChildNodes()) hydrateRoot(container, app);
  else createRoot(container).render(app);
});
