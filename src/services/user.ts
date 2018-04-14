import * as cheerio from 'cheerio';
import { Requester } from '../royalroad';

interface MyFiction {
  id: number;
  title: string;
}

/**
 * Methods related to logged in users.
 */
export class UserService {
  private readonly req: Requester;

  constructor(req: Requester) {
    this.req = req;
  }

  /**
   * Log on to royalroadl, saving the cookies for use in subsequent
   * requests.
   *
   * @param username
   * @param password
   */
  public async login(username: string, password: string) {
    const body = await this.req.post(
      '/user/login', { username, password },
    );

    const err = UserParser.getAlert(body);

    if (err !== null) {
      throw new Error(err);
    } else { return body; }
  }

  /**
   * @returns Array of fictions owned by logged in user.
   */
  public async getMyFictions() {
    const body = await this.req.get('/my/fictions');
    const myFictions = UserParser.parseMyFictions(body);

    return myFictions;
  }
}

/**
 * Methods related to parsing user related HTML.
 */
class UserParser {
  public static getAlert(html: string) {
    const $ = cheerio.load(html);

    const error = $('div.alert.alert-danger').eq(0).text().trim();

    if (error.length) {
      return error;
    } else { return null; }
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
}
