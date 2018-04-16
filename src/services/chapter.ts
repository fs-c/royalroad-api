import date = require('date.js');
import * as cheerio from 'cheerio';
import { URLSearchParams } from 'url';
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

export class ChapterService {
  private readonly req: Requester;

  constructor(req: Requester) {
    this.req = req;
  }

  /**
   * Add a chapter to a given fiction.
   *
   * @param fictionID - ID of the fiction to publish a chapter for.
   * @param chapter - Object describing the chapter.
   */
  public async publish(fictionID: number, chapter: NewChapter) {
    if (!this.req.isAuthenticated) {
      throw new RoyalError('Not authenticated.');
    }

    if (!this.isValidNewChapter(chapter)) {
      throw new RoyalError('Invalid chapter');
    }

    const body = await this.req.post(
      `/fiction/chapter/new/${String(fictionID)}`,
      {
        Status: 'New',
        fid: fictionID,
        Title: chapter.title,
        PreAuthorNotes: chapter.preNote || '',
        Content: chapter.content,
        PostAuthorNotes: chapter.postNote || '',
        action: 'publish',
      },
      true,
    );

    const error = ChapterParser.getError(body);

    if (error) {
      throw new RoyalError(error);
    } else { return new RoyalResponse(chapter); }
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

    const error = ChapterParser.getError(body);
    const chapter = ChapterParser.parseChapter(body);

    if (error) {
      throw new RoyalError(error);
    } else { return new RoyalResponse(chapter); }
  }

  public async getComments(chapterID: number, page: number | 'last' = 1) {
    const base = `/fiction/0/_/chapter/${String(chapterID)}/_`;
    const path = base + '?' + new URLSearchParams({
      page: String(page === 'last'
        ? ChapterParser.getLastPage(await this.req.get(base)) : page,
      ),
    });

    const body = await this.req.get(path);
    const comments = ChapterParser.parseComments(body);

    return new RoyalResponse(comments);
  }

  private isValidNewChapter(chapter: NewChapter) {
    // TODO: Pre and post author notes maxlength?
    return chapter.content.length >= 500;
  }
}

class ChapterParser {
  public static getError(html: string) {
    const $ = cheerio.load(html);

    function isMissingInput() {
      const message = $('div.alert.alert-danger').find('li').text().trim();
      return (message && message.length !== 0) ? message : false;
    }

    const missingInput = isMissingInput();
    const error = missingInput;

    return error || null;
  }

  public static parseChapter(html: string): Chapter {
    const $ = cheerio.load(html);

    const notes = $('div.author-note');
    const preNote = $(notes).eq(0).find('p').text();
    const postNote = $(notes).eq(1).find('p').text();

    const content = $('div.chapter-inner.chapter-content').html().trim();

    return { content, preNote, postNote };
  }

  public static getLastPage(html: string) {
    const $ = cheerio.load(html);

    const href = $('ul.pagination').find('li').last().find('a').attr('href');

    if (!href) {
      return 1;
    }

    // Get whatever is before '#' and after '=', (?page=1#comments).
    const page = parseInt(href.split('#')[0].split('=')[1], 10);

    return page;
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
          $(el).find('span.name').find('a').attr('href').split('/')[2], 10,
        ),
      };

      comments.push({ id, author, posted, content });
    });

    return comments;
  }
}
