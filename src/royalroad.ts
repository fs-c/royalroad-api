import * as logger from 'debug';
import * as cheerio from 'cheerio';
import * as request from 'request';

import { UserService } from './services/user';
import { ChapterService } from './services/chapter';
import { FictionService } from './services/fiction';
import { FictionsService } from './services/fictions';
import { getBaseAddress, getUserAgent } from './constants';

/**
 * Class passed to all Services for consistent cookies accross requests.
 */
export class Requester {
  private static readonly headers = {
    'User-Agent': getUserAgent(),
  };

  public cookies: any; // TODO: Dangerous!
  public insecure: boolean;

  private readonly url: string;
  private readonly debug: logger.IDebugger;

  constructor(insecure = false) {
    this.insecure = insecure;
    this.cookies = request.jar();
    this.debug = logger('requester');
    this.url = getBaseAddress(insecure);
  }

  /**
   * GET request to the given path, under the base address.
   *
   * @param path
   */
  public async get(path: string) {
    const uri = this.url + path;

    this.logCookies();
    this.debug('GET: %o', uri);

    const body = await this.request({
      uri,
      jar: this.cookies,
      headers: Requester.headers,
    });

    return body;
  }

  /**
   * POST request to the given path, under the base address.
   *
   * @param path
   */
  public async post(path: string, data: any, fetchToken?: boolean) {
    const uri = this.url + path;

    data['__RequestVerificationToken'] = fetchToken ? (
      await this.fetchToken(path)
    ) : undefined;

    this.logCookies();
    this.debug('POST: %o', uri);

    const body = await this.request({
      uri,
      form: data,
      method: 'POST',
      jar: this.cookies,
    });

    return body;
  }

  private request(
    options: request.UriOptions & request.CoreOptions,
  ): Promise<string> { return new Promise((resolve, reject) => {
    request(options, (err, res, body) => {
      if (err) {
        return reject(err);
      }

      if (res.statusCode === 200) {
        return resolve(body);
      }

      reject(res);
    });
  }); }

  /**
   * Log all cookies in the jar, shorten values which are longer than
   * 20 characters.
   *
   * @param insecure
   */
  private logCookies(insecure?: boolean) {
    const addr = getBaseAddress(insecure);
    const cookies = this.cookies.getCookies(addr)
      .filter((c: any) => c)
      .map((c: any) => `cookie ${c.key} = ${c.value.length >= 18
        ? c.value.slice(0, 17) + '...' : c.value}`);

    this.debug(cookies);
  }

  /**
   * Fetch a request verification token from a hidden input on the
   * target path. Throws if it couldn't find one.
   *
   * @param path
   */
  private async fetchToken(path: string) {
    const $ = cheerio.load(await this.get(path) as string);

    const token: string = $('input[name="__RequestVerificationToken"]')
      .prop('value');

    this.debug('got token %o', token);

    if (token.length !== 0) {
      return token;
    } else { throw new Error('Token not found.'); }
  }
}

/**
 * Container class, creating instances of the seperate Service classses.
 */
export class RoyalRoadAPI {
  public readonly user: UserService;
  public readonly chapter: ChapterService;
  public readonly fiction: FictionService;
  public readonly fictions: FictionsService;

  private readonly req: Requester;

  constructor(insecure?: boolean) {
    this.req = new Requester(insecure);

    this.user = new UserService(this.req);
    this.chapter = new ChapterService(this.req);
    this.fiction = new FictionService(this.req);
    this.fictions = new FictionsService(this.req);
  }
}
