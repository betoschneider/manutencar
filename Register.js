(function () {
  const { useState } = React;

  function Register() {
    const { Link, useNavigate } = window.ReactRouterDOM || {};
    const navigate = useNavigate ? useNavigate() : (path => { window.location.href = path; });
    const [formData, setFormData] = useState({ username: '', password: '', confirm_password: '', email: '' });
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const handleSubmit = async (e) => {
      e.preventDefault();
      // Validação local: confirmar senha
      if (formData.password !== formData.confirm_password) {
        setError('As senhas não coincidem');
        return;
      }

      try {
        const res = await axios.post('register', {
          email: formData.email,
          password: formData.password
        });
        console.log('Register response:', res.data);
        setSuccess('Usuário registrado com sucesso! Redirecionando para login...');
        setTimeout(() => navigate('/login'), 2000);
      } catch (error) {
        console.error('Register error:', error);
        const serverMsg = error?.response?.data?.detail || error.message || 'Erro ao registrar usuário';
        setError(serverMsg);
      }
    };

    return React.createElement('div', { className: 'min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8' },
      React.createElement('div', { className: 'max-w-md w-full space-y-8' },
        React.createElement('div', null,
          React.createElement('h2', { className: 'mt-6 text-center text-3xl font-extrabold text-gray-900 dark:text-white' },
            'Criar nova conta'
          )
        ),
        React.createElement('form', { className: 'mt-8 space-y-6', onSubmit: handleSubmit },
          React.createElement('div', { className: 'rounded-md shadow-sm -space-y-px' },
            React.createElement('div', null,
              React.createElement('input', {
                id: 'username',
                name: 'username',
                type: 'text',
                required: true,
                className: 'appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white',
                placeholder: 'Nome de usuário',
                value: formData.username,
                onChange: (e) => setFormData({ ...formData, username: e.target.value })
              })
            ),
            React.createElement('div', null,
              React.createElement('input', {
                id: 'email',
                name: 'email',
                type: 'email',
                required: true,
                className: 'appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white',
                placeholder: 'Email',
                value: formData.email,
                onChange: (e) => setFormData({ ...formData, email: e.target.value })
              })
            ),
            React.createElement('div', null,
              React.createElement('input', {
                id: 'password',
                name: 'password',
                type: 'password',
                required: true,
                className: 'appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white',
                placeholder: 'Senha',
                value: formData.password,
                onChange: (e) => setFormData({ ...formData, password: e.target.value })
              })
            ),
            React.createElement('div', null,
              React.createElement('input', {
                id: 'confirm_password',
                name: 'confirm_password',
                type: 'password',
                required: true,
                className: 'appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white',
                placeholder: 'Confirmar senha',
                value: formData.confirm_password,
                onChange: (e) => setFormData({ ...formData, confirm_password: e.target.value })
              })
            )
          ),
          error && React.createElement('div', { className: 'text-red-600 dark:text-red-400 text-center' }, error),
          success && React.createElement('div', { className: 'text-green-600 dark:text-green-400 text-center' }, success),
          React.createElement('div', null,
            React.createElement('button', {
              type: 'submit',
              className: 'group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
            }, 'Registrar')
          ),
          React.createElement('div', { className: 'text-center' },
            React.createElement('span', { className: 'text-gray-600 dark:text-gray-400' }, 'Já tem conta? '),
            Link ? React.createElement(Link, {
              to: '/login',
              className: 'text-blue-600 hover:text-blue-500 dark:text-blue-400'
            }, 'Entrar') : React.createElement('a', { href: '/login', className: 'text-blue-600 hover:text-blue-500 dark:text-blue-400' }, 'Entrar')
          )
        )
      )
    );
  }

  window.Register = Register;
})();
