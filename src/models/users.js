/**
 * @fileoverview User model schema definition and computed methods
 * @module models/users
 * @requires mongoose
 */
import mongoose from "mongoose";
/**
 * User Schema for MongoDB
 * @typedef {Object} UserSchema
 * @property {string} id - Unique identifier for the user
 * @property {string} first_name - User's first name
 * @property {string} last_name - User's last name
 * @property {Date} birthday - User's date of birth
 * @property {string} marital_status - User's marital status
 * @property {number} total_costs - Total costs accumulated by the user
 */

const UserSchema = new mongoose.Schema({
    id: { type: String, required: true, unique: true },
    first_name: { type: String, required: true},
    last_name: { type: String, required: true},
    birthday: {type: Date, required: true},
    marital_status: {type: String, required: true},
    total_costs: {type: Number, default: 0}
});
/**
 * Computes the total costs for a user
 * @async
 * @function computeTotalCosts
 * @param {string} userId - The ID of the user
 * @returns {Promise<number>} The total sum of all costs for the user
 */

//computed property for total costs
UserSchema.statics.computeTotalCosts = async function(userId) {
    const costs = await mongoose.model('costs').find({ userid: userId });
    return costs.reduce((total, cost) => total + cost.sum, 0);
};
/**
 * Updates the total costs for a user
 * @async
 * @method updateTotalCosts
 * @returns {Promise<Document>} The updated user document
 */

//Method to update total costs
UserSchema.methods.updateTotalCosts = async function() {
    this.total_costs = await this.constructor.computeTotalCosts(this.id);
    return this.save();
};

const User = mongoose.model("users", UserSchema);
export default User;