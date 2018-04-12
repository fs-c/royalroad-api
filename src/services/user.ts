import * as cheerio from 'cheerio';
import { Requester } from '../royalroad';

interface MyFiction {
  id: number;
  title: string;
}

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
    const res = await this.req.post(
      '/user/login', { username, password },
    );

    // RRL will always return 200 here.
    if (!res.includes('success')) {
      throw new Error('Login failed.');
    }

    return res;
  }

  public async getAccount() {
    const res = await this.req.get('/account');

    return res;
  }

  public async getMyFictions() {
    const html = await this.req.get('/my/fictions');
    const myFictions = UserParser.parseMyFictions(html);

    return myFictions;
  }
}

class UserParser {
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
