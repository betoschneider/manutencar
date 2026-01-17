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
    const [maintenanceTypes, setMaintenanceTypes] = useState([]);
    const [analysis, setAnalysis] = useState({});
    const [editingLogId, setEditingLogId] = useState(null);
    const [editingLogForm, setEditingLogForm] = useState({ maintenance_type_id: '', km_performed: 0, date_performed: '', notes: '', service_cost: 0, product_cost: 0, category: 'preventiva' });
    const [categoryFilter, setCategoryFilter] = useState('todas');

    const fetchData = async () => {
      try {
        const [historyRes, vehiclesRes, typesRes] = await Promise.all([
          axios.get(`vehicles/${id}/history`, { headers: { Authorization: `Bearer ${token}` } }),
          axios.get('vehicles', { headers: { Authorization: `Bearer ${token}` } }),
          axios.get('maintenance-types', { headers: { Authorization: `Bearer ${token}` } })
        ]);
        const vid = parseInt(id, 10);
        const found = (vehiclesRes.data || []).find(v => v.id === vid);
        setVehicle(found || null);
        const history = historyRes.data || [];
        const mTypes = typesRes.data || [];
        setMaintenanceHistory(history);
        setMaintenanceTypes(mTypes);

        // Calcular análises
        const now = new Date();
        const oneYearAgo = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
        const last12MonthsLogs = history.filter(log => new Date(log.date_performed) >= oneYearAgo);

        // KM rodados nos últimos 12 meses
        let kmDriven = 0;
        if (last12MonthsLogs.length > 0) {
          const sortedLogs = last12MonthsLogs.sort((a, b) => a.km_performed - b.km_performed);
          kmDriven = sortedLogs[sortedLogs.length - 1].km_performed - sortedLogs[0].km_performed;
        }

        // Média mensal
        const monthlyKm = kmDriven / 12;

        // Custos por categoria
        const costsByCategory = { preventiva: 0, desgaste: 0, corretiva: 0 };
        last12MonthsLogs.forEach(log => {
          const total = (log.service_cost || 0) + (log.product_cost || 0);
          costsByCategory[log.category] = (costsByCategory[log.category] || 0) + total;
        });

        // Estimativas de custos médios
        const avgCosts = {};
        ['preventiva', 'desgaste', 'corretiva'].forEach(cat => {
          const catLogs = last12MonthsLogs.filter(log => log.category === cat);
          if (catLogs.length > 0) {
            const totalCost = catLogs.reduce((sum, log) => sum + (log.service_cost || 0) + (log.product_cost || 0), 0);
            avgCosts[cat] = totalCost / catLogs.length;
          } else {
            avgCosts[cat] = 0;
          }
        });

        // Projeção futura usando intervalos reais
        const futureProjections = [];
        maintenanceTypes.forEach(mt => {
          const lastLog = history.filter(log => log.maintenance_type === mt.name).sort((a, b) => new Date(b.date_performed) - new Date(a.date_performed))[0];
          if (lastLog) {
            const nextKm = lastLog.km_performed + (mt.default_interval_km || 10000);
            const nextDate = new Date(lastLog.date_performed);
            nextDate.setMonth(nextDate.getMonth() + (mt.default_interval_months || 12));

            futureProjections.push({
              type: mt.name,
              nextKm,
              nextDate: nextDate.toISOString().split('T')[0],
              estimatedCost: avgCosts[lastLog.category] || 0
            });
          }
        });

        // Projeção mensal dos próximos 12 meses
        const monthlyProjection = [];
        for (let i = 0; i < 12; i++) {
          const monthDate = new Date(now.getFullYear(), now.getMonth() + i, 1);
          const monthKey = monthDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
          const dueMaintenances = futureProjections.filter(proj => {
            const projDate = new Date(proj.nextDate);
            return projDate.getFullYear() === monthDate.getFullYear() && projDate.getMonth() === monthDate.getMonth();
          });
          const totalCost = dueMaintenances.reduce((sum, m) => sum + m.estimatedCost, 0);

          monthlyProjection.push({
            month: monthKey,
            maintenances: dueMaintenances,
            totalCost
          });
        }

        setAnalysis({
          kmDriven,
          monthlyKm,
          costsByCategory,
          avgCosts,
          futureProjections,
          monthlyProjection,
          totalSpent: Object.values(costsByCategory).reduce((a, b) => a + b, 0)
        });
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
      const headers = ['date_performed', 'maintenance_type', 'category', 'km_performed', 'service_cost', 'product_cost', 'total', 'notes'];
      const rows = maintenanceHistory.map(it => {
        const mt = it.maintenance_type || it.maintenance_type_name || '';
        return [
          new Date(it.date_performed).toLocaleDateString('pt-BR'),
          (mt || '').replace(/"/g, '""'),
          it.category || '',
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
          : React.createElement('div', { className: 'space-y-6' },
            // Filtro de Categoria
            React.createElement('div', { className: 'flex items-center gap-4 mb-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg' },
              React.createElement('span', { className: 'text-sm font-medium text-gray-700 dark:text-gray-300' }, 'Filtrar por Categoria:'),
              React.createElement('div', { className: 'flex gap-2' },
                ['todas', 'preventiva', 'desgaste', 'corretiva'].map(cat =>
                  React.createElement('button', {
                    key: cat,
                    onClick: () => setCategoryFilter(cat),
                    className: `px-3 py-1 rounded-full text-xs font-medium transition-colors ${categoryFilter === cat
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-500'
                      }`
                  }, cat.charAt(0).toUpperCase() + cat.slice(1))
                )
              )
            ),

            // Lista Única Ordenada
            React.createElement('div', { className: 'space-y-3' },
              maintenanceHistory
                .filter(log => categoryFilter === 'todas' || log.category === categoryFilter)
                .sort((a, b) => new Date(b.date_performed) - new Date(a.date_performed))
                .map(item =>
                  React.createElement('div', {
                    key: item.id,
                    className: 'border border-gray-200 dark:border-gray-700 rounded-lg p-4'
                  },
                    React.createElement('div', { className: 'flex justify-between items-start mb-2' },
                      React.createElement('div', null,
                        React.createElement('h5', { className: 'text-lg font-semibold text-gray-900 dark:text-white' }, item.maintenance_type || item.maintenance_type_name),
                        React.createElement('span', {
                          className: `text-xs px-2 py-0.5 rounded-full font-medium ${item.category === 'preventiva' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' :
                              item.category === 'desgaste' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' :
                                'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                            }`
                        }, (item.category || 'preventiva').toUpperCase())
                      ),
                      React.createElement('div', { className: 'flex items-center gap-2' },
                        React.createElement('span', { className: 'text-sm text-gray-600 dark:text-gray-400' },
                          new Date(item.date_performed).toLocaleDateString('pt-BR')
                        ),
                        React.createElement('button', {
                          onClick: () => {
                            const type = maintenanceTypes.find(t => t.name === item.maintenance_type);
                            setEditingLogId(item.id);
                            setEditingLogForm({
                              maintenance_type_id: type ? type.id : '',
                              km_performed: item.km_performed,
                              date_performed: item.date_performed.split('T')[0],
                              notes: item.notes || '',
                              service_cost: item.service_cost || 0,
                              product_cost: item.product_cost || 0,
                              category: item.category || 'preventiva'
                            });
                          },
                          className: 'text-blue-500 hover:text-blue-700'
                        }, React.createElement('span', { className: 'material-icons text-lg' }, 'edit')),
                        React.createElement('button', {
                          onClick: async () => {
                            if (!confirm('Deseja realmente excluir este registro de manutenção?')) return;
                            try {
                              await axios.delete(`maintenance-logs/${item.id}`, { headers: { Authorization: `Bearer ${token}` } });
                              fetchData();
                            } catch (err) {
                              alert('Erro ao excluir registro');
                            }
                          },
                          className: 'text-red-500 hover:text-red-700'
                        }, React.createElement('span', { className: 'material-icons text-lg' }, 'delete'))
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
                        React.createElement('span', {
                          className: `font-semibold ${(item.service_cost || 0) + (item.product_cost || 0) > 500 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`
                        },
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
            ),

            // Consolidado por Categoria
            React.createElement('div', { className: 'mt-10 pt-6 border-t border-gray-200 dark:border-gray-700' },
              React.createElement('h4', { className: 'text-xl font-bold text-gray-900 dark:text-white mb-4' }, 'Consolidado por Categoria'),
              React.createElement('div', { className: 'grid grid-cols-1 md:grid-cols-3 gap-4' },
                ['preventiva', 'desgaste', 'corretiva'].map(cat => {
                  const filtered = maintenanceHistory.filter(log => log.category === cat);
                  const total = filtered.reduce((sum, log) => sum + (log.service_cost || 0) + (log.product_cost || 0), 0);
                  const count = filtered.length;
                  const names = { preventiva: 'Preventiva', desgaste: 'Desgaste', corretiva: 'Corretiva' };
                  const colors = { preventiva: 'text-green-600', desgaste: 'text-yellow-600', corretiva: 'text-red-600' };

                  return React.createElement('div', { key: cat, className: 'bg-gray-50 dark:bg-gray-700/30 p-4 rounded-lg' },
                    React.createElement('p', { className: `text-sm font-bold uppercase ${colors[cat]}` }, names[cat]),
                    React.createElement('div', { className: 'mt-2 flex justify-between items-end' },
                      React.createElement('div', null,
                        React.createElement('p', { className: 'text-2xl font-bold text-gray-900 dark:text-white' }, `R$ ${total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`),
                        React.createElement('p', { className: 'text-xs text-gray-500' }, `${count} manutenções`)
                      ),
                      React.createElement('span', { className: 'material-icons text-gray-300' },
                        cat === 'preventiva' ? 'verified' : cat === 'desgaste' ? 'build' : 'report_problem'
                      )
                    )
                  );
                })
              )
            ),

            // Modal de Edição de Log de Manutenção
            editingLogId && React.createElement('div', { className: 'fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50' },
              React.createElement('div', { className: 'bg-white dark:bg-gray-800 rounded-lg p-6 max-w-2xl w-full shadow-xl max-h-[90vh] overflow-y-auto' },
                React.createElement('h4', { className: 'text-xl font-bold mb-4' }, 'Editar Registro de Manutenção'),
                React.createElement('div', { className: 'grid grid-cols-1 md:grid-cols-2 gap-4' },
                  React.createElement('div', null,
                    React.createElement('label', { className: 'block text-sm font-medium mb-1' }, 'Tipo de Manutenção'),
                    React.createElement('select', {
                      value: editingLogForm.maintenance_type_id,
                      onChange: (e) => setEditingLogForm({ ...editingLogForm, maintenance_type_id: parseInt(e.target.value) }),
                      className: 'w-full px-3 py-2 rounded border dark:bg-gray-700'
                    },
                      React.createElement('option', { value: '' }, 'Selecione...'),
                      maintenanceTypes.map(t => React.createElement('option', { key: t.id, value: t.id }, t.name))
                    )
                  ),
                  React.createElement('div', null,
                    React.createElement('label', { className: 'block text-sm font-medium mb-1' }, 'Categoria'),
                    React.createElement('select', {
                      value: editingLogForm.category,
                      onChange: (e) => setEditingLogForm({ ...editingLogForm, category: e.target.value }),
                      className: 'w-full px-3 py-2 rounded border dark:bg-gray-700'
                    },
                      React.createElement('option', { value: 'preventiva' }, 'Preventiva'),
                      React.createElement('option', { value: 'desgaste' }, 'Desgaste'),
                      React.createElement('option', { value: 'corretiva' }, 'Corretiva')
                    )
                  ),
                  React.createElement('div', null,
                    React.createElement('label', { className: 'block text-sm font-medium mb-1' }, 'KM Realizada'),
                    React.createElement('input', {
                      type: 'number',
                      value: editingLogForm.km_performed,
                      onChange: (e) => setEditingLogForm({ ...editingLogForm, km_performed: parseInt(e.target.value || 0) }),
                      className: 'w-full px-3 py-2 rounded border dark:bg-gray-700'
                    })
                  ),
                  React.createElement('div', null,
                    React.createElement('label', { className: 'block text-sm font-medium mb-1' }, 'Data'),
                    React.createElement('input', {
                      type: 'date',
                      value: editingLogForm.date_performed,
                      onChange: (e) => setEditingLogForm({ ...editingLogForm, date_performed: e.target.value }),
                      className: 'w-full px-3 py-2 rounded border dark:bg-gray-700'
                    })
                  ),
                  React.createElement('div', null,
                    React.createElement('label', { className: 'block text-sm font-medium mb-1' }, 'Custo de Serviço (R$)'),
                    React.createElement('input', {
                      type: 'number',
                      value: editingLogForm.service_cost,
                      onChange: (e) => setEditingLogForm({ ...editingLogForm, service_cost: parseFloat(e.target.value || 0) }),
                      className: 'w-full px-3 py-2 rounded border dark:bg-gray-700'
                    })
                  ),
                  React.createElement('div', null,
                    React.createElement('label', { className: 'block text-sm font-medium mb-1' }, 'Custo de Produtos (R$)'),
                    React.createElement('input', {
                      type: 'number',
                      value: editingLogForm.product_cost,
                      onChange: (e) => setEditingLogForm({ ...editingLogForm, product_cost: parseFloat(e.target.value || 0) }),
                      className: 'w-full px-3 py-2 rounded border dark:bg-gray-700'
                    })
                  ),
                  React.createElement('div', { className: 'md:col-span-2' },
                    React.createElement('label', { className: 'block text-sm font-medium mb-1' }, 'Observações'),
                    React.createElement('textarea', {
                      value: editingLogForm.notes,
                      onChange: (e) => setEditingLogForm({ ...editingLogForm, notes: e.target.value }),
                      className: 'w-full px-3 py-2 rounded border dark:bg-gray-700',
                      rows: 3
                    })
                  )
                ),
                React.createElement('div', { className: 'flex justify-end gap-3 mt-6' },
                  React.createElement('button', { onClick: () => setEditingLogId(null), className: 'px-4 py-2 text-gray-600 hover:bg-gray-100 rounded' }, 'Cancelar'),
                  React.createElement('button', {
                    onClick: async () => {
                      try {
                        await axios.put(`maintenance-logs/${editingLogId}`, editingLogForm, { headers: { Authorization: `Bearer ${token}` } });
                        setEditingLogId(null);
                        fetchData();
                      } catch (err) {
                        alert(err?.response?.data?.detail || 'Erro ao atualizar registro');
                      }
                    },
                    className: 'px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700'
                  }, 'Salvar')
                )
              )
            )
          ),

        // Seção de Análises
        React.createElement('h3', { className: 'text-xl font-semibold text-gray-900 dark:text-white mb-4' }, 'Análises e Projeções'),
        React.createElement('div', { className: 'grid grid-cols-1 md:grid-cols-2 gap-6' },
          // Estatísticas dos últimos 12 meses
          React.createElement('div', { className: 'bg-white dark:bg-gray-800 rounded-lg shadow-md p-6' },
            React.createElement('h4', { className: 'text-lg font-semibold text-gray-900 dark:text-white mb-4' }, 'Últimos 12 Meses'),
            React.createElement('div', { className: 'space-y-3' },
              React.createElement('div', { className: 'flex justify-between' },
                React.createElement('span', { className: 'text-gray-700 dark:text-gray-300' }, 'KM Rodados:'),
                React.createElement('span', { className: 'font-semibold text-gray-900 dark:text-white' }, `${(analysis.kmDriven || 0).toLocaleString()} km`)
              ),
              React.createElement('div', { className: 'flex justify-between' },
                React.createElement('span', { className: 'text-gray-700 dark:text-gray-300' }, 'Média Mensal:'),
                React.createElement('span', { className: 'font-semibold text-gray-900 dark:text-white' }, `${(analysis.monthlyKm || 0).toFixed(0)} km/mês`)
              ),
              React.createElement('div', { className: 'flex justify-between' },
                React.createElement('span', { className: 'text-gray-700 dark:text-gray-300' }, 'Total Gasto:'),
                React.createElement('span', { className: 'font-semibold text-green-600 dark:text-green-400' }, `R$ ${(analysis.totalSpent || 0).toFixed(2)}`)
              )
            ),
            React.createElement('h5', { className: 'text-md font-semibold text-gray-900 dark:text-white mt-4 mb-2' }, 'Gastos por Categoria'),
            React.createElement('div', { className: 'space-y-2' },
              ['preventiva', 'desgaste', 'corretiva'].map(cat => {
                const names = { preventiva: 'Preventiva', desgaste: 'Desgaste', corretiva: 'Corretiva' };
                return React.createElement('div', { key: cat, className: 'flex justify-between' },
                  React.createElement('span', { className: 'text-gray-700 dark:text-gray-300' }, names[cat] + ':'),
                  React.createElement('span', { className: 'font-semibold text-gray-900 dark:text-white' }, `R$ ${(analysis.costsByCategory?.[cat] || 0).toFixed(2)}`)
                );
              })
            )
          ),

          // Custos Médios
          React.createElement('div', { className: 'bg-white dark:bg-gray-800 rounded-lg shadow-md p-6' },
            React.createElement('h4', { className: 'text-lg font-semibold text-gray-900 dark:text-white mb-4' }, 'Custos Médios por Manutenção'),
            React.createElement('div', { className: 'space-y-3' },
              ['preventiva', 'desgaste', 'corretiva'].map(cat => {
                const names = { preventiva: 'Preventiva', desgaste: 'Desgaste', corretiva: 'Corretiva' };
                return React.createElement('div', { key: cat, className: 'flex justify-between' },
                  React.createElement('span', { className: 'text-gray-700 dark:text-gray-300' }, names[cat] + ':'),
                  React.createElement('span', { className: 'font-semibold text-gray-900 dark:text-white' }, `R$ ${(analysis.avgCosts?.[cat] || 0).toFixed(2)}`)
                );
              })
            )
          )
        ),

        // Projeções Futuras
        React.createElement('div', { className: 'bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mt-6' },
          React.createElement('h4', { className: 'text-lg font-semibold text-gray-900 dark:text-white mb-4' }, 'Próximas Manutenções Recomendadas'),
          (analysis.futureProjections || []).length === 0
            ? React.createElement('p', { className: 'text-gray-600 dark:text-gray-400' }, 'Nenhuma projeção disponível.')
            : React.createElement('div', { className: 'overflow-x-auto' },
              React.createElement('table', { className: 'min-w-full table-auto' },
                React.createElement('thead', null,
                  React.createElement('tr', { className: 'bg-gray-50 dark:bg-gray-700' },
                    React.createElement('th', { className: 'px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider' }, 'Tipo'),
                    React.createElement('th', { className: 'px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider' }, 'Próxima em KM'),
                    React.createElement('th', { className: 'px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider' }, 'Próxima Data'),
                    React.createElement('th', { className: 'px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider' }, 'Custo Estimado')
                  )
                ),
                React.createElement('tbody', { className: 'bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700' },
                  (analysis.futureProjections || []).map((proj, index) =>
                    React.createElement('tr', { key: index },
                      React.createElement('td', { className: 'px-4 py-2 whitespace-nowrap text-sm text-gray-900 dark:text-white' }, proj.type),
                      React.createElement('td', { className: 'px-4 py-2 whitespace-nowrap text-sm text-gray-900 dark:text-white' }, `${proj.nextKm.toLocaleString()} km`),
                      React.createElement('td', { className: 'px-4 py-2 whitespace-nowrap text-sm text-gray-900 dark:text-white' }, new Date(proj.nextDate).toLocaleDateString('pt-BR')),
                      React.createElement('td', { className: 'px-4 py-2 whitespace-nowrap text-sm font-semibold' },
                        React.createElement('span', {
                          className: proj.estimatedCost > 500 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'
                        }, `R$ ${proj.estimatedCost.toFixed(2)}`)
                      )
                    )
                  )
                )
              )
            )
        ),

        // Projeção Mensal
        React.createElement('div', { className: 'bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mt-6' },
          React.createElement('h4', { className: 'text-lg font-semibold text-gray-900 dark:text-white mb-4' }, 'Projeção dos Próximos 12 Meses'),
          React.createElement('div', { className: 'overflow-x-auto' },
            React.createElement('table', { className: 'min-w-full table-auto' },
              React.createElement('thead', null,
                React.createElement('tr', { className: 'bg-gray-50 dark:bg-gray-700' },
                  React.createElement('th', { className: 'px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider' }, 'Mês'),
                  React.createElement('th', { className: 'px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider' }, 'Manutenções Previstas'),
                  React.createElement('th', { className: 'px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider' }, 'Custo Total Estimado')
                )
              ),
              React.createElement('tbody', { className: 'bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700' },
                (analysis.monthlyProjection || []).map((proj, index) =>
                  React.createElement('tr', { key: index },
                    React.createElement('td', { className: 'px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white' }, proj.month),
                    React.createElement('td', { className: 'px-4 py-2 text-sm text-gray-900 dark:text-white' },
                      proj.maintenances.length > 0
                        ? proj.maintenances.map(m => m.type).join(', ')
                        : 'Nenhuma'
                    ),
                    React.createElement('td', { className: 'px-4 py-2 whitespace-nowrap text-sm font-semibold' },
                      React.createElement('span', {
                        className: proj.totalCost > 500 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'
                      }, `R$ ${proj.totalCost.toFixed(2)}`)
                    )
                  )
                )
              )
            )
          ),
          React.createElement('div', { className: 'mt-4 p-4 bg-blue-50 dark:bg-blue-900 rounded' },
            React.createElement('h5', { className: 'text-md font-semibold text-blue-900 dark:text-blue-100 mb-2' }, 'Comparação com Gastos Passados'),
            React.createElement('div', { className: 'flex justify-between' },
              React.createElement('span', { className: 'text-blue-800 dark:text-blue-200' }, 'Gasto Médio Mensal (últimos 12 meses):'),
              React.createElement('span', { className: 'font-semibold text-blue-900 dark:text-blue-100' }, `R$ ${((analysis.totalSpent || 0) / 12).toFixed(2)}`)
            ),
            React.createElement('div', { className: 'flex justify-between mt-1' },
              React.createElement('span', { className: 'text-blue-800 dark:text-blue-200' }, 'Projeção Média Mensal (próximos 12 meses):'),
              React.createElement('span', { className: 'font-semibold text-blue-900 dark:text-blue-100' }, `R$ ${((analysis.monthlyProjection || []).reduce((sum, p) => sum + p.totalCost, 0) / 12).toFixed(2)}`)
            )
          )
        ),

        // Fundo de Manutenção
        React.createElement('div', { className: 'bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mt-6' },
          React.createElement('h4', { className: 'text-lg font-semibold text-gray-900 dark:text-white mb-4' }, 'Fundo de Manutenção'),
          React.createElement('div', { className: 'space-y-3' },
            React.createElement('div', { className: 'flex justify-between' },
              React.createElement('span', { className: 'text-gray-700 dark:text-gray-300' }, 'Gasto Médio Mensal (últimos 12 meses):'),
              React.createElement('span', { className: 'font-semibold text-gray-900 dark:text-white' }, `R$ ${((analysis.totalSpent || 0) / 12).toFixed(2)}`)
            ),
            React.createElement('div', { className: 'flex justify-between' },
              React.createElement('span', { className: 'text-gray-700 dark:text-gray-300' }, 'Recomendação de Reserva Mensal:'),
              React.createElement('span', { className: 'font-semibold text-blue-600 dark:text-blue-400' }, `R$ ${(((analysis.totalSpent || 0) / 12) * 1.2).toFixed(2)} (20% margem de segurança)`)
            )
          )
        )
      )
    );
  }

  window.History = History;
})();
