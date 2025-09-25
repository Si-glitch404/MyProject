const Listing = require("../models/listing");
const geocoder = require("../utils/geocoder");

module.exports.index = async (req, res) => {
    const allListings = await Listing.find({});
    res.render("listings/index.ejs", { allListings });
};

module.exports.renderNewForm = (req, res) => {
    res.render("listings/new.ejs");
};

module.exports.showListing = async (req, res) => {
    const { id } = req.params;
    const listing = await Listing.findById(id)
        .populate({ path: "reviews", populate: { path: "author" } })
        .populate("owner");
    if (!listing) {
        req.flash("error", "Listing you requested for does not exist");
        return res.redirect("/listings");
    }
    res.render("listings/show.ejs", { listing });
};

module.exports.createListing = async (req, res) => {
    const { listing } = req.body;

    // Geocode location
    const geoData = await geocoder.geocode(listing.location);
    if (!geoData || geoData.length === 0) {
        req.flash("error", "Invalid location!");
        return res.redirect("/listings/new");
    }

    const newListing = new Listing(listing);
    newListing.owner = req.user._id;
    newListing.geometry = {
        type: "Point",
        coordinates: [geoData[0].longitude, geoData[0].latitude],
    };

    if (req.file) {
        newListing.image = { url: req.file.path, filename: req.file.filename };
    }

    await newListing.save();
    req.flash("success", "New Listing Created!");
    res.redirect("/listings");
};

module.exports.renderEditForm = async (req, res) => {
    const { id } = req.params;
    const listing = await Listing.findById(id);
    if (!listing) {
        req.flash("error", "Listing you requested for does not exist");
        return res.redirect("/listings");
    }

    let originalImageUrl = listing.image.url;
    originalImageUrl = originalImageUrl.replace("/upload", "/upload/w_250");
    res.render("listings/edit.ejs", { listing, originalImageUrl });
};

module.exports.updateListing = async (req, res) => {
    const { id } = req.params;
    const { listing } = req.body;

    // Geocode updated location
    const geoData = await geocoder.geocode(listing.location);
    const updatedData = { ...listing };
    if (geoData && geoData.length > 0) {
        updatedData.geometry = {
            type: "Point",
            coordinates: [geoData[0].longitude, geoData[0].latitude],
        };
    }

    const updatedListing = await Listing.findByIdAndUpdate(id, updatedData, { new: true });

    if (req.file) {
        updatedListing.image = { url: req.file.path, filename: req.file.filename };
        await updatedListing.save();
    }

    req.flash("success", "Listing Updated!");
    res.redirect(`/listings/${id}`);
};

module.exports.deleteListing = async (req, res) => {
    const { id } = req.params;
    await Listing.findByIdAndDelete(id);
    req.flash("success", "Listing Deleted!");
    res.redirect("/listings");
};
