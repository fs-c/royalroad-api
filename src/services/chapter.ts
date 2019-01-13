import * as logger from 'debug';
import date = require('date.js');
import * as cheerio from 'cheerio';
import { getLastPage } from '../utils';
import { Requester } from '../royalroad';
import { RoyalError, RoyalResponse } from '../responses';

export interface NewChapter {
    title: string;
    content: string;
    preNote?: undefined | string;
    postNote?: undefined | string;
}

export interface Chapter {
    content: string;
    preNote: string;
    postNote: string;

    next: number;
    previous: number;
}

export interface ChapterComment {
    id: number;
    posted: number;
    content: string;

    author: {
        id: number;
        name: string;
        avatar: string;
        premium: boolean;
    };
}

/**
 * Methods related to chapters.
 */
export class ChapterService {
    /**
     * Basic checks for a chapter object's validity.
     *
     * @param chapter
     */
    private static isValidNewChapter(chapter: NewChapter) {
        // TODO: Pre and post author notes maxlength?
        return chapter.content.length >= 500 && chapter.title.length <= 150;
    }

    public debug: logger.IDebugger;

    private readonly req: Requester;

    constructor(req: Requester) {
        this.req = req;
        this.debug = logger('chapter');
    }

    /**
     * Add a chapter to a given fiction.
     *
     * @param fictionID - ID of the fiction to publish a chapter for.
     * @param chapter - Object describing the chapter.
     */
    public async publish(fictionID: number, chapter: NewChapter) {
        this.requireAuth();

        if (!ChapterService.isValidNewChapter(chapter)) {
            throw new RoyalError('Invalid chapter');
        }

        await this.req.post(
            `/fiction/chapter/new/${String(fictionID)}`,
            {
                Status: 'New',
                fid: fictionID,
                Title: chapter.title,
                Content: chapter.content,
                PreAuthorNotes: chapter.preNote || '',
                PostAuthorNotes: chapter.postNote || '',
                action: 'publish',
            },
            { fetchToken: true },
        );

        return new RoyalResponse(chapter);
    }

    /**
     * Return a chapter given its unique ID.
     *
     * @param chapterID - ID of the chapter to get.
     */
    public async getChapter(chapterID: number) {
        const body = await this.req.get(
            `/fiction/0/_/chapter/${String(chapterID)}/_`,
        );

        const chapter = ChapterParser.parseChapter(body);

        return new RoyalResponse(chapter);
    }

    /**
     * Return an array of comments for a given chapter.
     *
     * @param chapterID - ID of the chapter to get comments from.
     * @param page - Either the page of comments to load, or 'last'.
     */
    public async getComments(chapterID: number, page: number | 'last' = 1) {
        const path = `/fiction/0/_/chapter/${String(chapterID)}/_`;
        const lastPage = page === 'last' ? (
            getLastPage(await this.req.get(path))
        ) : page;

        const body = await this.req.get(path, { page: String(lastPage) });

        const comments = ChapterParser.parseComments(body);

        return new RoyalResponse(comments);
    }

    /**
     * Post a comment for a given fiction.
     *
     * @param chapterID - ID of the chapter to post a comment to.
     * @param content - Content to post, separate paragraphs with '\n'.
     */
    public async postComment(chapterID: number, content: string) {
        this.requireAuth();

        await this.req.post(
            `/fiction/0/_/chapter/${String(chapterID)}/_`,
            {
                cid: chapterID,
                action: 'submit',
                comment: content.split('\n').map((e) => `<p>${e}</p>`).join(''),
            },
            { fetchToken: true, ignoreStatus: true },
        );

        return new RoyalResponse(null);
    }

    /**
     * Throw if the requester doesn't have authentication.
     */
    private requireAuth() {
        if (!this.req.isAuthenticated) {
            throw new RoyalError('Not authenticated.');
        }
    }
}

class ChapterParser {
    public static parseChapter(html: string): Chapter {
        const $ = cheerio.load(html);

        const notes = $('div.author-note');
        const preNote = $(notes).eq(0).find('p').text();
        const postNote = $(notes).eq(1).find('p').text();

        const content = ($('div.chapter-inner.chapter-content').html() || '')
            .trim();

        const next = ChapterParser.getChapterID(
            $('i.fa-chevron-double-right').parent().attr('href') || '',
        );

        const previous = ChapterParser.getChapterID(
            $('i.fa-chevron-double-left').parent().attr('href') || '',
        );

        return { content, preNote, postNote, next, previous };
    }

    public static parseComments(html: string): ChapterComment[] {
        const $ = cheerio.load(html);

        const comments: ChapterComment[] = [];

        $('div.media.media-v2').each((i, el) => {
            const id = parseInt($(el).attr('id').split('-')[2], 10);

            const posted = date($(el).find('time').text() + ' ago').getTime();

            let raw = '';
            $(el).find('div.media-body').find('p').each((j, p) => {
                const text = $(p).text();

                if (text) {
                    raw += text.trim() + '\n';
                }
            });

            const content = raw.trim();

            const author = {
                avatar: $(el).find('img').attr('src'),
                name: $(el).find('span.name').find('a').text().split('@')[0],
                premium: $(el).find('div.upcase.label.bg-yellow-crusta')
                    .text().length !== 0,
                id: parseInt(
                    $(el).find('span.name').find('a').attr('href').split('/')[2]
                    , 10,
                ),
            };

            comments.push({ id, author, posted, content });
        });

        return comments;
    }

    public static getChapterID(url: string): number {
        // TODO: This is really inflexible.
        const split = url.split('/');

        return split.length < 5 ? -1 : parseInt(split[5], 10);
    }
}
