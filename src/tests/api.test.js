import mongoose from 'mongoose';
import request from 'supertest';
import app from '../app.js';
import Cost from '../models/costs.js';
import User from '../models/users.js';
import { MongoMemoryServer } from 'mongodb-memory-server';

describe('Cost Manager API Tests', () => {
    let mongoServer;
    let server;
    let testUser;

    beforeAll(async () => {
        mongoServer = await MongoMemoryServer.create();
        const uri = mongoServer.getUri();
        if (mongoose.connection.readyState === 0) {
            await mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true });
        }
        server = app.listen(4000);
    });

    beforeEach(async () => {
        await Cost.deleteMany({});
        await User.deleteMany({});
        // Create test user
        testUser = await User.create({
            id: "123123",
            first_name: "mosh",
            last_name: "israeli",
            birthday: new Date('1990-01-01'),
            marital_status: "single",
            total_costs: 0
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
        // Update user's total costs using computed pattern
        await testUser.updateTotalCosts();
    });

    afterEach(async () => {
        await Cost.deleteMany({});
        await User.deleteMany({});
    });

    afterAll(async () => {
        await mongoose.disconnect();
        await mongoServer.stop();
        await new Promise((resolve) => server.close(resolve));
    });

    describe('Computed Pattern Tests', () => {
        it('should correctly compute total costs for user', async () => {
            const user = await User.findOne({ id: "123123" });
            expect(user.total_costs).toBe(150);
        });

        it('should update total costs when adding new cost', async () => {
            const newCost = {
                userid: "123123",
                description: "New Cost",
                category: "food",
                sum: 75
            };

            await request(app)
                .post('/api/add')
                .send(newCost);

            const user = await User.findOne({ id: "123123" });
            expect(user.total_costs).toBe(225);
        });

        it('should compute correct monthly totals', async () => {
            const response = await request(app)
                .get('/api/report')
                .query({
                    id: '123123',
                    year: '2025',
                    month: '2'
                });

            expect(response.status).toBe(200);
            expect(response.body.summary.monthlyTotal).toBe(150);
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
        });
    });

    describe('POST /api/add', () => {
        it('should add a new cost item and update total costs', async () => {
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

            const user = await User.findOne({ id: "123123" });
            expect(user.total_costs).toBe(225);
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
    });

    describe('GET /api/users/:id', () => {
        it('should return user details with total costs', async () => {
            const response = await request(app)
                .get('/api/users/123123');

            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('first_name', 'mosh');
            expect(response.body).toHaveProperty('last_name', 'israeli');
            expect(response.body).toHaveProperty('id', '123123');
            expect(response.body).toHaveProperty('total', 150);
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