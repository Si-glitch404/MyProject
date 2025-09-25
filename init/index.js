const mongoose = require("mongoose");
const initData = require("./data.js");
const Listing = require("../models/listing.js");
const geocoder = require("../utils/geocoder");

const MONGO_URL = "mongodb://127.0.0.1:27017/wanderlust";

main().then(() => {
    console.log("connected to DB");
}).catch((err) => {
    console.log(err);
});

async function main() {
    await mongoose.connect(MONGO_URL);
};

const initDB = async () => {
    await Listing.deleteMany({});
    initData.data = await Promise.all(
        initData.data.map(async (obj) => {
            const geoData = await geocoder.geocode(obj.location); 
            return {
                ...obj,
                owner: "68c8e456155b5d3b7f7bb193",
                geometry: geoData && geoData.length > 0
                    ? {
                        type: "Point",
                        coordinates: [geoData[0].longitude, geoData[0].latitude],
                      }
                    : undefined
            };
        })
    );
    await Listing.insertMany(initData.data);
    console.log("data was initialized");
};

initDB();
