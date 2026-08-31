import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Polygon, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import io from 'socket.io-client';
import 'leaflet/dist/leaflet.css';
import './App.css';

const BACKEND_URL = 'http://localhost:5000';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// --- 100% Mobile Responsive Styles ---
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

  .navbar-brand { font-size: 1.25rem; font-weight: bold; margin: 0; }
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

// ------------------- Tourist Auth (Email OTP) -------------------
function TouristAuth({ onLogin }) {
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');
    const [otp, setOtp] = useState('');
    const [step, setStep] = useState('credentials');
    const [loading, setLoading] = useState(false);

    const handleSendOtp = async(e) => {
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
                alert('OTP sent to your Gmail!');
            } else {
                alert(data.msg || data.error || 'Failed to send OTP');
            }
        } catch (err) {
            alert('Server error. Make sure backend is running.');
        }
        setLoading(false);
    };

    const handleVerifyOtp = async(e) => {
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

    return ( <
        div className = "gradient-bg"
        style = {
            { display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', padding: '15px' }
        } >
        <
        div className = "auth-card-styled fade-in" >
        <
        h2 style = {
            { color: '#1e3c72', marginBottom: '15px', fontSize: '1.4rem' }
        } > 🌍Smart Tourist Safety < /h2> <
        h3 style = {
            { color: '#555', fontSize: '1.1rem', marginBottom: '15px' }
        } > { step === 'otp' ? 'Enter Gmail OTP' : isLogin ? 'Tourist Login' : 'Create an Account' } <
        /h3>

        {
            step === 'credentials' ? ( <
                form onSubmit = { handleSendOtp } > {!isLogin && ( <
                        input className = "modern-input"
                        type = "text"
                        placeholder = "Full Name"
                        value = { name }
                        onChange = {
                            (e) => setName(e.target.value)
                        }
                        required / >
                    )
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
                required / > {!isLogin && ( <
                        input className = "modern-input"
                        type = "tel"
                        placeholder = "Phone (optional)"
                        value = { phone }
                        onChange = {
                            (e) => setPhone(e.target.value)
                        }
                        />
                    )
                } <
                button className = "action-btn"
                type = "submit"
                style = {
                    { width: '100%', marginTop: '12px', padding: '12px' }
                }
                disabled = { loading } > { loading ? 'Sending OTP...' : isLogin ? 'Send Login OTP' : 'Send Registration OTP' } <
                /button> < /
                form >
            ) : ( <
                form onSubmit = { handleVerifyOtp } >
                <
                input className = "modern-input"
                type = "text"
                placeholder = "Enter 6-digit OTP"
                value = { otp }
                onChange = {
                    (e) => setOtp(e.target.value)
                }
                required / >
                <
                button className = "action-btn"
                type = "submit"
                style = {
                    { width: '100%', marginTop: '12px', padding: '12px' }
                }
                disabled = { loading } > { loading ? 'Verifying...' : 'Verify & Login' } <
                /button> <
                p onClick = {
                    () => setStep('credentials')
                }
                style = {
                    { cursor: 'pointer', marginTop: '15px', color: '#1e3c72', fontWeight: 'bold', fontSize: '0.9rem' }
                } > ←Back to Credentials <
                /p> < /
                form >
            )
        }

        {
            step === 'credentials' && ( <
                p onClick = {
                    () => setIsLogin(!isLogin)
                }
                style = {
                    { cursor: 'pointer', marginTop: '15px', color: '#1e3c72', fontWeight: 'bold', fontSize: '0.9rem' }
                } > { isLogin ? 'New user? Register here ➔' : 'Already have an account? Login ➔' } <
                /p>
            )
        } <
        /div> < /
        div >
    );
}

// ------------------- Admin Auth -------------------
function AdminAuth({ onAdminLogin }) {
    const [email, setEmail] = useState('');
    const [otp, setOtp] = useState('');
    const [step, setStep] = useState('email');
    const [loading, setLoading] = useState(false);

    const sendOtp = async(e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await fetch(`${BACKEND_URL}/api/admin/send-otp`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email })
            });
            const data = await res.json();
            if (data.success) {
                setStep('otp');
                alert('OTP sent to your email');
            } else {
                alert(data.error || 'Failed to send OTP');
            }
        } catch (err) { alert('Error sending OTP'); }
        setLoading(false);
    };

    const verifyOtp = async(e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await fetch(`${BACKEND_URL}/api/admin/verify-otp`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, otp })
            });
            const data = await res.json();
            if (data.token) {
                localStorage.setItem('token', data.token);
                localStorage.setItem('role', data.user.role);
                localStorage.setItem('userId', data.user.id);
                localStorage.setItem('userName', data.user.name || 'Admin');
                localStorage.setItem('userEmail', data.user.email || email);
                onAdminLogin(data.user);
            } else {
                alert(data.error || 'Invalid OTP');
            }
        } catch (err) { alert('Verification failed'); }
        setLoading(false);
    };

    return ( <
            div className = "gradient-bg"
            style = {
                { display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', padding: '15px' }
            } >
            <
            div className = "auth-card-styled fade-in" >
            <
            h2 style = {
                { color: '#1e3c72', marginBottom: '15px', fontSize: '1.4rem' }
            } > 🔐Admin Panel < /h2> {
            step === 'email' ? ( <
                form onSubmit = { sendOtp } >
                <
                input className = "modern-input"
                type = "email"
                placeholder = "Admin Email"
                value = { email }
                onChange = {
                    (e) => setEmail(e.target.value)
                }
                required / >
                <
                button className = "action-btn"
                type = "submit"
                style = {
                    { width: '100%', marginTop: '12px', padding: '12px' }
                }
                disabled = { loading } > { loading ? 'Sending Secure OTP...' : 'Send OTP' } <
                /button> < /
                form >
            ) : ( <
                form onSubmit = { verifyOtp } >
                <
                input className = "modern-input"
                type = "text"
                placeholder = "Enter Secure OTP"
                value = { otp }
                onChange = {
                    (e) => setOtp(e.target.value)
                }
                required / >
                <
                button className = "action-btn"
                type = "submit"
                style = {
                    { width: '100%', marginTop: '12px', padding: '12px' }
                }
                disabled = { loading } > { loading ? 'Verifying...' : 'Verify Identity' } <
                /button> < /
                form >
            )
        } {
            step === 'otp' && ( <
                p onClick = {
                    () => setStep('email')
                }
                style = {
                    { cursor: 'pointer', marginTop: '15px', color: '#1e3c72', fontWeight: 'bold', fontSize: '0.9rem' }
                } > ←Back to email <
                /p>
            )
        } <
        /div> < /
        div >
);
}

