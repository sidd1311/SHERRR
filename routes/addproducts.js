const express = require("express");
const router = express.Router();
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const authMiddleware = require('../middlewares/authMiddleware');
const { MongoClient } = require('mongodb');
require('dotenv').config();

const url = process.env.MONGO_URL; // MongoDB URL
const client = new MongoClient(url);
const dbName = 'HTM';

// Configure Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

// Configure Multer to use Cloudinary for storage
const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'product_images', // Folder name in Cloudinary
        allowed_formats: ['jpg', 'jpeg', 'png'], // Allowed image formats
    },
});

const upload = multer({ storage: storage });

router.post('/add-product', authMiddleware, upload.single('image'), async (req, res) => {
    const { title, price, description, tags, skintypefor } = req.body;
    const trimmedType = typeof skintypefor === 'string' ? skintypefor.split(',').map(type => type.trim()) : [];

    try {
        const admin = req.admin;
        if (!admin) {
            return res.status(403).json({ message: "Unauthorized to add new products" });
        }

        const imageUrl = req.file ? req.file.path : null; // Get Cloudinary URL

        await client.connect();
        const db = client.db(dbName);
        const collection = db.collection('products');

        const newProduct = {
            title,
            price,
            description,
            tags: tags,
            skintypefor: trimmedType,
            imageUrl: imageUrl, // Save image URL in the product data
            createdAt: new Date()
        };

        const result = await collection.insertOne(newProduct);
        res.status(201).json({ message: 'Product added successfully', result });

    } catch (e) {
        console.log(`Error: ${e}`);
        res.status(400).json({ message: 'Error adding product', error: e.message });
    } finally {
        await client.close(); // Ensure the DB connection is closed after the operation
    }
});

module.exports = router;