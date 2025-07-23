import * as cheerio from 'cheerio';
import { getLastPage } from '../utils.js';
import { Requester } from '../requester.js';
import { RoyalResponse } from '../responses.js';
import date from 'date.js';
import type { AnyNode } from 'domhandler';

export interface Fiction {
    type: string;
    title: string;
    image: string;
    status: string;
    tags: string[];
    warnings: string[];
    description: string;
    stats: FictionStats;
    author: FictionAuthor;
    chapters: FictionChapter[];
}

export interface FictionChapter {
    id: number;
    title: string;
    release: number;
}

export interface FictionStats {
    pages: number;
    ratings: number;
    favorites: number;
    followers: number;

    views: {
        total: number;
        average: number;
    };

    score: {
        style: number;
        story: number;
        grammar: number;
        overall: number;
        character: number;
    };
}

export interface FictionAuthor {
    id: number;
    name: string;
    title: string;
    avatar: string;
}

export interface Review {
    posted: number;
    content: string;

    author: {
        id: number;
        name: string;
        avatar: string;
    };

    score: {
        overall: number;

        style?: number;
        story?: number;
        grammar?: number;
        character?: number;
    };
}

/**
 * Fiction and chapter related methods.
 */
export class FictionService {
    private readonly req: Requester;

    constructor(req: Requester) {
        this.req = req;
    }

    /**
     * Returns a Fiction object scraped from the specified fictions page, throws
     * an error if it wasn't found.
     *
     * @param id - ID of the fiction to get. (royalroadl.com/fiction/<id>)
     * @returns - Fiction object.
     */
    public async getFiction(id: number) {
        const path = `/fiction/${String(id)}`;
        const body = await this.req.get(path);
        const fiction = FictionParser.parseFiction(body);

        return new RoyalResponse(fiction);
    }

    /**
     * Equivalent to royalroadl.com/fictions/random AKA 'Surprise me!', returns
     * a random fiction.
     *
     * @returns - Fiction object.
     */
    public async getRandom() {
        const path = `/fiction/random`;
        const body = await this.req.get(path);
        const fiction = FictionParser.parseFiction(body);

        return new RoyalResponse(fiction);
    }

    /**
     * Returns reviews of a given fiction.
     *
     * @param id - ID of the fiction to get reviews for.
     * @param page - Page number or 'last'.
     */
    public async getReviews(id: number, page: number | 'last' = 1) {
        const path = `/fiction/${String(id)}`;
        const body = await this.req.get(path, {
            reviews: String(page === 'last' ? getLastPage(await this.req.get(path)) : page),
        });

        const reviews = FictionParser.parseReviews(body);

        return new RoyalResponse(reviews);
    }
}

class FictionParser {
    public static parseFiction(html: string): Fiction {
        const $ = cheerio.load(html);

        const title = $('div.fic-title').find('h1').text();
        const image = $('div.fic-header').find('img').attr('src') ?? '';

        const labels = $('span.bg-blue-hoki');

        const type = labels.eq(0).text();
        const status = labels.eq(1).text().trim();

        const tags = $('span.tags')
            .find('a.label')
            .map((i, el) => $(el).text().trim())
            .get();

        const warnings = $('ul.list-inline')
            .find('li')
            .map((i, el) => $(el).text().trim())
            .get();

        const description = $('div.description > div.hidden-content').text().trim(); // <-- fixed description

        const authorEl = $('.portlet-body').eq(0);

        const author: FictionAuthor = {
            name: $(authorEl).find('.mt-card-content').find('a').text().trim(),
            title: $(authorEl).find('.mt-card-desc').text(),
            avatar: $(authorEl).find('img[data-type="avatar"]').attr('src') ?? '',
            id: +($(authorEl).find('.mt-card-content').find('a').attr('href') || '').split('/')[2],
        };

        const statsEl = $('div.stats-content');
        const statsList = $(statsEl).find('.list-unstyled').eq(1).find('li');
        const ratingList = $(statsEl).find('.list-unstyled').eq(0).find('li');

        const parseNumber = (raw: string): number => parseInt(raw.replace(/,/gi, ''), 10);
        const parseRating = (raw: unknown): number =>
            typeof raw === 'string' ? parseFloat(raw.split('/')[0].trim()) : -1;
        const getContent = (el: cheerio.Cheerio<AnyNode>) => el.find('span').data('content');

        const stats: FictionStats = {
            pages: parseNumber($(statsList).eq(11).text()),
            ratings: parseNumber($(statsList).eq(9).text()),
            followers: parseNumber($(statsList).eq(5).text()),
            favorites: parseNumber($(statsList).eq(7).text()),
            views: {
                total: parseNumber($(statsList).eq(1).text()),
                average: parseNumber($(statsList).eq(3).text()),
            },
            score: {
                style: parseRating(getContent($(ratingList).eq(3))),
                story: parseRating(getContent($(ratingList).eq(5))),
                grammar: parseRating(getContent($(ratingList).eq(9))),
                overall: parseRating(getContent($(ratingList).eq(1))),
                character: parseRating(getContent($(ratingList).eq(7))),
            },
        };

        const chapters: FictionChapter[] = [];

        $('tbody')
            .find('tr')
            .each((i, el) => {
                chapters.push({
                    title: $(el).find('td').eq(0).find('a').text().trim(),
                    id: parseInt(
                        $(el).find('td').eq(0).find('a').attr('href')?.split('/')[5] ?? '',
                        10,
                    ),
                    release: date($(el).find('td').eq(1).find('time').text()).getTime(),
                });
            });

        return {
            type,
            tags,
            stats,
            title,
            image,
            status,
            author,
            warnings,
            chapters,
            description,
        };
    }

    public static parseReviews(html: string): Review[] {
        const $ = cheerio.load(html);

        const reviews: Review[] = [];

        $('div.review').each((i, el) => {
            const posted = parseInt($(el).find('time').attr('unixtime') ?? '', 10);

            let content = '';
            $(el)
                .find('div.review-content')
                .each((j, p) => {
                    content += $(p).text() + '\n';
                });
            content = content.trim();

            const authorLink = $(el).find('div.review-meta').find('a').eq(0);
            const author = {
                name: $(authorLink).text(),
                avatar: $(el).find('img').attr('src') ?? '',
                id: parseInt($(authorLink).attr('href')?.split('/')[2] ?? '', 10),
            };

            const overallScore =
                parseFloat(
                    $(el)
                        .find('div.overall-score-container')
                        .children()
                        .filter((i, el) => $(el).attr('aria-label')?.includes('stars') ?? false)
                        .first()
                        .attr('aria-label')
                        ?.replace('stars', '')
                        .trim() ?? '',
                ) || 0;

            // todo: handle advanced reviews
            const score = {
                style: 0,
                story: 0,
                overall: overallScore,
                grammar: 0,
                character: 0,
            };

            reviews.push({ score, author, content, posted });
        });

        return reviews;
    }
}
