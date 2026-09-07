const mongoose = require('mongoose');
const Zone = require('./models/Zone');
const dns = require('dns');
try { dns.setServers(['8.8.8.8', '1.1.1.1']); } catch(e) {}
require('dotenv').config();

const makePoly = (lat, lng, offset = 0.006) => [
    [lat - offset, lng - offset],
    [lat + offset, lng - offset],
    [lat + offset, lng + offset],
    [lat - offset, lng + offset],
    [lat - offset, lng - offset]
];

const zones = [
    {
        name: 'Kanthalloor Waterfalls',
        riskScore: 65,
        riskLevel: 'HIGH 🟠',
        reason: '500m narrow downhill trail, mud + boulders; after rain slippery (Kerala Tourism)',
        center: { lat: 10.2085, lng: 77.1950 },
        coordinates: makePoly(10.2085, 77.1950),
        type: 'danger',
        level: 'danger'
    },
    {
        name: 'Iraichilpara Waterfalls',
        riskScore: 75,
        riskLevel: 'VERY HIGH 🔴',
        reason: 'Slippery rocks + falling/water-related accident risk (ManoramaOnline)',
        center: { lat: 10.0520, lng: 77.0680 },
        coordinates: makePoly(10.0520, 77.0680),
        type: 'danger',
        level: 'danger'
    },
    {
        name: 'Mattupetty',
        riskScore: 55,
        riskLevel: 'HIGH 🟠',
        reason: 'Water/boating + crowd/traffic related risk',
        center: { lat: 10.1054, lng: 77.1232 },
        coordinates: makePoly(10.1054, 77.1232),
        type: 'danger',
        level: 'danger'
    },
    {
        name: 'Echo Point',
        riskScore: 55,
        riskLevel: 'HIGH 🟠',
        reason: 'Steep/rocky terrain and crowd/traffic; trekking needs caution (Iris Holidays)',
        center: { lat: 10.1130, lng: 77.1472 },
        coordinates: makePoly(10.1130, 77.1472),
        type: 'danger',
        level: 'danger'
    },
    {
        name: 'Munnar',
        riskScore: 45,
        riskLevel: 'MODERATE 🟡',
        reason: 'Hill terrain, changing weather, trekking/forest conditions',
        center: { lat: 10.0889, lng: 77.0595 },
        coordinates: makePoly(10.0889, 77.0595),
        type: 'warning',
        level: 'warning'
    },
    {
        name: 'Marayoor',
        riskScore: 40,
        riskLevel: 'MODERATE 🟡',
        reason: 'Waterfall/forest terrain depending on exact location',
        center: { lat: 10.2745, lng: 77.1610 },
        coordinates: makePoly(10.2745, 77.1610),
        type: 'warning',
        level: 'warning'
    },
    {
        name: 'Bhramaram View Point',
        riskScore: 40,
        riskLevel: 'MODERATE 🟡',
        reason: 'Viewpoint/terrain + weather',
        center: { lat: 10.2180, lng: 77.1850 },
        coordinates: makePoly(10.2180, 77.1850),
        type: 'warning',
        level: 'warning'
    },
    {
        name: 'Murugamalai View Point',
        riskScore: 35,
        riskLevel: 'MODERATE 🟡',
        reason: 'Hill terrain/weather',
        center: { lat: 10.2250, lng: 77.1900 },
        coordinates: makePoly(10.2250, 77.1900),
        type: 'warning',
        level: 'warning'
    },
    {
        name: 'Kilanthoor View Point',
        riskScore: 35,
        riskLevel: 'MODERATE 🟡',
        reason: 'Hill terrain/weather',
        center: { lat: 10.2450, lng: 77.2020 },
        coordinates: makePoly(10.2450, 77.2020),
        type: 'warning',
        level: 'warning'
    },
    {
        name: 'Honey Rock',
        riskScore: 35,
        riskLevel: 'MODERATE 🟡',
        reason: 'Natural terrain',
        center: { lat: 10.2120, lng: 77.1890 },
        coordinates: makePoly(10.2120, 77.1890),
        type: 'warning',
        level: 'warning'
    },
    {
        name: 'Jaggery Unit Factory',
        riskScore: 15,
        riskLevel: 'LOW 🟢',
        reason: 'Normal visitor/industrial safety',
        center: { lat: 10.2710, lng: 77.1580 },
        coordinates: makePoly(10.2710, 77.1580),
        type: 'warning',
        level: 'warning'
    },
    {
        name: 'Strawberry Farm',
        riskScore: 10,
        riskLevel: 'LOW 🟢',
        reason: 'Normal farm environment',
        center: { lat: 10.2100, lng: 77.1920 },
        coordinates: makePoly(10.2100, 77.1920),
        type: 'warning',
        level: 'warning'
    },
    {
        name: 'Alappuzha Backwaters',
        riskScore: 50,
        riskLevel: 'HIGH 🟠',
        reason: 'Boat/water-related risk',
        center: { lat: 9.4981, lng: 76.3388 },
        coordinates: makePoly(9.4981, 76.3388),
        type: 'danger',
        level: 'danger'
    },
    {
        name: 'Alappuzha Beach',
        riskScore: 50,
        riskLevel: 'HIGH 🟠',
        reason: 'Sea/water + weather conditions',
        center: { lat: 9.4912, lng: 76.3219 },
        coordinates: makePoly(9.4912, 76.3219),
        type: 'danger',
        level: 'danger'
    }
];

async function seed() {
    try {
        const mongoURI = process.env.MONGODB_URI || process.env.MONGO_URI;
        await mongoose.connect(mongoURI);
        await Zone.deleteMany({});
        await Zone.insertMany(zones);
        console.log(`✅ Successfully seeded ${zones.length} Geofenced Danger/Tourist Zones!`);
        process.exit(0);
    } catch (err) {
        console.error('❌ Seeding error:', err);
        process.exit(1);
    }
}

seed();
