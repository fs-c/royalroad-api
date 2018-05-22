import * as cheerio from 'cheerio';
import { Requester } from '../royalroad';
import { RoyalResponse } from '../responses';

export interface ProfileOverview {
  name: string;
  avatar: string;
  active: number;
  gender: string;
  joined: number;
  follows: number;
  ratings: number;
  location: string;
  favorites: number;
  biography: string;
  authorStats: ProfileAuthorStats;
}

export interface ProfileAuthorStats {
  words: number;
  reviews: number;
  fictions: number;
  followers: number;
  favorites: number;
}

/**
 * Methods related to (foreign) user profiles.
 */
export class ProfileService {
  private readonly req: Requester;

  constructor(req: Requester) {
    this.req = req;
  }

  /**
   * Returns a RRL user profile given its ID.
   *
   * @param id - Profile ID, found in /profile/<id>.
   */
  public async getProfile(id: number) {
    const url = `/profile/${String(id)}`;
    const body = await this.req.get(url);
    const profile = ProfileParser.parseProfile(body);

    return new RoyalResponse(profile);
  }
}

class ProfileParser {
  public static parseProfile(html: string): ProfileOverview {
    const $ = cheerio.load(html);

    const avatar = $('div.profile-picture-container').find('img').attr('src');

    const statsEl = $('div.profile-stats');
    const name = $(statsEl).find('h1').text().trim();

    const statsEls = $(statsEl).find('span.stat-value');
    const follows = parseInt($(statsEls).eq(0).text(), 10);
    const ratings = parseInt($(statsEls).eq(2).text(), 10);
    const fictions = parseInt($(statsEls).eq(3).text(), 10);
    const favorites = parseInt($(statsEls).eq(1).text(), 10);

    const pInfoEl = $('tbody').eq(0);

    const timeEls = $(pInfoEl).find('time');
    const joined = parseInt($(timeEls).eq(0).attr('unixtime'), 10);
    const active = parseInt($(timeEls).eq(1).attr('unixtime'), 10);

    const metaEls = $(pInfoEl).find('td');
    const gender = $(metaEls).eq(2).text().trim();
    const location = $(metaEls).eq(3).text().trim();
    const biography = $(metaEls).eq(4).text().trim();

    const aInfoEl = $('tbody').eq(1);

    const aStatsEls = $(aInfoEl).find('td');
    const authorStats = {
      fictions,
      words: parseInt($(aStatsEls).eq(1).text(), 10),
      reviews: parseInt($(aStatsEls).eq(2).text(), 10),
      followers: parseInt($(aStatsEls).eq(3).text(), 10),
      favorites: parseInt($(aStatsEls).eq(4).text(), 10),
    };

    return { name, avatar, gender, active, joined, follows, ratings, location,
      favorites, biography, authorStats };
  }
}
