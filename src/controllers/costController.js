/**
 * @fileoverview Controller handling cost-related operations
 * @module controllers/costController
 * @requires ../models/costs
 * @requires ../models/users
 * @requires mongoose
 */
import Cost from '../models/costs.js';
import User from '../models/users.js';
import mongoose from "mongoose";
/**
 * Adds a new cost entry
 * @async
 * @function addCost
 * @param {Object} req - Express request object
 * @param {Object} req.body - Request body
 * @param {string} req.body.description - Cost description
 * @param {string} req.body.category - Cost category
 * @param {number} req.body.sum - Cost amount
 * @param {string} req.body.userid - User ID
 * @param {Date} [req.body.created_at] - Creation date
 * @param {Object} res - Express response object
 * @returns {Promise<void>}
 */

export const addCost = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const { description, category, sum, userid, created_at } = req.body;

        if (!description || !category || !sum || !userid) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        const allowedCategories = ['food', 'health', 'housing', 'sport', 'education'];
        if (!allowedCategories.includes(category)) {
            return res.status(400).json({ error: 'Invalid category' });
        }

        const newCost = new Cost({
            description,
            category,
            sum,
            userid,
            created_at: created_at || Date.now()
        });

        await newCost.save({ session });

        await User.findOneAndUpdate(
            { id: userid },
            { $inc: { total_costs: sum } },
            { session }
        );

        await session.commitTransaction();
        res.status(201).json(newCost);
    } catch (err) {
        await session.abortTransaction();
        res.status(500).json({ error: err.message });
    } finally {
        session.endSession();
    }
};
/**
 * Generates a cost report for a specific month
 * @async
 * @function getReport
 * @param {Object} req - Express request object
 * @param {Object} req.query - Query parameters
 * @param {string} req.query.id - User ID
 * @param {string} req.query.year - Year for report
 * @param {string} req.query.month - Month for report
 * @param {Object} res - Express response object
 * @returns {Promise<void>}
 */

export const getReport = async (req, res) => {
    try {
        const { id, year, month } = req.query;

        if (!id || !year || !month) {
            return res.status(400).json({
                error: 'Missing required parameters'
            });
        }

        const yearNum = parseInt(year);
        const monthNum = parseInt(month);

        if (isNaN(yearNum) || isNaN(monthNum) || monthNum < 1 || monthNum > 12) {
            return res.status(400).json({ error: 'Invalid year or month format' });
        }

        // Using computed properties to get totals
        const monthlyTotal = await Cost.getMonthlyTotal(id, yearNum, monthNum);
        const categoryTotals = await Cost.getCategoryTotals(id, yearNum, monthNum);

        const startDate = new Date(yearNum, monthNum - 1, 1);
        const endDate = new Date(yearNum, monthNum, 0, 23, 59, 59, 999);

        const costs = await Cost.find({
            userid: id,
            created_at: { $gte: startDate, $lte: endDate }
        });

        const categories = ['food', 'health', 'housing', 'sport', 'education'];
        const costsArray = categories.map(category => ({
            [category]: costs
                .filter(cost => cost.category === category)
                .map(cost => ({
                    sum: cost.sum,
                    description: cost.description,
                    day: new Date(cost.created_at).getDate()
                }))
        }));

        res.json({
            userid: id,
            year: yearNum,
            month: monthNum,
            costs: costsArray,
            summary: {
                monthlyTotal,
                categoryTotals
            }
        });

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
