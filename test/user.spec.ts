import { describe, it, before } from 'node:test';
import assert from 'node:assert';
import { RoyalRoadAPI } from '../src/royalroad.js';

describe('user login', () => {
    it('should fail with incorrect credentials ', async () => {
        const rr = new RoyalRoadAPI();

        await assert.rejects(rr.user.login('nonexistent@email.gov', 'wrong-password'));

        assert.strictEqual(rr.user.isLoggedIn, false);
    });

    it('should succeed with correct credentials', async () => {
        if (!process.env.TEST_USER_EMAIL || !process.env.TEST_USER_PASSWORD) {
            throw new Error('TEST_USER_EMAIL and TEST_USER_PASSWORD env variables must be set');
        }

        const rr = new RoyalRoadAPI();
        const response = await rr.user.login(
            process.env.TEST_USER_EMAIL,
            process.env.TEST_USER_PASSWORD,
        );

        assert.strictEqual(response.success, true);
        assert.strictEqual(rr.user.isLoggedIn, true);
    });
});

describe('user functionality', () => {
    let rr: RoyalRoadAPI;

    before(async () => {
        if (!process.env.TEST_USER_EMAIL || !process.env.TEST_USER_PASSWORD) {
            throw new Error('TEST_USER_EMAIL and TEST_USER_PASSWORD env variables must be set');
        }

        rr = new RoyalRoadAPI();
        await rr.user.login(process.env.TEST_USER_EMAIL, process.env.TEST_USER_PASSWORD);
    });

    it('should get user fictions', async () => {
        const fictions = await rr.user.getMyFictions();

        assert(fictions.success);
        assert(fictions.data.length > 0);
    });

    it('should get user follows', async () => {
        const follows = await rr.user.getMyFollows();

        assert(follows.success);
        assert(follows.data.length > 0);
    });

    it('should get user notifications', async () => {
        const notifications = await rr.user.getNotifications();

        assert(notifications.success);
        assert(notifications.data.length > 0);
    });
});
