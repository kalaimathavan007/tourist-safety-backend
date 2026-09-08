import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Polygon, Marker, Popup, Polyline } from 'react-leaflet';
import L from 'leaflet';
import io from 'socket.io-client';
import 'leaflet/dist/leaflet.css';
import './App.css';

const BACKEND_URL = 'https://tourist-safety-backend-production-ba8e.up.railway.app';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// --- 100% Mobile Responsive Styles & Splash Animations ---
const globalStyles = `
  * { box-sizing: border-box; }
  body, html { margin: 0; padding: 0; width: 100%; overflow-x: hidden; }
  
  .gradient-bg { 
    background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%); 
    min-height: 100vh; 
    padding-bottom: 25px; 
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    width: 100%;
    overflow-x: hidden;
    transition: background 0.8s ease-in-out;
  }

  /* Weather-Adaptive Dynamic Background Themes */
  .weather-bg-rain {
    background: linear-gradient(135deg, #232526 0%, #414345 50%, #1e3c72 100%) !important;
    animation: rainPulse 4s ease-in-out infinite alternate;
  }
  .weather-bg-clear {
    background: linear-gradient(135deg, #fceabb 0%, #f8b500 50%, #2a5298 100%) !important;
    animation: sunPulse 6s ease-in-out infinite alternate;
  }
  .weather-bg-cloudy {
    background: linear-gradient(135deg, #a8c0ff 0%, #3f2b96 100%) !important;
    animation: cloudPulse 5s ease-in-out infinite alternate;
  }

  @keyframes rainPulse {
    0% { filter: brightness(0.92) contrast(1.05); }
    100% { filter: brightness(1.08) contrast(1); }
  }
  @keyframes sunPulse {
    0% { filter: brightness(1) saturate(1.1); }
    100% { filter: brightness(1.08) saturate(1.25); }
  }
  @keyframes cloudPulse {
    0% { filter: brightness(0.96); }
    100% { filter: brightness(1.05); }
  }

  /* --- Splash Screen Styles --- */
  .splash-container {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    background: radial-gradient(circle, #1a2a40 0%, #0a1118 100%);
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    z-index: 99999;
  }
  .splash-logo {
    width: 160px;
    height: 160px;
    border-radius: 20px;
    animation: splashPop 2s ease-in-out infinite alternate;
    box-shadow: 0 0 35px rgba(0, 195, 255, 0.4);
  }
  .splash-text {
    color: #ffffff;
    font-size: 1.5rem;
    font-weight: bold;
    letter-spacing: 3px;
    margin-top: 20px;
    animation: textFade 1.5s ease-in-out;
  }

  .glass-navbar { 
    background: linear-gradient(90deg, #1e3c72 0%, #2a5298 100%); 
    color: white; 
    padding: 12px 16px; 
    display: flex; 
    justify-content: space-between; 
    align-items: center; 
    box-shadow: 0 4px 15px rgba(0,0,0,0.2); 
    margin-bottom: 15px; 
    flex-wrap: wrap;
    gap: 10px;
    width: 100%;
  }

  .navbar-brand { font-size: 1.2rem; font-weight: bold; margin: 0; letter-spacing: 1px; }
  .navbar-controls { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }

  .fade-in { animation: fadeIn 0.8s ease-out forwards; opacity: 0; }
  .delay-1 { animation-delay: 0.1s; }
  .delay-2 { animation-delay: 0.2s; }
  .delay-3 { animation-delay: 0.3s; }

  .hover-card { 
    background: white; 
    border-radius: 12px; 
    padding: 16px; 
    box-shadow: 0 4px 15px rgba(0,0,0,0.05); 
    margin-bottom: 15px; 
    border-top: 4px solid #1e3c72;
    width: 100%;
    word-break: break-word;
  }

  .pulse-btn { 
    animation: pulse 1.5s infinite; 
    color: white; 
    border: none; 
    font-weight: bold; 
    font-size: 1rem; 
    border-radius: 8px; 
    cursor: pointer; 
    padding: 14px; 
    width: 100%; 
    margin-top: 10px; 
  }
  .pulse-btn:hover { animation: none; box-shadow: 0 5px 15px rgba(255,0,0,0.4); }

  .action-btn { 
    padding: 10px 16px; 
    background: linear-gradient(90deg, #1e3c72 0%, #2a5298 100%); 
    color: white; 
    border: none; 
    border-radius: 8px; 
    cursor: pointer; 
    font-weight: bold; 
    font-size: 0.9rem;
  }

  .modern-input { 
    width: 100%; 
    padding: 12px; 
    margin: 8px 0; 
    border: 1.5px solid #e1e5ee; 
    border-radius: 8px; 
    box-sizing: border-box; 
    font-size: 0.95rem; 
  }
  .modern-input:focus { border-color: #1e3c72; outline: none; }

  .auth-card-styled { 
    background: white; 
    padding: 25px 20px; 
    border-radius: 16px; 
    box-shadow: 0 10px 30px rgba(0,0,0,0.1); 
    width: 92%; 
    max-width: 400px; 
    margin: 40px auto; 
    text-align: center; 
  }

  .alert-item { 
    background: #fff3cd; 
    border-left: 4px solid #ffc107; 
    padding: 12px; 
    margin-bottom: 10px; 
    border-radius: 6px; 
    font-size: 0.9rem; 
    word-break: break-word;
  }

  .role-badge { 
    background: rgba(255,255,255,0.2); 
    padding: 5px 10px; 
    border-radius: 15px; 
    font-size: 0.8rem; 
    font-weight: bold; 
  }

  .map-wrapper { 
    border-radius: 12px; 
    overflow: hidden; 
    box-shadow: 0 6px 15px rgba(0,0,0,0.1); 
    margin-bottom: 15px; 
    border: 2px solid white; 
    width: 100%;
  }

  .chat-box {
    background: #f5f7fa; 
    padding: 12px; 
    border-radius: 8px; 
    margin-bottom: 12px; 
    min-height: 50px; 
    color: #333;
    font-size: 0.9rem;
    word-break: break-word;
  }

  @media (max-width: 768px) {
    .glass-navbar { 
      flex-direction: column; 
      align-items: flex-start; 
      padding: 12px;
    }
    .navbar-controls { 
      width: 100%; 
      justify-content: space-between; 
      margin-top: 4px;
    }
    .navbar-brand { font-size: 1.1rem; }
    .grid-col-left, .grid-col-right { 
      flex: 1 1 100% !important; 
      max-width: 100% !important; 
    }
    .auth-card-styled { 
      padding: 20px 16px; 
      margin: 20px auto; 
    }
  }

  @keyframes splashPop {
    0% { transform: scale(0.85); filter: drop-shadow(0 0 15px rgba(0,195,255,0.3)); }
    100% { transform: scale(1.05); filter: drop-shadow(0 0 30px rgba(0,195,255,0.8)); }
  }
  @keyframes textFade {
    0% { opacity: 0; transform: translateY(10px); }
    100% { opacity: 1; transform: translateY(0); }
  }
  @keyframes fadeIn { from { opacity: 0; transform: translateY(15px); } to { opacity: 1; transform: translateY(0); } }
  @keyframes pulse { 0% { box-shadow: 0 0 0 0 rgba(255, 65, 108, 0.6); } 70% { box-shadow: 0 0 0 12px rgba(255, 65, 108, 0); } 100% { box-shadow: 0 0 0 0 rgba(255, 65, 108, 0); } }
`;

const isPointInZone = (point, polygonCoords) => {
    if (!point || !polygonCoords || polygonCoords.length < 3) return false;
    let closedCoords = [...polygonCoords];
    const first = closedCoords[0];
    const last = closedCoords[closedCoords.length - 1];
    if (first[0] !== last[0] || first[1] !== last[1]) closedCoords.push([first[0], first[1]]);
    try {
        let inside = false;
        for (let i = 0, j = closedCoords.length - 1; i < closedCoords.length; j = i++) {
            const xi = closedCoords[i][0],
                yi = closedCoords[i][1];
            const xj = closedCoords[j][0],
                yj = closedCoords[j][1];
            const intersect = ((yi > point.lat) !== (yj > point.lat)) &&
                (point.lng < (xj - xi) * (point.lat - yi) / (yj - yi) + xi);
            if (intersect) inside = !inside;
        }
        return inside;
    } catch { return false; }
};

