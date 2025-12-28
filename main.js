(function () {
  const { createRoot } = ReactDOM;
  const { StrictMode } = React;

  console.log('main.js loaded');

  // Aguardar que todos os componentes sejam carregados
  setTimeout(() => {
    console.log('Checking components...');
    console.log('window.App:', typeof window.App);
    console.log('window.AuthContext:', typeof window.AuthContext);

    if (window.App && window.AuthContext) {
      console.log('Rendering full React app...');
      try {
        const rootElement = document.getElementById('root');
        if (rootElement) {
          const root = createRoot(rootElement);
          const appElement = React.createElement(window.App);
          const strictElement = React.createElement(StrictMode, null, appElement);
          root.render(strictElement);
          console.log('Full React app rendered successfully!');
        } else {
          console.error('Root element not found');
        }
      } catch (error) {
        console.error('Error rendering full app:', error);
        console.error('Error stack:', error.stack);
      }
    } else {
      console.error('Components not ready yet, retrying...');
      setTimeout(() => {
        console.log('Retrying component check...');
        if (window.App && window.AuthContext) {
          console.log('Components now available, rendering...');
          try {
            const rootElement = document.getElementById('root');
            if (rootElement) {
              const root = createRoot(rootElement);
              const appElement = React.createElement(window.App);
              const strictElement = React.createElement(StrictMode, null, appElement);
              root.render(strictElement);
              console.log('React app rendered on retry!');
            }
          } catch (error) {
            console.error('Error on retry:', error);
          }
        } else {
          console.error('Components still not available');
        }
      }, 2000);
    }
  }, 2000);
})();