import React from 'react';
import ReactDOMServer from 'react-dom/server';
import { StaticRouter } from 'react-router-dom/server';
import App from './App.jsx';
import { AuthProvider } from './context/AuthContext.jsx';
import { SettingsProvider } from './context/SettingsContext.jsx';

export function render(url) {
  const helmetContext = {};
  const appHtml = ReactDOMServer.renderToString(
    <StaticRouter location={url}>
      <AuthProvider>
        <SettingsProvider>
          <App helmetContext={helmetContext} />
        </SettingsProvider>
      </AuthProvider>
    </StaticRouter>
  );

  return {
    appHtml,
    helmet: helmetContext.helmet,
  };
}
