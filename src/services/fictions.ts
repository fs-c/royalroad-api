import  date = require('date.js');
import * as cheerio from 'cheerio';
import { URLSearchParams } from 'url';
import { Requester } from '../royalroad';
import { getBaseAddress } from '../constants';

export interface FictionBlurb {
  id: number;
  type: string;
  title: string;
  image: string;
  tags: string[];
}

export interface LatestBlurb extends FictionBlurb {
  latest: {
    name: string;
    link: string;
    created: number;
  }[];
}

export interface PopularBlurb extends FictionBlurb {
  description: string;
  stats: {
    pages: number;
    latest: number;
    rating: number;
    chapters: number;
    followers: number;
  };
}

export interface BestBlurb extends PopularBlurb {}

export interface SearchBlurb {
  id: number;
  pages: number;
  title: string;
  image: string;
  author: string;
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
  public async getLatest(page: number = 1): Promise<LatestBlurb[]> {
    const params = new URLSearchParams({ page: page.toString() });
    const path = `/fictions/latest-updates?${params}`;

    const body = await this.req.get(path);

    return FictionsParser.parseLatest(body);
  }

  /**
   * Scrapes fictions from royalroadl.com/fictions/active-popular at the
   * given page.
   *
   * @param page - Desired page to scrape from.
   * @returns - Array of fiction blurbs.
   */
  public async getPopular(page: number = 1): Promise<PopularBlurb[]> {
    const params = new URLSearchParams({ page: page.toString() });
    const path = `/fictions/active-popular?${params}`;

    const body = await this.req.get(path);

    return FictionsParser.parsePopular(body);
  }

  /**
   * Scrapes fictions from royalroadl.com/fictions/best-rated at the
   * given page.
   *
   * @param page - Desired page to scrape from.
   * @returns - Array of fiction blurbs.
   */
  public async getBest(page: number = 1): Promise<BestBlurb[]> {
    const params = new URLSearchParams({ page: page.toString() });
    const path = `/fictions/best-rated?${params}`;

    const body = await this.req.get(path);

    return FictionsParser.parsePopular(body) as BestBlurb[];
  }

  /**
   * Scrapes fictions from royalroadl.com/fictions/search at the given page.
   *
   * @param keyword - Keyword to search for, case sensitive.
   * @param page - Desired page to scrape from.
   * @returns - Array of search fiction blurbs.
   */
  public async search(
    keyword: string, page: number = 1,
  ): Promise<SearchBlurb[]> {
    const params = new URLSearchParams({ keyword, page: page.toString() });
    const path = `/fictions/search?${params}`;

    const body = await this.req.get(path);

    return FictionsParser.parseSearch(body);
  }
}

/**
 * Methods related to parsing fiction lists.
 */
class FictionsParser {
  public static parseLatest(html: string): LatestBlurb[] {
    const $ = cheerio.load(html);

    const fictions: LatestBlurb[] = [];

    // Using .each instead of the more concise .map because the typings are
    // suboptimal. (TODO, maybe)
    $('.fiction-list-item').each((i, el) => {
      const latest: {
        name: string,
        link: string,
        created: number,
      }[] = [];

      $(el).find('li.list-item').each((j, item) => {
        latest.push({
          link: $(item).find('a').attr('href'),
          name: $(item).find('span.col-xs-8').text(),
          created: (date($(item).find('time').text()) as Date).getTime(),
        });
      });

      fictions.push(Object.assign(
        FictionsParser.parseBlurb($, el),
        { latest },
      ));
    });

    return fictions;
  }

  public static parsePopular(html: string): PopularBlurb[] {
    const $ = cheerio.load(html);

    const fictions: PopularBlurb[] = [];

    // Using .each instead of the more concise .map because the typings are
    // suboptimal. (TODO, maybe)
    $('.fiction-list-item').each((i, el) => {
      let description = '';

      // Sigh...
      $(el).find('.margin-top-10.col-xs-12').find('p').each((j, para) => {
        description += $(para).text() + '\n';
      });

      // DANGEROUS. But due to RRL site design there's few ways around this.
      const stats: any = {};

      stats.latest = date($(el).find('time').attr('datetime')).getTime();
      stats.rating = parseFloat($(el).find('.star').attr('title'));

      $(el).find('span').each((j, stat) => {
        const text = $(stat).text().toLowerCase();
        const key = text.split(' ')[1];
        const value = parseInt(text.split(' ')[0].replace(/,/gi, ''), 10);

        if (!key || !value) { return; }

        stats[key] = value;
      });

      fictions.push(Object.assign(
        FictionsParser.parseBlurb($, el),
        { description },
        { stats },
      ));
    });

    return fictions;
  }

  public static parseSearch(html: string): SearchBlurb[] {
    const $ = cheerio.load(html);

    const fictions: SearchBlurb[] = [];

    $('.search-item').each((i, el) => {
      const image = $(el).find('img').attr('src');

      const titleEl = $(el).find('h2.margin-bottom-10').children('a');

      const title = $(titleEl).text();
      const id = parseInt($(titleEl).attr('href').split('/')[2], 10);

      const pages = parseInt($(el).find('span.page-count').text(), 10);
      const author = $(el).find('span.author').text()
        .replace('by', '').trim();

      let description = '';
      $(el).find('div.fiction-description').find('p').each((j, para) => {
        description += $(para).text() + '\n';
      });

      fictions.push({ id, title, pages, author, image, description });
    });

    return fictions;
  }

  private static parseBlurb(
    $: CheerioStatic, el: CheerioElement,
  ): FictionBlurb {
    const titleEl = $(el).find('.fiction-title').children('a');

    const title = $(titleEl).text();
    const image = $(el).find('img').attr('src');
    const type = $(el).find('span.label.bg-blue-hoki').text();
    const id = parseInt($(titleEl).attr('href').split('/')[2], 10);

    const tags = $(el).find('span.label.bg-blue-dark')
      .map((i, tag) => $(tag).text()).get();

    return { id, type, tags, title, image };
  }
}
