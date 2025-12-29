import request from 'supertest';
import { app, server } from '../app.js';
import mongoose from 'mongoose';

// Mock mongoose to prevent actual DB connection attempts if not desired initially
// or we can allow it if we want integration tests.
// For this smoke test, we'll see if the app boots.

describe('Server Smoke Tests', () => {
    beforeAll((done) => {
        server.listen(0, () => done());
    });

    afterAll((done) => {
        // Close server and DB connection
        server.close(() => {
            mongoose.connection.close().then(() => done());
        });
    });

    // it('GET /debug/status should return 200 and status online', async () => {
    //     const res = await request(app).get('/debug/status');
    //     expect(res.statusCode).toEqual(200);
    //     expect(res.body.status).toEqual('online');
    // });

    it('GET /non-existent-route should return 404', async () => {
        const res = await request(app).get('/api/does-not-exist');
        expect(res.statusCode).toEqual(404);
    });

    it('GET /non-existent-route should return 404', async () => {
        const res = await request(app).get('/api/does-not-exist');
        expect(res.statusCode).toEqual(404);
    });
});
