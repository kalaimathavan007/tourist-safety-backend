import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Polygon, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import './App.css';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// --- CSS Animations and Styles injected directly to avoid errors ---
const globalStyles = `
  .gradient-bg { background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%); min-height: 100vh; padding-bottom: 30px; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; }
  .glass-navbar { background: linear-gradient(90deg, #1e3c72 0%, #2a5298 100%); color: white; padding: 15px 30px; display: flex; justify-content: space-between; align-items: center; box-shadow: 0 4px 15px rgba(0,0,0,0.2); margin-bottom: 20px; }
  .navbar-brand { font-size: 1.5rem; font-weight: bold; margin: 0; }
  .fade-in { animation: fadeIn 0.8s ease-out forwards; opacity: 0; }
  .delay-1 { animation-delay: 0.1s; }
  .delay-2 { animation-delay: 0.2s; }
  .delay-3 { animation-delay: 0.3s; }
  .hover-card { background: white; border-radius: 15px; padding: 20px; box-shadow: 0 8px 20px rgba(0,0,0,0.05); transition: transform 0.3s ease, box-shadow 0.3s ease; margin-bottom: 20px; border-top: 4px solid #1e3c72; }
  .hover-card:hover { transform: translateY(-5px); box-shadow: 0 12px 25px rgba(0,0,0,0.15); }
  .pulse-btn { animation: pulse 1.5s infinite; color: white; border: none; font-weight: bold; font-size: 1.1rem; border-radius: 10px; cursor: pointer; transition: transform 0.2s; padding: 15px; width: 100%; margin-top: 10px; }
  .pulse-btn:hover { transform: scale(1.02); animation: none; box-shadow: 0 5px 15px rgba(255,0,0,0.4); }
  .action-btn { padding: 10px 20px; background: linear-gradient(90deg, #1e3c72 0%, #2a5298 100%); color: white; border: none; border-radius: 8px; cursor: pointer; transition: 0.3s; font-weight: bold; }
  .action-btn:hover { transform: translateY(-2px); box-shadow: 0 5px 15px rgba(30, 60, 114, 0.3); }
  .modern-input { width: 100%; padding: 12px; margin: 10px 0; border: 1.5px solid #e1e5ee; border-radius: 8px; box-sizing: border-box; transition: border-color 0.3s; font-size: 1rem; }
  .modern-input:focus { border-color: #1e3c72; outline: none; box-shadow: 0 0 0 3px rgba(30, 60, 114, 0.1); }
  .auth-card-styled { background: white; padding: 40px; border-radius: 20px; box-shadow: 0 15px 35px rgba(0,0,0,0.1); max-width: 400px; margin: 80px auto; text-align: center; }
  .alert-item { background: #fff3cd; border-left: 5px solid #ffc107; padding: 15px; margin-bottom: 10px; border-radius: 5px; font-size: 0.95rem; }
  .role-badge { background: rgba(255,255,255,0.2); padding: 6px 15px; border-radius: 20px; font-size: 0.9rem; margin-right: 15px; font-weight: bold; }
  .map-wrapper { border-radius: 15px; overflow: hidden; box-shadow: 0 10px 20px rgba(0,0,0,0.1); margin-bottom: 20px; border: 3px solid white; }
  
  @keyframes fadeIn { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
  @keyframes pulse { 0% { box-shadow: 0 0 0 0 rgba(255, 65, 108, 0.6); } 70% { box-shadow: 0 0 0 15px rgba(255, 65, 108, 0); } 100% { box-shadow: 0 0 0 0 rgba(255, 65, 108, 0); } }
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

// ------------------- Tourist Auth -------------------
function TouristAuth({ onLogin }) {
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');

    const handleSubmit = async(e) => {
        e.preventDefault();
        const url = isLogin ? 'fetch('
        https: //tourist-safety-monitoring-system-alpha.vercel.app/api/alerts')/api/auth/login' : 'fetch('https://tourist-safety-monitoring-system-alpha.vercel.app/api/alerts')/api/auth/register';
            const body = isLogin ? { email, password } : { name, email, password, phone, role: 'tourist' };
        try {
            const res = await fetch(url, {
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
                localStorage.setItem('userEmail', data.user.email || email);
                onLogin(data.user);
            } else alert(data.msg || 'Authentication failed');
        } catch (err) { alert('Server error. Make sure backend is running.'); }
    };

    return ( <
        div className = "gradient-bg"
        style = {
            { display: 'flex', alignItems: 'center', justifyContent: 'center' }
        } >
        <
        div className = "auth-card-styled fade-in" >
        <
        h2 style = {
            { color: '#1e3c72', marginBottom: '20px' }
        } > 🌍Smart Tourist Safety < /h2> <
        h3 style = {
            { color: '#555' }
        } > { isLogin ? 'Tourist Login' : 'Create an Account' } < /h3> <
        form onSubmit = { handleSubmit }
        style = {
            { marginTop: '20px' }
        } > {!isLogin && ( <
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
            { width: '100%', marginTop: '15px', padding: '12px' }
        } > { isLogin ? 'Login' : 'Register Securely' } <
        /button> < /
        form > <
        p onClick = {
            () => setIsLogin(!isLogin)
        }
        style = {
            { cursor: 'pointer', marginTop: '20px', color: '#1e3c72', fontWeight: 'bold', transition: '0.3s' }
        } > { isLogin ? 'New user? Register here ➔' : 'Already have an account? Login ➔' } <
        /p> < /
        div > <
        /div>
    );
}

// ------------------- Admin Auth (OTP) -------------------
function AdminAuth({ onAdminLogin }) {
    const [email, setEmail] = useState('');
    const [otp, setOtp] = useState('');
    const [step, setStep] = useState('email');
    const [loading, setLoading] = useState(false);

    const sendOtp = async(e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await fetch('fetch('
                https: //tourist-safety-monitoring-system-alpha.vercel.app/api/alerts')/api/admin/send-otp', {
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
        const res = await fetch('fetch('
            https: //tourist-safety-monitoring-system-alpha.vercel.app/api/alerts')/api/admin/verify-otp', {
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
            { display: 'flex', alignItems: 'center', justifyContent: 'center' }
        } >
        <
        div className = "auth-card-styled fade-in" >
        <
        h2 style = {
            { color: '#1e3c72', marginBottom: '20px' }
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
                { width: '100%', marginTop: '15px' }
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
                { width: '100%', marginTop: '15px' }
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
                { cursor: 'pointer', marginTop: '20px', color: '#1e3c72', fontWeight: 'bold' }
            } > ←Back to email <
            /p>
        )
    } <
    /div> < /
    div >
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
    const [blockchainHash, setBlockchainHash] = useState('');
    const [identity, setIdentity] = useState(null);

    useEffect(() => {
            fetch('fetch('
                https: //tourist-safety-monitoring-system-alpha.vercel.app/api/alerts')/api/zones')
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

        useEffect(() => {
            if (!navigator.geolocation) return;
            const watchId = navigator.geolocation.watchPosition(
                (pos) => setCurrentLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
                err => console.log(err), { enableHighAccuracy: true, maximumAge: 5000 }
            );
            return () => navigator.geolocation.clearWatch(watchId);
        }, []);

        const getRiskPrediction = async(lat, lng) => {
            try {
                const res = await fetch('fetch('
                    https: //tourist-safety-monitoring-system-alpha.vercel.app/api/alerts')/api/ai/risk', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'x-auth-token': token },
                    body: JSON.stringify({ lat, lng, time: new Date().toISOString() })
                });
            setRiskLevel(await res.json());
        } catch {}
    };

    const sendLocationForAnomaly = async(lat, lng) => {
        try {
            const res = await fetch('fetch('
                https: //tourist-safety-monitoring-system-alpha.vercel.app/api/alerts')/api/ai/anomaly', {
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
                fetch('fetch('
                    https: //tourist-safety-monitoring-system-alpha.vercel.app/api/alerts')/api/alerts', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'x-auth-token': token },
                    body: JSON.stringify({ location: currentLocation, type: 'geo_fence', message: msg })
                }).catch(console.error);
        }
    });
}, [currentLocation, zones, lastAlertShown, token]);

const fetchAlerts = async() => {
    try {
        const res = await fetch('fetch('
            https: //tourist-safety-monitoring-system-alpha.vercel.app/api/alerts')/api/alerts/my', { headers: { 'x-auth-token': token } });
            setAlerts(await res.json());
        }
        catch {}
    };
    useEffect(() => { fetchAlerts(); }, []);

    const fetchIdentity = async() => {
        try {
            const res = await fetch('fetch('
                https: //tourist-safety-monitoring-system-alpha.vercel.app/api/alerts')/api/identity/my', { headers: { 'x-auth-token': token } });
                const data = await res.json(); setIdentity(data);
            }
            catch {}
        };
        useEffect(() => { fetchIdentity(); }, []);

        const storeIdentity = async() => {
            const name = prompt("Enter your full name:");
            const email = prompt("Enter your email:");
            const phone = prompt("Enter your phone number:");
            if (!name || !email || !phone) return;
            try {
                const res = await fetch('fetch('
                    https: //tourist-safety-monitoring-system-alpha.vercel.app/api/alerts')/api/identity/store', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'x-auth-token': token },
                    body: JSON.stringify({ name, email, phone })
                });
            const data = await res.json();
            if (data.success) {
                alert(`Identity stored on blockchain! Hash: ${data.blockchainHash}`);
                fetchIdentity();
            } else alert("Failed");
        } catch (err) { alert("Error: " + err.message); }
    };

    const sendSOS = async() => {
        if (!currentLocation) return alert('Getting location...');
        try {
            const alertRes = await fetch('fetch('
                https: //tourist-safety-monitoring-system-alpha.vercel.app/api/alerts')/api/alerts', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'x-auth-token': token },
                body: JSON.stringify({ location: currentLocation, type: 'sos', message: sosMessage || 'SOS Emergency!' })
            });
        const alertData = await alertRes.json();

        await fetch('fetch('
            https: //tourist-safety-monitoring-system-alpha.vercel.app/api/alerts')/api/notify/email', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'x-auth-token': token },
            body: JSON.stringify({
                to: user ? user.email : '',
                subject: 'SOS Alert',
                text: `SOS triggered at ${currentLocation.lat},${currentLocation.lng}. Message: ${sosMessage}`
            })
        });

    const efirRes = await fetch('fetch('
        https: //tourist-safety-monitoring-system-alpha.vercel.app/api/alerts')/api/efir/generate', {
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

const bcRes = await fetch('fetch('
https: //tourist-safety-monitoring-system-alpha.vercel.app/api/alerts')/api/blockchain/store', {
method: 'POST',
headers: { 'Content-Type': 'application/json', 'x-auth-token': token },
body: JSON.stringify({ incidentId: alertData._id, data: alertData })
});
const bcData = await bcRes.json();
setBlockchainHash(bcData.hash);

alert(`SOS sent! E-FIR downloaded. Blockchain hash: ${bcData.hash}`);
setSosMessage('');
fetchAlerts();
}
catch (err) { alert('Failed: ' + err.message); }
};

const translateText = async(text) => {
    if (language === 'en') return text;
    try {
        const res = await fetch('fetch('
            https: //tourist-safety-monitoring-system-alpha.vercel.app/api/alerts')/api/translate', {
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
        const res = await fetch('fetch('
            https: //tourist-safety-monitoring-system-alpha.vercel.app/api/alerts')/api/ai/chat', {
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
        h1 className = "navbar-brand" > 🚨Tourist Safety System < /h1> <
        div >
        <
        select className = "modern-input"
        value = { language }
        onChange = {
            (e) => setLanguage(e.target.value)
        }
        style = {
            { width: 'auto', marginRight: '15px', padding: '8px', display: 'inline-block' }
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
            { background: '#ff416c' }
        } > Logout < /button> < /
        div > <
        /nav>

        <
        div style = {
            { maxWidth: '1200px', margin: '0 auto', padding: '0 20px', display: 'flex', flexWrap: 'wrap', gap: '20px' }
        } >

        { /* Left Side: Map and AI Status */ } <
        div style = {
            { flex: '1 1 600px' }
        } >
        <
        div className = "map-wrapper fade-in delay-1" >
        <
        MapContainer center = { currentLocation ? [currentLocation.lat, currentLocation.lng] : [20.5937, 78.9629] }
        zoom = { 12 }
        style = {
            { height: '450px', width: '100%' }
        } >
        <
        TileLayer url = "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
        attribution = '&copy; OSM' / > {
            currentLocation && ( <
                Marker position = {
                    [currentLocation.lat, currentLocation.lng]
                } >
                <
                Popup > You are here < /Popup> < /
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
                    { marginTop: 0 }
                } > 🤖Thozhan Risk Assessment < /h3> <
                p style = {
                    { fontSize: '1.1rem', margin: 0 }
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
            { marginTop: 0 }
        } > 🤖Thozhan - AI Safety Assistant < /h3> <
        div style = {
            { background: '#f5f7fa', padding: '15px', borderRadius: '8px', marginBottom: '15px', minHeight: '60px', color: '#333' }
        } > { chatReply || 'Thozhan: Hi! Ask me about safe zones, danger areas, or emergency SOS features.' } <
        /div> <
        div style = {
            { display: 'flex', gap: '10px' }
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
        className = "action-btn" > Send < /button> < /
        div > <
        /div> < /
        div >

        { /* Right Side: Actions and Info */ } <
        div style = {
            { flex: '1 1 350px' }
        } >
        <
        div className = "hover-card fade-in delay-3"
        style = {
            { borderTop: 'none', background: '#ffebee' }
        } >
        <
        h3 style = {
            { marginTop: 0, color: '#c62828' }
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
            { background: 'linear-gradient(45deg, #f12711, #f5af19)', width: '100%', marginTop: '15px', padding: '12px' }
        } > ⚠️Simulate Auto Fall Alert <
        /button>

        {
            blockchainHash && ( <
                div style = {
                    { marginTop: '15px', padding: '10px', background: 'white', borderRadius: '5px', fontSize: '0.8rem', wordBreak: 'break-all' }
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
            { marginTop: 0, marginBottom: 0 }
        } > 📢Your Alerts < /h3> <
        button onClick = { fetchAlerts }
        className = "action-btn"
        style = {
            { padding: '5px 10px', fontSize: '0.8rem' }
        } > Refresh < /button> < /
        div > <
        hr style = {
            { border: 'none', borderTop: '1px solid #eee', margin: '15px 0' }
        }
        />

        {
            alerts.length === 0 ? ( <
                p style = {
                    { color: '#888' }
                } > No active alerts.You are safe! < /p>
            ) : ( <
                div style = {
                    { maxHeight: '250px', overflowY: 'auto' }
                } > {
                    alerts.map((alert) => ( <
                        div key = { alert._id }
                        className = "alert-item" >
                        <
                        strong style = {
                            { color: '#d32f2f' }
                        } > { alert.type.toUpperCase() } < /strong> - {alert.message} <
                        br / > < small > 📍Location: { alert.location ? alert.location.lat.toFixed(4) : 'N/A' }, { alert.location ? alert.location.lng.toFixed(4) : 'N/A' } < /small> <
                        br / > < small style = {
                            { color: '#666' }
                        } > 🕒{ new Date(alert.createdAt).toLocaleString() } < /small> < /
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
            { marginTop: 0 }
        } > 🔗Blockchain Identity < /h3> {
        identity && identity.hasIdentity !== false ? ( <
            div >
            <
            p style = {
                { margin: '5px 0' }
            } > < strong > Name: < /strong> {identity.name}</p >
            <
            p style = {
                { margin: '5px 0' }
            } > < strong > Email: < /strong> {identity.email}</p >
            <
            p style = {
                { margin: '5px 0' }
            } > < strong > Phone: < /strong> {identity.phone}</p >
            <
            p style = {
                { margin: '5px 0', fontSize: '0.85rem', color: '#555', wordBreak: 'break-all' }
            } >
            <
            strong > Blockchain Hash: < /strong><br/ > { identity.blockchainHash ? identity.blockchainHash : 'N/A' } <
            /p> < /
            div >
        ) : ( <
            div >
            <
            p style = {
                { color: '#888' }
            } > No secure identity stored on the blockchain yet. < /p> <
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

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async() => {
        try {
            const res = await fetch('fetch('
                https: //tourist-safety-monitoring-system-alpha.vercel.app/api/alerts')/api/admin/users', { headers: { 'x-auth-token': token } });
                const data = await res.json(); setUsers(data);
            }
            catch (err) { console.error(err); }
        };

        const fetchUserAlerts = async(userId) => {
            try {
                const res = await fetch(`fetch('https://tourist-safety-monitoring-system-alpha.vercel.app/api/alerts')/api/admin/user-alerts/${userId}`, { headers: { 'x-auth-token': token } });
                const data = await res.json();
                setUserAlerts(data);
            } catch (err) { console.error(err); }
        };

        const handleUserClick = (u) => {
            setSelectedUser(u);
            fetchUserAlerts(u.id);
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
            div >
            <
            span className = "role-badge" > Admin: { user ? user.email : '' } < /span> <
            button onClick = { logout }
            className = "action-btn"
            style = {
                { background: '#ff416c' }
            } > Logout < /button> < /
            div > <
            /nav>

            <
            div style = {
                { maxWidth: '1200px', margin: '0 auto', padding: '0 20px', display: 'flex', flexWrap: 'wrap', gap: '20px' }
            } >
            <
            div style = {
                { flex: '1 1 600px' }
            } >
            <
            div className = "map-wrapper fade-in delay-1" >
            <
            MapContainer center = { mapCenter }
            zoom = { 6 }
            style = {
                { height: '500px', width: '100%' }
            } >
            <
            TileLayer url = "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png" / > {
                users.map((u) =>
                    u.lastLocation && ( <
                        Marker key = { u.id }
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
                        Last seen: { u.lastAlertTime ? new Date(u.lastAlertTime).toLocaleString() : 'Never' } <
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
                { flex: '1 1 350px' }
            } >
            <
            div className = "hover-card fade-in delay-2" >
            <
            h3 style = {
                { marginTop: 0 }
            } > 📋Registered Tourists < /h3> <
            ul style = {
                { listStyle: 'none', padding: 0, maxHeight: '200px', overflowY: 'auto' }
            } > {
                users.map((u) => ( <
                    li key = { u.id }
                    style = {
                        { padding: '10px', borderBottom: '1px solid #eee', cursor: 'pointer', transition: '0.2s' }
                    }
                    onClick = {
                        () => handleUserClick(u)
                    }
                    onMouseOver = {
                        (e) => e.currentTarget.style.background = '#f5f7fa'
                    }
                    onMouseOut = {
                        (e) => e.currentTarget.style.background = 'transparent'
                    } >
                    <
                    strong > { u.name } < /strong><br / >
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
                        { marginTop: 0, marginBottom: 0 }
                    } > 📢Alerts: { selectedUser.name } < /h3> <
                    button onClick = {
                        () => fetchUserAlerts(selectedUser.id)
                    }
                    className = "action-btn"
                    style = {
                        { padding: '5px 10px', fontSize: '0.8rem' }
                    } > Refresh < /button> < /
                    div > <
                    hr style = {
                        { border: 'none', borderTop: '1px solid #eee', margin: '15px 0' }
                    }
                    />

                    {
                        userAlerts.length === 0 ? ( <
                            p style = {
                                { color: '#888' }
                            } > No alerts recorded. < /p>
                        ) : ( <
                            div style = {
                                { maxHeight: '250px', overflowY: 'auto' }
                            } > {
                                userAlerts.map((alert) => ( <
                                    div key = { alert._id }
                                    className = "alert-item" >
                                    <
                                    strong style = {
                                        { color: '#d32f2f' }
                                    } > { alert.type.toUpperCase() } < /strong> - {alert.message} <
                                    br / > < small > 📍{ alert.location ? alert.location.lat.toFixed(4) : 'N/A' }, { alert.location ? alert.location.lng.toFixed(4) : 'N/A' } < /small> <
                                    br / > < small style = {
                                        { color: '#666' }
                                    } > 🕒{ new Date(alert.createdAt).toLocaleString() } < /small> < /
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