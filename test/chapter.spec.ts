import { before, describe, it } from 'node:test';
import { RoyalRoadAPI } from '../src/royalroad';
import assert from 'node:assert';

describe('chapter functionality', () => {
    // not testing publishing chapters or comments since we don't want to spam the site

    let rr: RoyalRoadAPI;

    before(async () => {
        rr = new RoyalRoadAPI();
    });

    it('should get a chapter', async () => {
        const chapterId = 208170;

        const chapter = await rr.chapter.getChapter(chapterId);

        assert(chapter.success);
        assert.strictEqual(chapter.data.content[0], 'a');
    });

    it('should get comments', async () => {
        const chapterId = 208170;

        const comments = await rr.chapter.getComments(chapterId);

        assert(comments.success);
        assert(comments.data.length > 0);
    });
});
