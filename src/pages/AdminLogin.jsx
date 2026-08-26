import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './AdminLogin.css';
export default function AdminLogin() {
  const { login, currentUser, isAdmin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    if (currentUser && isAdmin) {
      const destino = location.state?.from ?? '/admin';
      navigate(destino, { replace: true });
    }
  }, [currentUser, isAdmin, navigate, location.state]);

  useEffect(() => {
    if (currentUser && !isAdmin) {
      setError('Esta cuenta no tiene permisos de administrador.');
    }
  }, [currentUser, isAdmin]);

  async function handleSubmit(e) {
    e.preventDefault();
    console.log('DEBUG 1: handleSubmit se ejecutó', { email, password });
    if (enviando) return;
    setError('');
    setEnviando(true);

    try {
      console.log('DEBUG 2: llamando a login()');
      await login(email, password);
      console.log('DEBUG 3: login() resolvió sin error');
    } catch (err) {
      console.log('DEBUG 4: login() lanzó error:', err.code, err.message);
      if (err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password' || err.code === 'auth/user-not-found') {
        setError('Correo o contraseña incorrectos.');
      } else if (err.code === 'auth/too-many-requests') {
        setError('Demasiados intentos fallidos. Intenta de nuevo en unos minutos.');
      } else {
        setError('Ocurrió un error al iniciar sesión. Intenta nuevamente.');
      }
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="admin-login-wrap">
      <form className="admin-login-form" onSubmit={handleSubmit}>
        <h1>Panel administrativo</h1>

        <label>
          Correo electrónico
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoFocus />
        </label>

        <label>
          Contraseña
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        </label>

        {error && <p className="form-error">{error}</p>}

        <button type="submit" disabled={enviando}>
          {enviando ? 'Ingresando...' : 'Iniciar sesión'}
        </button>
      </form>
    </div>
  );
}