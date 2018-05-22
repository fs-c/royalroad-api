import date = require( 'date.js');
import * as cheerio from 'cheerio';
import { Requester } from '../royalroad';
import { RoyalResponse } from '../responses';

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

  rating: {
    up: number;
    down: number;
  };

  author: {
    id: number,
    name: string,
    avatar: string,
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
    const fiction =  FictionParser.parseFiction(body);

    return new RoyalResponse(fiction);
  }

  /**
   * Equivalent of royalroadl.com/fictions/random AKA 'Surprise me!', returns a
   * random fiction.
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
      page: String(page === 'last'
        ? FictionParser.getLastPage(await this.req.get(path)) : page),
    });

    const reviews = FictionParser.parseReviews(body);

    return new RoyalResponse(reviews);
  }
}

class FictionParser {
  public static parseFiction(html: string): Fiction {
    const $ = cheerio.load(html);

    const title = $('div.fic-title').children('h1').text();
    const image = $('div.fic-header').find('img').attr('src');
    const type = $('span.bg-blue-hoki').eq(0).text();
    const status = $('span.bg-blue-hoki').eq(1).text();

    const tags = $('span.tags').find('span.label')
      .map((i, el) => $(el).text()).get();

    const warnings = $('ul.list-inline').find('li')
      .map((i, el) => $(el).text()).get();

    const description = $('div.hidden-content').find('p')
      .map((i, el) => $(el).text()).get().join('');

    const authorEl = $('.portlet-body').eq(0);

    const author: FictionAuthor = {
      name: $(authorEl).find('.mt-card-name').find('a').text(),
      title: $(authorEl).find('.mt-card-desc').text(),
      avatar: $(authorEl).find('.mt-card-avatar').find('img').attr('src'),
      id: parseInt(
        $(authorEl).find('.mt-card-name').find('a').attr('href')
          .split('/')[2]
        , 10,
      ),
    };

    const statsEl = $('div.stats-content');
    const statsList = $(statsEl).find('.list-unstyled').eq(1).find('li');
    const ratingList = $(statsEl).find('.list-unstyled').eq(0).find('li');

    const parseNumber = (raw: string) =>
      parseInt(raw.replace(/,/ig, ''), 10);
    const parseRating = (raw: string) =>
      parseFloat(raw.split('/')[0].trim());
    const getContent = (el: Cheerio) =>
      el.find('span').data('content');

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

    $('tbody').find('tr').each((i, el) => {
      chapters.push({
        title: $(el).find('td').eq(0).find('a').text().trim(),
        id: parseInt(
          $(el).find('td').eq(0).find('a').attr('href').split('/')[5], 10,
        ),
        release: date($(el).find('td').eq(1).find('time').text())
        .getTime(),
      });
    });

    return { type, tags, stats, title, image, status,
      author, warnings, chapters, description };
  }

  public static getLastPage(html: string) {
    const $ = cheerio.load(html);

    const href = $('ul.pagination').find('li').last()
      .find('a').attr('href');

    if (!href) {
      return 1;
    }

    // Get whatever is before '#' and after '=', (?page=1#comments).
    const page = parseInt(href.split('#')[0].split('=')[1], 10);

    return page;
  }

  public static parseReviews(html: string): Review[] {
    const $ = cheerio.load(html);

    const reviews: Review[] = [];

    $('div.review.row').each((i, el) => {
      const posted = parseInt($(el).find('time').attr('unixtime'), 10);

      let content = '';
      $(el).find('div.review-content')
        .each((j, p) => content += $(p).text() + '\n');
      content = content.trim();

      const rating = {
        up: parseInt($(el).find('button.blue-dark').text(), 10),
        down: parseInt($(el).find('button.red-sunglo').text(), 10),
      };

      const authorLink = $(el).find('div.review-meta').find('a').eq(0);
      const author = {
        name: $(authorLink).text(),
        avatar: $(el).find('img').attr('href'),
        id: parseInt($(authorLink).attr('href').split('/')[2], 10),
      };

      const parseScore = (classAttr: string) => {
        if (!classAttr) { return -1; }

        const classes = classAttr.split(' ');
        const value = classes[classes.length - 1].split('-')[1];

        return parseInt(value, 10) / 10;
      };

      const scoreItems = $(el).find('div.review-side').find('li').find('div');
      const score = {
        style: parseScore($(scoreItems).eq(1).attr('class')),
        story: parseScore($(scoreItems).eq(2).attr('class')),
        overall: parseScore($(scoreItems).eq(0).attr('class')),
        grammar: parseScore($(scoreItems).eq(3).attr('class')),
        character: parseScore($(scoreItems).eq(4).attr('class')),
      };

      reviews.push({ score, author, rating, content, posted });
    });

    return reviews;
  }
}
