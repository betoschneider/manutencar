(function () {
  const { useState, useEffect, useContext } = React;

  function Profile() {
    const { token, user, login, logout } = useContext(window.AuthContext);
    const [formData, setFormData] = useState({
      name: user?.name || '',
      email: user?.email || '',
      password: '',
      confirmPassword: ''
    });
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    const [aiProvider, setAiProvider] = useState('');
    const [aiApiKey, setAiApiKey] = useState('');
    const [hasApiKey, setHasApiKey] = useState(false);
    const [aiLoading, setAiLoading] = useState(false);
    const [aiMessage, setAiMessage] = useState('');

    useEffect(() => {
      const fetchAiConfig = async () => {
        try {
          const res = await axios.get('user-config', { headers: { Authorization: `Bearer ${token}` } });
          setAiProvider(res.data.llm_provider || '');
          setHasApiKey(res.data.has_api_key);
        } catch (err) {
          console.error('Erro ao buscar configs de IA', err);
        }
      };
      fetchAiConfig();
    }, [token]);

    const handleAiSubmit = async (e) => {
      e.preventDefault();
      setAiLoading(true);
      setAiMessage('');
      try {
        await axios.post('user-config', {
          llm_provider: aiProvider || null,
          llm_api_key: aiApiKey || null
        }, { headers: { Authorization: `Bearer ${token}` } });
        setAiMessage('Configurações de IA salvas com sucesso!');
        if (aiApiKey) setHasApiKey(true);
        setAiApiKey(''); // limpar após salvar por segurança
      } catch (err) {
        setAiMessage('Erro ao salvar as configurações de IA.');
      } finally {
        setAiLoading(false);
      }
    };

    const handleSubmit = async (e) => {
      e.preventDefault();
      setLoading(true);
      setError('');
      setMessage('');

      if (formData.password && formData.password !== formData.confirmPassword) {
        setError('As senhas não coincidem');
        setLoading(false);
        return;
      }

      try {
        const updateData = {};
        if (formData.name.trim()) updateData.name = formData.name;
        if (formData.email.trim()) updateData.email = formData.email;
        if (formData.password) updateData.password = formData.password;

        // Se nada foi alterado, não enviar
        if (Object.keys(updateData).length === 0) {
          setError('Nenhuma alteração foi feita.');
          setLoading(false);
          return;
        }

        const res = await axios.put('me', updateData, {
          headers: { Authorization: `Bearer ${token}` }
        });

        setMessage('Perfil atualizado com sucesso!');

        // Se email mudou, pode precisar relogar, mas por enquanto assumimos que não
        // Atualizar user no contexto
        if (updateData.name !== null || updateData.email !== null) {
          // Buscar user atualizado
          const userRes = await axios.get('me', { headers: { Authorization: `Bearer ${token}` } });
          // Como login atualiza user, podemos chamar login com mesmo token
          login(token);
        }

        // Limpar senha
        setFormData(prev => ({ ...prev, password: '', confirmPassword: '' }));

      } catch (err) {
        console.error('Erro ao atualizar perfil:', err);
        let msg = err?.response?.data?.detail || 'Erro ao atualizar perfil';
        if (typeof msg === 'object') msg = JSON.stringify(msg);
        setError(msg);
      } finally {
        setLoading(false);
      }
    };

    const handleChange = (e) => {
      setFormData(prev => ({
        ...prev,
        [e.target.name]: e.target.value
      }));
    };

    return React.createElement('div', { className: 'max-w-md mx-auto bg-white dark:bg-gray-800 p-8 rounded-lg shadow-md' },
      React.createElement('div', { className: 'flex justify-between items-center mb-6' },
        React.createElement('h1', { className: 'text-2xl font-bold text-gray-900 dark:text-white' }, 'Meu Perfil'),
        React.createElement('button', {
          onClick: () => window.location.href = '/',
          className: 'px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded font-medium transition-colors'
        }, 'Voltar ao Dashboard')
      ),

      React.createElement('form', { onSubmit: handleSubmit, className: 'space-y-6' },

        React.createElement('div', null,
          React.createElement('label', { htmlFor: 'name', className: 'block text-sm font-medium text-gray-700 dark:text-gray-300' }, 'Nome'),
          React.createElement('input', {
            type: 'text',
            id: 'name',
            name: 'name',
            value: formData.name,
            onChange: handleChange,
            className: 'mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white'
          })
        ),

        React.createElement('div', null,
          React.createElement('label', { htmlFor: 'email', className: 'block text-sm font-medium text-gray-700 dark:text-gray-300' }, 'Email'),
          React.createElement('input', {
            type: 'email',
            id: 'email',
            name: 'email',
            value: formData.email,
            onChange: handleChange,
            className: 'mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white'
          })
        ),

        React.createElement('div', null,
          React.createElement('label', { htmlFor: 'password', className: 'block text-sm font-medium text-gray-700 dark:text-gray-300' }, 'Nova Senha (deixe em branco para manter)'),
          React.createElement('input', {
            type: 'password',
            id: 'password',
            name: 'password',
            value: formData.password,
            onChange: handleChange,
            className: 'mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white'
          })
        ),

        React.createElement('div', null,
          React.createElement('label', { htmlFor: 'confirmPassword', className: 'block text-sm font-medium text-gray-700 dark:text-gray-300' }, 'Confirmar Nova Senha'),
          React.createElement('input', {
            type: 'password',
            id: 'confirmPassword',
            name: 'confirmPassword',
            value: formData.confirmPassword,
            onChange: handleChange,
            className: 'mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white'
          })
        ),

        error && React.createElement('div', { className: 'text-red-600 dark:text-red-400 text-sm' }, error),
        message && React.createElement('div', { className: 'text-green-600 dark:text-green-400 text-sm' }, message),

        React.createElement('button', {
          type: 'submit',
          disabled: loading,
          className: 'w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50'
        }, loading ? 'Salvando...' : 'Salvar Alterações'),

        React.createElement('div', { className: 'pt-8 mt-8 border-t border-gray-200 dark:border-gray-700' },
          React.createElement('h3', { className: 'text-lg font-bold text-indigo-600 dark:text-indigo-400 mb-2' }, 'Configurações de IA (BYOK)'),
          React.createElement('p', { className: 'text-sm text-gray-600 dark:text-gray-400 mb-4' },
            'Traga sua própria chave (Bring Your Own Key) para ativar o assistente mecânico avançado e a normalização automática de nomenclatura.'
          ),
          
          React.createElement('div', { className: 'space-y-4' },
            React.createElement('div', null,
              React.createElement('label', { className: 'block text-sm font-medium text-gray-700 dark:text-gray-300' }, 'Provedor de IA'),
              React.createElement('select', {
                value: aiProvider,
                onChange: (e) => setAiProvider(e.target.value),
                className: 'mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white'
              },
                React.createElement('option', { value: '' }, 'Desativado'),
                React.createElement('option', { value: 'openai' }, 'OpenAI (ChatGPT)'),
                React.createElement('option', { value: 'gemini' }, 'Google Gemini'),
                React.createElement('option', { value: 'claude' }, 'Anthropic Claude')
              )
            ),
            React.createElement('div', null,
              React.createElement('label', { className: 'block text-sm font-medium text-gray-700 dark:text-gray-300' },
                'API Key ', hasApiKey && React.createElement('span', { className: 'text-green-600 dark:text-green-400 text-xs ml-2' }, '✓ Chave já cadastrada')
              ),
              React.createElement('input', {
                type: 'password',
                value: aiApiKey,
                onChange: (e) => setAiApiKey(e.target.value),
                placeholder: hasApiKey ? '•••••••••••••••• (deixe em branco p/ manter)' : 'Cole sua API Key aqui...',
                className: 'mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white'
              })
            ),
            aiMessage && React.createElement('div', { className: aiMessage.includes('Erro') ? 'text-red-600 text-sm' : 'text-green-600 text-sm' }, aiMessage),
            React.createElement('button', {
              type: 'button',
              onClick: handleAiSubmit,
              disabled: aiLoading,
              className: 'w-full flex justify-center py-2 px-4 border border-indigo-600 text-indigo-600 hover:bg-indigo-600 hover:text-white rounded-md shadow-sm text-sm font-medium transition-colors disabled:opacity-50'
            }, aiLoading ? 'Salvando IA...' : 'Salvar Configuração de IA')
          )
        ),

        React.createElement('div', { className: 'pt-8 mt-8 border-t border-red-200 dark:border-red-900' },
          React.createElement('h3', { className: 'text-lg font-bold text-red-600 dark:text-red-400 mb-2' }, 'Zona de Perigo'),
          React.createElement('p', { className: 'text-sm text-gray-600 dark:text-gray-400 mb-4' },
            'A exclusão da conta é uma ação crítica e irreversível. Todos os seus veículos e históricos de manutenção serão permanentemente apagados.'
          ),
          React.createElement('button', {
            type: 'button',
            onClick: async () => {
              if (confirm('AVISO CRÍTICO: Você tem certeza que deseja excluir sua conta? Esta ação é IRREVERSÍVEL e todos os seus dados serão perdidos para sempre!')) {
                try {
                  await axios.delete('me', { headers: { Authorization: `Bearer ${token}` } });
                  alert('Sua conta foi excluída com sucesso.');
                  logout();
                  window.location.href = '/';
                } catch (err) {
                  alert('Erro ao excluir conta');
                }
              }
            },
            className: 'w-full py-2 px-4 border border-red-600 text-red-600 hover:bg-red-600 hover:text-white rounded-md text-sm font-medium transition-colors'
          }, 'Excluir Minha Conta')
        )
      )
    );
  }

  window.Profile = Profile;
})();