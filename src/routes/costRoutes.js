/**
 * @fileoverview Routes for cost-related endpoints
 * @module routes/costRoutes
 * @requires express
 * @requires ../controllers/costController
 */

import express from 'express';
import { addCost, getReport } from '../controllers/costController.js';
const router = express.Router();

router.post('/add', addCost);
router.get('/report', getReport);

export default router;