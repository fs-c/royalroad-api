import * as cheerio from 'cheerio';
import { Requester } from '../requester.js';
import { getBaseAddress } from '../constants.js';
import { RoyalError, RoyalResponse } from '../responses.js';
import { isAd } from '../utils.js';
import date from 'date.js';

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
    link: string;

    author: {
        id: number;
        name: string;
    };
}

export interface ReadLater {
    id: number;
    title: string;
    image: string;
    link: string;
    pages: number;

    author: {
        id: number;
        name: string;
    };
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
     * Log on to royalroad, saving the cookies for use in subsequent
     * requests. Ignores existing login status.
     *
     * @param email
     * @param password
     */
    public async login(email: string, password: string) {
        // RR will respond with a 302 if the login was successful and a
        // 200 (!) if it wasn't. Therefore we just ignore the status and
        // rely on the generic error parsing.
        await this.req.post(
            '/account/login',
            { Email: email, Password: password, ReturnUrl: '/home', Remember: 'true' },
            {
                fetchToken: true,
                ignoreStatus: true,
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
    public async getMyFollows(page: number = 1) {
        if (!this.isLoggedIn) {
            throw new RoyalError('Not authenticated.');
        }

        const body = await this.req.get('/my/follows', { page: String(page) });

        const $ = cheerio.load(body);
        const hasContent = $('div.fiction-list-item').length > 0;
        if (!hasContent) {
            throw new RoyalError('Out of bounds.');
        }

        const myBookmarks = UserParser.parseMyFollows(body);
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

    public async getMyReadLater(page: number = 1) {
        if (!this.isLoggedIn) {
            throw new RoyalError('Not authenticated.');
        }

        const body = await this.req.get('/my/readlater', { page: String(page) });

        const $ = cheerio.load(body);
        const hasContent = $('div.fiction-list-item').length > 0;
        if (!hasContent) {
            throw new RoyalError('Out of bounds.');
        }

        const myBookmarks = UserParser.parseMyReadLater(body);
        return new RoyalResponse(myBookmarks);
    }
}

class UserParser {
    public static parseMyFollows(html: string) {
        const $ = cheerio.load(html);

        const myBookmarks: Bookmark[] = [];

        $('div.fiction-list-item').each((i, el) => {
            if (isAd($(el))) {
                return;
            }

            const image = $(el).find('img').attr('src');
            if (!image) {
                return;
            }

            const titleEl = $(el).find('h2.fiction-title').find('a');

            const title = $(titleEl).text().trim();

            const titleHref = $(titleEl).attr('href');
            if (!titleHref) {
                return;
            }

            const id = parseInt(titleHref.split('/')[2], 10);

            const link = $(el).find('a').attr('href');
            if (!link) {
                return;
            }

            const authorEl = $(el).find('span.author').find('a');

            const authorHref = $(authorEl).attr('href');
            if (!authorHref) {
                return;
            }

            const author = {
                name: $(authorEl).text(),
                id: parseInt(authorHref.split('/')[2], 10),
            };

            myBookmarks.push({ id, title, image, link, author });
        });

        return myBookmarks;
    }

    public static parseMyFictions(html: string): MyFiction[] {
        const $ = cheerio.load(html);

        const fictions: MyFiction[] = [];

        $('div.fiction').each((i, el) => {
            const title = $(el).find('h4.col-sm-10').text();
            const href = $(el).find('a').attr('href');
            if (!href) {
                return;
            }

            const id = parseInt(href.split('/')[2], 10);

            fictions.push({ id, title });
        });

        return fictions;
    }

    public static parseNotifications(html: string): Notification[] {
        const $ = cheerio.load(html);

        const notifications: Notification[] = [];

        $('li').each((i, el) => {
            const image = $(el).find('img').attr('src');
            if (!image) {
                return;
            }

            const message = $(el).find('span').eq(0).text().trim();
            const link = getBaseAddress() + $(el).find('a').attr('href');
            const timestamp = date($(el).find('time').text() + ' ago').getTime();

            notifications.push({ link, image, message, timestamp });
        });

        return notifications;
    }

    public static parseMyReadLater(html: string): ReadLater[] {
        const $ = cheerio.load(html);

        const myReadLater: ReadLater[] = [];

        $('div.fiction-list-item').each((i, el) => {
            if (isAd($(el))) {
                return;
            }

            const image = $(el).find('img').attr('src');
            if (!image) {
                return;
            }

            const titleEl = $(el).find('h2.fiction-title').find('a');

            const title = $(titleEl).text().trim();
            const titleHref = $(titleEl).attr('href');
            if (!titleHref) {
                return;
            }

            const id = parseInt(titleHref.split('/')[2], 10);

            const link = $(el).find('a').attr('href');
            if (!link) {
                return;
            }

            const pages = parseInt(
                $(el).find('span.page-count').text().replace('pages', '').trim(),
                10,
            );
            const authorEl = $(el).find('span.author').find('a');

            const authorHref = $(authorEl).attr('href');
            if (!authorHref) {
                return;
            }

            const author = {
                name: $(authorEl).text(),
                id: parseInt(authorHref.split('/')[2], 10),
            };

            myReadLater.push({ id, title, image, link, pages, author });
        });

        return myReadLater;
    }
}
