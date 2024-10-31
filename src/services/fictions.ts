import * as cheerio from 'cheerio';
import { Requester } from '../requester.js';
import { RoyalError, RoyalResponse } from '../responses.js';
import date from 'date.js';
import type { AnyNode } from 'domhandler';

export interface FictionBlurb {
    id: number;
    type: string;
    title: string;
    image: string;
    tags: string[];
}

export interface NewReleaseBlurb extends FictionBlurb {
    description: string;
}

export interface LatestBlurb extends FictionBlurb {
    latest: {
        name: string;
        link: string;
        created: number;
    }[];
}

const statsKeys = ['pages', 'latest', 'rating', 'chapters', 'followers'] as const;

export interface PopularBlurb extends FictionBlurb {
    description: string;

    stats: Record<(typeof statsKeys)[number], number>;
}

export type BestBlurb = PopularBlurb;

export interface SearchBlurb {
    id: number;
    pages: number;
    title: string;
    image: string;
    description: string;
}

/**
 * Methods related to public fiction lists, and the search function.
 */
export class FictionsService {
    private readonly req: Requester;

    constructor(req: Requester) {
        this.req = req;
    }

    /**
     * Scrapes fictions from royalroadl.com/fictions/latest-updates at the
     * given page.
     *
     * @param page - Desired page to scrape from.
     * @returns - Array of fiction blurbs.
     */
    public async getLatest(page: number = 1) {
        const body = await this.getList('latest-updates', page);
        const fictions = FictionsParser.parseLatest(body);

        return new RoyalResponse(fictions);
    }

    /**
     * Scrapes fictions from royalroadl.com/fictions/active-popular at the
     * given page.
     *
     * @param page - Desired page to scrape from.
     * @returns - Array of fiction blurbs.
     */
    public async getPopular(page: number = 1) {
        const body = await this.getList('active-popular', page);
        const fictions = FictionsParser.parsePopular(body);

        return new RoyalResponse(fictions);
    }

    /**
     * Scrapes fictions from royalroadl.com/fictions/best-rated at the
     * given page.
     *
     * @param page - Desired page to scrape from.
     * @returns - Array of fiction blurbs.
     */
    public async getBest(page: number = 1) {
        const body = await this.getList('best-rated', page);
        const fictions = FictionsParser.parsePopular(body) as BestBlurb[];

        return new RoyalResponse(fictions);
    }

    public async getNewReleases(page: number = 1) {
        const body = await this.getList('new-releases', page);
        const fictions = FictionsParser.parseNewReleases(body);

        return new RoyalResponse(fictions);
    }

    /**
     * Scrapes fictions from royalroadl.com/fictions/search at the given page.
     *
     * @param query - Query to search for. example: tagsAdd=fantasy&tagsRemove=graphic_violence&minPages=50&maxPages=200
     * @param page - Desired page to scrape from.
     * @returns - Array of search fiction blurbs.
     */
    public async search(query: string, page: number = 1) {
        const body = await this.getList(`search?${query}`, page);
        const fictions = FictionsParser.parseSearch(body);

        return new RoyalResponse(fictions);
    }

    /**
     * Gets a list of chapters as raw HTML.
     *
     * @param type - Name of the list.
     * @param page - Page to scrape from, will throw if out of bounds.
     */
    public async getList(type: string, page: number = 1) {
        const path = `/fictions/${type}`;
        const body = await this.req.get(path, { page: String(page) });

        function validPage(html: string) {
            return !html.includes('There is nothing here :(');
        }
        if (!validPage(body)) {
            throw new RoyalError('No fictions found.');
        } else {
            return body;
        }
    }
}

class FictionsParser {
    public static parseLatest(html: string): LatestBlurb[] {
        const $ = cheerio.load(html);

        const fictions: LatestBlurb[] = [];

        // Using .each instead of the more concise .map because the typings are
        // suboptimal. (TODO, maybe)
        $('.fiction-list-item').each((i, el) => {
            const latest: {
                name: string;
                link: string;
                created: number;
            }[] = [];

            $(el)
                .find('li.list-item')
                .each((j, item) => {
                    latest.push({
                        link: $(item).find('a').attr('href') ?? '',
                        name: $(item).find('span.col-xs-8').text(),
                        created: (date($(item).find('time').text()) as Date).getTime(),
                    });
                });

            fictions.push(Object.assign(FictionsParser.parseBlurb($, el), { latest }));
        });

        return fictions;
    }

    public static parsePopular(html: string): PopularBlurb[] {
        const $ = cheerio.load(html);

        const fictions: PopularBlurb[] = [];

        $('.fiction-list-item').each((i, el) => {
            let description = '';

            $(el)
                .find('.margin-top-10.col-xs-12')
                .find('p')
                .each((j, para) => {
                    description += $(para).text() + '\n';
                });

            const stats = {
                pages: 0,
                latest: 0,
                rating: 0,
                chapters: 0,
                followers: 0,
            };

            stats.latest = date($(el).find('time').attr('datetime') ?? '').getTime();
            stats.rating = parseFloat($(el).find('.star').attr('title') ?? '');

            $(el)
                .find('span')
                .each((j, stat) => {
                    const text = $(stat).text().toLowerCase();
                    const key = text.split(' ')[1];
                    const value = parseInt(text.split(' ')[0].replace(/,/gi, ''), 10);

                    if (!key || !value) {
                        return;
                    }

                    // todo: i mean this is kind of typesafe but not nice to look at
                    if (statsKeys.includes(key as (typeof statsKeys)[number])) {
                        stats[key as (typeof statsKeys)[number]] = value;
                    }
                });

            fictions.push(
                Object.assign(FictionsParser.parseBlurb($, el), { description }, { stats }),
            );
        });

        return fictions;
    }

    public static parseSearch(html: string): SearchBlurb[] {
        const $ = cheerio.load(html);

        const fictions: SearchBlurb[] = [];

        $('.fiction-list-item').each((i, el) => {
            const image = $(el).find('img').attr('src') ?? '';

            const titleEl = $(el).find('h2.fiction-title').children('a');

            const title = $(titleEl).text();
            const id = parseInt($(titleEl).attr('href')?.split('/')[2] ?? '', 10);

            const pages = parseInt(
                $(el).find('i.fa-book').next().text().replace('Pages', '').trim(),
                10,
            );

            let description = '';
            $(el)
                .find('div.margin-top-10.col-xs-12')
                .children()
                .each((i, el) => {
                    description += $(el).text();
                });

            fictions.push({ id, title, pages, image, description });
        });

        return fictions;
    }

    public static parseNewReleases(html: string): NewReleaseBlurb[] {
        const $ = cheerio.load(html);

        const fictions: NewReleaseBlurb[] = [];

        $('div.fiction-list-item').each((i, el) => {
            let description = '';
            $(el)
                .find('div.hidden-content')
                .find('p')
                .each((j, p) => {
                    description += $(p).text().trim() + '\n';
                });
            description = description.trim();

            fictions.push(Object.assign(FictionsParser.parseBlurb($, el), { description }));
        });

        return fictions;
    }

    private static parseBlurb($: cheerio.CheerioAPI, el: AnyNode): FictionBlurb {
        const titleEl = $(el).find('.fiction-title').children('a');

        const title = $(titleEl).text();
        const image = $(el).find('img').attr('src') ?? '';
        const type = $(el).find('span.label.bg-blue-hoki').text();
        const id = parseInt($(titleEl).attr('href')?.split('/')[2] ?? '', 10);

        const tags = $(el)
            .find('span.label.bg-blue-dark')
            .map((i, tag) => $(tag).text())
            .get();

        return { id, type, tags, title, image };
    }
}
