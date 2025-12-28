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
    const [editingVehicleForm, setEditingVehicleForm] = useState({ make: '', model: '', year: 2024, current_km: 0, license_plate: '' });
    const [newVehicleForm, setNewVehicleForm] = useState({ make: '', model: '', year: 2024, current_km: 0, license_plate: '' });
    const [newType, setNewType] = useState({ name: '', default_interval_km: 10000, default_interval_months: 12, description: '' });
    const [loadingCreate, setLoadingCreate] = useState(false);
    const [showAddVehicle, setShowAddVehicle] = useState(false);

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

    // detecta rota /admin/vehicle/{id} ou se deve abrir formulário de adição
    useEffect(() => {
      const path = window.location.pathname;
      const m = path.match(/\/admin\/vehicle\/(\d+)/);
      if (m) {
        setEditingVehicleId(parseInt(m[1]));
      }

      // Se vier com ?add=true, abre o formulário de adição
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.get('add') === 'true') {
        setShowAddVehicle(true);
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

    return React.createElement('div', { className: 'space-y-6 pb-12' },
      React.createElement('div', { className: 'flex justify-between items-center' },
        React.createElement('h1', { className: 'text-3xl font-bold text-gray-900 dark:text-white' }, 'Administração'),
        React.createElement('button', {
          onClick: () => navigate('/'),
          className: 'bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded font-medium'
        }, 'Voltar ao Dashboard')
      ),

      // Seção de Veículos
      React.createElement('div', { className: 'bg-white dark:bg-gray-800 rounded-lg shadow-md p-6' },
        React.createElement('div', { className: 'flex justify-between items-center mb-6' },
          React.createElement('h3', { className: 'text-xl font-semibold text-gray-900 dark:text-white' }, 'Gerenciar Veículos'),
          React.createElement('button', {
            onClick: () => setShowAddVehicle(!showAddVehicle),
            className: 'bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded text-sm font-medium flex items-center gap-1'
          },
            React.createElement('span', { className: 'material-icons text-sm' }, showAddVehicle ? 'remove' : 'add'),
            showAddVehicle ? 'Cancelar' : 'Novo Veículo'
          )
        ),

        // Formulário para Adicionar Veículo
        showAddVehicle && React.createElement('div', { className: 'mb-8 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-lg' },
          React.createElement('h4', { className: 'font-bold mb-4 text-blue-800 dark:text-blue-300' }, 'Cadastrar Novo Veículo'),
          React.createElement('div', { className: 'grid grid-cols-1 md:grid-cols-5 gap-3' },
            React.createElement('input', { placeholder: 'Marca (Ex: Toyota)', value: newVehicleForm.make, onChange: (e) => setNewVehicleForm({ ...newVehicleForm, make: e.target.value }), className: 'px-3 py-2 rounded border dark:bg-gray-700 dark:border-gray-600' }),
            React.createElement('input', { placeholder: 'Modelo (Ex: Corolla)', value: newVehicleForm.model, onChange: (e) => setNewVehicleForm({ ...newVehicleForm, model: e.target.value }), className: 'px-3 py-2 rounded border dark:bg-gray-700 dark:border-gray-600' }),
            React.createElement('input', { placeholder: 'Ano', type: 'number', value: newVehicleForm.year, onChange: (e) => setNewVehicleForm({ ...newVehicleForm, year: parseInt(e.target.value || 0) }), className: 'px-3 py-2 rounded border dark:bg-gray-700 dark:border-gray-600' }),
            React.createElement('input', { placeholder: 'Placa', value: newVehicleForm.license_plate, onChange: (e) => setNewVehicleForm({ ...newVehicleForm, license_plate: e.target.value.toUpperCase() }), className: 'px-3 py-2 rounded border dark:bg-gray-700 dark:border-gray-600' }),
            React.createElement('input', { placeholder: 'KM Atual', type: 'number', value: newVehicleForm.current_km, onChange: (e) => setNewVehicleForm({ ...newVehicleForm, current_km: parseInt(e.target.value || 0) }), className: 'px-3 py-2 rounded border dark:bg-gray-700 dark:border-gray-600' })
          ),
          React.createElement('button', {
            onClick: async () => {
              try {
                const res = await axios.post('/vehicles', newVehicleForm, { headers: { Authorization: `Bearer ${token}` } });
                setVehicles([...vehicles, res.data]);
                setNewVehicleForm({ make: '', model: '', year: 2024, current_km: 0, license_plate: '' });
                setShowAddVehicle(false);
                alert('Veículo cadastrado com sucesso!');
              } catch (err) {
                alert(err?.response?.data?.detail || 'Erro ao cadastrar veículo');
              }
            },
            className: 'mt-4 bg-green-600 text-white px-6 py-2 rounded font-medium hover:bg-green-700 transition-colors'
          }, 'Salvar Veículo')
        ),

        // Lista de Veículos Existentes
        React.createElement('div', { className: 'overflow-x-auto' },
          React.createElement('table', { className: 'w-full text-left' },
            React.createElement('thead', { className: 'text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-300' },
              React.createElement('tr', null,
                React.createElement('th', { className: 'px-4 py-3' }, 'Veículo'),
                React.createElement('th', { className: 'px-4 py-3' }, 'Placa'),
                React.createElement('th', { className: 'px-4 py-3' }, 'KM Atual'),
                React.createElement('th', { className: 'px-4 py-3' }, 'Ações')
              )
            ),
            React.createElement('tbody', null,
              vehicles.map(v => (
                React.createElement('tr', { key: v.id, className: 'border-b dark:border-gray-700' },
                  React.createElement('td', { className: 'px-4 py-3' },
                    React.createElement('div', { className: 'font-bold' }, `${v.make} ${v.model}`),
                    React.createElement('div', { className: 'text-xs text-gray-500' }, v.year)
                  ),
                  React.createElement('td', { className: 'px-4 py-3 font-mono' }, v.license_plate),
                  React.createElement('td', { className: 'px-4 py-3' }, `${v.current_km.toLocaleString()} km`),
                  React.createElement('td', { className: 'px-4 py-3 flex gap-2' },
                    React.createElement('button', {
                      onClick: () => {
                        setEditingVehicleId(v.id);
                        setEditingVehicleForm({ ...v });
                      },
                      className: 'text-blue-600 hover:underline text-sm'
                    }, 'Editar'),
                    React.createElement('button', {
                      onClick: async () => {
                        if (!confirm(`Excluir veículo ${v.make} ${v.model}? Isso removerá todo o histórico!`)) return;
                        try {
                          await axios.delete(`/vehicles/${v.id}`, { headers: { Authorization: `Bearer ${token}` } });
                          setVehicles(vehicles.filter(x => x.id !== v.id));
                        } catch (err) {
                          alert('Erro ao excluir veículo');
                        }
                      },
                      className: 'text-red-600 hover:underline text-sm'
                    }, 'Excluir')
                  )
                )
              ))
            )
          )
        ),

        // Modal/Overlay de Edição (Se um veículo estiver sendo editado)
        editingVehicleId && React.createElement('div', { className: 'fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50' },
          React.createElement('div', { className: 'bg-white dark:bg-gray-800 rounded-lg p-6 max-w-lg w-full shadow-xl' },
            React.createElement('h4', { className: 'text-xl font-bold mb-4' }, 'Editar Veículo'),
            React.createElement('div', { className: 'grid grid-cols-1 gap-4' },
              React.createElement('div', null,
                React.createElement('label', { className: 'block text-sm font-medium mb-1' }, 'Marca'),
                React.createElement('input', { value: editingVehicleForm.make, onChange: (e) => setEditingVehicleForm({ ...editingVehicleForm, make: e.target.value }), className: 'w-full px-3 py-2 rounded border dark:bg-gray-700' })
              ),
              React.createElement('div', null,
                React.createElement('label', { className: 'block text-sm font-medium mb-1' }, 'Modelo'),
                React.createElement('input', { value: editingVehicleForm.model, onChange: (e) => setEditingVehicleForm({ ...editingVehicleForm, model: e.target.value }), className: 'w-full px-3 py-2 rounded border dark:bg-gray-700' })
              ),
              React.createElement('div', { className: 'grid grid-cols-2 gap-4' },
                React.createElement('div', null,
                  React.createElement('label', { className: 'block text-sm font-medium mb-1' }, 'Ano'),
                  React.createElement('input', { type: 'number', value: editingVehicleForm.year, onChange: (e) => setEditingVehicleForm({ ...editingVehicleForm, year: parseInt(e.target.value || 0) }), className: 'w-full px-3 py-2 rounded border dark:bg-gray-700' })
                ),
                React.createElement('div', null,
                  React.createElement('label', { className: 'block text-sm font-medium mb-1' }, 'Placa'),
                  React.createElement('input', { value: editingVehicleForm.license_plate, onChange: (e) => setEditingVehicleForm({ ...editingVehicleForm, license_plate: e.target.value.toUpperCase() }), className: 'w-full px-3 py-2 rounded border dark:bg-gray-700' })
                )
              ),
              React.createElement('div', null,
                React.createElement('label', { className: 'block text-sm font-medium mb-1' }, 'KM Atual'),
                React.createElement('input', { type: 'number', value: editingVehicleForm.current_km, onChange: (e) => setEditingVehicleForm({ ...editingVehicleForm, current_km: parseInt(e.target.value || 0) }), className: 'w-full px-3 py-2 rounded border dark:bg-gray-700' })
              )
            ),
            React.createElement('div', { className: 'flex justify-end gap-3 mt-6' },
              React.createElement('button', { onClick: () => setEditingVehicleId(null), className: 'px-4 py-2 text-gray-600 hover:bg-gray-100 rounded' }, 'Cancelar'),
              React.createElement('button', {
                onClick: async () => {
                  try {
                    const res = await axios.put(`/vehicles/${editingVehicleId}`, editingVehicleForm, { headers: { Authorization: `Bearer ${token}` } });
                    setVehicles(vehicles.map(v => v.id === res.data.id ? res.data : v));
                    setEditingVehicleId(null);
                    alert('Veículo atualizado');
                  } catch (err) {
                    alert(err?.response?.data?.detail || 'Erro ao atualizar veículo');
                  }
                },
                className: 'px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700'
              }, 'Salvar')
            )
          )
        )
      ),

      // Tipos de Manutenção
      React.createElement('div', { className: 'bg-white dark:bg-gray-800 rounded-lg shadow-md p-6' },
        React.createElement('h3', { className: 'text-xl font-semibold text-gray-900 dark:text-white mb-6' }, 'Configurações de Manutenção'),

        React.createElement('div', { className: 'mb-8 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg' },
          React.createElement('h4', { className: 'text-sm font-semibold mb-3' }, 'Adicionar Novo Tipo de Manutenção'),
          React.createElement('div', { className: 'grid grid-cols-1 md:grid-cols-4 gap-3' },
            React.createElement('input', { placeholder: 'Nome (ex: Óleo)', value: newType.name, onChange: (e) => setNewType({ ...newType, name: e.target.value }), className: 'px-2 py-2 rounded border dark:bg-gray-700' }),
            React.createElement('input', { placeholder: 'KM Intervalo', type: 'number', value: newType.default_interval_km, onChange: (e) => setNewType({ ...newType, default_interval_km: parseInt(e.target.value || 0) }), className: 'px-2 py-2 rounded border dark:bg-gray-700' }),
            React.createElement('input', { placeholder: 'Meses Intervalo', type: 'number', value: newType.default_interval_months, onChange: (e) => setNewType({ ...newType, default_interval_months: parseInt(e.target.value || 0) }), className: 'px-2 py-2 rounded border dark:bg-gray-700' }),
            React.createElement('button', {
              onClick: async () => {
                setLoadingCreate(true);
                try {
                  const res = await axios.post('/maintenance-types', newType, { headers: { Authorization: `Bearer ${token}` } });
                  setMaintenanceTypes([...maintenanceTypes, res.data]);
                  setNewType({ name: '', default_interval_km: 10000, default_interval_months: 12, description: '' });
                } catch (err) {
                  alert(err?.response?.data?.detail || 'Erro ao criar tipo');
                } finally {
                  setLoadingCreate(false);
                }
              },
              className: 'bg-blue-600 text-white px-3 py-2 rounded hover:bg-blue-700'
            }, loadingCreate ? 'Criando...' : 'Criar Tipo')
          )
        ),

        React.createElement('div', { className: 'space-y-2' },
          maintenanceTypes.map(type =>
            React.createElement('div', { key: type.id, className: 'p-4 border dark:border-gray-700 rounded-lg flex justify-between items-center' },
              React.createElement('div', null,
                React.createElement('div', { className: 'font-medium' }, type.name),
                React.createElement('div', { className: 'text-sm text-gray-500' }, `${type.default_interval_km} km / ${type.default_interval_months} meses`)
              ),
              React.createElement('button', {
                onClick: async () => {
                  if (!confirm(`Remover tipo '${type.name}'?`)) return;
                  try {
                    await axios.delete(`/maintenance-types/${type.id}`, { headers: { Authorization: `Bearer ${token}` } });
                    setMaintenanceTypes(maintenanceTypes.filter(t => t.id !== type.id));
                  } catch (err) {
                    alert(err?.response?.data?.detail || 'Erro ao remover tipo');
                  }
                },
                className: 'text-red-500 hover:text-red-700'
              }, React.createElement('span', { className: 'material-icons' }, 'delete'))
            )
          )
        )
      )
    );
  }

  window.Admin = Admin;
})();
