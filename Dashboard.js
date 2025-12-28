(function () {
  const { useEffect, useState, useContext } = React;

  function _getRouter() {
    return window.ReactRouterDOM || {};
  }
  const {
    ResponsiveContainer, BarChart, Bar, XAxis, YAxis,
    CartesianGrid, Tooltip, Legend, Cell
  } = window.Recharts || {};

  function Dashboard() {
    const { token } = useContext(window.AuthContext);
    const { useNavigate } = _getRouter();
    const navigate = useNavigate ? useNavigate() : (path => { window.location.href = path; });
    const [vehicles, setVehicles] = useState([]);
    const [stats, setStats] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchData = async () => {
      setLoading(true);
      try {
        const [vehiclesRes, statsRes] = await Promise.all([
          axios.get('/vehicles', { headers: { Authorization: `Bearer ${token}` } }),
          axios.get('/stats', { headers: { Authorization: `Bearer ${token}` } })
        ]);
        setVehicles(vehiclesRes.data);
        setStats(statsRes.data);
      } catch (error) {
        console.error("Erro ao buscar dados do dashboard", error);
      } finally {
        setLoading(false);
      }
    };

    useEffect(() => {
      if (token) {
        fetchData();
      }
    }, [token]);

    if (loading) {
      return React.createElement('div', { className: 'flex justify-center items-center h-64' },
        React.createElement('div', { className: 'text-gray-600 dark:text-gray-400' }, 'Carregando Dashboard...')
      );
    }

    return React.createElement('div', { className: 'space-y-8' },
      React.createElement('div', { className: 'flex justify-between items-center' },
        React.createElement('h1', { className: 'text-3xl font-bold text-gray-900 dark:text-white' }, 'Dashboard'),
        React.createElement('button', {
          onClick: () => navigate('/admin'),
          className: 'bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded font-medium transition-colors'
        }, 'Administração')
      ),

      // Gráfico de Despesas
      stats.length > 0 && React.createElement('div', { className: 'bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md' },
        React.createElement('h2', { className: 'text-xl font-semibold mb-6 text-gray-800 dark:text-gray-200' }, 'Despesas com Manutenção (Últimos 12 Meses)'),
        React.createElement('div', { style: { width: '100%', height: 300 } },
          window.Recharts ? React.createElement(ResponsiveContainer, null,
            React.createElement(BarChart, { data: stats },
              React.createElement(CartesianGrid, { strokeDasharray: '3 3', stroke: '#374151' }),
              React.createElement(XAxis, { dataKey: 'month', stroke: '#9CA3AF' }),
              React.createElement(YAxis, { stroke: '#9CA3AF' }),
              React.createElement(Tooltip, {
                contentStyle: { backgroundColor: '#1F2937', border: 'none', borderRadius: '8px', color: '#F9FAFB' },
                itemStyle: { color: '#F9FAFB' }
              }),
              React.createElement(Legend, null),
              React.createElement(Bar, { dataKey: 'product_cost', name: 'Peças', fill: '#10B981', radius: [4, 4, 0, 0] }),
              React.createElement(Bar, { dataKey: 'service_cost', name: 'Serviço', fill: '#3B82F6', radius: [4, 4, 0, 0] })
            )
          ) : React.createElement('p', null, 'Gráfico carregando...')
        )
      ),

      // Lista de Veículos
      React.createElement('div', null,
        React.createElement('h2', { className: 'text-2xl font-bold text-gray-900 dark:text-white mb-6' }, 'Seus Veículos'),
        React.createElement('div', { className: 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' },
          vehicles.map(vehicle =>
            React.createElement('div', {
              key: vehicle.id,
              className: 'bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 hover:shadow-xl transition-all border-l-4 ' + (vehicle.alerts.length > 0 ? 'border-red-500' : 'border-green-500')
            },
              React.createElement('div', { className: 'flex justify-between items-start mb-4' },
                React.createElement('h3', { className: 'text-xl font-bold text-gray-900 dark:text-white' },
                  `${vehicle.make} ${vehicle.model}`
                ),
                vehicle.alerts.length > 0 && React.createElement('span', { className: 'bg-red-100 text-red-800 text-xs font-medium px-2.5 py-0.5 rounded dark:bg-red-900 dark:text-red-300' },
                  'ALERTA'
                )
              ),
              React.createElement('div', { className: 'space-y-2 mb-6' },
                React.createElement('p', { className: 'text-gray-600 dark:text-gray-400 flex justify-between' },
                  React.createElement('span', null, 'Placa:'),
                  React.createElement('span', { className: 'font-mono font-bold' }, vehicle.license_plate)
                ),
                React.createElement('p', { className: 'text-gray-600 dark:text-gray-400 flex justify-between' },
                  React.createElement('span', null, 'KM Atual:'),
                  React.createElement('span', { className: 'font-bold' }, `${vehicle.current_km.toLocaleString()} km`)
                ),
                React.createElement('p', { className: 'text-gray-600 dark:text-gray-400 flex justify-between' },
                  React.createElement('span', null, 'Gasto Total:'),
                  React.createElement('span', { className: 'font-bold text-green-600 dark:text-green-400' }, `R$ ${vehicle.total_maintenance_cost.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`)
                )
              ),

              vehicle.alerts.length > 0 && React.createElement('div', { className: 'mb-4 p-3 bg-red-50 dark:bg-red-900/30 rounded border border-red-200 dark:border-red-800' },
                React.createElement('h4', { className: 'text-sm font-bold text-red-800 dark:text-red-300 mb-1' }, 'Manutenções Pendentes:'),
                vehicle.alerts.map((alert, idx) =>
                  React.createElement('p', { key: idx, className: 'text-xs text-red-700 dark:text-red-400' }, `• ${alert.type}: ${alert.msg}`)
                )
              ),

              React.createElement('div', { className: 'flex gap-3' },
                React.createElement('button', {
                  onClick: () => navigate(`/vehicle/${vehicle.id}/history`),
                  className: 'flex-1 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-white px-3 py-2 rounded text-sm font-medium transition-colors text-center'
                }, 'Ver Histórico'),
                React.createElement('button', {
                  onClick: () => navigate(`/vehicle/${vehicle.id}/maintenance`),
                  className: 'flex-1 bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded text-sm font-medium transition-colors text-center'
                }, 'Inserir Manutenção')
              )
            )
          )
        ),

        vehicles.length === 0 && React.createElement('div', { className: 'text-center py-16 bg-white dark:bg-gray-800 rounded-lg shadow-inner' },
          React.createElement('div', { className: 'material-icons text-5xl text-gray-300 mb-4' }, 'directions_car'),
          React.createElement('p', { className: 'text-gray-500 dark:text-gray-400 text-lg' },
            'Nenhum veículo cadastrado ainda.'
          ),
          React.createElement('button', {
            onClick: () => navigate('/admin?add=true'),
            className: 'mt-4 text-blue-600 hover:underline font-medium'
          }, 'Adicionar meu primeiro veículo')
        )
      )
    );
  }

  window.Dashboard = Dashboard;
})();
