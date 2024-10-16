const express = require("express");
const router = express.Router();
const { MongoClient } = require('mongodb');
const { ObjectId } = require('mongodb');
require('dotenv').config();

const url = process.env.MONGO_URL; // MongoDB URL
const client = new MongoClient(url);
const dbName = 'HTM';

// Route to get all products with optional filtering
router.get('/products', async (req, res) => {
    try {
        // Connect to MongoDB
        await client.connect();
        const db = client.db(dbName);
        const collection = db.collection('products');

        // Get the query parameters for filtering
        const { skintypefor } = req.query;
        let filter = {};

    
        // If there are skintypefor values in the query, filter based on them
        if (skintypefor) {
            const skintypeArray = skintypefor.split(',').map(type => type.trim());
            filter.skintypefor = { $in: skintypeArray };
        }

        // Find all products matching the filter (if any) or return all products
        const products = await collection.find(filter).toArray();

        // Respond with the list of products
        res.status(200).json({ products });

    } catch (e) {
        console.log(`Error fetching products: ${e}`);
        res.status(500).json({ message: 'Error fetching products', error: e.message });
    } finally {
        // Close the MongoDB connection after query
        await client.close();
    }
});
router.get('/view-product/:productId', async (req, res) => {
    try {
        // Connect to MongoDB
        await client.connect();
        const db = client.db(dbName);
        const collection = db.collection('products');

        // Get the product ID from the request parameters
        const { productId } = req.params;

        // Find the product by its ID
        const product = await collection.findOne({ _id: new ObjectId(productId) });

        // If the product is not found, return a 404 error
        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }

        // Respond with the product data
        res.status(200).json({ product });

    } catch (e) {
        console.log(`Error fetching product: ${e}`);
        res.status(500).json({ message: 'Error fetching product', error: e.message });
    } finally {
        // Close the MongoDB connection after query
        await client.close();
    }
});

module.exports = router;