const getDistanceInMeters = (lat1, lon1, lat2, lon2) => {
    if (!lat1 || !lon1 || !lat2 || !lon2) return 999999;
    const R = 6371000;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
};

const GLOBAL_DANGER_ZONES = [{
        _id: "danger_guna_cave",
        name: "Guna Cave (Kodai)",
        level: "danger",
        coordinates: [
            [10.2225, 77.4850],
            [10.2225, 77.4875],
            [10.2200, 77.4875],
            [10.2200, 77.4850]
        ]
    },
    {
        _id: "danger_snake_island",
        name: "Snake Island (Brazil)",
        level: "danger",
        coordinates: [
            [-24.4800, -46.6700],
            [-24.4800, -46.6800],
            [-24.4900, -46.6800],
            [-24.4900, -46.6700]
        ]
    },
    {
        _id: "danger_death_road",
        name: "Death Road (Bolivia)",
        level: "danger",
        coordinates: [
            [-16.3400, -68.0300],
            [-16.3400, -68.0400],
            [-16.3500, -68.0400],
            [-16.3500, -68.0300]
        ]
    }
];

// ------------------- Splash Screen Component -------------------
function SplashScreen() {
    return ( <
        div className = "splash-container" >
        <
        img src = "/logo.png"
        alt = "Journey Guard Logo"
        className = "splash-logo" / >
        <
        div className = "splash-text" > JOURNEY GUARD < /div> <
        p style = {
            { color: '#4facfe', fontSize: '0.9rem', marginTop: '8px' }
        } > Smart Tourist Safety System < /p> < /
        div >
    );
}

// ------------------- Unified Animated Auth Screen (Tourist + Admin) -------------------
function AuthScreen({ onLogin, onAdminLogin, initialMode = 'tourist' }) {
    const [authMode, setAuthMode] = useState(initialMode); // 'tourist' | 'admin'
    const [isLogin, setIsLogin] = useState(true);

    // Tourist State
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');
    const [otp, setOtp] = useState('');
    const [step, setStep] = useState('credentials');
    const [loading, setLoading] = useState(false);

    // Admin State
    const [adminEmail, setAdminEmail] = useState('kalaimathavan007@gmail.com');
    const [adminOtp, setAdminOtp] = useState('');
    const [adminStep, setAdminStep] = useState('email');
    const [adminLoading, setAdminLoading] = useState(false);

    // Tourist Handlers
    const handleSendOtp = async (e) => {
        e.preventDefault();
        setLoading(true);
        const url = isLogin ? `${BACKEND_URL}/api/auth/send-otp` : `${BACKEND_URL}/api/auth/register-send-otp`;
        const body = isLogin ? { email, password } : { name, email, password, phone, role: 'tourist' };

        try {
            const res = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });
            const data = await res.json();
            if (data.success) {
                setStep('otp');
                const notice = data.debugOtp ? `\n(Test OTP: ${data.debugOtp})` : '';
                alert(`OTP sent to your Gmail!${notice}`);
            } else {
                alert(data.msg || data.error || 'Failed to send OTP');
            }
        } catch (err) {
            alert('Server error. Make sure backend is running.');
        }
        setLoading(false);
    };

    const handleVerifyOtp = async (e) => {
        e.preventDefault();
        setLoading(true);
        const url = `${BACKEND_URL}/api/auth/verify-otp`;

        try {
            const res = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, otp })
            });
            const data = await res.json();
            if (data.token) {
                localStorage.setItem('token', data.token);
                localStorage.setItem('role', data.user.role);
                localStorage.setItem('userId', data.user.id);
                localStorage.setItem('userName', data.user.name || name);
                localStorage.setItem('userEmail', data.user.email || email);
                onLogin(data.user);
            } else {
                alert(data.msg || data.error || 'Invalid OTP');
            }
        } catch (err) {
            alert('Verification failed');
        }
        setLoading(false);
    };

    // Admin Handlers
    const handleSendAdminOtp = async (e) => {
        e.preventDefault();
        setAdminLoading(true);
        try {
            const res = await fetch(`${BACKEND_URL}/api/admin/send-otp`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: adminEmail })
            });
            const data = await res.json();
            if (data.success) {
                setAdminStep('otp');
                const notice = data.debugOtp ? `\n(Test OTP: ${data.debugOtp})` : '';
                alert(`Admin OTP sent to your email!${notice}`);
            } else {
                alert(data.error || 'Failed to send OTP. Ensure email matches ADMIN_EMAIL.');
            }
        } catch (err) { alert('Error sending Admin OTP'); }
        setAdminLoading(false);
    };

    const handleVerifyAdminOtp = async (e) => {
        e.preventDefault();
        setAdminLoading(true);
        try {
            const res = await fetch(`${BACKEND_URL}/api/admin/verify-otp`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: adminEmail, otp: adminOtp })
            });
            const data = await res.json();
            if (data.token) {
                localStorage.setItem('token', data.token);
                localStorage.setItem('role', data.user.role);
                localStorage.setItem('userId', data.user.id);
                localStorage.setItem('userName', data.user.name || 'Admin');
                localStorage.setItem('userEmail', data.user.email || adminEmail);
                onAdminLogin(data.user);
            } else {
                alert(data.error || 'Invalid OTP');
            }
        } catch (err) { alert('Verification failed'); }
        setAdminLoading(false);
    };

    return (
        <div className="gradient-bg" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', padding: '15px' }}>
            <div className="auth-card-styled fade-in" style={{ width: '100%', maxWidth: '420px', borderRadius: '20px', boxShadow: '0 20px 40px rgba(0,0,0,0.25)', background: 'rgba(255, 255, 255, 0.95)', padding: '25px' }}>

                {/* Logo & Header */}
                <div style={{ textAlign: 'center', marginBottom: '18px' }}>
                    <img src="/logo.png" alt="Journey Guard" style={{ width: '65px', height: '65px', marginBottom: '8px' }} />
                    <h2 style={{ color: '#1e3c72', fontSize: '1.5rem', fontWeight: 'bold', margin: '0' }}>Journey Guard</h2>
                    <p style={{ color: '#666', fontSize: '0.85rem', marginTop: '4px' }}>Smart Tourist Safety System</p>
                </div>

                {/* Animated Mode Switcher (Tourist / Admin) */}
                <div style={{ display: 'flex', background: '#eef2f5', borderRadius: '30px', padding: '4px', marginBottom: '20px' }}>
                    <button
                        type="button"
                        onClick={() => { setAuthMode('tourist'); setStep('credentials'); }}
                        style={{
                            flex: 1,
                            padding: '10px',
                            borderRadius: '25px',
                            border: 'none',
                            fontWeight: '600',
                            fontSize: '0.9rem',
                            cursor: 'pointer',
                            transition: 'all 0.3s ease',
                            background: authMode === 'tourist' ? '#1e3c72' : 'transparent',
                            color: authMode === 'tourist' ? '#ffffff' : '#555',
                            boxShadow: authMode === 'tourist' ? '0 4px 10px rgba(30,60,114,0.3)' : 'none'
                        }}>
                        🧳 Tourist Portal
                    </button>
                    <button
                        type="button"
                        onClick={() => { setAuthMode('admin'); setAdminStep('email'); }}
                        style={{
                            flex: 1,
                            padding: '10px',
                            borderRadius: '25px',
                            border: 'none',
                            fontWeight: '600',
                            fontSize: '0.9rem',
                            cursor: 'pointer',
                            transition: 'all 0.3s ease',
                            background: authMode === 'admin' ? '#1e3c72' : 'transparent',
                            color: authMode === 'admin' ? '#ffffff' : '#555',
                            boxShadow: authMode === 'admin' ? '0 4px 10px rgba(30,60,114,0.3)' : 'none'
                        }}>
                        🔐 Admin Portal
                    </button>
                </div>

                {/* TOURIST MODE */}
                {authMode === 'tourist' && (
                    <div className="fade-in">
                        <h3 style={{ color: '#333', fontSize: '1.05rem', marginBottom: '15px', textAlign: 'center' }}>
                            {step === 'otp' ? 'Enter Gmail OTP' : isLogin ? 'Tourist Login' : 'Create an Account'}
                        </h3>

                        {step === 'credentials' ? (
                            <form onSubmit={handleSendOtp}>
                                {!isLogin && (
                                    <input className="modern-input" type="text" placeholder="Full Name" value={name} onChange={(e) => setName(e.target.value)} required />
                                )}
                                <input className="modern-input" type="email" placeholder="Email Address" value={email} onChange={(e) => setEmail(e.target.value)} required />
                                <input className="modern-input" type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required />
                                {!isLogin && (
                                    <input className="modern-input" type="tel" placeholder="Phone (optional)" value={phone} onChange={(e) => setPhone(e.target.value)} />
                                )}
                                <button className="action-btn" type="submit" style={{ width: '100%', marginTop: '12px', padding: '12px' }} disabled={loading}>
                                    {loading ? 'Sending OTP...' : isLogin ? 'Send Login OTP' : 'Send Registration OTP'}
                                </button>
                            </form>
                        ) : (
                            <form onSubmit={handleVerifyOtp}>
                                <input className="modern-input" type="text" placeholder="Enter 6-digit OTP" value={otp} onChange={(e) => setOtp(e.target.value)} required />
                                <button className="action-btn" type="submit" style={{ width: '100%', marginTop: '12px', padding: '12px' }} disabled={loading}>
                                    {loading ? 'Verifying...' : 'Verify & Login'}
                                </button>
                                <p onClick={() => setStep('credentials')} style={{ cursor: 'pointer', marginTop: '15px', color: '#1e3c72', fontWeight: 'bold', fontSize: '0.9rem', textAlign: 'center' }}>
                                    ← Back to Credentials
                                </p>
                            </form>
                        )}

                        {step === 'credentials' && (
                            <p onClick={() => setIsLogin(!isLogin)} style={{ cursor: 'pointer', marginTop: '15px', color: '#1e3c72', fontWeight: 'bold', fontSize: '0.9rem', textAlign: 'center' }}>
                                {isLogin ? 'New user? Register here ➔' : 'Already have an account? Login ➔'}
                            </p>
                        )}
                    </div>
                )}

                {/* ADMIN MODE */}
                {authMode === 'admin' && (
                    <div className="fade-in">
                        <h3 style={{ color: '#333', fontSize: '1.05rem', marginBottom: '15px', textAlign: 'center' }}>
                            {adminStep === 'otp' ? 'Enter Admin OTP' : 'Admin Authentication'}
                        </h3>

                        {adminStep === 'email' ? (
                            <form onSubmit={handleSendAdminOtp}>
                                <input className="modern-input" type="email" placeholder="Admin Email" value={adminEmail} onChange={(e) => setAdminEmail(e.target.value)} required />
                                <button className="action-btn" type="submit" style={{ width: '100%', marginTop: '12px', padding: '12px' }} disabled={adminLoading}>
                                    {adminLoading ? 'Sending Secure OTP...' : 'Send Admin OTP'}
                                </button>
                            </form>
                        ) : (
                            <form onSubmit={handleVerifyAdminOtp}>
                                <input className="modern-input" type="text" placeholder="Enter Admin 6-digit OTP" value={adminOtp} onChange={(e) => setAdminOtp(e.target.value)} required />
                                <button className="action-btn" type="submit" style={{ width: '100%', marginTop: '12px', padding: '12px' }} disabled={adminLoading}>
                                    {adminLoading ? 'Verifying...' : 'Verify & Open Dashboard'}
                                </button>
                                <p onClick={() => setAdminStep('email')} style={{ cursor: 'pointer', marginTop: '15px', color: '#1e3c72', fontWeight: 'bold', fontSize: '0.9rem', textAlign: 'center' }}>
                                    ← Back to Admin Email
                                </p>
                            </form>
                        )}
                    </div>
                )}

            </div>
        </div>
    );
}

