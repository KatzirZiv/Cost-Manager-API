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

// Validate input for adding a cost
const validateCostInput = (description, category, sum, userid) => {
    const errors = {
        missingFields: [],
        invalidCategory: false
    };

    // Convert userid to string
    const userIdStr = String(userid);

    // Check for empty or missing fields
    if (!description || description.trim() === '') {
        errors.missingFields.push('Description is required');
    }

    if (!userIdStr || userIdStr.trim() === '') {
        errors.missingFields.push('User ID is required');
    }

    if (!sum || typeof sum !== 'number' || sum <= 0) {
        errors.missingFields.push('Sum must be a positive number');
    }

    // Validate category
    const allowedCategories = ['food', 'health', 'housing', 'sport', 'education'];
    if (!category) {
        errors.missingFields.push('Category is required');
    } else if (!allowedCategories.includes(category)) {
        errors.invalidCategory = true;
    }

    return errors;
};

// Add a new cost item
export const addCost = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        // Convert userid to string
        const userid = String(req.body.userid);
        const { description, category, sum, created_at } = req.body;

        // Validate input
        const validationResult = validateCostInput(description, category, sum, userid);

        // Check for invalid category first
        if (validationResult.invalidCategory) {
            return res.status(400).json({
                error: 'Invalid category'
            });
        }

        // Then check for missing fields
        if (validationResult.missingFields.length > 0) {
            return res.status(400).json({
                error: 'Missing required fields',
                details: validationResult.missingFields
            });
        }

        // Check if user exists
        const user = await User.findOne({ id: userid }).session(session);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Create and save new cost entry
        const newCost = new Cost({
            description: description.trim(),
            category,
            sum,
            userid,
            created_at: created_at || Date.now()
        });

        await newCost.save({ session });

        await session.commitTransaction();
        res.status(201).json(newCost);
    } catch (err) {
        await session.abortTransaction();

        // Handle specific error types
        if (err.name === 'ValidationError') {
            return res.status(400).json({
                error: 'Validation failed',
                details: Object.values(err.errors).map(e => e.message)
            });
        }

        // Generic server error
        res.status(500).json({
            error: 'Internal server error',
            message: err.message
        });
    } finally {
        await session.endSession();
    }
};

// Generate a cost report for a specific month and year
export const getReport = async (req, res) => {
    try {
        const { id, year, month } = req.query;

        // Convert id to string
        const userIdStr = String(id);

        // Validate input parameters
        const validationErrors = [];

        // Validate user ID
        if (!userIdStr || userIdStr.trim() === '') {
            validationErrors.push('User ID is required');
        }

        // Validate year
        const yearNum = parseInt(year);
        if (isNaN(yearNum) || yearNum < 1900 || yearNum > 2100) {
            validationErrors.push('Invalid year format');
        }

        // Validate month
        const monthNum = parseInt(month);
        if (isNaN(monthNum) || monthNum < 1 || monthNum > 12) {
            validationErrors.push('Invalid month format');
        }

        // Return validation errors if any
        if (validationErrors.length > 0) {
            return res.status(400).json({
                error: 'Validation failed',
                details: validationErrors
            });
        }

        // Verify user exists
        const user = await User.findOne({ id: userIdStr });
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Create date range for the specific month
        const startDate = new Date(yearNum, monthNum - 1, 1);
        const endDate = new Date(yearNum, monthNum, 0, 23, 59, 59, 999);

        // Define all possible categories
        const categories = ['food', 'health', 'housing', 'sport', 'education'];

        // Aggregate to get totals for each category
        const results = await Cost.aggregate([
            {
                $match: {
                    userid: userIdStr,
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

        // Prepare category totals with all categories
        const categoryTotals = {};
        const costsArray = [];

        // Initialize all categories with 0 total
        categories.forEach(category => {
            const categoryData = results.find(r => r._id === category);
            categoryTotals[category] = categoryData ? categoryData.total : 0;
            costsArray.push({ [category]: categoryData ? categoryData.items : [] });
        });

        // Calculate monthly total
        const monthlyTotal = Object.values(categoryTotals).reduce((a, b) => a + b, 0);

        // Return comprehensive report
        res.json({
            userid: userIdStr,
            year: yearNum,
            month: monthNum,
            summary: {
                monthlyTotal: monthlyTotal,
                totalCosts: monthlyTotal,
                categoryTotals: categoryTotals
            },
            costs: costsArray
        });

    } catch (error) {
        // Handle any unexpected errors
        res.status(500).json({
            error: 'Internal server error',
            message: error.message
        });
    }
};