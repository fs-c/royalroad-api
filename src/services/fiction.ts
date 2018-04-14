import date = require( 'date.js');
import * as cheerio from 'cheerio';
import { Requester } from '../royalroad';
import { getBaseAddress } from '../constants';

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
  public async getFiction(id: number): Promise<Fiction> {
    const path = `/fiction/${id.toString()}`;
    const body = await this.req.get(path);

    return FictionParser.parseFiction(body);
  }

  /**
   * Equivalent of royalroadl.com/fictions/random AKA 'Surprise me!', returns a
   * random fiction.
   *
   * @returns - Fiction object.
   */
  public async getRandom(): Promise<Fiction> {
    const path = `/fiction/random`;
    const body = await this.req.get(path);

    return FictionParser.parseFiction(body);
  }
}

/**
 * Container class for all fiction related parsers.
 */
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
          $(el).find('td').eq(0).find('a').attr('href').split('/')[2], 10,
        ),
        release: date($(el).find('td').eq(1).find('time').text())
        .getTime(),
      });
    });

    return { type, tags, stats, title, image, status,
      author, warnings, chapters, description };
  }
}
