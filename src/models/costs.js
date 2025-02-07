/**
 * @fileoverview Cost model schema definition and computed methods
 * @module models/costs
 * @requires mongoose
 */

import mongoose from "mongoose";

/**
 * Cost Schema for MongoDB
 * @typedef {Object} CostSchema
 * @property {string} description - Description of the cost
 * @property {('food'|'health'|'housing'|'sport'|'education')} category - Category of the cost
 * @property {number} sum - Amount of the cost
 * @property {string} userid - ID of the user who created the cost
 * @property {Date} created_at - Date when the cost was created
 */

const CostSchema = new mongoose.Schema({
    description: {type: String, required: true},
    category: {
        type: String,
        enum: ['food','health','housing','sport','education'],
        required: true
    },
    sum: {type: Number, required: true},
    userid: { type: String, required: true },
    created_at: {type: Date, default: Date.now},
});
/**
 * Computes the total costs for a specific month
 * @async
 * @function getMonthlyTotal
 * @param {string} userId - The ID of the user
 * @param {number} year - The year to calculate totals for
 * @param {number} month - The month to calculate totals for
 * @returns {Promise<number>} The total sum of costs for the specified month
 */

CostSchema.statics.getMonthlyTotal = async function(userId, year, month) {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59, 999);

    const costs = await this.find({
        userid: userId,
        created_at: { $gte: startDate, $lte: endDate }
    });

    return costs.reduce((total, cost) => total + cost.sum, 0);
};
/**
 * Computes totals by category for a specific month
 * @async
 * @function getCategoryTotals
 * @param {string} userId - The ID of the user
 * @param {number} year - The year to calculate totals for
 * @param {number} month - The month to calculate totals for
 * @returns {Promise<Object>} Object containing totals for each category
 */

CostSchema.statics.getCategoryTotals = async function(userId, year, month) {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59, 999);

    const costs = await this.find({
        userid: userId,
        created_at: { $gte: startDate, $lte: endDate }
    });

    return ['food', 'health', 'housing', 'sport', 'education'].reduce((acc, category) => {
        acc[category] = costs
            .filter(cost => cost.category === category)
            .reduce((total, cost) => total + cost.sum, 0);
        return acc;
    }, {});
};

const Cost = mongoose.model("costs", CostSchema);
export default Cost;