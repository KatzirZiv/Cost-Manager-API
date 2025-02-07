/**
 * @fileoverview Cost model schema definition
 * @module models/costs
 * @requires mongoose
 */

import mongoose from "mongoose";

const CostSchema = new mongoose.Schema({
    description: { type: String, required: true },
    category: {
        type: String,
        enum: ['food', 'health', 'housing', 'sport', 'education'],
        required: true
    },
    sum: { type: Number, required: true },
    userid: { type: String, required: true, index: true },
    created_at: { type: Date, default: Date.now, index: true }
});

// Define the static method for getCategoryTotals
CostSchema.statics.getCategoryTotals = async function(userId, year, month) {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59, 999);

    const results = await this.aggregate([
        {
            $match: {
                userid: userId,
                created_at: { $gte: startDate, $lte: endDate }
            }
        },
        {
            $group: {
                _id: "$category",
                total: { $sum: "$sum" },
                items: { $push: "$$ROOT" }
            }
        }
    ]);

    // Initialize all categories
    const categories = ['food', 'health', 'housing', 'sport', 'education'];
    const categoryTotals = {};
    const costsArray = [];

    // Process each category
    categories.forEach(category => {
        const categoryData = results.find(r => r._id === category) || { total: 0, items: [] };
        categoryTotals[category] = categoryData.total;
        costsArray.push({ [category]: categoryData.items });
    });

    return {
        monthlyTotal: Object.values(categoryTotals).reduce((a, b) => a + b, 0),
        categoryTotals,
        costs: costsArray
    };
};

const Cost = mongoose.model("costs", CostSchema);
export default Cost;