// ------------------- Tourist Dashboard (Live Location via Socket.io) -------------------
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
    const [blockchainHash, setBlockchainHash] = useState('');
    const [identity, setIdentity] = useState(null);

    // Initial Zones Fetch
    useEffect(() => {
        fetch(`${BACKEND_URL}/api/zones`)
            .then(res => res.json())
            .then(backendZones => {
                const allZones = [...backendZones, ...GLOBAL_DANGER_ZONES];
                setZones(allZones);
            })
            .catch(err => {
                console.error("Backend fetch error, loading default zones...", err);
                setZones(GLOBAL_DANGER_ZONES);
            });
    }, []);

    // Live Geolocation Tracking & Socket.io Broadcast
    useEffect(() => {
        if (!navigator.geolocation) return;

        const socket = io(BACKEND_URL);

        const watchId = navigator.geolocation.watchPosition(
            (pos) => {
                const coords = {
                    userId: user ? user.id : 'guest',
                    name: user ? user.name : 'Tourist',
                    lat: pos.coords.latitude,
                    lng: pos.coords.longitude
                };
                setCurrentLocation({ lat: coords.lat, lng: coords.lng });
                socket.emit('sendLocation', coords); // Broadcast live location
            },
            (err) => console.log('Location watch error:', err), { enableHighAccuracy: true, maximumAge: 5000 }
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
        try {
            const res = await fetch(`${BACKEND_URL}/api/ai/anomaly`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'x-auth-token': token },
                body: JSON.stringify({ lat, lng })
            });
            const data = await res.json();
            if (data.anomaly) alert(`🤖 Thozhan Alert: ${data.message}`);
        } catch {}
    };

    useEffect(() => {
        if (currentLocation) {
            getRiskPrediction(currentLocation.lat, currentLocation.lng);
            sendLocationForAnomaly(currentLocation.lat, currentLocation.lng);
        }
    }, [currentLocation]);

    useEffect(() => {
        if (!currentLocation) return;
        zones.forEach(zone => {
            if (isPointInZone(currentLocation, zone.coordinates)) {
                const key = zone._id;
                if (lastAlertShown[key] && Date.now() - lastAlertShown[key] < 60000) return;
                const msg = zone.level === 'warning' ? `⚠️ CAUTION: ${zone.name}` : `🔴 DANGER: ${zone.name}`;
                alert(msg);
                setLastAlertShown(prev => ({...prev, [key]: Date.now() }));
                fetch(`${BACKEND_URL}/api/alerts`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'x-auth-token': token },
                    body: JSON.stringify({ location: currentLocation, type: 'geo_fence', message: msg })
                }).catch(console.error);
            }
        });
    }, [currentLocation, zones, lastAlertShown, token]);

    const fetchAlerts = async() => {
        try {
            const res = await fetch(`${BACKEND_URL}/api/alerts/my`, { headers: { 'x-auth-token': token } });
            setAlerts(await res.json());
        } catch {}
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

    const simulateFall = async() => {
        alert('🤖 Thozhan: Fall detected! Sending alert...');
        await sendSOS();
    };

    return ( <
            div className = "gradient-bg" >
            <
            nav className = "glass-navbar fade-in" >
            <
            h1 className = "navbar-brand" > 🚨Tourist Safety < /h1> <
            div className = "navbar-controls" >
            <
            select className = "modern-input"
            value = { language }
            onChange = {
                (e) => setLanguage(e.target.value)
            }
            style = {
                { width: 'auto', margin: 0, padding: '6px 10px', fontSize: '0.85rem' }
            } >
            <
            option value = "en" > English < /option> <
            option value = "ta" > தமிழ் < /option> <
            option value = "hi" > हिन्दी < /option> <
            option value = "fr" > Français < /option> < /
            select > <
            span className = "role-badge" > Tourist: { user ? user.name : '' } < /span> <
            button onClick = { logout }
            className = "action-btn"
            style = {
                { background: '#ff416c', padding: '6px 12px' }
            } > Logout < /button> < /
            div > <
            /nav>

            <
            div style = {
                { maxWidth: '1200px', margin: '0 auto', padding: '0 12px', display: 'flex', flexWrap: 'wrap', gap: '15px' }
            } >

            { /* Left Column (Map & AI) */ } <
            div style = {
                { flex: '1 1 500px', minWidth: '0', maxWidth: '100%' }
            }
            className = "grid-col-left" >
            <
            div className = "map-wrapper fade-in delay-1" >
            <
            MapContainer center = { currentLocation ? [currentLocation.lat, currentLocation.lng] : [20.5937, 78.9629] }
            zoom = { 12 }
            style = {
                { height: '360px', width: '100%' }
            } >
            <
            TileLayer url = "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
            attribution = '&copy; OSM' / > {
                currentLocation && ( <
                    Marker position = {
                        [currentLocation.lat, currentLocation.lng]
                    } >
                    <
                    Popup > You are here(Live) < /Popup> < /
                    Marker >
                )
            } {
                zones.map((zone) => ( <
                    Polygon key = { zone._id }
                    positions = { zone.coordinates }
                    color = { zone.level === 'danger' ? '#ff416c' : '#ffb347' }
                    fillColor = { zone.level === 'danger' ? '#ff416c' : '#ffb347' }
                    fillOpacity = { 0.4 } >
                    <
                    Popup >
                    <
                    b style = {
                        { color: zone.level === 'danger' ? 'red' : 'orange' }
                    } > { zone.name } < /b> <
                    br / > { zone.level === 'danger' ? 'DANGER ZONE' : 'CAUTION' } <
                    /Popup> < /
                    Polygon >
                ))
            } <
            /MapContainer> < /
            div >

            {
                riskLevel && ( <
                    div className = "hover-card fade-in delay-2"
                    style = {
                        { borderLeft: riskLevel.risk === 'High' ? '5px solid #ff416c' : '5px solid #ffb347' }
                    } >
                    <
                    h3 style = {
                        { marginTop: 0, fontSize: '1.05rem' }
                    } > 🤖Thozhan Risk Assessment < /h3> <
                    p style = {
                        { fontSize: '0.95rem', margin: 0 }
                    } >
                    Risk Level: < strong > { riskLevel.risk } < /strong> (Score: {riskLevel.score}) < /
                    p > <
                    /div>
                )
            }

            <
            div className = "hover-card fade-in delay-2" >
            <
            h3 style = {
                { marginTop: 0, fontSize: '1.05rem' }
            } > 🤖Thozhan AI Assistant < /h3> <
            div className = "chat-box" > { chatReply || 'Thozhan: Hi! Ask me about safe zones, danger areas, or SOS features.' } <
            /div> <
            div style = {
                { display: 'flex', gap: '8px' }
            } >
            <
            input className = "modern-input"
            style = {
                { margin: 0 }
            }
            type = "text"
            value = { chatMessage }
            onChange = {
                (e) => setChatMessage(e.target.value)
            }
            placeholder = "Ask Thozhan..." / >
            <
            button onClick = { sendChatMessage }
            className = "action-btn"
            style = {
                { whiteSpace: 'nowrap' }
            } > Send < /button> < /
            div > <
            /div> < /
            div >

            { /* Right Column (Emergency, Alerts & Blockchain) */ } <
            div style = {
                { flex: '1 1 320px', minWidth: '0', maxWidth: '100%' }
            }
            className = "grid-col-right" >
            <
            div className = "hover-card fade-in delay-3"
            style = {
                { borderTop: 'none', background: '#ffebee' }
            } >
            <
            h3 style = {
                { marginTop: 0, color: '#c62828', fontSize: '1.1rem' }
            } > 🆘Emergency Actions < /h3> <
            input className = "modern-input"
            type = "text"
            placeholder = "Optional emergency message..."
            value = { sosMessage }
            onChange = {
                (e) => setSosMessage(e.target.value)
            }
            />

            <
            button onClick = { sendSOS }
            className = "pulse-btn"
            style = {
                { background: 'linear-gradient(45deg, #ff416c, #ff4b2b)' }
            } > 🚨SEND SOS IMMEDIATELY🚨 <
            /button>

            <
            button onClick = { simulateFall }
            className = "action-btn"
            style = {
                { background: 'linear-gradient(45deg, #f12711, #f5af19)', width: '100%', marginTop: '12px', padding: '12px' }
            } > ⚠️Simulate Auto Fall Alert <
            /button>

            {
                blockchainHash && ( <
                    div style = {
                        { marginTop: '12px', padding: '8px', background: 'white', borderRadius: '5px', fontSize: '0.75rem', wordBreak: 'break-all' }
                    } >
                    <
                    strong > Blockchain Hash: < /strong><br / > { blockchainHash } <
                    /div>
                )
            } <
            /div>

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
                alerts.length === 0 ? ( <
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
                            } > { alert.type.toUpperCase() } < /strong> - {alert.message} <
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

// ------------------- Admin Dashboard (Socket.io Real-time Tracker) -------------------
function AdminDashboard({ user, logout }) {
    const token = localStorage.getItem('token');
    const [users, setUsers] = useState([]);
    const [selectedUser, setSelectedUser] = useState(null);
    const [userAlerts, setUserAlerts] = useState([]);
    const [mapCenter, setMapCenter] = useState([20.5937, 78.9629]);

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async() => {
        try {
            const res = await fetch(`${BACKEND_URL}/api/admin/users`, { headers: { 'x-auth-token': token } });
            const data = await res.json();
            setUsers(data);
        } catch (err) { console.error(err); }
    };

    // Socket.io Listener for Real-Time Location Updates
    useEffect(() => {
        const socket = io(BACKEND_URL);

        socket.on('receiveLocation', (data) => {
            setUsers((prevUsers) => {
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
            setUserAlerts(data);
        } catch (err) { console.error(err); }
    };

    const handleUserClick = (u) => {
        setSelectedUser(u);
        fetchUserAlerts(u.id || u._id);
        if (u.lastLocation) {
            setMapCenter([u.lastLocation.lat, u.lastLocation.lng]);
        }
    };

    return ( <
        div className = "gradient-bg" >
        <
        nav className = "glass-navbar fade-in" >
        <
        h1 className = "navbar-brand" > 👑Admin Dashboard < /h1> <
        div className = "navbar-controls" >
        <
        span className = "role-badge" > Admin: { user ? user.email : '' } < /span> <
        button onClick = { logout }
        className = "action-btn"
        style = {
            { background: '#ff416c', padding: '6px 12px' }
        } > Logout < /button> < /
        div > <
        /nav>

        <
        div style = {
            { maxWidth: '1200px', margin: '0 auto', padding: '0 12px', display: 'flex', flexWrap: 'wrap', gap: '15px' }
        } >
        <
        div style = {
            { flex: '1 1 500px', minWidth: '0', maxWidth: '100%' }
        }
        className = "grid-col-left" >
        <
        div className = "map-wrapper fade-in delay-1" >
        <
        MapContainer center = { mapCenter }
        zoom = { 6 }
        style = {
            { height: '380px', width: '100%' }
        } >
        <
        TileLayer url = "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png" / > {
            users.map((u) =>
                u.lastLocation && ( <
                    Marker key = { u.id || u._id }
                    position = {
                        [u.lastLocation.lat, u.lastLocation.lng]
                    }
                    eventHandlers = {
                        { click: () => handleUserClick(u) }
                    } >
                    <
                    Popup >
                    <
                    strong > { u.name } < /strong><br / >
                    Email: { u.email } < br / >
                    Phone: { u.phone || 'N/A' } < br / >
                    Last seen: { u.lastAlertTime ? new Date(u.lastAlertTime).toLocaleTimeString() : 'Never' } <
                    /Popup> < /
                    Marker >
                )
            )
        } <
        /MapContainer> < /
        div > <
        /div>

        <
        div style = {
            { flex: '1 1 320px', minWidth: '0', maxWidth: '100%' }
        }
        className = "grid-col-right" >
        <
        div className = "hover-card fade-in delay-2" >
        <
        h3 style = {
            { marginTop: 0, fontSize: '1.1rem' }
        } > 📋Registered Tourists < /h3> <
        ul style = {
            { listStyle: 'none', padding: 0, maxHeight: '180px', overflowY: 'auto' }
        } > {
            users.map((u) => ( <
                li key = { u.id || u._id }
                style = {
                    { padding: '8px', borderBottom: '1px solid #eee', cursor: 'pointer' }
                }
                onClick = {
                    () => handleUserClick(u)
                } >
                <
                strong style = {
                    { fontSize: '0.95rem' }
                } > { u.name } < /strong><br / >
                <
                small style = {
                    { color: '#555' }
                } > { u.email } < /small><br / >
                <
                small style = {
                    { color: '#888' }
                } > Last loc: { u.lastLocation ? `${u.lastLocation.lat.toFixed(4)}, ${u.lastLocation.lng.toFixed(4)}` : 'Unknown' } < /small> < /
                li >
            ))
        } <
        /ul> < /
        div >

        {
            selectedUser && ( <
                div className = "hover-card fade-in delay-3" >
                <
                div style = {
                    { display: 'flex', justifyContent: 'space-between', alignItems: 'center' }
                } >
                <
                h3 style = {
                    { marginTop: 0, marginBottom: 0, fontSize: '1rem' }
                } > 📢Alerts: { selectedUser.name } < /h3> <
                button onClick = {
                    () => fetchUserAlerts(selectedUser.id || selectedUser._id)
                }
                className = "action-btn"
                style = {
                    { padding: '4px 8px', fontSize: '0.75rem' }
                } > Refresh < /button> < /
                div > <
                hr style = {
                    { border: 'none', borderTop: '1px solid #eee', margin: '10px 0' }
                }
                />

                {
                    userAlerts.length === 0 ? ( <
                        p style = {
                            { color: '#888', fontSize: '0.85rem' }
                        } > No alerts recorded. < /p>
                    ) : ( <
                        div style = {
                            { maxHeight: '180px', overflowY: 'auto' }
                        } > {
                            userAlerts.map((alert) => ( <
                                div key = { alert._id }
                                className = "alert-item" >
                                <
                                strong style = {
                                    { color: '#d32f2f' }
                                } > { alert.type.toUpperCase() } < /strong> - {alert.message} <
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
            )
        } <
        /div> < /
        div > <
        /div>
    );
}

// ------------------- Main App -------------------
function App() {
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [user, setUser] = useState(null);
    const navigate = useNavigate();

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
                Route path = "/admin-login"
                element = { < AdminAuth onAdminLogin = { handleAdminLogin }
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
                    element = {
                        user && user.role === 'tourist' ? ( <
                            TouristDashboard user = { user }
                            logout = { logout }
                            />
                        ) : ( <
                            Navigate to = "/admin/dashboard" / >
                        )
                    }
                    /> <
                    Route path = "/admin/dashboard"
                    element = {
                        user && user.role === 'admin' ? ( <
                            AdminDashboard user = { user }
                            logout = { logout }
                            />
                        ) : ( <
                            Navigate to = "/" / >
                        )
                    }
                    /> <
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