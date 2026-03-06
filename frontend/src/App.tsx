import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const api = axios.create({ baseURL: API_URL });

function App() {
  const [products, setProducts] = useState<any[]>([]);
  const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem('token'));
  const [eventLogs, setEventLogs] = useState<string[]>([]);
  const [email, setEmail] = useState('admin@admin.com');
  const [password, setPassword] = useState('12345678');

  const fetchProducts = async () => {
    try {
      const res = await api.get('/product', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      const productsArray = Array.isArray(res.data) ? res.data : (res.data?.data || []);
      setProducts(productsArray);
    } catch (e) { 
      setProducts([]); 
    }
  };

  useEffect(() => { if (isLoggedIn) fetchProducts(); }, [isLoggedIn]);

  useEffect(() => {
    if (!isLoggedIn) return;
    const eventSource = new EventSource('http://localhost:3000/product/stream-events');

    eventSource.onmessage = (event) => {
      const rawData = JSON.parse(event.data);
      const parsedData = rawData.data || rawData;
      
      if (parsedData.type === 'PRODUCT_ACTIVATED') {
        debugger;
        addLog(`EVENT: product.activated - ID: ${parsedData.payload.productId}`);
        fetchProducts(); 
      }
      if (parsedData.type === 'PRODUCT_CREATED') {
        debugger;
        addLog(`EVENT: product.created - ID: ${parsedData.payload.productId}`);
        fetchProducts(); 
      }
    };

    return () => eventSource.close();
  }, [isLoggedIn]);

  const addLog = (msg: string) => setEventLogs(prev => [msg, ...prev]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.post('/auth/login', { email, password });
      const token = res.data?.data?.accessToken || res.data?.accessToken;
      if (token) {
        localStorage.setItem('token', token);
        setIsLoggedIn(true);
      }
    } catch (e) { alert("AUTH_ERROR"); }
  };

  const handleCreateMock = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };
      const rid = Math.floor(Math.random() * 1000);
      const res = await api.post('/product/create', { title: `Product_${rid}`, code: `P-${rid}`, categoryId: 1 }, { headers });
      const pid = res.data.data.id; 
      await api.post(`/product/${pid}/details`, { 
        title: `Product_${rid}`, code: `P-${rid}`, variationType: "NONE",
        description: "Test", about: ["Test"], details: { category: "Test", test: true }
      }, { headers });
    } catch (e) { console.error(e); }
  };

  const handleActivate = async (id: number) => {
    try {
      await api.post(`/product/${id}/activate`, {}, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
    } catch (e) { console.error(e); }
  };

    if (!isLoggedIn) {
    return (
      <div style={{ width: '100vw', height: '100vh', margin: 0, padding: '50px', fontFamily: 'sans-serif', backgroundColor: 'white', color: 'black', boxSizing: 'border-box' }}>
        <h2>LOGIN</h2>
        <form onSubmit={handleLogin}>
          <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Email" /><br/>
          <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Password" style={{marginTop: '10px'}} /><br/>
          <button type="submit" style={{marginTop: '10px'}}>ENTER</button>
        </form>
      </div>
    );
  }

  return (
    <div style={{ width: '100vw', height: '100vh', margin: 0, padding: '20px', fontFamily: 'sans-serif', color: 'black', backgroundColor: 'white', boxSizing: 'border-box' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '20px solid transparent' }}>
        <strong>Challenge Microservicios</strong>
        <button onClick={() => { localStorage.removeItem('token'); window.location.reload(); }}>LOGOUT</button>
      </div>

      <button onClick={handleCreateMock} style={{ padding: '10px', cursor: 'pointer', marginBottom: '20px' }}>
        Crear Producto
      </button>

      <div style={{ display: 'flex', gap: '50px' }}>
        <div style={{ flex: 1 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid black', textAlign: 'left' }}>
                <th>ID</th><th>NAME</th><th>STATUS</th><th>ACTION</th>
              </tr>
            </thead>
            <tbody>
              {products.map(p => (
                <tr key={p.id} style={{ borderBottom: '1px solid #ddd' }}>
                  <td>{p.id}</td><td>{p.title}</td>
                  <td>{p.isActive ? 'ACTIVE' : 'INACTIVE'}</td>
                  <td>{!p.isActive && <button onClick={() => handleActivate(p.id)}>ACTIVATE</button>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div style={{ width: '300px', borderLeft: '1px solid #ccc', paddingLeft: '20px' }}>
          <strong>EVENTOS</strong>
          <div style={{ fontSize: '11px', marginTop: '10px' }}>
            {eventLogs.map((l, i) => <div key={i}>{l}</div>)}
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;