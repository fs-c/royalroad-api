import { get } from 'got';
import * as cheerio from 'cheerio';
import { getBaseAddress } from '../constants';

import { Fiction, FictionAuthor, FictionStats } from '../common-types';

export class FictionService {
  public async getFiction(id: number): Promise<Fiction> {
    const url = `${getBaseAddress()}/fiction/${id.toString()}`;

    const { body } = await get(url);

    return FictionParser.parseFiction(body);
  }

  public async getRandom(): Promise<Fiction> {
    const url = `${getBaseAddress()}/fiction/random`;

    const { body } = await get(url);

    return FictionParser.parseFiction(body);
  }
}

class FictionParser {
  public static parseFiction(html: string): Fiction {
    const $ = cheerio.load(html);

    const title = $('div.fic-title').children('h1').text();
    const image = $('cover-' + title).attr('src');
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

    return { type, tags, stats, title, image, status,
      author, warnings, description };
  }
}
