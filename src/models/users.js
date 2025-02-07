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
    marital_status: { type: String, required: true }
});

const User = mongoose.model("users", UserSchema);
export default User;