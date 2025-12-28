 (function () {
  const { useEffect, useState, useContext } = React;

  function _getRouter() {
    return window.ReactRouterDOM || {};
  }

  function Admin() {
    const { token } = useContext(window.AuthContext);
    const { useNavigate } = _getRouter();
    const navigate = useNavigate ? useNavigate() : (path => { window.location.href = path; });
    const [maintenanceTypes, setMaintenanceTypes] = useState([]);
    const [vehicles, setVehicles] = useState([]);
    const [editingVehicleId, setEditingVehicleId] = useState(null);
    const [editingVehicleForm, setEditingVehicleForm] = useState({ make: '', model: '', year: 0, current_km: 0, license_plate: '' });
    const [newType, setNewType] = useState({ name: '', default_interval_km: 10000, default_interval_months: 12, description: '' });
    const [loadingCreate, setLoadingCreate] = useState(false);

    const fetchData = async () => {
      try {
        const [typesRes, vehiclesRes] = await Promise.all([
          axios.get('/maintenance-types', { headers: { Authorization: `Bearer ${token}` } }),
          axios.get('/vehicles', { headers: { Authorization: `Bearer ${token}` } })
        ]);
        setMaintenanceTypes(typesRes.data || []);
        setVehicles(vehiclesRes.data || []);
      } catch (error) {
        console.error("Erro ao buscar dados", error);
      }
    };

    useEffect(() => {
      if (token) {
        fetchData();
      }
    }, [token]);

    // detecta rota /admin/vehicle/{id}
    useEffect(() => {
      const m = window.location.pathname.match(/\/admin\/vehicle\/(\d+)/);
      if (m) {
        setEditingVehicleId(parseInt(m[1]));
      }
    }, []);

    useEffect(() => {
      if (editingVehicleId && vehicles.length > 0) {
        const v = vehicles.find(x => x.id === editingVehicleId);
        if (v) {
          setEditingVehicleForm({ make: v.make || '', model: v.model || '', year: v.year || 0, current_km: v.current_km || 0, license_plate: v.license_plate || '' });
        }
      }
    }, [editingVehicleId, vehicles]);

    return React.createElement('div', { className: 'space-y-6' },
      React.createElement('div', { className: 'flex justify-between items-center' },
        React.createElement('h1', { className: 'text-3xl font-bold text-gray-900 dark:text-white' }, 'Administração'),
        React.createElement('button', {
          onClick: () => navigate('/'),
          className: 'bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded font-medium'
        }, 'Voltar ao Dashboard')
      ),

      React.createElement('div', { className: 'grid grid-cols-1 md:grid-cols-2 gap-6' },
        React.createElement('div', { className: 'bg-white dark:bg-gray-800 rounded-lg shadow-md p-6' },
          React.createElement('h3', { className: 'text-xl font-semibold text-gray-900 dark:text-white mb-4' }, 'Veículos'),
          React.createElement('p', { className: 'text-2xl font-bold text-green-600 dark:text-green-400' }, vehicles.length),
          React.createElement('p', { className: 'text-gray-600 dark:text-gray-400' }, 'Total de veículos cadastrados')
        ),

        React.createElement('div', { className: 'bg-white dark:bg-gray-800 rounded-lg shadow-md p-6' },
          React.createElement('h3', { className: 'text-xl font-semibold text-gray-900 dark:text-white mb-4' }, 'Tipos de Manutenção'),
          React.createElement('div', { className: 'mt-4' },
            React.createElement('h4', { className: 'text-sm font-semibold text-gray-900 dark:text-white mb-2' }, 'Adicionar novo tipo'),
            React.createElement('div', { className: 'grid grid-cols-1 gap-2' },
              React.createElement('input', { placeholder: 'Nome', value: newType.name, onChange: (e) => setNewType({ ...newType, name: e.target.value }), className: 'px-2 py-2 rounded border dark:bg-gray-700' }),
              React.createElement('input', { placeholder: 'Intervalo KM', type: 'number', value: newType.default_interval_km, onChange: (e) => setNewType({ ...newType, default_interval_km: parseInt(e.target.value || 0) }), className: 'px-2 py-2 rounded border dark:bg-gray-700' }),
              React.createElement('input', { placeholder: 'Intervalo meses', type: 'number', value: newType.default_interval_months, onChange: (e) => setNewType({ ...newType, default_interval_months: parseInt(e.target.value || 0) }), className: 'px-2 py-2 rounded border dark:bg-gray-700' }),
              React.createElement('input', { placeholder: 'Descrição (opcional)', value: newType.description, onChange: (e) => setNewType({ ...newType, description: e.target.value }), className: 'px-2 py-2 rounded border dark:bg-gray-700' }),
              React.createElement('div', null,
                React.createElement('button', {
                  onClick: async () => {
                    setLoadingCreate(true);
                    try {
                      const res = await axios.post('/maintenance-types', newType, { headers: { Authorization: `Bearer ${token}` } });
                      setMaintenanceTypes([ ...maintenanceTypes, res.data ]);
                      setNewType({ name: '', default_interval_km: 10000, default_interval_months: 12, description: '' });
                    } catch (err) {
                      console.error('Erro ao criar tipo', err);
                      alert(err?.response?.data?.detail || 'Erro ao criar tipo');
                    } finally {
                      setLoadingCreate(false);
                    }
                  },
                  className: 'mt-2 bg-blue-600 text-white px-3 py-2 rounded'
                }, loadingCreate ? 'Criando...' : 'Criar tipo')
              )
            )
          )
        )
      ),

      React.createElement('div', { className: 'bg-white dark:bg-gray-800 rounded-lg shadow-md p-6' },
        React.createElement('h3', { className: 'text-xl font-semibold text-gray-900 dark:text-white mb-4' }, 'Tipos de Manutenção (detalhe)'),
        editingVehicleId && React.createElement('div', { className: 'mb-4 p-4 bg-gray-50 dark:bg-gray-700 rounded' },
          React.createElement('h4', { className: 'text-lg font-semibold mb-2' }, 'Editar Veículo'),
          React.createElement('div', { className: 'grid grid-cols-1 md:grid-cols-2 gap-2' },
            React.createElement('input', { placeholder: 'Marca', value: editingVehicleForm.make, onChange: (e) => setEditingVehicleForm({ ...editingVehicleForm, make: e.target.value }), className: 'px-2 py-2 rounded border dark:bg-gray-700' }),
            React.createElement('input', { placeholder: 'Modelo', value: editingVehicleForm.model, onChange: (e) => setEditingVehicleForm({ ...editingVehicleForm, model: e.target.value }), className: 'px-2 py-2 rounded border dark:bg-gray-700' }),
            React.createElement('input', { placeholder: 'Ano', type: 'number', value: editingVehicleForm.year, onChange: (e) => setEditingVehicleForm({ ...editingVehicleForm, year: parseInt(e.target.value || 0) }), className: 'px-2 py-2 rounded border dark:bg-gray-700' }),
            React.createElement('input', { placeholder: 'KM Atual', type: 'number', value: editingVehicleForm.current_km, onChange: (e) => setEditingVehicleForm({ ...editingVehicleForm, current_km: parseInt(e.target.value || 0) }), className: 'px-2 py-2 rounded border dark:bg-gray-700' }),
            React.createElement('input', { placeholder: 'Placa', value: editingVehicleForm.license_plate, onChange: (e) => setEditingVehicleForm({ ...editingVehicleForm, license_plate: e.target.value }), className: 'px-2 py-2 rounded border dark:bg-gray-700' }),
            React.createElement('div', null,
              React.createElement('button', {
                onClick: async () => {
                  try {
                    const res = await axios.put(`/vehicles/${editingVehicleId}`, editingVehicleForm, { headers: { Authorization: `Bearer ${token}` } });
                    // Atualiza lista local
                    setVehicles(vehicles.map(v => v.id === res.data.id ? res.data : v));
                    alert('Veículo atualizado');
                  } catch (err) {
                    console.error('Erro ao atualizar veículo', err);
                    alert(err?.response?.data?.detail || 'Erro ao atualizar veículo');
                  }
                },
                className: 'mt-2 bg-indigo-600 text-white px-3 py-2 rounded'
              }, 'Salvar alterações')
            )
          )
        ),
        React.createElement('div', { className: 'space-y-2' },
          maintenanceTypes.map(type =>
            React.createElement('div', { key: type.id, className: 'p-3 bg-gray-50 dark:bg-gray-700 rounded' },
              React.createElement('div', { className: 'flex justify-between items-center' },
                React.createElement('div', null,
                  React.createElement('div', { className: 'font-medium text-gray-900 dark:text-white' }, type.name),
                  React.createElement('div', { className: 'text-sm text-gray-600 dark:text-gray-400' }, type.description || '—')
                ),
                React.createElement('div', { className: 'flex items-center gap-4' },
                  React.createElement('div', { className: 'text-sm text-gray-600 dark:text-gray-400' }, `${type.default_interval_km || ''} km / ${type.default_interval_months || ''} meses`),
                  React.createElement('button', {
                    onClick: async () => {
                      if (!confirm(`Remover tipo '${type.name}'?`)) return;
                      try {
                        await axios.delete(`/maintenance-types/${type.id}`, { headers: { Authorization: `Bearer ${token}` } });
                        setMaintenanceTypes(maintenanceTypes.filter(t => t.id !== type.id));
                      } catch (err) {
                        console.error('Erro ao remover tipo', err);
                        alert(err?.response?.data?.detail || 'Erro ao remover tipo');
                      }
                    },
                    className: 'text-red-600 hover:text-red-800'
                  }, 'Remover')
                )
              )
            )
          )
        )
      )
    );
  }

  window.Admin = Admin;
})();
