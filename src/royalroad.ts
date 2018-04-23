import * as logger from 'debug';
import * as cheerio from 'cheerio';
import * as request from 'request';
import { URLSearchParams } from 'url';

import { RoyalError } from './responses';
import { UserService } from './services/user';
import { ProfileService } from './services/profile';
import { ChapterService } from './services/chapter';
import { FictionService } from './services/fiction';
import { FictionsService } from './services/fictions';
import { getBaseAddress, getUserAgent } from './constants';

interface RequestOptions {
  fetchToken?: boolean;
  ignoreStatus?: boolean;
  ignoreParser?: boolean;
  ignoreCookies?: boolean;
}

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

  get isAuthenticated() {
    const cookies = this.cookies.getCookies(
      getBaseAddress(this.insecure),
    );

    for (const cookie of cookies) {
      // TODO: Dangerous.
      const c = cookie as { key: string, value: string };

      if (c.key === 'mybbuser' && c.value) {
        return true;
      }
    }

    return false;
  }

  /**
   * GET request to the given path, under the base address.
   *
   * @param path
   */
  public async get(
    path: string, data: { [key: string]: string } = {},
    options: RequestOptions = {},
  ) {
    const query = new URLSearchParams(data);
    const uri = this.url + path + (query ? ('?' + query) : '');

    const body = await this.request({
      uri,
      jar: options.ignoreCookies ? undefined : this.cookies,
    });

    return body;
  }

  /**
   * POST request to the given path, under the base address.
   *
   * @param path
   */
  public async post(path: string, data: any, options: RequestOptions = {}) {
    const uri = this.url + path;

    data['__RequestVerificationToken'] = options.fetchToken ? (
      await this.fetchToken(path)
    ) : undefined;

    this.debug(data);

    return await this.request({
      uri,
      form: data,
      method: 'POST',
      jar: this.cookies,
    }, options);
  }

  private request(
    req: request.UriOptions & request.CoreOptions, options: RequestOptions = {},
  ): Promise<string> { return new Promise((resolve, reject) => {
    this.debug('%o: %o', req.method || 'GET', req.uri);

    req.headers = Requester.headers;

    request(req, (err, res, body) => {
      if (err || (res.statusCode !== 200 && !options.ignoreStatus)) {
        this.logCookies();

        return reject(new RoyalError(
          err ? err.message || err : res.statusMessage || 'Requester error',
        ));
      }

      this.debug('%o < %o (%o)',
        res.method || 'GET', res.statusCode, res.statusMessage);

      const genericError = this.catchGenericError(body);
      if (!options.ignoreParser && genericError !== null) {
        reject(new RoyalError(genericError));
      }

      resolve(body);
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
      .filter((c: any) => c) // Because for some reason values can be undefined.
      .map((c: { [key: string]: string }) =>
        `cookie ${c.key} = ${c.value.length >= 18
          ? c.value.slice(0, 17) + '...'
          : c.value}`,
      );

    this.debug(cookies);
  }

  /**
   * Fetch a request verification token from a hidden input on the
   * target path. Throws if it couldn't find one.
   *
   * @param path
   */
  private async fetchToken(path: string) {
    const body = await this.get(path);
    const $ = cheerio.load(body);

    // Disregard ignoreParser option here, we need to know when we weren't able
    // to fetch the token, even for operations where it would be set to true.
    const genericError = this.catchGenericError(body);
    if (genericError !== null) {
      throw new RoyalError(genericError);
    }

    const token: string = $('input[name="__RequestVerificationToken"]')
      .prop('value');

    this.debug('got token %o', token);

    if (token && token.length !== 0) {
      return token;
    } else { throw new RoyalError('Token not found.'); }
  }

  /**
   * Catch generic errors like 404 and 403, since RRL always returns with status
   * code 200.
   *
   * @param html
   */
  private catchGenericError(html: string) {
    const $ = cheerio.load(html);

    // Usually 4xx, mostly 404 and 403.
    const error =  $('div.page-404').find('h3').text().trim();
    // These often are a result of invalid POSTs.
    const alert = $('div.alert.alert-danger').eq(0).text().trim();

    const message = error || alert;

    return (message && message.length !== 0) ? message : null;
  }
}

/**
 * Container class, creating instances of the seperate Service classses.
 */
export class RoyalRoadAPI {
  public readonly user: UserService;
  public readonly profile: ProfileService;
  public readonly chapter: ChapterService;
  public readonly fiction: FictionService;
  public readonly fictions: FictionsService;

  private readonly req: Requester;

  constructor(insecure: boolean = false) {
    this.req = new Requester(insecure);

    this.user = new UserService(this.req);
    this.profile = new ProfileService(this.req);
    this.chapter = new ChapterService(this.req);
    this.fiction = new FictionService(this.req);
    this.fictions = new FictionsService(this.req);
  }
}
