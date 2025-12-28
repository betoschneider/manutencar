(function () {
  const { useEffect, useState, useContext } = React;

  function MaintenanceForm() {
    const { token } = useContext(window.AuthContext);
    const { useParams, useNavigate } = window.ReactRouterDOM || {};
    const params = useParams ? useParams() : {};
    let { id } = params || {};

    // fallback: parse id from pathname
    if (!id) {
      const m = window.location.pathname.match(/\/vehicle\/(\d+)/);
      if (m) id = m[1];
    }

    const navigate = useNavigate ? useNavigate() : (path => { window.location.href = path; });

    const [vehicle, setVehicle] = useState(null);
    const [maintenanceTypes, setMaintenanceTypes] = useState([]);
    const [lastLogs, setLastLogs] = useState([]);
    const [form, setForm] = useState({
      maintenance_type_id: '',
      km_performed: '',
      date_performed: new Date().toISOString().slice(0, 10),
      service_cost: 0,
      product_cost: 0,
      notes: ''
    });

    const fetchData = async () => {
      try {
        const [vehiclesRes, typesRes, historyRes] = await Promise.all([
          axios.get('vehicles', { headers: { Authorization: `Bearer ${token}` } }),
          axios.get('maintenance-types', { headers: { Authorization: `Bearer ${token}` } }),
          axios.get(`vehicles/${id}/history`, { headers: { Authorization: `Bearer ${token}` } })
        ]);

        const vid = parseInt(id, 10);
        const found = (vehiclesRes.data || []).find(v => v.id === vid);
        setVehicle(found || null);
        setMaintenanceTypes(typesRes.data || []);

        // Pega apenas as últimas 10
        const history = historyRes.data || [];
        setLastLogs(history.slice(0, 10));

        // Define KM default se o veículo foi encontrado e o campo ainda está vazio
        if (found && !form.km_performed) {
          setForm(f => ({ ...f, km_performed: found.current_km }));
        }

      } catch (error) {
        console.error("Erro ao buscar dados", error);
      }
    };

    useEffect(() => {
      if (token && id) {
        fetchData();
      }
    }, [token, id]);

    const submitMaintenance = async () => {
      if (!form.maintenance_type_id) {
        alert('Escolha um tipo de manutenção');
        return;
      }
      try {
        const payload = {
          maintenance_type_id: parseInt(form.maintenance_type_id, 10),
          km_performed: parseInt(form.km_performed || 0, 10),
          date_performed: new Date(form.date_performed).toISOString(),
          notes: form.notes,
          service_cost: parseFloat(form.service_cost || 0),
          product_cost: parseFloat(form.product_cost || 0)
        };
        await axios.post(`/vehicles/${id}/maintenance`, payload, { headers: { Authorization: `Bearer ${token}` } });

        alert('Manutenção registrada com sucesso!');

        // Limpa formulário (mantendo a data de hoje) e recarrega dados
        setForm({
          maintenance_type_id: '',
          km_performed: '', // Será atualizado no fetchData com a nova KM do veículo
          date_performed: new Date().toISOString().slice(0, 10),
          service_cost: 0,
          product_cost: 0,
          notes: ''
        });
        await fetchData();

      } catch (err) {
        console.error('Erro ao registrar manutenção', err);
        alert(err?.response?.data?.detail || 'Erro ao registrar manutenção');
      }
    };

    if (!vehicle) {
      return React.createElement('div', { className: 'flex justify-center items-center h-64' },
        React.createElement('div', { className: 'text-gray-600 dark:text-gray-400' }, 'Carregando...')
      );
    }

    return React.createElement('div', { className: 'space-y-6' },
      React.createElement('div', { className: 'flex justify-between items-center' },
        React.createElement('h1', { className: 'text-3xl font-bold text-gray-900 dark:text-white' },
          `Nova Manutenção - ${vehicle.make} ${vehicle.model}`
        ),
        React.createElement('button', {
          onClick: () => navigate('/'),
          className: 'bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded font-medium'
        }, 'Voltar ao Dashboard')
      ),

      React.createElement('div', { className: 'bg-white dark:bg-gray-800 rounded-lg shadow-md p-6' },
        // Formulário
        React.createElement('h3', { className: 'text-xl font-semibold text-gray-900 dark:text-white mb-4' }, 'Registrar Serviço'),
        React.createElement('div', { className: 'mb-8 p-4 bg-gray-50 dark:bg-gray-700 rounded border border-gray-200 dark:border-gray-600' },
          React.createElement('div', { className: 'grid grid-cols-1 md:grid-cols-3 gap-4 mb-4' },
            React.createElement('div', { className: 'flex flex-col' },
              React.createElement('label', { className: 'text-sm font-medium text-gray-700 dark:text-gray-300 mb-1' }, 'Tipo de Manutenção'),
              React.createElement('select', {
                value: form.maintenance_type_id,
                onChange: (e) => setForm({ ...form, maintenance_type_id: e.target.value }),
                className: 'px-3 py-2 rounded border dark:bg-gray-800 dark:border-gray-600 dark:text-white'
              },
                React.createElement('option', { value: '' }, 'Selecione...'),
                maintenanceTypes.map(t => React.createElement('option', { key: t.id, value: t.id }, t.name))
              )
            ),
            React.createElement('div', { className: 'flex flex-col' },
              React.createElement('label', { className: 'text-sm font-medium text-gray-700 dark:text-gray-300 mb-1' }, 'Quilometragem (KM)'),
              React.createElement('input', {
                type: 'number',
                value: form.km_performed,
                onChange: (e) => setForm({ ...form, km_performed: e.target.value }),
                className: 'px-3 py-2 rounded border dark:bg-gray-800 dark:border-gray-600 dark:text-white'
              })
            ),
            React.createElement('div', { className: 'flex flex-col' },
              React.createElement('label', { className: 'text-sm font-medium text-gray-700 dark:text-gray-300 mb-1' }, 'Data'),
              React.createElement('input', {
                type: 'date',
                value: form.date_performed,
                onChange: (e) => setForm({ ...form, date_performed: e.target.value }),
                className: 'px-3 py-2 rounded border dark:bg-gray-800 dark:border-gray-600 dark:text-white'
              })
            )
          ),
          React.createElement('div', { className: 'grid grid-cols-1 md:grid-cols-3 gap-4 mb-4' },
            React.createElement('div', { className: 'flex flex-col' },
              React.createElement('label', { className: 'text-sm font-medium text-gray-700 dark:text-gray-300 mb-1' }, 'Custo Serviço (R$)'),
              React.createElement('input', {
                type: 'number',
                value: form.service_cost,
                onChange: (e) => setForm({ ...form, service_cost: e.target.value }),
                className: 'px-3 py-2 rounded border dark:bg-gray-800 dark:border-gray-600 dark:text-white'
              })
            ),
            React.createElement('div', { className: 'flex flex-col' },
              React.createElement('label', { className: 'text-sm font-medium text-gray-700 dark:text-gray-300 mb-1' }, 'Custo Peças (R$)'),
              React.createElement('input', {
                type: 'number',
                value: form.product_cost,
                onChange: (e) => setForm({ ...form, product_cost: e.target.value }),
                className: 'px-3 py-2 rounded border dark:bg-gray-800 dark:border-gray-600 dark:text-white'
              })
            ),
            React.createElement('div', { className: 'flex flex-col' },
              React.createElement('label', { className: 'text-sm font-medium text-gray-700 dark:text-gray-300 mb-1' }, 'Observações'),
              React.createElement('input', {
                type: 'text',
                value: form.notes,
                onChange: (e) => setForm({ ...form, notes: e.target.value }),
                className: 'px-3 py-2 rounded border dark:bg-gray-800 dark:border-gray-600 dark:text-white'
              })
            )
          ),
          React.createElement('div', { className: 'flex justify-end' },
            React.createElement('button', {
              onClick: submitMaintenance,
              className: 'bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded font-medium shadow-sm'
            }, 'Salvar Manutenção')
          )
        ),

        // Lista das últimas 10
        React.createElement('h3', { className: 'text-xl font-semibold text-gray-900 dark:text-white mb-4' }, 'Últimas 10 Manutenções'),
        lastLogs.length === 0
          ? React.createElement('p', { className: 'text-gray-600 dark:text-gray-400' }, 'Nenhuma manutenção recente.')
          : React.createElement('div', { className: 'space-y-3' },
            lastLogs.map(item =>
              React.createElement('div', {
                key: item.id,
                className: 'border-b border-gray-200 dark:border-gray-700 pb-3 last:border-0'
              },
                React.createElement('div', { className: 'flex justify-between items-center' },
                  React.createElement('div', null,
                    React.createElement('span', { className: 'font-semibold text-gray-900 dark:text-white block' }, item.maintenance_type || item.maintenance_type_name),
                    React.createElement('span', { className: 'text-sm text-gray-500 dark:text-gray-400' },
                      `${new Date(item.date_performed).toLocaleDateString('pt-BR')} - ${item.km_performed} km`
                    )
                  ),
                  React.createElement('span', { className: 'font-medium text-green-600 dark:text-green-400' },
                    `R$ ${(item.service_cost || 0) + (item.product_cost || 0)}`
                  )
                )
              )
            )
          )
      )
    );
  }

  window.MaintenanceForm = MaintenanceForm;
})();