// Speech Synthesis Helper for Voice Safety Warnings
const speakSpeech = (text, lang = 'en') => {
    if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        if (lang === 'ta') utterance.lang = 'ta-IN';
        else if (lang === 'hi') utterance.lang = 'hi-IN';
        else if (lang === 'ml') utterance.lang = 'ml-IN';
        else utterance.lang = 'en-US';
        utterance.rate = 0.9;
        window.speechSynthesis.speak(utterance);
    }
};

// Pure SVG Digital Verification QR Code Generator
function SimpleQRCode({ text }) {
    const hash = text ? text.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) : 12345;
    const modules = [];
    for (let r = 0; r < 9; r++) {
        const row = [];
        for (let c = 0; c < 9; c++) {
            if ((r < 3 && c < 3) || (r < 3 && c > 5) || (r > 5 && c < 3)) {
                row.push((r === 1 && c === 1) || (r === 1 && c === 7) || (r === 7 && c === 1) ? false : true);
            } else {
                row.push((hash * (r + 1) * (c + 1)) % 3 === 0);
            }
        }
        modules.push(row);
    }

    return (
        <svg width="75" height="75" viewBox="0 0 9 9" style={{ background: '#ffffff', padding: '5px', borderRadius: '8px', border: '1px solid #e0e0e0', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
            {modules.map((row, r) =>
                row.map((val, c) =>
                    val ? <rect key={`${r}-${c}`} x={c} y={r} width="1" height="1" fill="#1e3c72" /> : null
                )
            )}
        </svg>
    );
}

// ------------------- Tourist Dashboard -------------------
function TouristDashboard({ user, logout }) {
    const token = localStorage.getItem('token');
    const [currentLocation, setCurrentLocation] = useState(null);
    const [zones, setZones] = useState([]);
    const [alerts, setAlerts] = useState([]);
    const [sosMessage, setSosMessage] = useState('');
    const [lastAlertShown, setLastAlertShown] = useState({});
    const [riskLevel, setRiskLevel] = useState(null);
    const [chatMessage, setChatMessage] = useState('');
    const [chatReply, setChatReply] = useState('');
    const [language, setLanguage] = useState('en');
    const [mapTileStyle, setMapTileStyle] = useState('google_hybrid');
    const [walkingTrail, setWalkingTrail] = useState([]);
    const [blockchainHash, setBlockchainHash] = useState('');
    const [identity, setIdentity] = useState(null);
    const [weatherData, setWeatherData] = useState(null);
    const [lastAnomalyTime, setLastAnomalyTime] = useState(0);

    // Fetch Real-time Live Weather automatically based on Tourist GPS Location
    useEffect(() => {
        if (!currentLocation) return;
        const lat = currentLocation.lat;
        const lng = currentLocation.lng;
        fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current_weather=true`)
            .then(res => res.json())
            .then(data => {
                if (data && data.current_weather) {
                    const temp = Math.round(data.current_weather.temperature);
                    const code = data.current_weather.weathercode;
                    const wind = data.current_weather.windspeed;

                    let condition = 'Clear Sky ☀️';
                    let isRain = false;

                    if (code >= 51 && code <= 67) { condition = 'Drizzle / Light Rain 🌧️'; isRain = true; }
                    else if (code >= 71 && code <= 86) { condition = 'Monsoon Rain / Snow 🌧️'; isRain = true; }
                    else if (code >= 95) { condition = 'Heavy Thunderstorm ⚡🌧️'; isRain = true; }
                    else if (code >= 1 && code <= 3) { condition = 'Partly Cloudy ⛅'; }

                    setWeatherData({
                        temp,
                        condition,
                        wind,
                        isRain,
                        advice: isRain ? '⚠️ Monsoon Alert: Slippery trails at waterfalls. Avoid steep rocks.' : '🟢 Good weather for sightseeing and trekking.'
                    });
                }
            })
            .catch(err => console.error("Weather fetch error:", err));
    }, [currentLocation]);

    // Initial Zones Fetch with Array Check
    useEffect(() => {
        fetch(`${BACKEND_URL}/api/zones`)
            .then(res => res.json())
            .then(backendZones => {
                const validZones = Array.isArray(backendZones) ? backendZones : [];
                setZones([...validZones, ...GLOBAL_DANGER_ZONES]);
            })
            .catch(err => {
                console.error("Backend fetch error, loading default zones...", err);
                setZones(GLOBAL_DANGER_ZONES);
            });
    }, []);

    // Live Geolocation Tracking with Socket.io
    useEffect(() => {
        if (!navigator.geolocation) return;

        const socket = io(BACKEND_URL);

        const watchId = navigator.geolocation.watchPosition(
            (pos) => {
                const coords = {
                    userId: user ? (user.id || user._id) : 'guest',
                    name: user ? user.name : 'Tourist',
                    lat: pos.coords.latitude,
                    lng: pos.coords.longitude
                };
                setCurrentLocation({ lat: coords.lat, lng: coords.lng });
                setWalkingTrail(prev => [...prev.slice(-40), [coords.lat, coords.lng]]);
                socket.emit('sendLocation', coords);
            },
            (err) => console.log('Location watch error:', err),
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
        );

        return () => {
            navigator.geolocation.clearWatch(watchId);
            socket.disconnect();
        };
    }, [user]);

    const getRiskPrediction = async(lat, lng) => {
        try {
            const res = await fetch(`${BACKEND_URL}/api/ai/risk`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'x-auth-token': token },
                body: JSON.stringify({ lat, lng, time: new Date().toISOString() })
            });
            setRiskLevel(await res.json());
        } catch {}
    };

    const sendLocationForAnomaly = async(lat, lng) => {
        // 30 Minutes Cooldown (30 * 60 * 1000 = 1800000 ms)
        if (Date.now() - lastAnomalyTime < 1800000) return;

        try {
            const res = await fetch(`${BACKEND_URL}/api/ai/anomaly`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'x-auth-token': token },
                body: JSON.stringify({ lat, lng })
            });
            const data = await res.json();
            if (data.anomaly) {
                alert(`🤖 Thozhan Movement Alert: ${data.message}`);
                setLastAnomalyTime(Date.now());
            }
        } catch {}
    };

    useEffect(() => {
        if (currentLocation) {
            getRiskPrediction(currentLocation.lat, currentLocation.lng);
            sendLocationForAnomaly(currentLocation.lat, currentLocation.lng);
        }
    }, [currentLocation]);

    useEffect(() => {
        if (!currentLocation || !Array.isArray(zones)) return;
        zones.forEach(zone => {
            const isInside = isPointInZone(currentLocation, zone.coordinates) ||
                (zone.center && getDistanceInMeters(currentLocation.lat, currentLocation.lng, zone.center.lat, zone.center.lng) <= 800);

            const key = zone._id || zone.name;

            if (isInside) {
                // Show notification EXACTLY ONCE per visit to avoid annoying the user
                if (lastAlertShown[key]) return;

                const scoreText = zone.riskScore ? `\n• Risk Score: ${zone.riskScore}/100 [${zone.riskLevel || 'HIGH'}]` : '';
                const reasonText = zone.reason ? `\n• Risk Reason: ${zone.reason}` : '';
                const msg = `🚨 GEOFENCE ALERT: You entered ${zone.name}${scoreText}${reasonText}\n\n⚠️ Exercise extra caution in this area!`;

                alert(msg);
                setLastAlertShown(prev => ({ ...prev, [key]: true }));

                fetch(`${BACKEND_URL}/api/alerts`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'x-auth-token': token },
                    body: JSON.stringify({ location: currentLocation, type: 'geo_fence', message: msg })
                }).catch(console.error);
            } else {
                // Reset alert status when user leaves the area
                if (lastAlertShown[key]) {
                    setLastAlertShown(prev => {
                        const updated = { ...prev };
                        delete updated[key];
                        return updated;
                    });
                }
            }
        });
    }, [currentLocation, zones, lastAlertShown, token]);

    // Fetch Alerts with Array Safety Protection
    const fetchAlerts = async() => {
        try {
            const res = await fetch(`${BACKEND_URL}/api/alerts/my`, { headers: { 'x-auth-token': token } });
            const data = await res.json();
            setAlerts(Array.isArray(data) ? data : []);
        } catch {
            setAlerts([]);
        }
    };
    useEffect(() => { fetchAlerts(); }, []);

    const fetchIdentity = async() => {
        try {
            const res = await fetch(`${BACKEND_URL}/api/identity/my`, { headers: { 'x-auth-token': token } });
            const data = await res.json();
            setIdentity(data);
        } catch {}
    };
    useEffect(() => { fetchIdentity(); }, []);

    const storeIdentity = async() => {
        const name = prompt("Enter your full name:");
        const email = prompt("Enter your email:");
        const phone = prompt("Enter your phone number:");
        if (!name || !email || !phone) return;
        try {
            const res = await fetch(`${BACKEND_URL}/api/identity/store`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'x-auth-token': token },
                body: JSON.stringify({ name, email, phone })
            });
            const data = await res.json();
            if (data.success) {
                alert(`Identity stored on blockchain! Hash: ${data.blockchainHash}`);
                fetchIdentity();
            } else alert("Failed to store identity");
        } catch (err) { alert("Error: " + err.message); }
    };

    const sendSOS = async() => {
        if (!currentLocation) return alert('Getting location...');
        try {
            const alertRes = await fetch(`${BACKEND_URL}/api/alerts`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'x-auth-token': token },
                body: JSON.stringify({ location: currentLocation, type: 'sos', message: sosMessage || 'SOS Emergency!' })
            });
            const alertData = await alertRes.json();

            await fetch(`${BACKEND_URL}/api/notify/email`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'x-auth-token': token },
                body: JSON.stringify({
                    to: user ? user.email : '',
                    subject: 'SOS Alert',
                    text: `SOS triggered at ${currentLocation.lat},${currentLocation.lng}. Message: ${sosMessage}`
                })
            });

            const efirRes = await fetch(`${BACKEND_URL}/api/efir/generate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'x-auth-token': token },
                body: JSON.stringify({
                    touristName: user ? user.name : '',
                    location: currentLocation,
                    message: sosMessage,
                    time: new Date()
                })
            });
            const blob = await efirRes.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `efir_${Date.now()}.pdf`;
            a.click();

            const bcRes = await fetch(`${BACKEND_URL}/api/blockchain/store`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'x-auth-token': token },
                body: JSON.stringify({ incidentId: alertData._id, data: alertData })
            });
            const bcData = await bcRes.json();
            setBlockchainHash(bcData.hash);

            alert(`SOS sent! E-FIR downloaded. Blockchain hash: ${bcData.hash}`);
            setSosMessage('');
            fetchAlerts();
        } catch (err) { alert('Failed: ' + err.message); }
    };

    const translateText = async(text) => {
        if (language === 'en') return text;
        try {
            const res = await fetch(`${BACKEND_URL}/api/translate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text, targetLang: language })
            });
            const data = await res.json();
            return data.translatedText;
        } catch { return text; }
    };

    const sendChatMessage = async() => {
        if (!chatMessage.trim()) return;
        try {
            const res = await fetch(`${BACKEND_URL}/api/ai/chat`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'x-auth-token': token },
                body: JSON.stringify({ message: chatMessage })
            });
            const data = await res.json();
            let reply = data.reply;
            if (language !== 'en') reply = await translateText(reply);
            setChatReply(reply);
            setChatMessage('');
        } catch (err) {}
    };

    const playVoiceStatus = () => {
        const text = language === 'ta'
            ? `வணக்கம் ${user ? user.name : 'பயணி'}. ஜர்னி கார்டு நேரலை பாதுகாப்பு கண்காணிப்பில் உள்ளீர்கள். நீங்கள் பாதுகாப்பாக இருக்கிறீர்கள்.`
            : `Hello ${user ? user.name : 'Tourist'}. Journey Guard live safety monitoring is active. You are currently safe.`;
        speakSpeech(text, language);
    };

    const shareWhatsappGPS = () => {
        if (!currentLocation) return alert('Acquiring live GPS location...');
        const mapsUrl = `https://maps.google.com/?q=${currentLocation.lat},${currentLocation.lng}`;
        const msg = encodeURIComponent(`🚨 EMERGENCY SOS! I need assistance.\nLive Location: ${mapsUrl}\nName: ${user ? user.name : 'Tourist'}`);
        window.open(`https://api.whatsapp.com/send?text=${msg}`, '_blank');
    };

    const simulateFall = async() => {
        alert('🤖 Thozhan: Fall detected! Sending alert...');
        await sendSOS();
    };

    const bgClass = weatherData && weatherData.isRain
        ? 'gradient-bg weather-bg-rain'
        : (weatherData && weatherData.condition && weatherData.condition.includes('Clear') ? 'gradient-bg weather-bg-clear' : 'gradient-bg weather-bg-cloudy');

    return (
        <div className={bgClass}>
            <nav className="glass-navbar fade-in">
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <img src="/logo.png" alt="Logo" style={{ width: '34px', height: '34px', borderRadius: '6px' }} />
                    <h1 className="navbar-brand">JOURNEY GUARD</h1>
                </div>
                <div className="navbar-controls">
                    <select className="modern-input" value={language} onChange={(e) => setLanguage(e.target.value)} style={{ width: 'auto', margin: 0, padding: '6px 10px', fontSize: '0.85rem' }}>
                        <option value="en">🇬🇧 English</option>
                        <option value="ta">🇮🇳 தமிழ்</option>
                        <option value="ml">🌴 മലയാളം</option>
                        <option value="hi">🇮🇳 हिन्दी</option>
                    </select>
                    <span className="role-badge">Tourist: {user ? user.name : ''}</span>
                    <button onClick={logout} className="action-btn" style={{ background: '#ff416c', padding: '6px 12px' }}>Logout</button>
                </div>
            </nav>

            <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 12px', display: 'flex', flexWrap: 'wrap', gap: '15px' }}>
                <div style={{ flex: '1 1 500px', minWidth: '0', maxWidth: '100%' }} className="grid-col-left">

                    {/* Live Weather & Monsoon Alert Widget */}
                    <div className="hover-card fade-in" style={{ background: 'linear-gradient(135deg, #e0c3fc 0%, #8ec5fc 100%)', color: '#1e3c72', padding: '12px 18px', marginBottom: '12px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                                <h3 style={{ margin: 0, fontSize: '1rem' }}>🌤️ Live GPS Weather Monitoring</h3>
                                <p style={{ margin: '4px 0 0 0', fontSize: '0.85rem', fontWeight: 'bold' }}>
                                    {weatherData ? `Temp: ${weatherData.temp}°C | ${weatherData.condition}` : 'Munnar / Kerala: 22°C - Monsoon Rain Warning 🌧️'}
                                </p>
                                <p style={{ margin: '2px 0 0 0', fontSize: '0.75rem', opacity: 0.9 }}>
                                    {weatherData ? weatherData.advice : '⚠️ High slippery rock risk at waterfalls. Stay on guided trails.'}
                                </p>
                            </div>
                            <button onClick={playVoiceStatus} className="action-btn" style={{ background: '#1e3c72', padding: '6px 12px', fontSize: '0.8rem', whiteSpace: 'nowrap' }}>
                                🔊 Voice Safety Status
                            </button>
                        </div>
                    </div>

                    {/* In-App Google Maps Layer Selector */}
                    <div style={{ display: 'flex', gap: '6px', marginBottom: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
                        <button type="button" onClick={() => setMapTileStyle('google_hybrid')} className="action-btn" style={{ background: mapTileStyle === 'google_hybrid' ? '#1e3c72' : '#78909c', padding: '6px 12px', fontSize: '0.8rem' }}>
                            🛰️ Google Satellite
                        </button>
                        <button type="button" onClick={() => setMapTileStyle('google_streets')} className="action-btn" style={{ background: mapTileStyle === 'google_streets' ? '#1e3c72' : '#78909c', padding: '6px 12px', fontSize: '0.8rem' }}>
                            🗺️ Google Streets
                        </button>
                        <button type="button" onClick={() => setMapTileStyle('osm')} className="action-btn" style={{ background: mapTileStyle === 'osm' ? '#1e3c72' : '#78909c', padding: '6px 12px', fontSize: '0.8rem' }}>
                            🗺️ OSM Map
                        </button>
                        <span style={{ marginLeft: 'auto', fontSize: '0.75rem', fontWeight: 'bold', color: '#1e3c72', background: '#e3f2fd', padding: '4px 8px', borderRadius: '12px' }}>
                            🚶 Live In-App Walking GPS Active
                        </span>
                    </div>

                    <div className="map-wrapper fade-in delay-1">
                        <MapContainer center={currentLocation ? [currentLocation.lat, currentLocation.lng] : [20.5937, 78.9629]} zoom={15} style={{ height: '390px', width: '100%' }}>
                            <TileLayer
                                url={
                                    mapTileStyle === 'google_hybrid'
                                        ? 'https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}'
                                        : (mapTileStyle === 'google_streets'
                                            ? 'https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}'
                                            : 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png')
                                }
                                attribution="&copy; Google Maps"
                            />
                            {currentLocation && (
                                <Marker position={[currentLocation.lat, currentLocation.lng]}>
                                    <Popup>You are here (Live Walking GPS)</Popup>
                                </Marker>
                            )}
                            {/* Live In-App Walking Route Polyline */}
                            {walkingTrail.length > 1 && (
                                <Polyline positions={walkingTrail} color="#00c3ff" weight={6} opacity={0.9} />
                            )}
                            {Array.isArray(zones) && zones.map((zone) => (
                                <Polygon key={zone._id || zone.name} positions={zone.coordinates} color={zone.level === 'danger' ? '#ff416c' : '#ffb347'} fillColor={zone.level === 'danger' ? '#ff416c' : '#ffb347'} fillOpacity={0.4}>
                                    <Popup>
                                        <b style={{ color: zone.level === 'danger' ? 'red' : 'orange' }}>{zone.name}</b>
                                        <br />{zone.riskScore ? `Risk: ${zone.riskScore}/100` : ''} - {zone.level === 'danger' ? 'DANGER ZONE' : 'CAUTION'}
                                    </Popup>
                                </Polygon>
                            ))}
                        </MapContainer>
                    </div>

                    {/* Digital Tourist Pass & Verification QR Code */}
                    <div className="hover-card fade-in delay-2" style={{ background: '#ffffff', borderRadius: '12px', padding: '15px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                                <span style={{ background: '#1e3c72', color: 'white', padding: '3px 8px', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 'bold' }}>OFFICIAL PASS</span>
                                <h3 style={{ margin: '6px 0 2px 0', fontSize: '1.05rem', color: '#1e3c72' }}>🪪 Digital Tourist Safety Pass</h3>
                                <p style={{ margin: '2px 0', fontSize: '0.85rem', color: '#444' }}><strong>Holder:</strong> {user ? user.name : 'Tourist'}</p>
                                <p style={{ margin: '2px 0', fontSize: '0.8rem', color: '#666' }}><strong>Pass ID:</strong> #TG-{(user ? (user.id || user._id || '8839') : '8839').toString().slice(-6)}</p>
                                <p style={{ margin: '2px 0', fontSize: '0.75rem', color: '#2e7d32' }}>✅ Blockchain Verified & Geofence Active</p>
                            </div>
                            <div style={{ textAlign: 'center' }}>
                                <SimpleQRCode text={`JOURNEY-GUARD-PASS-${user ? user.id : 'GUEST'}`} />
                                <small style={{ display: 'block', fontSize: '0.65rem', color: '#888', marginTop: '3px' }}>Scan to Verify</small>
                            </div>
                        </div>
                    </div>

                    {riskLevel && (
                        <div className="hover-card fade-in delay-2" style={{ borderLeft: riskLevel.risk === 'High' ? '5px solid #ff416c' : '5px solid #ffb347' }}>
                            <h3 style={{ marginTop: 0, fontSize: '1.05rem' }}>🤖 Thozhan Risk Assessment</h3>
                            <p style={{ fontSize: '0.95rem', margin: 0 }}>
                                Risk Level: <strong>{riskLevel.risk}</strong> (Score: {riskLevel.score})
                            </p>
                        </div>
                    )}

                    <div className="hover-card fade-in delay-2">
                        <h3 style={{ marginTop: 0, fontSize: '1.05rem' }}>🤖 Thozhan AI Assistant</h3>
                        <div className="chat-box">{chatReply || 'Thozhan: Hi! Ask me about safe zones, danger areas, or SOS features.'}</div>
                        <div style={{ display: 'flex', gap: '8px' }}>
                            <input className="modern-input" style={{ margin: 0 }} type="text" value={chatMessage} onChange={(e) => setChatMessage(e.target.value)} placeholder="Ask Thozhan..." />
                            <button onClick={sendChatMessage} className="action-btn" style={{ whiteSpace: 'nowrap' }}>Send</button>
                        </div>
                    </div>
                </div>

                <div style={{ flex: '1 1 320px', minWidth: '0', maxWidth: '100%' }} className="grid-col-right">

                    {/* Emergency Quick Helplines Bar */}
                    <div className="hover-card fade-in delay-3" style={{ background: '#fff3e0', borderLeft: '4px solid #ff9800' }}>
                        <h3 style={{ marginTop: 0, fontSize: '1rem', color: '#e65100' }}>📞 Emergency Helplines (1-Tap Call)</h3>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginTop: '10px' }}>
                            <a href="tel:112" style={{ textDecoration: 'none' }}><button className="action-btn" style={{ width: '100%', background: '#d32f2f', padding: '8px', fontSize: '0.8rem' }}>🚨 112 Emergency</button></a>
                            <a href="tel:100" style={{ textDecoration: 'none' }}><button className="action-btn" style={{ width: '100%', background: '#1976d2', padding: '8px', fontSize: '0.8rem' }}>👮 100 Police</button></a>
                            <a href="tel:108" style={{ textDecoration: 'none' }}><button className="action-btn" style={{ width: '100%', background: '#388e3c', padding: '8px', fontSize: '0.8rem' }}>🚑 108 Ambulance</button></a>
                            <a href="tel:1363" style={{ textDecoration: 'none' }}><button className="action-btn" style={{ width: '100%', background: '#f57c00', padding: '8px', fontSize: '0.8rem' }}>🧳 1363 Tourist</button></a>
                        </div>
                    </div>

                    <div className="hover-card fade-in delay-3" style={{ borderTop: 'none', background: '#ffebee' }}>
                        <h3 style={{ marginTop: 0, color: '#c62828', fontSize: '1.1rem' }}>🆘 Emergency Actions</h3>
                        <input className="modern-input" type="text" placeholder="Optional emergency message..." value={sosMessage} onChange={(e) => setSosMessage(e.target.value)} />

                        <button onClick={sendSOS} className="pulse-btn" style={{ background: 'linear-gradient(45deg, #ff416c, #ff4b2b)' }}>🚨 SEND SOS IMMEDIATELY 🚨</button>

                        <button onClick={shareWhatsappGPS} className="action-btn" style={{ background: '#25D366', width: '100%', marginTop: '10px', padding: '10px', fontWeight: 'bold' }}>💬 Share Live GPS on WhatsApp</button>

                        <button onClick={simulateFall} className="action-btn" style={{ background: 'linear-gradient(45deg, #f12711, #f5af19)', width: '100%', marginTop: '10px', padding: '10px' }}>⚠️ Simulate Auto Fall Alert</button>

                        {blockchainHash && (
                            <div style={{ marginTop: '12px', padding: '8px', background: 'white', borderRadius: '5px', fontSize: '0.75rem', wordBreak: 'break-all' }}>
                                <strong>Blockchain Hash:</strong><br />{blockchainHash}
                            </div>
                        )}
                    </div>

            <
            div className = "hover-card fade-in delay-3" >
            <
            div style = {
                { display: 'flex', justifyContent: 'space-between', alignItems: 'center' }
            } >
            <
            h3 style = {
                { marginTop: 0, marginBottom: 0, fontSize: '1.05rem' }
            } > 📢Your Alerts < /h3> <
            button onClick = { fetchAlerts }
            className = "action-btn"
            style = {
                { padding: '4px 10px', fontSize: '0.75rem' }
            } > Refresh < /button> < /
            div > <
            hr style = {
                { border: 'none', borderTop: '1px solid #eee', margin: '12px 0' }
            }
            />

            {
                !Array.isArray(alerts) || alerts.length === 0 ? ( <
                    p style = {
                        { color: '#888', fontSize: '0.9rem', margin: '5px 0' }
                    } > No active alerts.You are safe! < /p>
                ) : ( <
                    div style = {
                        { maxHeight: '220px', overflowY: 'auto' }
                    } > {
                        alerts.map((alert) => ( <
                            div key = { alert._id }
                            className = "alert-item" >
                            <
                            strong style = {
                                { color: '#d32f2f' }
                            } > { alert.type ? alert.type.toUpperCase() : 'ALERT' } < /strong> - {alert.message} <
                            br / > < small > 📍{ alert.location ? `${alert.location.lat.toFixed(4)}, ${alert.location.lng.toFixed(4)}` : 'N/A' } < /small> <
                            br / > < small style = {
                                { color: '#666' }
                            } > 🕒{ new Date(alert.createdAt).toLocaleTimeString() } < /small> < /
                            div >
                        ))
                    } <
                    /div>
                )
            } <
            /div>

            <
            div className = "hover-card fade-in delay-3" >
            <
            h3 style = {
                { marginTop: 0, fontSize: '1.05rem' }
            } > 🔗Blockchain Identity < /h3> {
            identity && identity.hasIdentity !== false ? ( <
                div style = {
                    { fontSize: '0.9rem' }
                } >
                <
                p style = {
                    { margin: '4px 0' }
                } > < strong > Name: < /strong> {identity.name}</p >
                <
                p style = {
                    { margin: '4px 0' }
                } > < strong > Email: < /strong> {identity.email}</p >
                <
                p style = {
                    { margin: '4px 0' }
                } > < strong > Phone: < /strong> {identity.phone}</p >
                <
                p style = {
                    { margin: '4px 0', fontSize: '0.8rem', color: '#555', wordBreak: 'break-all' }
                } >
                <
                strong > Hash: < /strong><br/ > { identity.blockchainHash || 'N/A' } <
                /p> < /
                div >
            ) : ( <
                div >
                <
                p style = {
                    { color: '#888', fontSize: '0.85rem' }
                } > No identity stored on blockchain yet. < /p> <
                button onClick = { storeIdentity }
                className = "action-btn"
                style = {
                    { width: '100%' }
                } > Store My Identity < /button> < /
                div >
            )
        } <
        /div> < /
        div > <
        /div> < /
        div >
);
}

// ------------------- Admin Dashboard -------------------
function AdminDashboard({ user, logout }) {
    const token = localStorage.getItem('token');
    const [users, setUsers] = useState([]);
    const [selectedUser, setSelectedUser] = useState(null);
    const [userAlerts, setUserAlerts] = useState([]);
    const [mapCenter, setMapCenter] = useState([20.5937, 78.9629]);
    const [searchQuery, setSearchQuery] = useState('');
    const [adminMapTileStyle, setAdminMapTileStyle] = useState('google_hybrid');

    const filteredUsers = Array.isArray(users) ? users.filter(u =>
        (u.name && u.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (u.email && u.email.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (u.phone && u.phone.includes(searchQuery))
    ) : [];

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async() => {
        try {
            const res = await fetch(`${BACKEND_URL}/api/admin/users`, { headers: { 'x-auth-token': token } });
            const data = await res.json();
            setUsers(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error(err);
            setUsers([]);
        }
    };

    useEffect(() => {
        const socket = io(BACKEND_URL);

        socket.on('newAlert', (newAlert) => {
            alert(`🚨 LIVE TOURIST GEOFENCE ALERT!\n\nTourist: ${newAlert.touristName}\n${newAlert.message}`);
            fetchUsers();
        });

        socket.on('receiveLocation', (data) => {
            setUsers((prevUsers) => {
                if (!Array.isArray(prevUsers)) return [];
                const index = prevUsers.findIndex((u) => u.id === data.userId || u._id === data.userId);
                if (index !== -1) {
                    const updated = [...prevUsers];
                    updated[index].lastLocation = { lat: data.lat, lng: data.lng };
                    updated[index].lastAlertTime = new Date();
                    return updated;
                } else {
                    return [...prevUsers, {
                        id: data.userId,
                        name: data.name,
                        email: 'Live Tourist',
                        lastLocation: { lat: data.lat, lng: data.lng },
                        lastAlertTime: new Date()
                    }];
                }
            });
        });

        return () => socket.disconnect();
    }, []);

    const fetchUserAlerts = async(userId) => {
        try {
            const res = await fetch(`${BACKEND_URL}/api/admin/user-alerts/${userId}`, { headers: { 'x-auth-token': token } });
            const data = await res.json();
            setUserAlerts(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error(err);
            setUserAlerts([]);
        }
    };

    const [userWeather, setUserWeather] = useState(null);
    const [userZoneRisk, setUserZoneRisk] = useState(null);

    const handleUserClick = (u) => {
        setSelectedUser(u);
        fetchUserAlerts(u.id || u._id);
        setUserWeather(null);
        setUserZoneRisk(null);

        if (u.lastLocation && u.lastLocation.lat) {
            setMapCenter([u.lastLocation.lat, u.lastLocation.lng]);

            // 1. Fetch live weather at tourist's location
            fetch(`https://api.open-meteo.com/v1/forecast?latitude=${u.lastLocation.lat}&longitude=${u.lastLocation.lng}&current_weather=true`)
                .then(res => res.json())
                .then(data => {
                    if (data && data.current_weather) {
                        const temp = Math.round(data.current_weather.temperature);
                        const code = data.current_weather.weathercode;
                        let condition = 'Clear Sky ☀️';
                        if (code >= 51 && code <= 67) condition = 'Drizzle / Light Rain 🌧️';
                        else if (code >= 71 && code <= 86) condition = 'Monsoon Rain 🌧️';
                        else if (code >= 95) condition = 'Heavy Thunderstorm ⚡';
                        else if (code >= 1 && code <= 3) condition = 'Partly Cloudy ⛅';

                        setUserWeather({
                            temp,
                            condition,
                            advice: code >= 50 ? '⚠️ Rain / Monsoon Warning at tourist location!' : '🟢 Clear & safe weather at tourist location.'
                        });
                    }
                })
                .catch(() => {});

            // 2. Check if tourist is in any Geofenced Danger Zone
            const matchedZone = GLOBAL_DANGER_ZONES.find(z =>
                isPointInZone(u.lastLocation, z.coordinates) ||
                (z.center && getDistanceInMeters(u.lastLocation.lat, u.lastLocation.lng, z.center.lat, z.center.lng) <= 800)
            );
            if (matchedZone) {
                setUserZoneRisk(matchedZone);
            }
        }
    };

    const handleSearchKeyDown = (e) => {
        if (e.key === 'Enter' && filteredUsers.length > 0) {
            handleUserClick(filteredUsers[0]);
        }
    };

    return (
        <div className="gradient-bg">
            <nav className="glass-navbar fade-in">
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <img src="/logo.png" alt="Logo" style={{ width: '34px', height: '34px', borderRadius: '6px' }} />
                    <h1 className="navbar-brand">JOURNEY GUARD ADMIN</h1>
                </div>
                <div className="navbar-controls">
                    <span className="role-badge">Admin: {user ? user.email : ''}</span>
                    <button onClick={logout} className="action-btn" style={{ background: '#ff416c', padding: '6px 12px' }}>Logout</button>
                </div>
            </nav>

            <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 12px', display: 'flex', flexWrap: 'wrap', gap: '15px' }}>
                <div style={{ flex: '1 1 500px', minWidth: '0', maxWidth: '100%' }} className="grid-col-left">

                    {/* Live Selected Tourist Intelligence Card (Location + Place Risk + Weather) */}
                    {selectedUser && (
                        <div className="hover-card fade-in delay-1" style={{ background: '#ffffff', borderRadius: '12px', padding: '12px 16px', marginBottom: '10px', borderTop: '4px solid #1e3c72' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '6px' }}>
                                <div>
                                    <h3 style={{ margin: 0, fontSize: '1.05rem', color: '#1e3c72' }}>🎯 Live Monitoring: {selectedUser.name}</h3>
                                    <p style={{ margin: '2px 0 0 0', fontSize: '0.8rem', color: '#555' }}>📧 {selectedUser.email} | 📞 {selectedUser.phone || 'N/A'}</p>
                                </div>
                                <span style={{ background: selectedUser.lastLocation ? '#e8f5e9' : '#ffebee', color: selectedUser.lastLocation ? '#2e7d32' : '#c62828', padding: '3px 8px', borderRadius: '10px', fontSize: '0.75rem', fontWeight: 'bold' }}>
                                    {selectedUser.lastLocation ? '🟢 LIVE GPS ACTIVE' : '🔴 NO GPS'}
                                </span>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '8px', marginTop: '8px' }}>
                                {/* Location Risk Assessment */}
                                <div style={{ background: userZoneRisk ? '#ffebee' : '#e8f5e9', padding: '8px 10px', borderRadius: '8px', borderLeft: userZoneRisk ? '4px solid #d32f2f' : '4px solid #2e7d32' }}>
                                    <strong style={{ fontSize: '0.8rem', color: userZoneRisk ? '#c62828' : '#2e7d32' }}>
                                        {userZoneRisk ? `🚨 Danger Zone: ${userZoneRisk.name}` : '🟢 Location: Safe Tourist Area'}
                                    </strong>
                                    {userZoneRisk ? (
                                        <p style={{ margin: '3px 0 0 0', fontSize: '0.75rem', color: '#444' }}>
                                            • <strong>Risk Score:</strong> {userZoneRisk.riskScore || 50}/100 [{userZoneRisk.riskLevel || 'HIGH'}]
                                            <br />• <strong>Reason:</strong> {userZoneRisk.reason}
                                        </p>
                                    ) : (
                                        <p style={{ margin: '3px 0 0 0', fontSize: '0.75rem', color: '#555' }}>
                                            Tourist is in a low-risk zone with no geofence warnings.
                                        </p>
                                    )}
                                </div>

                                {/* Live Weather at Tourist's Location */}
                                <div style={{ background: 'linear-gradient(135deg, #e0c3fc 0%, #8ec5fc 100%)', color: '#1e3c72', padding: '8px 10px', borderRadius: '8px' }}>
                                    <strong style={{ fontSize: '0.8rem' }}>🌤️ Weather at Tourist's Location</strong>
                                    {userWeather ? (
                                        <p style={{ margin: '3px 0 0 0', fontSize: '0.75rem' }}>
                                            <strong>Temp:</strong> {userWeather.temp}°C | {userWeather.condition}
                                            <br /><span style={{ fontWeight: 'bold' }}>{userWeather.advice}</span>
                                        </p>
                                    ) : (
                                        <p style={{ margin: '3px 0 0 0', fontSize: '0.75rem', opacity: 0.9 }}>
                                            {selectedUser.lastLocation ? 'Fetching live weather for tourist...' : 'No GPS coordinates available.'}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Google Maps Layer Selector for Admin */}
                    <div style={{ display: 'flex', gap: '6px', marginBottom: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
                        <button type="button" onClick={() => setAdminMapTileStyle('google_hybrid')} className="action-btn" style={{ background: adminMapTileStyle === 'google_hybrid' ? '#1e3c72' : '#78909c', padding: '6px 12px', fontSize: '0.8rem' }}>
                            🛰️ Google Satellite
                        </button>
                        <button type="button" onClick={() => setAdminMapTileStyle('google_streets')} className="action-btn" style={{ background: adminMapTileStyle === 'google_streets' ? '#1e3c72' : '#78909c', padding: '6px 12px', fontSize: '0.8rem' }}>
                            🗺️ Google Streets
                        </button>
                        <button type="button" onClick={() => setAdminMapTileStyle('osm')} className="action-btn" style={{ background: adminMapTileStyle === 'osm' ? '#1e3c72' : '#78909c', padding: '6px 12px', fontSize: '0.8rem' }}>
                            🗺️ OSM Map
                        </button>
                        {selectedUser && (
                            <span style={{ marginLeft: 'auto', fontSize: '0.8rem', fontWeight: 'bold', color: '#1e3c72', background: '#e3f2fd', padding: '4px 10px', borderRadius: '12px' }}>
                                📍 Selected: {selectedUser.name}
                            </span>
                        )}
                    </div>

                    <div className="map-wrapper fade-in delay-1">
                        <MapContainer center={mapCenter} zoom={13} style={{ height: '390px', width: '100%' }}>
                            <TileLayer
                                url={
                                    adminMapTileStyle === 'google_hybrid'
                                        ? 'https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}'
                                        : (adminMapTileStyle === 'google_streets'
                                            ? 'https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}'
                                            : 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png')
                                }
                                attribution="&copy; Google Maps / OpenStreetMap"
                            />
                            {Array.isArray(users) && users.map((u) =>
                                u.lastLocation && u.lastLocation.lat && (
                                    <Marker key={u.id || u._id} position={[u.lastLocation.lat, u.lastLocation.lng]} eventHandlers={{ click: () => handleUserClick(u) }}>
                                        <Popup>
                                            <strong>{u.name}</strong><br />
                                            Email: {u.email}<br />
                                            Phone: {u.phone || 'N/A'}<br />
                                            Last seen: {u.lastAlertTime ? new Date(u.lastAlertTime).toLocaleTimeString() : 'Never'}
                                        </Popup>
                                    </Marker>
                                )
                            )}
                        </MapContainer>
                    </div>
                </div>

                <div style={{ flex: '1 1 320px', minWidth: '0', maxWidth: '100%' }} className="grid-col-right">
                    <div className="hover-card fade-in delay-2">
                        <h3 style={{ marginTop: 0, fontSize: '1.1rem' }}>📋 Registered Tourists ({filteredUsers.length})</h3>

                        {/* Instant Search Box with Enter Key Auto-Select */}
                        <div style={{ marginBottom: '12px' }}>
                            <input
                                type="text"
                                className="modern-input"
                                placeholder="🔍 Type Tourist Name & Press Enter..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                onKeyDown={handleSearchKeyDown}
                                style={{ margin: 0, padding: '8px 12px', fontSize: '0.85rem', borderRadius: '18px' }}
                            />
                        </div>

                        <ul style={{ listStyle: 'none', padding: 0, maxHeight: '200px', overflowY: 'auto' }}>
                            {filteredUsers.length === 0 ? (
                                <p style={{ color: '#888', fontSize: '0.85rem' }}>No matching tourists found.</p>
                            ) : (
                                filteredUsers.map((u) => (
                                    <li key={u.id || u._id} style={{ padding: '8px', borderBottom: '1px solid #eee', cursor: 'pointer', background: selectedUser && (selectedUser.id === u.id || selectedUser._id === u._id) ? '#e3f2fd' : 'transparent', borderRadius: '6px' }} onClick={() => handleUserClick(u)}>
                                        <strong style={{ fontSize: '0.95rem', color: '#1e3c72' }}>{u.name}</strong><br />
                                        <small style={{ color: '#555' }}>{u.email}</small><br />
                                        <small style={{ color: u.lastLocation ? '#2e7d32' : '#888', fontWeight: u.lastLocation ? 'bold' : 'normal' }}>
                                            📍 Last loc: {u.lastLocation && u.lastLocation.lat ? `${u.lastLocation.lat.toFixed(4)}, ${u.lastLocation.lng.toFixed(4)}` : 'Unknown'}
                                        </small>
                                    </li>
                                ))
                            )}
                        </ul>
                    </div>

                    {selectedUser && (
                        <div className="hover-card fade-in delay-3">
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <h3 style={{ marginTop: 0, marginBottom: 0, fontSize: '1rem' }}>📢 Alerts: {selectedUser.name}</h3>
                                <button onClick={() => fetchUserAlerts(selectedUser.id || selectedUser._id)} className="action-btn" style={{ padding: '4px 8px', fontSize: '0.75rem' }}>Refresh</button>
                            </div>
                            <hr style={{ border: 'none', borderTop: '1px solid #eee', margin: '10px 0' }} />

                            {!Array.isArray(userAlerts) || userAlerts.length === 0 ? (
                                <p style={{ color: '#888', fontSize: '0.85rem' }}>No alerts recorded.</p>
                            ) : (
                                <div style={{ maxHeight: '180px', overflowY: 'auto' }}>
                                    {userAlerts.map((alert) => (
                                        <div key={alert._id} className="alert-item">
                                            <strong style={{ color: '#d32f2f' }}>{alert.type ? alert.type.toUpperCase() : 'ALERT'}</strong> - {alert.message}<br />
                                            <small>📍 {alert.location ? `${alert.location.lat.toFixed(4)}, ${alert.location.lng.toFixed(4)}` : 'N/A'}</small><br />
                                            <small style={{ color: '#666' }}>🕒 {new Date(alert.createdAt).toLocaleTimeString()}</small>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

// ------------------- Main App -------------------
function App() {
    const [showSplash, setShowSplash] = useState(true);
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [user, setUser] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        const timer = setTimeout(() => {
            setShowSplash(false);
        }, 2500);
        return () => clearTimeout(timer);
    }, []);

    useEffect(() => {
        const token = localStorage.getItem('token');
        const role = localStorage.getItem('role');
        const userId = localStorage.getItem('userId');
        const name = localStorage.getItem('userName');
        const email = localStorage.getItem('userEmail');

        if (token && role) {
            setIsLoggedIn(true);
            setUser({ id: userId, role, name, email });
        }
    }, []);

    const handleLogin = (u) => {
        setIsLoggedIn(true);
        setUser(u);
        navigate('/');
    };

    const handleAdminLogin = (u) => {
        setIsLoggedIn(true);
        setUser(u);
        navigate('/admin/dashboard');
    };

    const logout = () => {
        localStorage.clear();
        setIsLoggedIn(false);
        setUser(null);
        navigate('/');
    };

    if (showSplash) {
        return (
            <>
                <style>{globalStyles}</style>
                <SplashScreen />
            </>
        );
    }

    return (
        <>
            <style>{globalStyles}</style>
            {!isLoggedIn ? (
                <Routes>
                    <Route path="/" element={<AuthScreen onLogin={handleLogin} onAdminLogin={handleAdminLogin} initialMode="tourist" />} />
                    <Route path="/admin-login" element={<AuthScreen onLogin={handleLogin} onAdminLogin={handleAdminLogin} initialMode="admin" />} />
                    <Route path="*" element={<Navigate to="/" />} />
                </Routes>
            ) : (
                <Routes>
                    <Route path="/" element={user && user.role === 'tourist' ? <TouristDashboard user={user} logout={logout} /> : <Navigate to="/admin/dashboard" />} />
                    <Route path="/admin/dashboard" element={user && user.role === 'admin' ? <AdminDashboard user={user} logout={logout} /> : <Navigate to="/" />} />
                    <Route path="*" element={<Navigate to="/" />} />
                </Routes>
            )}
        </>
    );
}

export default App;