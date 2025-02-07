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
    sum: {
        type: Number,
        required: true,
        validate: {
            validator: function(v) {
                return v > 0;
            },
            message: 'Sum must be positive'
        }
    },
    userid: { type: String, required: true, index: true },
    created_at: { type: Date, default: Date.now, index: true }
});

const Cost = mongoose.model("costs", CostSchema);
export default Cost;