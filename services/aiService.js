const axios = require('axios');

const offlineTouristKnowledge = {
    kodaikanal: {
        name: 'Kodaikanal',
        summary: 'Kodaikanal is a cool hill station in Tamil Nadu known for its misty weather, lake, and pine forests.',
        highlights: ['Kodaikanal Lake', 'Bryant Park', 'Coaker\'s Walk', 'Pillar Rocks'],
        bestTime: 'March to June',
        travelTip: 'Carry warm clothes because the weather is cool throughout the year.'
    },
    ooty: {
        name: 'Ooty',
        summary: 'Ooty is a famous hill station with tea gardens, botanical gardens, and scenic viewpoints.',
        highlights: ['Botanical Garden', 'Ooty Lake', 'Doddabetta Peak', 'Nilgiri Mountain Railway'],
        bestTime: 'October to June',
        travelTip: 'Visit early in the morning for the best views and less traffic.'
    },
    madurai: {
        name: 'Madurai',
        summary: 'Madurai is one of the oldest cities in Tamil Nadu and is famous for the Meenakshi Amman Temple.',
        highlights: ['Meenakshi Amman Temple', 'Thirumalai Nayakkar Palace', 'Gandhi Memorial Museum'],
        bestTime: 'November to February',
        travelTip: 'Wear comfortable footwear because temple visits often involve a lot of walking.'
    },
    rameswaram: {
        name: 'Rameswaram',
        summary: 'Rameswaram is a holy coastal town known for its temples, bridges, and sea views.',
        highlights: ['Ramanathaswamy Temple', 'Pamban Bridge', 'Dhanushkodi'],
        bestTime: 'October to April',
        travelTip: 'Carry light cotton clothes and sunscreen for the coastal weather.'
    },
    kanyakumari: {
        name: 'Kanyakumari',
        summary: 'Kanyakumari is the southernmost tip of India where the Arabian Sea, Bay of Bengal, and Indian Ocean meet.',
        highlights: ['Vivekananda Rock Memorial', 'Thiruvalluvar Statue', 'Sunset Point'],
        bestTime: 'October to March',
        travelTip: 'Plan a sunset visit for one of the most beautiful views in India.'
    }
};

const predictRisk = async(lat, lng, time, pastIncidents = []) => {
    let riskScore = 0;
    const hour = new Date(time).getHours();
    if (hour >= 22 || hour <= 5) riskScore += 40;
    else if (hour >= 19 || hour <= 6) riskScore += 20;
    // Weather API optional – skip for now
    const nearbyIncidents = pastIncidents.filter(inc => {
        const dist = Math.hypot(inc.lat - lat, inc.lng - lng);
        return dist < 0.01;
    });
    riskScore += nearbyIncidents.length * 10;
    if (riskScore >= 50) return { risk: 'High', score: riskScore };
    if (riskScore >= 25) return { risk: 'Medium', score: riskScore };
    return { risk: 'Low', score: riskScore };
};

class AnomalyDetector {
    constructor() {
        this.userPaths = new Map();
    }
    addLocation(userId, lat, lng) {
        if (!this.userPaths.has(userId)) this.userPaths.set(userId, []);
        const path = this.userPaths.get(userId);
        path.push({ lat, lng, timestamp: Date.now() });
        if (path.length > 20) path.shift();
        return this.detectAnomaly(userId, path);
    }
    detectAnomaly(userId, path) {
        if (path.length < 3) return null;
        let totalSpeed = 0,
            angleChanges = 0;
        for (let i = 1; i < path.length; i++) {
            const prev = path[i - 1],
                curr = path[i];
            const dt = (curr.timestamp - prev.timestamp) / 1000;
            if (dt === 0) continue;
            const distance = this.haversine(prev.lat, prev.lng, curr.lat, curr.lng);
            const speed = distance / dt;
            totalSpeed += speed;
            if (i > 1) {
                const prevAngle = Math.atan2(prev.lat - path[i - 2].lat, prev.lng - path[i - 2].lng);
                const currAngle = Math.atan2(curr.lat - prev.lat, curr.lng - prev.lng);
                const angleDiff = Math.abs(prevAngle - currAngle);
                if (angleDiff > Math.PI / 2) angleChanges++;
            }
        }
        const avgSpeed = totalSpeed / (path.length - 1);
        if (avgSpeed < 0.1 && path.length > 5) {
            return { type: 'long_stop', message: 'You have stopped for a long time. Thozhan suggests moving to a safer area.' };
        }
        if (angleChanges > (path.length - 2) * 0.6) {
            return { type: 'erratic_movement', message: 'Unusual movement detected. Thozhan recommends being cautious.' };
        }
        return null;
    }
    haversine(lat1, lon1, lat2, lon2) {
        const R = 6371e3;
        const φ1 = lat1 * Math.PI / 180,
            φ2 = lat2 * Math.PI / 180;
        const Δφ = (lat2 - lat1) * Math.PI / 180,
            Δλ = (lon2 - lon1) * Math.PI / 180;
        const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }
}

const getOfflineTouristReply = (message) => {
    const msg = (message || '').toLowerCase();
    const placeName = Object.keys(offlineTouristKnowledge).find(key => msg.includes(key));

    if (placeName) {
        const place = offlineTouristKnowledge[placeName];
        return `Offline AI: ${place.name} is ${place.summary} Highlights: ${place.highlights.join(', ')}. Best time: ${place.bestTime}. Tip: ${place.travelTip}`;
    }

    if (msg.includes('place') || msg.includes('tourist') || msg.includes('travel')) {
        const knownPlaces = Object.keys(offlineTouristKnowledge).map(key => offlineTouristKnowledge[key].name).join(', ');
        return `Offline AI: I know about popular tourist places like ${knownPlaces}. Ask me about any one of them for details.`;
    }

    return 'Offline AI: I can provide offline tourist information for places such as Kodaikanal, Ooty, Madurai, Rameswaram, and Kanyakumari.';
};

const getOnlineTouristReply = (message) => {
    const msg = (message || '').toLowerCase();

    if (msg.includes('safe zone') || msg.includes('safe area')) {
        return 'Online AI: Safe zones are marked on the map and include police stations, hospitals, and public places with good security.';
    }

    if (msg.includes('danger') || msg.includes('risk')) {
        return 'Online AI: Avoid red zones, stay alert at night, and use the SOS feature if you feel unsafe.';
    }

    if (msg.includes('sos') || msg.includes('emergency')) {
        return 'Online AI: Press the SOS button to alert authorities and your emergency contacts with your live location.';
    }

    if (msg.includes('place') || msg.includes('tourist') || msg.includes('travel') || msg.includes('hotel') || msg.includes('food')) {
        return 'Online AI: I can help with tourist attractions, nearby hotels, food suggestions, travel routes, and local safety tips. Tell me what you want to know.';
    }

    return 'Online AI: I can answer your tourist and travel questions. Ask me about places, food, routes, hotels, or safety.';
};

const chatbotResponse = (message, options = {}) => {
    const mode = options.mode || 'offline';
    const msg = message || '';

    if (mode === 'online') {
        return getOnlineTouristReply(msg);
    }

    if (mode === 'offline') {
        return getOfflineTouristReply(msg);
    }

    return getOfflineTouristReply(msg);
};

module.exports = { predictRisk, AnomalyDetector, chatbotResponse, offlineTouristKnowledge };