import assert from 'assert';
import { describe, before, it } from 'node:test';
import { RoyalRoadAPI } from '../src/royalroad';

describe('fiction list functionality', () => {
    let rr: RoyalRoadAPI;

    before(async () => {
        rr = new RoyalRoadAPI();
    });

    it('should get latest fictions', async () => {
        const fictions = await rr.fictions.getLatest();

        assert(fictions.success);
        assert(fictions.data.length > 0);
    });

    it('should get popular fictions', async () => {
        const fictions = await rr.fictions.getPopular();

        assert(fictions.success);
        assert(fictions.data.length > 0);
    });

    it('should get best fictions', async () => {
        const fictions = await rr.fictions.getBest();

        assert(fictions.success);
        assert(fictions.data.length > 0);
    });

    it('should get new releases', async () => {
        const fictions = await rr.fictions.getNewReleases();

        assert(fictions.success);
        assert(fictions.data.length > 0);
    });

    it('should search for fictions with broad term', async () => {
        const broadSearch = await rr.fictions.search('fantasy');

        assert(broadSearch.success);
        assert(broadSearch.data.length > 0);
    });

    it('should search for fictions with specific term', async () => {
        const fictions = await rr.fictions.search('title=234892y3fhu23hf29837423fwefuwhfqwej833');

        assert(fictions.success);
        assert(fictions.data.length === 0);
    });
});
