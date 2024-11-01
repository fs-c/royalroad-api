import assert from 'node:assert';
import { before, describe, it } from 'node:test';
import { RoyalRoadAPI } from '../src/royalroad';

describe('profile functionality', () => {
    let rr: RoyalRoadAPI;

    before(async () => {
        rr = new RoyalRoadAPI();
    });

    it('should get a user profile', async () => {
        const userId = 49921;

        const profile = await rr.profile.getProfile(userId);

        assert(profile.success);
        assert.strictEqual(profile.data.name, 'Dgeymi');
    });
});
