// // utils/geocoder.js
const NodeGeocoder = require("node-geocoder");

const options = {
  provider: "openstreetmap",   // free geocoding
  httpAdapter: "https",         // use https
  formatter: null,              // default formatting
  // Add custom HTTP headers to comply with OSM's usage policy
  headers: {
    "User-Agent": `WanderlustApp/1.0 (${process.env.GEOCODER_EMAIL})`
  },
};

const geocoder = NodeGeocoder(options);

module.exports = geocoder;
