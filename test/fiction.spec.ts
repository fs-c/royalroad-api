import assert from 'assert';
import { describe, before, it } from 'node:test';
import { RoyalRoadAPI } from '../src/royalroad';

describe('fiction functionality', () => {
    let rr: RoyalRoadAPI;

    before(async () => {
        rr = new RoyalRoadAPI();
    });

    it('should get a fiction', async () => {
        const fictionId = 9685;
        const expectedFictionTitle = 'Pantheon: Online';
        const expectedFictionAuthorId = 49920;

        const fiction = await rr.fiction.getFiction(fictionId);

        assert(fiction.success);
        assert.strictEqual(fiction.data.title, expectedFictionTitle);
        assert.strictEqual(fiction.data.author.id, expectedFictionAuthorId);
        assert(fiction.data.description.length !== 0)
    });

    it('should get a random fiction', async () => {
        const fiction = await rr.fiction.getRandom();

        assert(fiction.success);
        assert(fiction.data.title);
    });

    it('should get reviews', async () => {
        const fictionId = 21220;

        const reviews = await rr.fiction.getReviews(fictionId);

        assert(reviews.success);
        assert(reviews.data.length > 0);
    });
});
