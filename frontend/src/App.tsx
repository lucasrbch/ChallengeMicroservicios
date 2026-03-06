import { useEffect, useState } from 'react';
import api from './api';

interface Product {
  id: number;
  title: string | null;
  code: string | null;
  isActive: boolean;
}

function App() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem('token'));
  const [email, setEmail] = useState('admin@admin.com'); 
  const [password, setPassword] = useState('12345678');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.post('/auth/login', { email, password });
      if (res.data.isSuccess) {
        localStorage.setItem('token', res.data.data.accessToken);
        setIsLoggedIn(true);
      }
    } catch (error) {
      alert("Credenciales incorrectas");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setIsLoggedIn(false);
    setProducts([]);
  };

  const loadProducts = async () => {
    setLoading(true);
    try {
      const res = await api.get('/product');
      setProducts(res.data.data || res.data); 
    } catch (error) {
      console.error("Error al cargar productos:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleActivate = async (id: number) => {
    try {
      await api.post(`/product/${id}/activate`);
      await loadProducts();
      alert("¡Producto activado! Revisá la consola del Backend para ver el evento.");
    } catch (error) {
      alert("Error al activar. Es probable que el producto tenga datos nulos. " + error);
    }
  };

  useEffect(() => {
    if (isLoggedIn) {
      loadProducts();
    }
  }, [isLoggedIn]);

  if (!isLoggedIn) {
    return (
      <div style={{ padding: '100px', textAlign: 'center', fontFamily: 'sans-serif' }}>
        <h2>Challenge: Login</h2>
        <form onSubmit={handleLogin} style={{ display: 'inline-block', textAlign: 'left', border: '1px solid #ccc', padding: '20px', borderRadius: '8px' }}>
          <div style={{ marginBottom: '10px' }}>
            <label>Email:</label><br />
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} style={{ width: '250px', padding: '5px' }} />
          </div>
          <div style={{ marginBottom: '10px' }}>
            <label>Password:</label><br />
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} style={{ width: '250px', padding: '5px' }} />
          </div>
          <button type="submit" style={{ width: '100%', padding: '10px', background: '#2b6cb0', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
            Ingresar
          </button>
        </form>
      </div>
    );
  }

  return (
    <div style={{ padding: '40px', fontFamily: 'sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1>Gestión de Inventario</h1>
        <button onClick={handleLogout} style={{ padding: '8px 16px', cursor: 'pointer', background: '#e53e3e', color: 'white', border: 'none', borderRadius: '4px' }}>
          Cerrar Sesión
        </button>
      </div>
      <hr />
      
      {loading ? (
        <p>Cargando catálogo...</p>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '20px', marginTop: '20px' }}>
          {products.map((p) => (
            <div key={p.id} style={{ 
              border: '1px solid #ccc', 
              padding: '15px', 
              borderRadius: '8px',
              background: '#0e0c0c'
            }}>
              <h3>{p.title || `ID: ${p.id} (Sin título)`}</h3>
              <p>Código: {p.code || 'N/A'}</p>
              <p>Estado: <b>{p.isActive ? 'ACTIVO' : 'INACTIVO'}</b></p>
              
              {!p.isActive && (
                <button 
                  onClick={() => handleActivate(p.id)}
                  style={{ padding: '8px 16px', cursor: 'pointer', background: '#2b6cb0', color: 'white', border: 'none', borderRadius: '4px', width: '100%' }}
                >
                  Activar Producto
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default App;