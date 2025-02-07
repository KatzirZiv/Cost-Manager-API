/**
 * @fileoverview User model schema definition with computed pattern
 * @module models/users
 * @requires mongoose
 */

import mongoose from "mongoose";

const UserSchema = new mongoose.Schema({
    id: { type: String, required: true, unique: true },
    first_name: { type: String, required: true },
    last_name: { type: String, required: true },
    birthday: { type: Date, required: true },
    marital_status: { type: String, required: true },
    total_costs: { type: Number, default: 0 }
});

// Computed virtual fields
UserSchema.virtual('total').get(function() {
    return this.total_costs;
});

// Static method to compute total costs
UserSchema.statics.computeTotalCosts = async function(userId) {
    const result = await mongoose.model('costs').aggregate([
        { $match: { userid: String(userId) } },
        { $group: { _id: null, total: { $sum: "$sum" } } }
    ]);
    return result.length ? result[0].total : 0;
};


UserSchema.methods.updateTotalCosts = async function() {
    this.total_costs = await this.constructor.computeTotalCosts(this.id);
    return this.save();
};

// Include virtuals when converting to JSON
UserSchema.set('toJSON', { virtuals: true });
UserSchema.set('toObject', { virtuals: true });

const User = mongoose.model("users", UserSchema);
export default User;