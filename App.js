(function () {
  // Definir AuthContext no objeto window se não existir
  if (!window.AuthContext) {
    window.AuthContext = React.createContext(null);
  }

  function App() {
    const { useState, useEffect } = React;
    const RouterLib = window.ReactRouterDOM || null;

    // Logs diagnósticos para ajudar a entender estado das libs carregadas
    try {
      console.log('Debug: window.ReactRouterDOM =', RouterLib);
      console.log('Debug: window.Recharts =', window.Recharts);
    } catch (e) {
      console.warn('Debug logging failed', e);
    }

    // Se React Router não estiver disponível, usaremos o roteador fallback.
    if (!RouterLib) {
      console.warn('React Router UMD não detectado — usando fallback interno');
    }

    // Evita acessar propriedades do UMD `react-router-dom` (isso pode acionar getters que lançam)
    let Router = null, RoutesComp = null, RouteComp = null, NavigateComp = null;
    // Forçar uso do roteador fallback para evitar falhas com UMD CDN de react-router-dom
    let useFallbackRouter = true;

    // Inicializa tema baseado no localStorage ou preferência do sistema
    const [mode, setMode] = useState(() => localStorage.getItem('theme') || 'dark');
    const [token, setToken] = useState(localStorage.getItem('token'));

    // Efeito para aplicar a classe 'dark' no HTML
    useEffect(() => {
      if (mode === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
      localStorage.setItem('theme', mode);
    }, [mode]);

    const toggleColorMode = () => {
      setMode((prevMode) => (prevMode === 'light' ? 'dark' : 'light'));
    };

    const login = (newToken) => {
      localStorage.setItem('token', newToken);
      setToken(newToken);
    };

    const logout = () => {
      localStorage.removeItem('token');
      setToken(null);
    };

    return React.createElement(window.AuthContext.Provider, { value: { token, login, logout } },
      React.createElement('div', { className: 'min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100 transition-colors duration-300' },
        useFallbackRouter ? (
          // Fallback: roteador simples baseado em pathname (evita depender do react-router UMD)
          (() => {
            const path = window.location.pathname || '/';
            const routeMatch = (pattern) => {
              if (pattern === path) return { ok: true, params: {} };
              const vehicleMatch = /^\/vehicle\/(\d+)\/history$/.exec(path);
              if (pattern === '/vehicle/:id/history' && vehicleMatch) return { ok: true, params: { id: vehicleMatch[1] } };
              const maintenanceMatch = /^\/vehicle\/(\d+)\/maintenance$/.exec(path);
              if (pattern === '/vehicle/:id/maintenance' && maintenanceMatch) return { ok: true, params: { id: maintenanceMatch[1] } };
              return { ok: false };
            };

            const renderRoute = () => {
              const SafeComp = (comp) => comp ? React.createElement(comp) : React.createElement('div', { className: 'p-8 text-center text-red-600' }, 'Erro: Componente não carregado. Verifique se o arquivo .js foi incluído no index.html.');

              if (routeMatch('/admin').ok) return token ? SafeComp(window.Admin) : SafeComp(window.Login);
              if (routeMatch('/register').ok) return !token ? SafeComp(window.Register) : SafeComp(window.Dashboard);
              if (routeMatch('/login').ok) return !token ? SafeComp(window.Login) : SafeComp(window.Dashboard);
              if (routeMatch('/vehicle/:id/history').ok) return token ? SafeComp(window.History) : SafeComp(window.Login);
              if (routeMatch('/vehicle/:id/maintenance').ok) return token ? SafeComp(window.MaintenanceForm) : SafeComp(window.Login);
              return token ? SafeComp(window.Dashboard) : SafeComp(window.Login);
            };

            return React.createElement('div', { className: 'flex flex-col min-h-screen' },
              React.createElement('nav', { className: 'bg-blue-600 text-white shadow-md' },
                React.createElement('div', { className: 'container mx-auto px-4' },
                  React.createElement('div', { className: 'flex items-center justify-between h-16' },
                    React.createElement('span', { className: 'text-xl font-bold' }, 'ManutenCar'),
                    React.createElement('div', { className: 'flex items-center gap-4' },
                      React.createElement('button', {
                        onClick: toggleColorMode,
                        className: 'p-2 rounded-full hover:bg-blue-700 focus:outline-none'
                      }, React.createElement('span', { className: 'material-icons align-middle' }, mode === 'dark' ? 'brightness_7' : 'brightness_4')),
                      token && React.createElement('button', { onClick: logout, className: 'px-4 py-2 hover:bg-blue-700 rounded font-medium' }, 'Sair')
                    )
                  )
                )
              ),
              React.createElement('div', { className: 'container mx-auto mt-8 px-4 flex-grow' }, renderRoute())
            );
          })()
        ) : (
          React.createElement(Router, null,
            React.createElement('div', { className: 'flex flex-col min-h-screen' },
              React.createElement('nav', { className: 'bg-blue-600 text-white shadow-md' },
                React.createElement('div', { className: 'container mx-auto px-4' },
                  React.createElement('div', { className: 'flex items-center justify-between h-16' },
                    React.createElement('span', { className: 'text-xl font-bold' }, 'ManutenCar'),
                    React.createElement('div', { className: 'flex items-center gap-4' },
                      React.createElement('button', { onClick: toggleColorMode, className: 'p-2 rounded-full hover:bg-blue-700 focus:outline-none' }, React.createElement('span', { className: 'material-icons align-middle' }, mode === 'dark' ? 'brightness_7' : 'brightness_4')),
                      token && React.createElement('button', { onClick: logout, className: 'px-4 py-2 hover:bg-blue-700 rounded font-medium' }, 'Sair')
                    )
                  )
                )
              ),
              React.createElement('div', { className: 'container mx-auto mt-8 px-4 flex-grow' },
                React.createElement(RoutesComp, null,
                  React.createElement(RouteComp, { path: '/admin', element: token ? React.createElement(window.Admin) : React.createElement(NavigateComp, { to: '/login' }) }),
                  React.createElement(RouteComp, { path: '/vehicle/:id/history', element: token ? React.createElement(window.History) : React.createElement(NavigateComp, { to: '/login' }) }),
                  React.createElement(RouteComp, { path: '/vehicle/:id/maintenance', element: token ? (window.MaintenanceForm ? React.createElement(window.MaintenanceForm) : React.createElement('div', null, 'Erro: MaintenanceForm não carregado')) : React.createElement(NavigateComp, { to: '/login' }) }),
                  React.createElement(RouteComp, { path: '/register', element: !token ? React.createElement(window.Register) : React.createElement(NavigateComp, { to: '/' }) }),
                  React.createElement(RouteComp, { path: '/login', element: !token ? React.createElement(window.Login) : React.createElement(NavigateComp, { to: '/' }) }),
                  React.createElement(RouteComp, { path: '/', element: token ? React.createElement(window.Dashboard) : React.createElement(NavigateComp, { to: '/login' }) })
                )
              )
            )
          )
        )
      )
    );
  }

  // Definir como variável global para que o main.js possa acessar
  window.App = App;
})();