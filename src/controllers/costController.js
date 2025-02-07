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

        // Create and save new cost entry
        const newCost = new Cost({
            description,
            category,
            sum,
            userid,
            created_at: created_at || Date.now()
        });

        await newCost.save({ session });

        // Find user and update their total costs
        const user = await User.findOne({ id: userid }).session(session);
        if (user) {
            // Update total_costs directly and save
            user.total_costs += sum;
            await user.save({ session });
        }

        await session.commitTransaction();
        res.status(201).json(newCost);
    } catch (err) {
        await session.abortTransaction();
        res.status(500).json({ error: err.message });
    } finally {
        await session.endSession();
    }
};

export const getReport = async (req, res) => {
    try {
        const { id, year, month } = req.query;

        if (!id || !year || !month) {
            return res.status(400).json({ error: 'Missing required parameters' });
        }

        const yearNum = parseInt(year);
        const monthNum = parseInt(month);

        if (isNaN(yearNum) || isNaN(monthNum) || monthNum < 1 || monthNum > 12) {
            return res.status(400).json({ error: 'Invalid year or month format' });
        }

        // Use the static method from the Cost model
        const report = await Cost.getCategoryTotals(id, yearNum, monthNum);

        res.json({
            userid: id,
            year: yearNum,
            month: monthNum,
            summary: {
                monthlyTotal: report.monthlyTotal,
                categoryTotals: report.categoryTotals
            },
            costs: report.costs
        });

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};