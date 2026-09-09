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

  /* Animated Glassmorphism Bottom Navigation Bar */
  .bottom-nav-bar {
    position: fixed;
    bottom: 0;
    left: 0;
    width: 100vw;
    background: rgba(30, 60, 114, 0.94);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    display: flex;
    justify-content: space-around;
    align-items: center;
    padding: 8px 12px;
    box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.25);
    z-index: 99999;
    border-top: 1px solid rgba(255, 255, 255, 0.2);
  }

  .bottom-nav-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    background: transparent;
    border: none;
    color: rgba(255, 255, 255, 0.65);
    font-size: 0.75rem;
    font-weight: bold;
    padding: 6px 18px;
    border-radius: 20px;
    cursor: pointer;
    transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  }

  .bottom-nav-item.active {
    color: #ffffff;
    background: rgba(255, 255, 255, 0.22);
    transform: translateY(-3px) scale(1.05);
    box-shadow: 0 4px 15px rgba(0, 195, 255, 0.3);
  }

  .bottom-nav-item-icon {
    font-size: 1.3rem;
    margin-bottom: 2px;
    transition: transform 0.3s ease;
  }

  .bottom-nav-item.active .bottom-nav-item-icon {
    transform: scale(1.15);
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

// Speech Synthesis Helper for Voice Safety Warnings (Android Mobile & Web)
const speakSpeech = (text, lang = 'en') => {
    if (!('speechSynthesis' in window)) return;
    try {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);

        const voices = window.speechSynthesis.getVoices();
        const targetLang = lang === 'ta' ? 'ta' : lang === 'hi' ? 'hi' : lang === 'ml' ? 'ml' : 'en';

        const matchedVoice = voices.find(v => v.lang.toLowerCase().includes(targetLang)) ||
                             voices.find(v => v.lang.toLowerCase().includes('en')) ||
                             voices[0];

        if (matchedVoice) utterance.voice = matchedVoice;
        utterance.rate = 0.9;
        utterance.volume = 1.0;

        window.speechSynthesis.speak(utterance);
    } catch (e) {
        console.error('Speech synthesis error:', e);
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
    const [selectedDestination, setSelectedDestination] = useState(null);
    const [isNavigating, setIsNavigating] = useState(false);
    const [navRoutePoints, setNavRoutePoints] = useState([]);
    const [navDistanceKm, setNavDistanceKm] = useState('0');
    const [navDurationMins, setNavDurationMins] = useState(0);
    const [destSearchQuery, setDestSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [isSearchingDest, setIsSearchingDest] = useState(false);
    const [touristTab, setTouristTab] = useState('map');
    const [aiSuggestedPlace, setAiSuggestedPlace] = useState(null);
    const [blockchainHash, setBlockchainHash] = useState('');
    const [identity, setIdentity] = useState(null);
    const [weatherData, setWeatherData] = useState(null);
    const [lastAnomalyTime, setLastAnomalyTime] = useState(0);
    const [showSosModal, setShowSosModal] = useState(false);
    const [sosTimer, setSosTimer] = useState(30);

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

    const triggerSosModal = () => {
        if (!currentLocation) return alert('Acquiring live GPS location...');
        setShowSosModal(true);
        setSosTimer(30);
    };

    useEffect(() => {
        let timerId = null;
        if (showSosModal) {
            if (sosTimer > 0) {
                timerId = setInterval(() => {
                    setSosTimer(prev => prev - 1);
                }, 1000);
            } else {
                executeActualSOS();
                setShowSosModal(false);
            }
        }
        return () => clearInterval(timerId);
    }, [showSosModal, sosTimer]);

    const executeActualSOS = async() => {
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

            alert(`🚨 EMERGENCY SOS EXECUTED SUCCESSFULLY!\n\n• GPS Location Sent\n• E-FIR Downloaded\n• Blockchain Hash: ${bcData.hash}`);
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
        const msg = chatMessage.trim();
        if (!msg) return;

        const lowerMsg = msg.toLowerCase();
        let replyText = "";
        let detectedPlace = null;

        if (lowerMsg.includes('hospital') || lowerMsg.includes('doctor') || lowerMsg.includes('medical') || lowerMsg.includes('மருத்துவமனை')) {
            detectedPlace = { name: "Munnar General Hospital", lat: 10.0890, lng: 77.0597 };
            replyText = language === 'ta'
                ? `🤖 தோழன் AI: உங்களுக்கு அருகில் உள்ள மருத்துவமனை: "மூணார் அரசு மருத்துவமனை" (தூரம்: 1.2 கி.மீ). அவசர உதவிக்கு 108 ஐயும் அழைக்கலாம்.`
                : `🤖 Thozhan AI: Nearest medical facility is "Munnar General Hospital" (1.2 km away). For emergency ambulance call 108.`;
        } else if (lowerMsg.includes('police') || lowerMsg.includes('station') || lowerMsg.includes('காவல் நிலைய') || lowerMsg.includes('போலீஸ்')) {
            detectedPlace = { name: "Munnar Police Station", lat: 10.0881, lng: 77.0601 };
            replyText = language === 'ta'
                ? `🤖 தோழன் AI: உங்களுக்கு அருகில் உள்ள காவல் நிலையம்: "மூணார் காவல் நிலையம்" (தூரம்: 0.9 கி.மீ). அவசர உதவிக்கு 100 ஐ அழைக்கலாம்.`
                : `🤖 Thozhan AI: Nearest police station is "Munnar Police Station" (0.9 km away). For immediate police help call 100.`;
        } else if (lowerMsg.includes('bus') || lowerMsg.includes('stand') || lowerMsg.includes('பேருந்து நிலையம்')) {
            detectedPlace = { name: "Munnar KSRTC Bus Stand", lat: 10.0872, lng: 77.0620 };
            replyText = language === 'ta'
                ? `🤖 தோழன் AI: உங்களுக்கு அருகில் உள்ள பேருந்து நிலையம்: "மூணார் கே.எஸ்.ஆர்.டி.சி பேருந்து நிலையம்" (தூரம்: 1.5 கி.மீ).`
                : `🤖 Thozhan AI: Nearest bus station is "Munnar KSRTC Bus Stand" (1.5 km away).`;
        } else if (lowerMsg.includes('waterfall') || lowerMsg.includes('iraichilpara') || lowerMsg.includes('நீர்வீழ்ச்சி')) {
            detectedPlace = { name: "Iraichilpara Waterfalls", lat: 10.0520, lng: 77.0680 };
            replyText = language === 'ta'
                ? `🤖 தோழன் AI: "இறைச்சில்பாறை நீர்வீழ்ச்சி" ஆபத்து அளவு: 75/100 (மிக அதிகம்). வழுக்கும் பாறைகள் உள்ளன. கவனமாகச் செல்லவும்.`
                : `🤖 Thozhan AI: "Iraichilpara Waterfalls" Risk Score: 75/100 (VERY HIGH). Beware of slippery rocks.`;
        } else if (lowerMsg.includes('shop') || lowerMsg.includes('hotel') || lowerMsg.includes('restaurant') || lowerMsg.includes('கடை') || lowerMsg.includes('சாப்பாடு')) {
            detectedPlace = { name: "Munnar Central Market & Hotels", lat: 10.0895, lng: 77.0610 };
            replyText = language === 'ta'
                ? `🤖 தோழன் AI: அருகில் உள்ள கடைகள் மற்றும் உணவகங்கள்: "மூணார் சென்ட்ரல் மார்க்கெட் பகுதி" (தூரம்: 0.8 கி.மீ).`
                : `🤖 Thozhan AI: Nearest shops and restaurants are at "Munnar Central Market Area" (0.8 km away).`;
        } else {
            try {
                const res = await fetch(`${BACKEND_URL}/api/ai/chat`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'x-auth-token': token },
                    body: JSON.stringify({ message: msg })
                });
                const data = await res.json();
                replyText = data.reply;
                if (language !== 'en') replyText = await translateText(replyText);
            } catch (err) {
                replyText = language === 'ta'
                    ? `🤖 தோழன் AI: நான் உங்களுக்கு பாதுகாப்பான வழித்தடங்கள், மருத்துவமனை, காவல் நிலையம் மற்றும் ஆபத்தான பகுதிகளைக் காட்ட முடியும்.`
                    : `🤖 Thozhan AI: I can help you locate nearby hospitals, police stations, safe zones, and danger areas.`;
            }
        }

        setChatReply(replyText);
        setAiSuggestedPlace(detectedPlace);
        setChatMessage('');
        speakSpeech(replyText, language);
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

    const handleStartNavigation = async (zone) => {
        if (!zone) return alert('Please select a destination place!');
        if (!currentLocation) return alert('Acquiring live GPS location...');

        setSelectedDestination(zone);
        setIsNavigating(true);

        const currentLat = currentLocation.lat;
        const currentLng = currentLocation.lng;
        const destLat = zone.center ? zone.center.lat : zone.coordinates[0][0];
        const destLng = zone.center ? zone.center.lng : zone.coordinates[0][1];

        // 1. Fetch Real Road-Matched Walking Route (Roadmap Geometry) from OSRM
        try {
            const osrmUrl = `https://router.project-osrm.org/route/v1/foot/${currentLng},${currentLat};${destLng},${destLat}?overview=full&geometries=geojson`;
            const res = await fetch(osrmUrl);
            const data = await res.json();

            if (data && data.routes && data.routes.length > 0) {
                const route = data.routes[0];
                const rawCoords = route.geometry.coordinates; // Array of [lng, lat]
                const latLngPoints = rawCoords.map(pt => [pt[1], pt[0]]); // Convert to [lat, lng]

                setNavRoutePoints(latLngPoints);
                const distKm = (route.distance / 1000).toFixed(1);
                const durationMins = Math.round(route.duration / 60);
                setNavDistanceKm(distKm);
                setNavDurationMins(durationMins);

                const voiceMsg = language === 'ta'
                    ? `${zone.name} இடத்திற்கான சாலை வழித்தடம் கணக்கிடப்பட்டது. தூரம் ${distKm} கிலோமீட்டர். கவனமாக செல்லவும்.`
                    : `Road route calculated to ${zone.name}. Distance ${distKm} kilometers. Est time ${durationMins} minutes.`;
                speakSpeech(voiceMsg, language);
            } else {
                setNavRoutePoints([[currentLat, currentLng], [destLat, destLng]]);
            }
        } catch (e) {
            console.error('OSRM route error:', e);
            setNavRoutePoints([[currentLat, currentLng], [destLat, destLng]]);
        }
    };

    const handleStopNavigation = () => {
        setIsNavigating(false);
        setSelectedDestination(null);
        setNavRoutePoints([]);
    };

    const searchAnyDestination = async (query) => {
        const q = (query || destSearchQuery).trim();
        if (!q) return alert('Please enter a destination place name to search!');
        setIsSearchingDest(true);
        try {
            const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}`, {
                headers: { 'User-Agent': 'TouristSafetyApp/1.0' }
            });
            const data = await res.json();
            if (Array.isArray(data) && data.length > 0) {
                const item = data[0];
                const searchedPlace = {
                    _id: `search_${item.place_id}`,
                    name: item.display_name.split(',')[0],
                    fullName: item.display_name,
                    center: { lat: parseFloat(item.lat), lng: parseFloat(item.lon) },
                    coordinates: [[parseFloat(item.lat), parseFloat(item.lon)]]
                };
                setSearchResults(prev => [searchedPlace, ...prev]);
                handleStartNavigation(searchedPlace);
            } else {
                alert('No matching places found. Try typing another place name.');
            }
        } catch (err) {
            console.error('Universal place search error:', err);
            alert('Failed to search place. Check internet connection.');
        }
        setIsSearchingDest(false);
    };

    const simulateFall = async() => {
        alert('🤖 Thozhan: Fall detected! Sending emergency alert...');
        await executeActualSOS();
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

            {/* Tourist Tab Navigation Switcher */}
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', marginBottom: '15px', padding: '0 12px' }}>
                <button
                    type="button"
                    onClick={() => setTouristTab('map')}
                    className="action-btn"
                    style={{
                        background: touristTab === 'map' ? '#1e3c72' : '#ffffff',
                        color: touristTab === 'map' ? '#ffffff' : '#1e3c72',
                        padding: '10px 22px',
                        borderRadius: '25px',
                        fontSize: '0.9rem',
                        fontWeight: 'bold',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                        border: '1.5px solid #1e3c72'
                    }}
                >
                    🗺️ Safety Map & Nav
                </button>
                <button
                    type="button"
                    onClick={() => setTouristTab('account')}
                    className="action-btn"
                    style={{
                        background: touristTab === 'account' ? '#1e3c72' : '#ffffff',
                        color: touristTab === 'account' ? '#ffffff' : '#1e3c72',
                        padding: '10px 22px',
                        borderRadius: '25px',
                        fontSize: '0.9rem',
                        fontWeight: 'bold',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                        border: '1.5px solid #1e3c72'
                    }}
                >
                    👤 My Account & Pass
                </button>
            </div>

            {/* Tab 1: Instagram-Style My Account & Settings Page */}
            {touristTab === 'account' ? (
                <div style={{ maxWidth: '600px', margin: '0 auto', width: '100%', padding: '0 12px' }} className="fade-in">

                    {/* Instagram Header Banner & Avatar Card */}
                    <div className="hover-card" style={{ background: '#ffffff', borderRadius: '20px', padding: '24px 20px', textAlign: 'center', boxShadow: '0 8px 25px rgba(0,0,0,0.08)' }}>
                        <div style={{ width: '85px', height: '85px', borderRadius: '50%', background: 'linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2.2rem', fontWeight: 'bold', margin: '0 auto 12px auto', border: '4px solid #ffffff', boxShadow: '0 4px 15px rgba(30,60,114,0.3)' }}>
                            {user && user.name ? user.name.charAt(0).toUpperCase() : 'T'}
                        </div>

                        <h2 style={{ margin: '4px 0 2px 0', fontSize: '1.4rem', color: '#1e3c72' }}>
                            {user ? user.name : 'Tourist'} <span style={{ color: '#25D366', fontSize: '1.1rem' }}>☑️</span>
                        </h2>
                        <p style={{ margin: '0 0 12px 0', fontSize: '0.9rem', color: '#666', fontWeight: '500' }}>
                            📍 {user ? (user.place || 'Kerala Tourist') : 'Tamil Nadu, India'}
                        </p>

                        {/* Instagram Style Stats Bar */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', background: '#f5f7fa', padding: '12px 8px', borderRadius: '12px', margin: '15px 0' }}>
                            <div>
                                <strong style={{ display: 'block', fontSize: '1.1rem', color: '#1e3c72' }}>100%</strong>
                                <small style={{ color: '#777', fontSize: '0.75rem' }}>Safety Score</small>
                            </div>
                            <div style={{ borderLeft: '1px solid #ddd', borderRight: '1px solid #ddd' }}>
                                <strong style={{ display: 'block', fontSize: '1.1rem', color: '#2e7d32' }}>VERIFIED</strong>
                                <small style={{ color: '#777', fontSize: '0.75rem' }}>Passport / ID</small>
                            </div>
                            <div>
                                <strong style={{ display: 'block', fontSize: '1.1rem', color: '#1976d2' }}>ACTIVE</strong>
                                <small style={{ color: '#777', fontSize: '0.75rem' }}>GPS Tracking</small>
                            </div>
                        </div>

                        <div style={{ display: 'flex', gap: '10px', marginTop: '15px' }}>
                            <button onClick={() => setTouristTab('map')} className="action-btn" style={{ flex: 1, background: '#1e3c72', padding: '10px', fontSize: '0.85rem' }}>
                                🗺️ Open Live Safety Map
                            </button>
                            <button onClick={logout} className="action-btn" style={{ background: '#ff416c', padding: '10px 16px', fontSize: '0.85rem' }}>
                                🚪 Logout
                            </button>
                        </div>
                    </div>

                    {/* Digital Verification ID Pass Card */}
                    <div className="hover-card delay-1" style={{ background: 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)', borderRadius: '16px', padding: '18px', borderLeft: '6px solid #1e3c72' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                                <span style={{ background: '#1e3c72', color: 'white', padding: '3px 8px', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 'bold' }}>GOVT VERIFIED PASS</span>
                                <h3 style={{ margin: '8px 0 2px 0', fontSize: '1.1rem', color: '#1e3c72' }}>🪪 Digital Verification ID</h3>
                                <p style={{ margin: '3px 0', fontSize: '0.85rem', color: '#444' }}><strong>Verification ID:</strong> #TG-{(user ? (user.id || user._id || '8839') : '8839').toString().slice(-6)}</p>
                                <p style={{ margin: '3px 0', fontSize: '0.8rem', color: '#2e7d32', fontWeight: 'bold' }}>✅ Active Geofence & Emergency Protection</p>
                            </div>
                            <div style={{ textAlign: 'center', background: '#ffffff', padding: '8px', borderRadius: '10px', border: '1px solid #eee' }}>
                                <SimpleQRCode text={`JOURNEY-GUARD-PASS-${user ? user.id : 'GUEST'}`} />
                                <small style={{ display: 'block', fontSize: '0.65rem', color: '#888', marginTop: '3px' }}>Scan ID</small>
                            </div>
                        </div>
                    </div>

                    {/* Personal Details Card */}
                    <div className="hover-card delay-2" style={{ background: '#ffffff', borderRadius: '16px', padding: '18px' }}>
                        <h3 style={{ margin: '0 0 12px 0', fontSize: '1.05rem', color: '#1e3c72' }}>👤 Tourist Personal Details</h3>
                        <div style={{ background: '#f8f9fa', padding: '12px', borderRadius: '10px', fontSize: '0.9rem' }}>
                            <p style={{ margin: '6px 0' }}><strong>Full Name:</strong> {user ? user.name : 'Tourist'}</p>
                            <p style={{ margin: '6px 0' }}><strong>Email Address:</strong> {user ? user.email : 'N/A'}</p>
                            <p style={{ margin: '6px 0' }}><strong>Phone Number:</strong> {user ? user.phone || 'N/A' : 'N/A'}</p>
                            <p style={{ margin: '6px 0' }}><strong>Hometown / Place (ஊர்):</strong> {user ? (user.place || 'Kerala Tourist Spot') : 'Tamil Nadu, India'}</p>
                        </div>
                    </div>

                    {/* Settings & Preferences Card */}
                    <div className="hover-card delay-3" style={{ background: '#ffffff', borderRadius: '16px', padding: '18px' }}>
                        <h3 style={{ margin: '0 0 12px 0', fontSize: '1.05rem', color: '#1e3c72' }}>⚙️ Account Settings & Preferences</h3>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px', background: '#f8f9fa', borderRadius: '8px' }}>
                                <span style={{ fontSize: '0.9rem', fontWeight: 'bold' }}>🌐 Preferred Language</span>
                                <select className="modern-input" value={language} onChange={(e) => setLanguage(e.target.value)} style={{ width: 'auto', margin: 0, padding: '6px 10px', fontSize: '0.85rem' }}>
                                    <option value="en">🇬🇧 English</option>
                                    <option value="ta">🇮🇳 தமிழ்</option>
                                    <option value="ml">🌴 മലയാളം</option>
                                    <option value="hi">🇮🇳 हिन्दी</option>
                                </select>
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px', background: '#f8f9fa', borderRadius: '8px' }}>
                                <span style={{ fontSize: '0.9rem', fontWeight: 'bold' }}>🔊 AI Voice Safety Assistant</span>
                                <button onClick={playVoiceStatus} className="action-btn" style={{ padding: '6px 12px', fontSize: '0.8rem' }}>
                                    Test Voice 🔊
                                </button>
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px', background: '#f8f9fa', borderRadius: '8px' }}>
                                <span style={{ fontSize: '0.9rem', fontWeight: 'bold' }}>🔔 Geofence Safety Alerts</span>
                                <span style={{ color: '#2e7d32', fontWeight: 'bold', fontSize: '0.85rem' }}>🟢 Enabled (1-Time Alert)</span>
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                /* Tab 2: Map & Safety Navigation Dashboard */
                <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 12px', display: 'flex', flexWrap: 'wrap', gap: '15px' }} className="fade-in">
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

                        {/* Universal In-App Destination Search & Roadmap Navigation Bar */}
                        <div className="hover-card fade-in" style={{ background: '#ffffff', borderRadius: '12px', padding: '14px', marginBottom: '12px', borderLeft: '4px solid #1e3c72' }}>
                            <h3 style={{ margin: '0 0 8px 0', fontSize: '0.95rem', color: '#1e3c72' }}>
                                🧭 Search ANY Place & Get Real-Time Roadmap Navigation
                            </h3>

                            {/* Universal Place Search Box */}
                            <div style={{ display: 'flex', gap: '6px', marginBottom: '10px' }}>
                                <input
                                    type="text"
                                    className="modern-input"
                                    placeholder="🔍 Search ANY Place / Hotel / Station (e.g. Kovilpatti, Munnar Tea Museum)..."
                                    value={destSearchQuery}
                                    onChange={(e) => setDestSearchQuery(e.target.value)}
                                    onKeyDown={(e) => { if (e.key === 'Enter') searchAnyDestination(destSearchQuery); }}
                                    style={{ flex: 1, margin: 0, padding: '8px 12px', fontSize: '0.85rem' }}
                                />
                                <button
                                    type="button"
                                    onClick={() => searchAnyDestination(destSearchQuery)}
                                    className="action-btn"
                                    style={{ background: '#1e3c72', whiteSpace: 'nowrap', padding: '8px 14px', fontSize: '0.85rem' }}
                                    disabled={isSearchingDest}
                                >
                                    {isSearchingDest ? 'Searching...' : '🔍 Search Road'}
                                </button>
                            </div>

                            {/* Quick Dropdown Preset Selector */}
                            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
                                <select
                                    className="modern-input"
                                    style={{ flex: 1, margin: 0, padding: '8px 12px', fontSize: '0.85rem' }}
                                    value={selectedDestination ? (selectedDestination._id || selectedDestination.name) : ''}
                                    onChange={(e) => {
                                        const found = [...zones, ...searchResults].find(z => (z._id || z.name) === e.target.value);
                                        if (found) handleStartNavigation(found);
                                    }}
                                >
                                    <option value="">📍 Or Select Popular Tourist Danger Zones...</option>
                                    {Array.isArray(zones) && zones.map(z => (
                                        <option key={z._id || z.name} value={z._id || z.name}>
                                            {z.name} ({z.riskScore ? `Risk: ${z.riskScore}/100 - ${z.riskLevel}` : z.level})
                                        </option>
                                    ))}
                                    {searchResults.map(s => (
                                        <option key={s._id} value={s._id}>
                                            🔍 Searched: {s.name}
                                        </option>
                                    ))}
                                </select>
                                {isNavigating ? (
                                    <button type="button" onClick={handleStopNavigation} className="action-btn" style={{ background: '#ff416c', padding: '8px 14px', fontSize: '0.85rem' }}>
                                        ❌ Stop Nav
                                    </button>
                                ) : (
                                    <button type="button" onClick={() => selectedDestination && handleStartNavigation(selectedDestination)} className="action-btn" style={{ background: '#25D366', padding: '8px 14px', fontSize: '0.85rem' }}>
                                        🧭 Start Nav
                                    </button>
                                )}
                            </div>

                            {/* Turn-by-Turn Navigation Header Banner over Map */}
                            {isNavigating && selectedDestination && currentLocation && (
                                <div style={{ marginTop: '10px', background: 'linear-gradient(90deg, #1e3c72 0%, #2a5298 100%)', color: '#ffffff', padding: '10px 14px', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                                    <div>
                                        <strong style={{ fontSize: '0.95rem' }}>🧭 Navigating to: {selectedDestination.name}</strong>
                                        <p style={{ margin: '3px 0 0 0', fontSize: '0.82rem', opacity: 0.95 }}>
                                            📏 <strong>Road Distance:</strong> {navDistanceKm} km
                                            &nbsp;|&nbsp; ⏱️ <strong>Est. Walk:</strong> {navDurationMins} mins
                                        </p>
                                    </div>
                                    <span style={{ background: 'rgba(255,255,255,0.2)', padding: '4px 8px', borderRadius: '10px', fontSize: '0.75rem', fontWeight: 'bold' }}>
                                        🚶 Real Roadmap Route Active
                                    </span>
                                </div>
                            )}
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
                            {/* Live In-App Road-Matched Navigation Route Polyline */}
                            {isNavigating && navRoutePoints.length > 0 && (
                                <Polyline
                                    positions={navRoutePoints}
                                    color="#304ffe"
                                    weight={7}
                                    opacity={0.9}
                                />
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
                        <h3 style={{ marginTop: 0, fontSize: '1.05rem', color: '#1e3c72' }}>🤖 Thozhan AI Assistant</h3>
                        <div className="chat-box">{chatReply || 'Thozhan: Hi! Ask me about nearby hospitals, police stations, bus stands, shops, or danger areas.'}</div>

                        {/* Interactive Location Permission Prompt */}
                        {aiSuggestedPlace && (
                            <div style={{ margin: '10px 0', background: '#e3f2fd', padding: '10px 12px', borderRadius: '8px', borderLeft: '4px solid #1e3c72' }}>
                                <p style={{ margin: '0 0 8px 0', fontSize: '0.82rem', fontWeight: 'bold', color: '#1e3c72' }}>
                                    🧭 🤖 Thozhan: Shall I plot the roadmap to "{aiSuggestedPlace.name}" on your Google Satellite Map?
                                </p>
                                <div style={{ display: 'flex', gap: '8px' }}>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            handleStartNavigation({
                                                name: aiSuggestedPlace.name,
                                                center: { lat: aiSuggestedPlace.lat, lng: aiSuggestedPlace.lng },
                                                coordinates: [[aiSuggestedPlace.lat, aiSuggestedPlace.lng]]
                                            });
                                            setAiSuggestedPlace(null);
                                        }}
                                        className="action-btn"
                                        style={{ background: '#25D366', padding: '6px 12px', fontSize: '0.8rem' }}
                                    >
                                        ✅ Yes, Plot Roadmap
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setAiSuggestedPlace(null)}
                                        className="action-btn"
                                        style={{ background: '#ff416c', padding: '6px 12px', fontSize: '0.8rem' }}
                                    >
                                        ❌ Cancel
                                    </button>
                                </div>
                            </div>
                        )}

                        <div style={{ display: 'flex', gap: '8px' }}>
                            <input
                                className="modern-input"
                                style={{ margin: 0 }}
                                type="text"
                                value={chatMessage}
                                onChange={(e) => setChatMessage(e.target.value)}
                                onKeyDown={(e) => { if (e.key === 'Enter') sendChatMessage(); }}
                                placeholder="Ask Thozhan (e.g. Nearest hospital, police station)..."
                            />
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

                        <button onClick={triggerSosModal} className="pulse-btn" style={{ background: 'linear-gradient(45deg, #ff416c, #ff4b2b)' }}>🚨 SEND SOS IMMEDIATELY 🚨</button>

                        <button onClick={shareWhatsappGPS} className="action-btn" style={{ background: '#25D366', width: '100%', marginTop: '10px', padding: '10px', fontWeight: 'bold' }}>💬 Share Live GPS on WhatsApp</button>

                        <button onClick={simulateFall} className="action-btn" style={{ background: 'linear-gradient(45deg, #f12711, #f5af19)', width: '100%', marginTop: '10px', padding: '10px' }}>⚠️ Simulate Auto Fall Alert</button>

                        {blockchainHash && (
                            <div style={{ marginTop: '12px', padding: '8px', background: 'white', borderRadius: '5px', fontSize: '0.75rem', wordBreak: 'break-all' }}>
                                <strong>Blockchain Hash:</strong><br />{blockchainHash}
                            </div>
                        )}
                    </div>

                    <div className="hover-card fade-in delay-3">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h3 style={{ marginTop: 0, marginBottom: 0, fontSize: '1.05rem' }}>📢 Your Alerts</h3>
                            <button onClick={fetchAlerts} className="action-btn" style={{ padding: '4px 10px', fontSize: '0.75rem' }}>Refresh</button>
                        </div>
                        <hr style={{ border: 'none', borderTop: '1px solid #eee', margin: '12px 0' }} />

                        {!Array.isArray(alerts) || alerts.length === 0 ? (
                            <p style={{ color: '#888', fontSize: '0.9rem', margin: '5px 0' }}>No active alerts. You are safe!</p>
                        ) : (
                            <div style={{ maxHeight: '220px', overflowY: 'auto' }}>
                                {alerts.map((alert) => (
                                    <div key={alert._id} className="alert-item">
                                        <strong style={{ color: '#d32f2f' }}>{alert.type ? alert.type.toUpperCase() : 'ALERT'}</strong> - {alert.message}<br />
                                        <small>📍 {alert.location ? `${alert.location.lat.toFixed(4)}, ${alert.location.lng.toFixed(4)}` : 'N/A'}</small><br />
                                        <small style={{ color: '#666' }}>🕒 {new Date(alert.createdAt).toLocaleTimeString()}</small>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
            )}

            {/* 30-Second Emergency SOS Countdown Confirmation Modal */}
            {showSosModal && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
                    background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)',
                    display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 999999, padding: '16px'
                }} className="fade-in">
                    <div style={{
                        background: '#ffffff', borderRadius: '20px', padding: '28px 20px', maxWidth: '420px', width: '100%',
                        textAlign: 'center', boxShadow: '0 20px 50px rgba(255,65,108,0.5)', border: '3px solid #ff416c'
                    }}>
                        <h2 style={{ color: '#d32f2f', margin: '0 0 10px 0', fontSize: '1.4rem' }}>🚨 EMERGENCY SOS TRIGGERED!</h2>
                        <p style={{ color: '#444', fontSize: '0.95rem', margin: '0 0 15px 0' }}>
                            Sending emergency GPS alert, notifying authorities, downloading E-FIR PDF & storing on Blockchain.
                        </p>

                        <div style={{
                            width: '100px', height: '100px', borderRadius: '50%', background: 'linear-gradient(135deg, #ff416c 0%, #ff4b2b 100%)',
                            color: 'white', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                            margin: '0 auto 20px auto', boxShadow: '0 0 25px rgba(255,65,108,0.6)', animation: 'pulse 1s infinite'
                        }}>
                            <span style={{ fontSize: '2.2rem', fontWeight: 'bold', lineHeight: '1' }}>{sosTimer}s</span>
                            <small style={{ fontSize: '0.65rem', textTransform: 'uppercase', opacity: 0.9 }}>Auto Send</small>
                        </div>

                        <p style={{ fontSize: '0.85rem', color: '#666', marginBottom: '20px' }}>
                            If not cancelled, SOS will automatically execute when timer reaches 0s.
                        </p>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            <button
                                type="button"
                                onClick={() => { executeActualSOS(); setShowSosModal(false); }}
                                className="action-btn"
                                style={{ background: 'linear-gradient(90deg, #d32f2f 0%, #ff416c 100%)', padding: '14px', fontSize: '1rem', width: '100%' }}
                            >
                                🚨 Confirm & Send SOS Now
                            </button>
                            <button
                                type="button"
                                onClick={() => setShowSosModal(false)}
                                className="action-btn"
                                style={{ background: '#78909c', padding: '12px', fontSize: '0.9rem', width: '100%' }}
                            >
                                ❌ Cancel SOS
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Tourist Dashboard Animated Bottom Glassmorphism Navigation Bar */}
            <nav className="bottom-nav-bar">
                <button
                    type="button"
                    onClick={() => setTouristTab('map')}
                    className={`bottom-nav-item ${touristTab === 'map' ? 'active' : ''}`}
                >
                    <span className="bottom-nav-item-icon">🗺️</span>
                    <span>Safety Map</span>
                </button>
                <button
                    type="button"
                    onClick={() => setTouristTab('account')}
                    className={`bottom-nav-item ${touristTab === 'account' ? 'active' : ''}`}
                >
                    <span className="bottom-nav-item-icon">👤</span>
                    <span>My Account</span>
                </button>
            </nav>
        </div>
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
    const [adminTab, setAdminTab] = useState('map');

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
                let updated = [...prevUsers];
                if (index !== -1) {
                    updated[index] = {
                        ...updated[index],
                        lastLocation: { lat: data.lat, lng: data.lng },
                        lastAlertTime: new Date()
                    };
                } else {
                    updated.push({
                        id: data.userId,
                        name: data.name,
                        email: 'Live Tourist',
                        lastLocation: { lat: data.lat, lng: data.lng },
                        lastAlertTime: new Date()
                    });
                }
                return updated;
            });

            // Live Auto-Follow Monitored Tourist on Admin Google Satellite Map
            if (data && data.lat && data.lng) {
                setSelectedUser((prevSelected) => {
                    if (prevSelected && (prevSelected.id === data.userId || prevSelected._id === data.userId)) {
                        setMapCenter([data.lat, data.lng]);
                        return { ...prevSelected, lastLocation: { lat: data.lat, lng: data.lng } };
                    }
                    return prevSelected;
                });
            }
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
        <div className="gradient-bg" style={{ paddingBottom: '75px' }}>
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

            {/* Tab 1: Live Satellite Map & GPS Search */}
            {adminTab === 'map' ? (
                <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 12px' }} className="fade-in">

                    {/* Top Search Input Box with Enter Key Auto-Zoom */}
                    <div className="hover-card fade-in" style={{ background: '#ffffff', borderRadius: '12px', padding: '12px', marginBottom: '12px', borderLeft: '4px solid #1e3c72' }}>
                        <input
                            type="text"
                            className="modern-input"
                            placeholder="🔍 Type Tourist Name / Email & Press Enter to Auto-Zoom Map..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onKeyDown={handleSearchKeyDown}
                            style={{ margin: 0, padding: '10px 14px', borderRadius: '20px', fontSize: '0.9rem' }}
                        />
                    </div>

                    {/* Selected Tourist Deep Intelligence Panel */}
                    {selectedUser && (
                        <div className="hover-card fade-in delay-1" style={{ background: '#ffffff', borderRadius: '12px', padding: '14px', marginBottom: '12px', borderTop: '4px solid #1e3c72' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '6px' }}>
                                <div>
                                    <h3 style={{ margin: 0, fontSize: '1.05rem', color: '#1e3c72' }}>🎯 Live Monitoring: {selectedUser.name}</h3>
                                    <p style={{ margin: '2px 0 0 0', fontSize: '0.8rem', color: '#555' }}>📧 {selectedUser.email} | 📞 {selectedUser.phone || 'N/A'}</p>
                                </div>
                                <span style={{ background: selectedUser.lastLocation ? '#e8f5e9' : '#ffebee', color: selectedUser.lastLocation ? '#2e7d32' : '#c62828', padding: '3px 8px', borderRadius: '10px', fontSize: '0.75rem', fontWeight: 'bold' }}>
                                    {selectedUser.lastLocation ? '🟢 LIVE GPS ACTIVE' : '🔴 NO GPS'}
                                </span>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '8px', marginTop: '10px' }}>
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
                        <MapContainer center={mapCenter} zoom={13} style={{ height: '440px', width: '100%' }}>
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
            ) : (
                /* Tab 2: Registered Tourists & Active Alerts View */
                <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 12px', display: 'flex', flexWrap: 'wrap', gap: '15px' }} className="fade-in">
                    <div style={{ flex: '1 1 500px', minWidth: '0', maxWidth: '100%' }}>
                        <div className="hover-card fade-in">
                            <h3 style={{ marginTop: 0, fontSize: '1.1rem' }}>📋 Registered Tourists Directory ({filteredUsers.length})</h3>

                            <div style={{ marginBottom: '12px' }}>
                                <input
                                    type="text"
                                    className="modern-input"
                                    placeholder="🔍 Search Tourist by Name / Email..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    style={{ margin: 0, padding: '8px 12px', fontSize: '0.85rem', borderRadius: '18px' }}
                                />
                            </div>

                            <ul style={{ listStyle: 'none', padding: 0, maxHeight: '350px', overflowY: 'auto' }}>
                                {filteredUsers.length === 0 ? (
                                    <p style={{ color: '#888', fontSize: '0.85rem' }}>No matching tourists found.</p>
                                ) : (
                                    filteredUsers.map((u) => (
                                        <li
                                            key={u.id || u._id}
                                            style={{ padding: '10px', borderBottom: '1px solid #eee', cursor: 'pointer', background: selectedUser && (selectedUser.id === u.id || selectedUser._id === u._id) ? '#e3f2fd' : 'transparent', borderRadius: '8px', marginBottom: '6px' }}
                                            onClick={() => { handleUserClick(u); setAdminTab('map'); }}
                                        >
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <div>
                                                    <strong style={{ fontSize: '0.95rem', color: '#1e3c72' }}>{u.name}</strong>
                                                    <br /><small style={{ color: '#555' }}>📧 {u.email} | 📞 {u.phone || 'N/A'}</small>
                                                </div>
                                                <button className="action-btn" style={{ padding: '4px 8px', fontSize: '0.75rem' }}>
                                                    🎯 Locate on Map ➔
                                                </button>
                                            </div>
                                        </li>
                                    ))
                                )}
                            </ul>
                        </div>
                    </div>

                    <div style={{ flex: '1 1 320px', minWidth: '0', maxWidth: '100%' }}>
                        {selectedUser && (
                            <div className="hover-card fade-in delay-1" style={{ borderLeft: '4px solid #1e3c72' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <h3 style={{ marginTop: 0, marginBottom: 0, fontSize: '1rem', color: '#1e3c72' }}>📢 Alerts Log: {selectedUser.name}</h3>
                                    <button onClick={() => fetchUserAlerts(selectedUser.id || selectedUser._id)} className="action-btn" style={{ padding: '4px 8px', fontSize: '0.75rem' }}>Refresh</button>
                                </div>
                                <hr style={{ border: 'none', borderTop: '1px solid #eee', margin: '10px 0' }} />

                                {!Array.isArray(userAlerts) || userAlerts.length === 0 ? (
                                    <p style={{ color: '#888', fontSize: '0.85rem' }}>No alerts recorded for this tourist.</p>
                                ) : (
                                    <div style={{ maxHeight: '250px', overflowY: 'auto' }}>
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
            )}

            {/* Admin Dashboard Animated Glassmorphism Bottom Navigation Bar */}
            <nav className="bottom-nav-bar">
                <button
                    type="button"
                    onClick={() => setAdminTab('map')}
                    className={`bottom-nav-item ${adminTab === 'map' ? 'active' : ''}`}
                >
                    <span className="bottom-nav-item-icon">🛰️</span>
                    <span>Live Map & GPS</span>
                </button>
                <button
                    type="button"
                    onClick={() => setAdminTab('tourists')}
                    className={`bottom-nav-item ${adminTab === 'tourists' ? 'active' : ''}`}
                >
                    <span className="bottom-nav-item-icon">📋</span>
                    <span>Tourists & Alerts</span>
                </button>
            </nav>
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