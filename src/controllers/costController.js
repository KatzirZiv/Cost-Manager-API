// controllers/costController.js
/**
 * Controller for handling cost-related operations
 * Includes functions for adding costs and generating reports
 */

import Cost from '../models/costs.js';
import User from '../models/users.js';
import mongoose from "mongoose";

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
            costs: costsArray
        });

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
