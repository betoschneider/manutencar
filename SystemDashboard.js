(function () {
  const { useState, useEffect } = React;

  function SystemDashboard() {
    const [token, setToken] = useState(sessionStorage.getItem('globalDashboardToken') || '');
    const [inputToken, setInputToken] = useState('');
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
      if (token) {
        fetchStats(token);
      }
    }, [token]);

    const fetchStats = async (activeToken) => {
      setLoading(true);
      setError('');
      try {
        const res = await axios.get('global-stats', {
          headers: { Authorization: `Bearer ${activeToken}` }
        });
        setStats(res.data);
        sessionStorage.setItem('globalDashboardToken', activeToken);
      } catch (err) {
        console.error('Erro ao buscar stats globais', err);
        setError('Token inválido ou sem permissão de acesso.');
        if (err.response && err.response.status === 403) {
          sessionStorage.removeItem('globalDashboardToken');
          setToken('');
        }
      } finally {
        setLoading(false);
      }
    };

    const handleLogin = (e) => {
      e.preventDefault();
      if (!inputToken) return;
      setToken(inputToken);
      fetchStats(inputToken);
    };

    const handleLogout = () => {
      sessionStorage.removeItem('globalDashboardToken');
      setToken('');
      setStats(null);
    };

    if (!token && !stats) {
      return React.createElement('div', { className: 'min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8' },
        React.createElement('div', { className: 'max-w-md w-full space-y-8 bg-white dark:bg-gray-800 p-8 rounded-xl shadow-lg' },
          React.createElement('div', null,
            React.createElement('h2', { className: 'text-center text-3xl font-extrabold text-blue-600 dark:text-blue-400' },
              'Dashboard Global'
            ),
            React.createElement('p', { className: 'mt-2 text-center text-sm text-gray-600 dark:text-gray-400' },
              'Acesso restrito para administradores.'
            )
          ),
          React.createElement('form', { className: 'mt-8 space-y-6', onSubmit: handleLogin },
            React.createElement('div', { className: 'rounded-md shadow-sm -space-y-px' },
              React.createElement('div', null,
                React.createElement('input', {
                  type: 'password',
                  required: true,
                  className: 'appearance-none rounded relative block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 placeholder-gray-500 text-gray-900 dark:text-white rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm dark:bg-gray-700',
                  placeholder: 'Token de Acesso',
                  value: inputToken,
                  onChange: (e) => setInputToken(e.target.value)
                })
              )
            ),
            error && React.createElement('div', { className: 'text-red-500 text-sm text-center font-medium' }, error),
            React.createElement('div', null,
              React.createElement('button', {
                type: 'submit',
                disabled: loading,
                className: 'group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 transition-colors'
              }, loading ? 'Autenticando...' : 'Acessar')
            )
          )
        )
      );
    }

    // Renderizando o Dashboard com Stats
    return React.createElement('div', { className: 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8' },
      React.createElement('div', { className: 'flex justify-between items-center mb-8' },
        React.createElement('h1', { className: 'text-3xl font-bold text-gray-900 dark:text-white' }, 'Visão Global do Sistema'),
        React.createElement('button', {
          onClick: handleLogout,
          className: 'px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded font-medium transition-colors shadow-sm'
        }, 'Sair do Dashboard')
      ),

      error && React.createElement('div', { className: 'mb-4 p-4 bg-red-100 text-red-700 rounded-md shadow-sm' }, error),

      !stats && loading ?
        React.createElement('div', { className: 'text-center py-20' },
          React.createElement('div', { className: 'animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto' }),
          React.createElement('p', { className: 'mt-4 text-gray-500' }, 'Carregando estatísticas...')
        )
        : stats ?
          React.createElement('div', { className: 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' },

            React.createElement(StatCard, {
              title: 'Total de Usuários',
              value: stats.total_users,
              icon: 'group',
              color: 'bg-blue-500'
            }),

            React.createElement(StatCard, {
              title: 'Média de Tempo de Uso',
              value: `${stats.avg_usage_days} dias`,
              subtitle: 'Baseado na data de criação',
              icon: 'history',
              color: 'bg-purple-500'
            }),

            React.createElement(StatCard, {
              title: 'Última Utilização',
              value: stats.last_usage_time ? new Date(stats.last_usage_time).toLocaleString('pt-BR') : 'Sem dados',
              icon: 'schedule',
              color: 'bg-green-500'
            }),

            React.createElement(StatCard, {
              title: 'Usuários com IA (BYOK)',
              value: stats.ai_users_count,
              subtitle: `Representa ${stats.total_users ? Math.round((stats.ai_users_count / stats.total_users) * 100) : 0}% da base`,
              icon: 'smart_toy',
              color: 'bg-indigo-500'
            }),

            React.createElement(StatCard, {
              title: 'Total de Veículos cadastrados',
              value: stats.total_vehicles,
              icon: 'directions_car',
              color: 'bg-yellow-500'
            }),

            React.createElement(StatCard, {
              title: 'Média de Veículos',
              value: `${stats.avg_vehicles_per_user} por usuário`,
              icon: 'pie_chart',
              color: 'bg-orange-500'
            })

          ) : null
    );
  }

  function StatCard({ title, value, subtitle, icon, color }) {
    return React.createElement('div', { className: 'bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 flex items-start' },
      React.createElement('div', { className: `${color} rounded-lg p-3 text-white mr-4 shadow-sm` },
        React.createElement('span', { className: 'material-icons' }, icon)
      ),
      React.createElement('div', { className: 'flex-1' },
        React.createElement('h3', { className: 'text-sm font-medium text-gray-500 dark:text-gray-400' }, title),
        React.createElement('p', { className: 'mt-1 text-2xl font-bold text-gray-900 dark:text-white' }, value),
        subtitle && React.createElement('p', { className: 'mt-1 text-xs text-gray-400 dark:text-gray-500' }, subtitle)
      )
    );
  }

  window.SystemDashboard = SystemDashboard;
})();
