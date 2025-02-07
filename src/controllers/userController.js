/**
 * @fileoverview Controller handling user-related operations
 * @module controllers/userController
 * @requires ../models/users
 * @requires ../models/costs
 */
import User from '../models/users.js';
import Cost from '../models/costs.js';
/**
 * Retrieves user details
 * @async
 * @function getUserDetails
 * @param {Object} req - Express request object
 * @param {Object} req.params - Request parameters
 * @param {string} req.params.id - User ID
 * @param {Object} res - Express response object
 * @returns {Promise<void>}
 */

export const getUserDetails = async (req, res) => {
    try {
        const user = await User.findOne({ id: req.params.id });
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Ensure total_costs is up to date using computed pattern
        await user.updateTotalCosts();

        res.status(200).json({
            id: user.id,
            first_name: user.first_name,
            last_name: user.last_name,
            total: user.total_costs
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
/**
 * Creates a new user
 * @async
 * @function createUser
 * @param {Object} req - Express request object
 * @param {Object} req.body - Request body
 * @param {string} req.body.id - User ID
 * @param {string} req.body.first_name - First name
 * @param {string} req.body.last_name - Last name
 * @param {Date} req.body.birthday - Date of birth
 * @param {string} req.body.marital_status - Marital status
 * @param {Object} res - Express response object
 * @returns {Promise<void>}
 */

export const createUser = async (req, res) => {
    const { id, first_name, last_name, birthday, marital_status } = req.body;

    if (!id || !first_name || !last_name || !birthday || !marital_status) {
        return res.status(400).json({ error: 'Missing details!' }); // Changed from message to error
    }

    const newUser = new User({id, first_name, last_name, birthday, marital_status});

    try {
        const savedUser = await newUser.save();
        res.status(201).json(savedUser);
    } catch (error) {
        res.status(400).json({ error: error.message }); // error message
    }
};
/**
 * Returns information about the development team
 * @async
 * @function getDevelopers
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Promise<void>}
 */

export const getDevelopers = async (req, res) => {
  try {
      const team = [
          { first_name: 'Ofek', last_name: 'Drihan' },
          { first_name: 'Ziv', last_name: 'Katzir' }
      ];
      res.status(200).json(team);
  } catch (error) {
      res.status(500).json({ message: error.message });
  }
};
