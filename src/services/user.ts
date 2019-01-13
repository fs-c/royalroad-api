import date = require('date.js');
import * as cheerio from 'cheerio';
import { Requester } from '../royalroad';
import { getBaseAddress } from '../constants';
import { RoyalError, RoyalResponse } from '../responses';

export interface MyFiction {
    id: number;
    title: string;
}

export interface Notification {
    link: string;
    image: string;
    message: string;
    timestamp: number;
}

export interface Bookmark {
    id: number;
    title: string;
    image: string;
    pages: number;
    recent: BookmarkChapter[];

    author: {
        id: number;
        name: string;
    };
}

export interface BookmarkChapter {
    id: number;
    name: string;
    released: number;
}

/**
 * Methods related to the logged in user.
 */
export class UserService {
    private readonly req: Requester;

    constructor(req: Requester) {
        this.req = req;
    }

    public get isLoggedIn() {
        return this.req.isAuthenticated;
    }

    /**
     * Log on to royalroadl, saving the cookies for use in subsequent
     * requests.
     *
     * @param username
     * @param password
     * @param force Ignore isAuthenticated
     */
    public async login(username: string, password: string, force = false) {
        if (this.isLoggedIn && !force) {
            return new RoyalResponse('Already logged in.');
        }

        // RR will respond with a 302 if the login was successful and a
        // 200 (!) if it wasn't. Therefore we just ignore the status and
        // rely on the generic error parsing.
        await this.req.post(
            '/account/login', { username, password }, {
                fetchToken: true, ignoreStatus: true,
            },
        );

        return new RoyalResponse('Logged in.');
    }

    /**
     * Gets fictions owned and published by the currently logged in user.
     */
    public async getMyFictions() {
        if (!this.isLoggedIn) {
            throw new RoyalError('Not authenticated.');
        }

        const body = await this.req.get('/my/fictions');
        const myFictions = UserParser.parseMyFictions(body);

        return new RoyalResponse(myFictions);
    }

    /**
     * Get the logged in users bookmarks.
     *
     * @param page
     */
    public async getMyBookmarks(page: number = 1) {
        if (!this.isLoggedIn) {
            throw new RoyalError('Not authenticated.');
        }

        function noContent(html: string) {
            const $ = cheerio.load(html);

            let fictions = 0;
            $('div.fiction-list-item').each(() => fictions++);

            return fictions === 0;
        }

        const body = await this.req.get('/my/bookmarks', { page: String(page) });
        const outOfBounds = noContent(body);

        if (outOfBounds) {
            throw new RoyalError('Out of bounds.');
        }

        const myBookmarks = UserParser.parseMyBookmarks(body);
        return new RoyalResponse(myBookmarks);
    }

    /**
     * Get a list of notifications.
     */
    public async getNotifications() {
        if (!this.isLoggedIn) {
            throw new RoyalError('Not authenticated.');
        }

        const body = await this.req.get('/notifications/get');
        const notifications = UserParser.parseNotifications(body);

        return new RoyalResponse(notifications);
    }
}

class UserParser {
    public static parseMyBookmarks(html: string) {
        const $ = cheerio.load(html);

        const myBookmarks: Bookmark[] = [];

        $('div.fiction-list-item').each((i, el) => {
            const image = $(el).find('img').attr('src');

            const titleEl = $(el).find('h2.fiction-title').find('a');

            const title = $(titleEl).text().trim();
            const id = parseInt($(titleEl).attr('href').split('/')[2], 10);

            const pages = parseInt($(el).find('span.page-count').text().trim(), 10);

            const authorEl = $(el).find('span.author').find('a');

            const author = {
                name: $(authorEl).text(),
                id: parseInt($(authorEl).attr('href').split('/')[2], 10),
            };

            const recent: BookmarkChapter[] = [];

            $(el).find('li.list-item').each((j, item) => {
                const chapter = {
                    name: $(item).find('a').find('span').eq(0).text().trim(),
                    id: parseInt($(item).find('a').attr('href').split('/')[2], 10),
                    released: date($(item).find('time').text() + ' ago').getTime(),
                };

                recent.push(chapter);
            });

            myBookmarks.push({ id, title, pages, image, author, recent });
        });

        return myBookmarks;
    }

    public static parseMyFictions(html: string): MyFiction[] {
        const $ = cheerio.load(html);

        const fictions: MyFiction[] = [];

        $('div.fiction').each((i, el) => {
            const title = $(el).find('h4.col-sm-10').text();
            const id = parseInt($(el).find('a').attr('href').split('/')[2], 10);

            fictions.push({ id, title });
        });

        return fictions;
    }

    public static parseNotifications(html: string): Notification[] {
        const $ = cheerio.load(html);

        const notifications: Notification[] = [];

        $('li').each((i, el) => {
            const image = $(el).find('img').attr('src');
            const message = $(el).find('span').eq(0).text().trim();
            const link = getBaseAddress() + $(el).find('a').attr('href');
            const timestamp = date($(el).find('time').text() + ' ago').getTime();

            notifications.push({ link, image, message, timestamp });
        });

        return notifications;
    }
}
