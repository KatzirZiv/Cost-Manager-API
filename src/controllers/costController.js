// controllers/costController.js
/**
 * Controller for handling cost-related operations
 * Includes functions for adding costs and generating reports
 */

import Cost from '../models/costs.js';
import User from '../models/users.js';

export const addCost = async (req, res) => {
    try {
        const { description, category, sum, userid, created_at } = req.body;

        if (!description || !category || !sum || !userid) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        const allowedCategories = ['food', 'health', 'housing', 'sport', 'education'];
        if (!allowedCategories.includes(category)) {
            return res.status(400).json({ error: 'Invalid category' });
        }

        const newCost = new Cost({ description, category, sum, userid, created_at: Date.now() });
        const savedCost = await newCost.save();
        res.status(201).json(savedCost);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

export const getReport = async (req, res) => {
  try {
      // Extract query parameters
      const { id, year, month } = req.query;

      // Validate required parameters
      if (!id || !year || !month) {
          return res.status(400).json({
              error: 'Missing required parameters. Please provide id, year, and month.'
          });
      }

      // Convert parameters to appropriate types
      const userId = id;
      const yearNum = parseInt(year);
      const monthNum = parseInt(month);

      // Validate year and month
      if (isNaN(yearNum) || isNaN(monthNum) || 
          monthNum < 1 || monthNum > 12) {
          return res.status(400).json({
              error: 'Invalid year or month format'
          });
      }

      // Calculate start and end dates for the specified month
      const startDate = new Date(yearNum, monthNum - 1, 1);
      const endDate = new Date(yearNum, monthNum, 0, 23, 59, 59, 999);

      // Query the database for costs
      const costs = await Cost.find({
          userid: userId,
          created_at: { $gte: startDate, $lte: endDate }
      });

      // Initialize categories object
      const categories = {
          food: [],
          health: [],
          housing: [],
          sport: [],
          education: []
      };

      // Group costs by category
      costs.forEach(cost => {
          if (categories.hasOwnProperty(cost.category)) {
              categories[cost.category].push({
                  sum: cost.sum,
                  description: cost.description,
                  day: new Date(cost.created_at).getDate()
              });
          }
      });

      // Format response
      const response = {
          userid: userId,
          year: yearNum,
          month: monthNum,
          costs: Object.keys(categories).map(category => ({
              [category]: categories[category]
          }))
      };

      res.json(response);

  } catch (error) {
      console.error('Error generating monthly report:', error);
      res.status(500).json({
          error: 'Internal server error while generating monthly report',
          details: error.message
      });
  }
};
