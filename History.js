(function () {
  const { useEffect, useState, useContext } = React;

  function History() {
    const { token } = useContext(window.AuthContext);
    const { useParams, useNavigate } = window.ReactRouterDOM || {};
    const params = useParams ? useParams() : {};
    let { id } = params || {};
    // fallback: parse id from pathname when router hooks not available
    if (!id) {
      const m = window.location.pathname.match(/\/vehicle\/(\d+)/);
      if (m) id = m[1];
    }
    const navigate = useNavigate ? useNavigate() : (path => { window.location.href = path; });
    const [vehicle, setVehicle] = useState(null);
    const [maintenanceHistory, setMaintenanceHistory] = useState([]);

    const fetchData = async () => {
      try {
        const [historyRes, vehiclesRes] = await Promise.all([
          axios.get(`vehicles/${id}/history`, { headers: { Authorization: `Bearer ${token}` } }),
          axios.get('vehicles', { headers: { Authorization: `Bearer ${token}` } })
        ]);
        const vid = parseInt(id, 10);
        const found = (vehiclesRes.data || []).find(v => v.id === vid);
        setVehicle(found || null);
        setMaintenanceHistory(historyRes.data || []);
      } catch (error) {
        console.error("Erro ao buscar dados", error);
      }
    };

    useEffect(() => {
      if (token && id) {
        fetchData();
      }
    }, [token, id]);

    if (!vehicle) {
      return React.createElement('div', { className: 'flex justify-center items-center h-64' },
        React.createElement('div', { className: 'text-gray-600 dark:text-gray-400' }, 'Carregando...')
      );
    }

    const exportCsv = () => {
      if (!maintenanceHistory || maintenanceHistory.length === 0) {
        alert('Nenhuma manutenção para exportar');
        return;
      }
      const headers = ['date_performed', 'maintenance_type', 'km_performed', 'service_cost', 'product_cost', 'total', 'notes'];
      const rows = maintenanceHistory.map(it => {
        const mt = it.maintenance_type || it.maintenance_type_name || '';
        return [
          new Date(it.date_performed).toLocaleDateString('pt-BR'),
          (mt || '').replace(/"/g, '""'),
          it.km_performed || '',
          it.service_cost || 0,
          it.product_cost || 0,
          ((it.service_cost || 0) + (it.product_cost || 0)),
          (it.notes || '').replace(/"/g, '""')
        ].map(v => `"${v}"`).join(',');
      });
      const csv = [headers.join(','), ...rows].join('\n');
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${vehicle.license_plate || 'historico'}-manutencoes.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    };

    return React.createElement('div', { className: 'space-y-6' },
      React.createElement('div', { className: 'flex justify-between items-center' },
        React.createElement('h1', { className: 'text-3xl font-bold text-gray-900 dark:text-white' },
          `Histórico de Manutenção - ${vehicle.make} ${vehicle.model}`
        ),
        React.createElement('div', null,
          React.createElement('button', {
            onClick: () => navigate('/'),
            className: 'bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded font-medium mr-2'
          }, 'Voltar ao Dashboard'),
          React.createElement('button', {
            onClick: exportCsv,
            className: 'bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded font-medium'
          }, 'Exportar CSV')
        )
      ),

      React.createElement('div', { className: 'bg-white dark:bg-gray-800 rounded-lg shadow-md p-6' },
        React.createElement('h3', { className: 'text-xl font-semibold text-gray-900 dark:text-white mb-4' }, 'Dados do Veículo'),
        React.createElement('div', { className: 'grid grid-cols-1 md:grid-cols-3 gap-4 mb-6' },
          React.createElement('div', null,
            React.createElement('span', { className: 'font-medium text-gray-700 dark:text-gray-300' }, 'Placa: '),
            React.createElement('span', { className: 'text-gray-900 dark:text-white' }, vehicle.license_plate)
          ),
          React.createElement('div', null,
            React.createElement('span', { className: 'font-medium text-gray-700 dark:text-gray-300' }, 'KM Atual: '),
            React.createElement('span', { className: 'text-gray-900 dark:text-white' }, `${(vehicle.current_km || 0).toLocaleString()} km`)
          ),
          React.createElement('div', null,
            React.createElement('span', { className: 'font-medium text-gray-700 dark:text-gray-300' }, 'Modelo: '),
            React.createElement('span', { className: 'text-gray-900 dark:text-white' }, `${vehicle.make} ${vehicle.model}`)
          )
        ),

        React.createElement('h3', { className: 'text-xl font-semibold text-gray-900 dark:text-white mb-4' }, 'Histórico de Manutenções'),
        maintenanceHistory.length === 0
          ? React.createElement('p', { className: 'text-gray-600 dark:text-gray-400' }, 'Nenhuma manutenção registrada ainda.')
          : React.createElement('div', { className: 'space-y-4' },
            maintenanceHistory.map(item =>
              React.createElement('div', {
                key: item.id,
                className: 'border border-gray-200 dark:border-gray-700 rounded-lg p-4'
              },
                React.createElement('div', { className: 'flex justify-between items-start mb-2' },
                  React.createElement('h4', { className: 'text-lg font-semibold text-gray-900 dark:text-white' }, item.maintenance_type || item.maintenance_type_name),
                  React.createElement('span', { className: 'text-sm text-gray-600 dark:text-gray-400' },
                    new Date(item.date_performed).toLocaleDateString('pt-BR')
                  )
                ),
                React.createElement('div', { className: 'grid grid-cols-2 md:grid-cols-4 gap-4 text-sm' },
                  React.createElement('div', null,
                    React.createElement('span', { className: 'font-medium text-gray-700 dark:text-gray-300' }, 'KM: '),
                    React.createElement('span', { className: 'text-gray-900 dark:text-white' }, item.km_performed)
                  ),
                  React.createElement('div', null,
                    React.createElement('span', { className: 'font-medium text-gray-700 dark:text-gray-300' }, 'Serviço: '),
                    React.createElement('span', { className: 'text-gray-900 dark:text-white' }, `R$ ${item.service_cost || 0}`)
                  ),
                  React.createElement('div', null,
                    React.createElement('span', { className: 'font-medium text-gray-700 dark:text-gray-300' }, 'Peças: '),
                    React.createElement('span', { className: 'text-gray-900 dark:text-white' }, `R$ ${item.product_cost || 0}`)
                  ),
                  React.createElement('div', null,
                    React.createElement('span', { className: 'font-medium text-gray-700 dark:text-gray-300' }, 'Total: '),
                    React.createElement('span', { className: 'text-green-600 dark:text-green-400 font-semibold' },
                      `R$ ${(item.service_cost || 0) + (item.product_cost || 0)}`
                    )
                  )
                ),
                item.notes && React.createElement('div', { className: 'mt-2' },
                  React.createElement('span', { className: 'font-medium text-gray-700 dark:text-gray-300' }, 'Observações: '),
                  React.createElement('span', { className: 'text-gray-900 dark:text-white' }, item.notes)
                )
              )
            )
          )
      )
    );
  }

  window.History = History;
})();
