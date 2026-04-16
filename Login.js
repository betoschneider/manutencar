(function () {
  const { useState } = React;

  function Login() {
    const { Link } = window.ReactRouterDOM || {};
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
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
              const domEmail = e.target.elements.email?.value || email;
              const domPassword = e.target.elements.password?.value || password;
              
              const params = new URLSearchParams();
              params.append('username', domEmail.trim());
              params.append('password', domPassword);
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
            React.createElement('div', { className: 'relative' },
              React.createElement('input', {
                id: 'password',
                name: 'password',
                type: showPassword ? 'text' : 'password',
                required: true,
                className: 'appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white pr-10',
                placeholder: 'Senha',
                value: password,
                onChange: (e) => setPassword(e.target.value)
              }),
              React.createElement('button', {
                type: 'button',
                className: 'absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-500 z-20',
                onClick: () => setShowPassword(!showPassword)
              },
                showPassword ? 
                  React.createElement('svg', { className: 'h-5 w-5', fill: 'none', viewBox: '0 0 24 24', stroke: 'currentColor' },
                    React.createElement('path', { strokeLinecap: 'round', strokeLinejoin: 'round', strokeWidth: 2, d: 'M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21' })
                  ) :
                  React.createElement('svg', { className: 'h-5 w-5', fill: 'none', viewBox: '0 0 24 24', stroke: 'currentColor' },
                    React.createElement('path', { strokeLinecap: 'round', strokeLinejoin: 'round', strokeWidth: 2, d: 'M15 12a3 3 0 11-6 0 3 3 0 016 0z' }),
                    React.createElement('path', { strokeLinecap: 'round', strokeLinejoin: 'round', strokeWidth: 2, d: 'M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z' })
                  )
              )
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
