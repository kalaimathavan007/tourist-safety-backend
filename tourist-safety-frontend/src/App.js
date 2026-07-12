import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Polygon, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import './App.css';

// Centralized API URL - If your backend link changes, change only this!
const API_BASE_URL = 'https://tourist-safety-monitoring-system-alpha.vercel.app';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const globalStyles = `
  .gradient-bg { background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%); min-height: 100vh; padding-bottom: 30px; font-family: sans-serif; }
  .glass-navbar { background: linear-gradient(90deg, #1e3c72 0%, #2a5298 100%); color: white; padding: 15px 30px; display: flex; justify-content: space-between; align-items: center; box-shadow: 0 4px 15px rgba(0,0,0,0.2); margin-bottom: 20px; }
  .navbar-brand { font-size: 1.5rem; font-weight: bold; margin: 0; }
  .fade-in { animation: fadeIn 0.8s ease-out forwards; opacity: 0; }
  .hover-card { background: white; border-radius: 15px; padding: 20px; box-shadow: 0 8px 20px rgba(0,0,0,0.05); margin-bottom: 20px; border-top: 4px solid #1e3c72; }
  .pulse-btn { animation: pulse 1.5s infinite; color: white; border: none; font-weight: bold; font-size: 1.1rem; border-radius: 10px; cursor: pointer; padding: 15px; width: 100%; margin-top: 10px; }
  .action-btn { padding: 10px 20px; background: linear-gradient(90deg, #1e3c72 0%, #2a5298 100%); color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: bold; }
  .modern-input { width: 100%; padding: 12px; margin: 10px 0; border: 1.5px solid #e1e5ee; border-radius: 8px; box-sizing: border-box; }
  .auth-card-styled { background: white; padding: 40px; border-radius: 20px; box-shadow: 0 15px 35px rgba(0,0,0,0.1); max-width: 400px; margin: 80px auto; text-align: center; }
  .alert-item { background: #fff3cd; border-left: 5px solid #ffc107; padding: 15px; margin-bottom: 10px; border-radius: 5px; font-size: 0.95rem; }
  .role-badge { background: rgba(255,255,255,0.2); padding: 6px 15px; border-radius: 20px; font-size: 0.9rem; font-weight: bold; }
  .map-wrapper { border-radius: 15px; overflow: hidden; box-shadow: 0 10px 20px rgba(0,0,0,0.1); margin-bottom: 20px; border: 3px solid white; }
  @keyframes fadeIn { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
  @keyframes pulse { 0% { box-shadow: 0 0 0 0 rgba(255, 65, 108, 0.6); } 70% { box-shadow: 0 0 0 15px rgba(255, 65, 108, 0); } }
`;

// Helper: Point in Zone Check
const isPointInZone = (point, polygonCoords) => {
    if (!point || !polygonCoords || polygonCoords.length < 3) return false;
    let closedCoords = [...polygonCoords];
    const first = closedCoords[0];
    const last = closedCoords[closedCoords.length - 1];
    if (first[0] !== last[0] || first[1] !== last[1]) closedCoords.push([first[0], first[1]]);
    let inside = false;
    for (let i = 0, j = closedCoords.length - 1; i < closedCoords.length; j = i++) {
        const xi = closedCoords[i][0],
            yi = closedCoords[i][1];
        const xj = closedCoords[j][0],
            yj = closedCoords[j][1];
        const intersect = ((yi > point.lat) !== (yj > point.lat)) && (point.lng < (xj - xi) * (point.lat - yi) / (yj - yi) + xi);
        if (intersect) inside = !inside;
    }
    return inside;
};

// --- Auth Components (Simplified for structure) ---
function TouristAuth({ onLogin }) {
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');

    const handleSubmit = async(e) => {
        e.preventDefault();
        const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register';
        const body = isLogin ? { email, password } : { name, email, password, phone, role: 'tourist' };
        try {
            const res = await fetch(`${API_BASE_URL}${endpoint}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });
            const data = await res.json();
            if (data.token) {
                localStorage.setItem('token', data.token);
                localStorage.setItem('role', data.user.role);
                localStorage.setItem('userId', data.user.id);
                localStorage.setItem('userName', data.user.name || name);
                onLogin(data.user);
            } else alert(data.msg || 'Authentication failed');
        } catch (err) { alert('Server error. Check backend link.'); }
    };

    return ( <
        div className = "gradient-bg"
        style = {
            { display: 'flex', alignItems: 'center', justifyContent: 'center' }
        } >
        <
        div className = "auth-card-styled fade-in" >
        <
        h2 > 🌍Smart Tourist Safety < /h2> <
        form onSubmit = { handleSubmit } > {!isLogin && < input className = "modern-input"
            type = "text"
            placeholder = "Full Name"
            value = { name }
            onChange = {
                (e) => setName(e.target.value)
            }
            required / >
        } <
        input className = "modern-input"
        type = "email"
        placeholder = "Email Address"
        value = { email }
        onChange = {
            (e) => setEmail(e.target.value)
        }
        required / >
        <
        input className = "modern-input"
        type = "password"
        placeholder = "Password"
        value = { password }
        onChange = {
            (e) => setPassword(e.target.value)
        }
        required / >
        <
        button className = "action-btn"
        type = "submit"
        style = {
            { width: '100%', marginTop: '15px' }
        } > { isLogin ? 'Login' : 'Register' } < /button> < /
        form > <
        p onClick = {
            () => setIsLogin(!isLogin)
        }
        style = {
            { cursor: 'pointer', marginTop: '20px', color: '#1e3c72', fontWeight: 'bold' }
        } > { isLogin ? 'New user? Register here ➔' : 'Already have an account? Login ➔' } <
        /p> < /
        div > <
        /div>
    );
}

// NOTE: Please ensure you continue the pattern for AdminAuth, TouristDashboard, and AdminDashboard 
// by replacing fetch('https://tourist-safety-monitoring-system-alpha.vercel.app/api/...') 
// with fetch(`${API_BASE_URL}/api/...`) 

function App() {
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [user, setUser] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token) setIsLoggedIn(true);
    }, []);

    const handleLogin = (u) => {
        setIsLoggedIn(true);
        setUser(u);
        navigate('/');
    };
    const logout = () => {
        localStorage.clear();
        setIsLoggedIn(false);
        navigate('/');
    };

    return ( <
        >
        <
        style > { globalStyles } < /style> {!isLoggedIn ? ( <
        Routes >
        <
        Route path = "/"
        element = { < TouristAuth onLogin = { handleLogin }
            />} / >
            <
            Route path = "*"
            element = { < Navigate to = "/" / > }
            /> < /
            Routes >
        ): ( <
            Routes >
            <
            Route path = "/"
            element = { < TouristDashboard user = { user }
                logout = { logout }
                />} / >
                <
                Route path = "*"
                element = { < Navigate to = "/" / > }
                /> < /
                Routes >
            )
        } <
        />
    );
}

export default App;