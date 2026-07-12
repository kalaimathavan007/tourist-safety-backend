const mongoose = require('mongoose');
const Zone = require('./models/Zone');
require('dotenv').config();

// Helper to close polygon
const closePolygon = (coords) => {
    const first = coords[0];
    const last = coords[coords.length - 1];
    if (first[0] !== last[0] || first[1] !== last[1]) {
        coords.push([first[0], first[1]]);
    }
    return coords;
};

const zones = [{
        name: 'Beach Warning Zone (Marina)',
        coordinates: closePolygon([
            [13.045, 80.278],
            [13.050, 80.282],
            [13.048, 80.288],
            [13.040, 80.285],
            [13.042, 80.280]
        ]),
        type: 'warning',
        level: 'warning'
    },
    {
        name: 'High Crime Danger Zone (T Nagar)',
        coordinates: closePolygon([
            [13.035, 80.240],
            [13.040, 80.245],
            [13.038, 80.250],
            [13.030, 80.248],
            [13.032, 80.242]
        ]),
        type: 'danger',
        level: 'danger'
    },
    {
        name: 'Railway Track Danger Zone',
        coordinates: closePolygon([
            [13.080, 80.270],
            [13.085, 80.275],
            [13.082, 80.280],
            [13.075, 80.278]
        ]),
        type: 'danger',
        level: 'danger'
    }
];

async function seed() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        await Zone.deleteMany({});
        await Zone.insertMany(zones);
        console.log('✅ Zones seeded (closed polygons)');
        process.exit();
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

seed();