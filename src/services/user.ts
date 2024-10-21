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
     * Log on to royalroadl, saving the cookies for use in subsequent
     * requests.
     *
     * @param username
     * @param password
     * @param force Ignore isAuthenticated
     */
    public async login(email: string, password: string, force = false) {
        if (this.isLoggedIn && !force) {
            return new RoyalResponse('Already logged in.');
        }

        // RR will respond with a 302 if the login was successful and a
        // 200 (!) if it wasn't. Therefore we just ignore the status and
        // rely on the generic error parsing.
        await this.req.post(
            '/account/login', { email, password }, {
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
    public async getMyFollows(page: number = 1) {
        if (!this.isLoggedIn) {
            throw new RoyalError('Not authenticated.');
        }

        function noContent(html: string) {
            const $ = cheerio.load(html);

            let fictions = 0;
            $('div.fiction-list-item').each(() => fictions++);

            return fictions === 0;
        }

        const body = await this.req.get('/my/follows', { page: String(page) });
        const outOfBounds = noContent(body);

        if (outOfBounds) {
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

        function noContent(html: string) {
            const $ = cheerio.load(html);

            let fictions = 0;
            $('div.fiction-list-item').each(() => fictions++);

            return fictions === 0;
        }

        const body = await this.req.get('/my/readlater', { page: String(page) });
        const outOfBounds = noContent(body);

        if (outOfBounds) {
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
            if($(el).hasClass('portlet')){ //skip if its ad
                return;
            }

            const image = $(el).find('img').attr('src');

            const titleEl = $(el).find('h2.fiction-title').find('a');

            const title = $(titleEl).text().trim();
            const id = parseInt($(titleEl).attr('href').split('/')[2], 10);

            const link = $(el).find('a').attr('href');

            const authorEl = $(el).find('span.author').find('a');

            const author = {
                name: $(authorEl).text(),
                id: parseInt($(authorEl).attr('href').split('/')[2], 10),
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

    public static parseMyReadLater(html: string): ReadLater[]{
        const $ = cheerio.load(html);

        const myReadLater: ReadLater[] = [];

        $('div.fiction-list-item').each((i, el) => {
            if($(el).hasClass('portlet')){ //skip if its ad
                return;
            }

            const image = $(el).find('img').attr('src');

            const titleEl = $(el).find('h2.fiction-title').find('a');

            const title = $(titleEl).text().trim();
            const id = parseInt($(titleEl).attr('href').split('/')[2], 10);
            const link = $(el).find('a').attr('href');
            const pages = parseInt($(el).find('span.page-count').text().replace('pages', '').trim(), 10);

            const authorEl = $(el).find('span.author').find('a');

            const author = {
                name: $(authorEl).text(),
                id: parseInt($(authorEl).attr('href').split('/')[2], 10),
            };

            myReadLater.push({ id, title, image, link, pages, author });
        });

        return myReadLater;
    }
}
