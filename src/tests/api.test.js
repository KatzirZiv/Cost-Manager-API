import mongoose from 'mongoose';
import request from 'supertest';
import app from '../app.js';
import Cost from '../models/costs.js';
import User from '../models/users.js';

// Use the actual MongoDB connection string
const URL = "mongodb+srv://katzirziv:CrCSJlK46P4jJl3g@cluster0.pgid0.mongodb.net/cost-manager";

describe('Cost Manager API Tests', () => {
    beforeAll(async () => {
        // Connect to the actual MongoDB database
        await mongoose.connect(URL, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
    });

    beforeEach(async () => {
        // Clear existing data for the test user
        await User.deleteMany({ id: "123123" });
        await Cost.deleteMany({ userid: "123123" });

        // Create test user
        await User.create({
            id: "123123",
            first_name: "mosh",
            last_name: "israeli",
            birthday: new Date('1990-01-01'),
            marital_status: "single"
        });

        // Create initial costs
        await Cost.create([
            {
                userid: "123123",
                description: "Test Food",
                category: "food",
                sum: 50,
                created_at: new Date('2025-02-15')
            },
            {
                userid: "123123",
                description: "Test Health",
                category: "health",
                sum: 100,
                created_at: new Date('2025-02-15')
            }
        ]);
    });

    it('ensures test user and costs are set up', async () => {
        // Verify user exists
        const user = await User.findOne({ id: "123123" });
        expect(user).toBeTruthy();

        // Verify costs exist
        const costs = await Cost.find({ userid: "123123" });
        expect(costs.length).toBe(2);
    });

    afterAll(async () => {
        // Disconnect from the database
        await mongoose.disconnect();
    });
    describe('Computed Pattern Tests', () => {
        it('should correctly compute total costs for user in a specific month', async () => {
            // Directly query the database to check total costs
            const totalCosts = await Cost.aggregate([
                {
                    $match: {
                        userid: "123123",
                        created_at: {
                            $gte: new Date('2025-02-01'),
                            $lte: new Date('2025-02-29')
                        }
                    }
                },
                {
                    $group: {
                        _id: null,
                        total: { $sum: "$sum" }
                    }
                }
            ]);

            expect(totalCosts[0].total).toBe(150);
        });

        it('should compute correct monthly totals in report', async () => {
            const response = await request(app)
                .get('/api/report')
                .query({
                    id: '123123',
                    year: '2025',
                    month: '2'
                });

            expect(response.status).toBe(200);
            expect(response.body.summary.monthlyTotal).toBe(150);
            expect(response.body.summary.totalCosts).toBe(150);
            expect(response.body.summary.categoryTotals).toEqual({
                food: 50,
                health: 100,
                housing: 0,
                sport: 0,
                education: 0
            });
        });
    });

    describe('GET /api/report', () => {
        it('should return monthly report with computed totals', async () => {
            const response = await request(app)
                .get('/api/report')
                .query({
                    id: '123123',
                    year: '2025',
                    month: '2'
                });

            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('userid', '123123');
            expect(response.body).toHaveProperty('year', 2025);
            expect(response.body).toHaveProperty('month', 2);
            expect(response.body).toHaveProperty('summary');
            expect(response.body.summary).toHaveProperty('monthlyTotal');
            expect(response.body.summary).toHaveProperty('categoryTotals');
            expect(response.body.summary).toHaveProperty('totalCosts', 150);

            const foodCategory = response.body.costs.find(
                item => Object.keys(item)[0] === 'food'
            );
            expect(foodCategory.food[0]).toHaveProperty('sum', 50);
            expect(foodCategory.food[0]).toHaveProperty('description', 'Test Food');
        });

        it('should return 400 when missing parameters', async () => {
            const response = await request(app)
                .get('/api/report')
                .query({ id: '123123', year: '2025' });

            expect(response.status).toBe(400);
            expect(response.body).toHaveProperty('error', 'Validation failed');
        });

        it('should return 404 when user does not exist', async () => {
            const response = await request(app)
                .get('/api/report')
                .query({
                    id: '999999',
                    year: '2025',
                    month: '2'
                });

            expect(response.status).toBe(404);
            expect(response.body).toHaveProperty('error', 'User not found');
        });
    });

    describe('POST /api/add', () => {
        it('should add a new cost item', async () => {
            const newCost = {
                userid: "123123",
                description: "New Cost",
                category: "food",
                sum: 75
            };

            const response = await request(app)
                .post('/api/add')
                .send(newCost);

            expect(response.status).toBe(201);
            expect(response.body).toHaveProperty('description', 'New Cost');
            expect(response.body).toHaveProperty('sum', 75);
            expect(response.body).toHaveProperty('category', 'food');
            expect(response.body).toHaveProperty('created_at');

            // Verify total costs for the specific month
            const totalCosts = await Cost.aggregate([
                {
                    $match: {
                        userid: "123123",
                        created_at: {
                            $gte: new Date('2025-02-01'),
                            $lte: new Date('2025-02-29')
                        }
                    }
                },
                {
                    $group: {
                        _id: null,
                        total: { $sum: "$sum" }
                    }
                }
            ]);

            expect(totalCosts[0].total).toBe(225);
        });

        it('should return 400 for invalid category', async () => {
            const invalidCost = {
                userid: "123123",
                description: "Invalid Category",
                category: "invalid",
                sum: 75
            };

            const response = await request(app)
                .post('/api/add')
                .send(invalidCost);

            expect(response.status).toBe(400);
            expect(response.body).toHaveProperty('error', 'Invalid category');
        });

        it('should return 400 for missing required fields', async () => {
            const incompleteCost = {
                userid: "123123",
                description: "Incomplete",
                category: "food"
            };

            const response = await request(app)
                .post('/api/add')
                .send(incompleteCost);

            expect(response.status).toBe(400);
            expect(response.body).toHaveProperty('error', 'Missing required fields');
        });

        it('should return 400 for zero or negative sum', async () => {
            const invalidCost = {
                userid: "123123",
                description: "Invalid Sum",
                category: "food",
                sum: 0
            };

            const response = await request(app)
                .post('/api/add')
                .send(invalidCost);

            expect(response.status).toBe(400);
            expect(response.body).toHaveProperty('error', 'Missing required fields');
        });
    });

    describe('GET /api/users/:id', () => {
        it('should return user details', async () => {
            const response = await request(app)
                .get('/api/users/123123');

            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('first_name', 'mosh');
            expect(response.body).toHaveProperty('last_name', 'israeli');
            expect(response.body).toHaveProperty('id', '123123');
        });

        it('should return 404 for non-existent user', async () => {
            const response = await request(app)
                .get('/api/users/999999');

            expect(response.status).toBe(404);
            expect(response.body).toHaveProperty('error', 'User not found');
        });
    });

    describe('GET /api/about', () => {
        it('should return team members information', async () => {
            const response = await request(app)
                .get('/api/about');

            expect(response.status).toBe(200);
            expect(Array.isArray(response.body)).toBe(true);

            response.body.forEach(member => {
                expect(member).toHaveProperty('first_name');
                expect(member).toHaveProperty('last_name');
                expect(Object.keys(member).length).toBe(2);
            });
        });
    });
});