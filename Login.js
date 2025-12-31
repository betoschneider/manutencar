(function () {
  const { useState } = React;

  function Login() {
    const { Link } = window.ReactRouterDOM || {};
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    return React.createElement('div', { className: 'min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8' },
      React.createElement('div', { className: 'max-w-md w-full space-y-8' },
        React.createElement('div', null,
          React.createElement('h2', { className: 'mt-6 text-center text-3xl font-extrabold text-gray-900 dark:text-white' },
            'Entrar na sua conta'
          )
        ),
        React.createElement('form', {
          className: 'mt-8 space-y-6', onSubmit: async (e) => {
            e.preventDefault();
            setLoading(true);
            try {
              const params = new URLSearchParams();
              params.append('username', email);
              params.append('password', password);
              const res = await axios.post('token', params, { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } });
              const access = res.data && res.data.access_token;
              if (access) {
                localStorage.setItem('token', access);
                window.location.href = '/';
              } else {
                setError('Resposta de autenticação inválida');
              }
            } catch (err) {
              console.error('Login error:', err);
              let msg = err?.response?.data?.detail || 'Credenciais inválidas';
              if (typeof msg === 'object') msg = JSON.stringify(msg);
              setError(msg);
            } finally {
              setLoading(false);
            }
          }
        },
          React.createElement('div', { className: 'rounded-md shadow-sm -space-y-px' },
            React.createElement('div', null,
              React.createElement('input', {
                id: 'email',
                name: 'email',
                type: 'email',
                required: true,
                className: 'appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white',
                placeholder: 'Email',
                value: email,
                onChange: (e) => setEmail(e.target.value)
              })
            ),
            React.createElement('div', null,
              React.createElement('input', {
                id: 'password',
                name: 'password',
                type: 'password',
                required: true,
                className: 'appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white',
                placeholder: 'Senha',
                value: password,
                onChange: (e) => setPassword(e.target.value)
              })
            )
          ),
          error && React.createElement('div', { className: 'text-red-600 dark:text-red-400 text-center' }, error),
          React.createElement('div', null,
            React.createElement('button', {
              type: 'submit',
              disabled: loading,
              className: 'group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
            }, loading ? 'Entrando...' : 'Entrar')
          ),
          React.createElement('div', { className: 'text-center' },
            React.createElement('span', { className: 'text-gray-600 dark:text-gray-400' }, 'Não tem conta? '),
            Link ? React.createElement(Link, { to: '/register', className: 'text-blue-600 hover:text-blue-500 dark:text-blue-400' }, 'Criar conta') : React.createElement('a', { href: '/register', className: 'text-blue-600 hover:text-blue-500 dark:text-blue-400' }, 'Criar conta')
          )
        )
      )
    );
  }

  window.Login = Login;
})();
