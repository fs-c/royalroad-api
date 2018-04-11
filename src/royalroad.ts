import * as logger from 'debug';
import * as cheerio from 'cheerio';
import * as request from 'request-promise-native';

import { UserService } from './services/user';
import { FictionService } from './services/fiction';
import { FictionsService } from './services/fictions';
import { getBaseAddress, getUserAgent } from './constants';

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

  public async get(path: string) {
    const uri = this.url + path;

    this.logCookies();
    this.debug('GET: %o', uri);

    const res = await request.get({
      uri,
      jar: this.cookies,
    });

    return res;
  }

  public async post(path: string, data: any, fetchToken?: boolean) {
    const uri = this.url + path;

    this.logCookies();
    this.debug('POST: %o', uri);

    if (fetchToken) {
      data['__RequestVerificationToken'] = await this.fetchToken(path);
    }

    const res = await request.post({
      uri,
      form: data,
      jar: this.cookies,
    });

    return res;
  }

  private logCookies(insecure?: boolean) {
    const addr = getBaseAddress(insecure);
    const cookies = this.cookies.getCookies(addr).filter((c: any) => c);

    this.debug(cookies);
  }

  private async fetchToken(path: string) {
    const $ = cheerio.load(await this.get(path));

    const token = $('input[name="__RequestVerificationToken"]').prop('value');

    this.debug('got token %o', token);

    if (token) {
      return token;
    } else { throw new Error('Token not found.'); }
  }
}

/**
 * Container class, creating instances of the seperate Service classses.
 */
export class RoyalRoadAPI {
  public readonly user: UserService;
  public readonly fiction: FictionService;
  public readonly fictions: FictionsService;

  private readonly req: Requester;

  constructor(insecure?: boolean) {
    this.req = new Requester(insecure);

    this.user = new UserService(this.req);
    this.fiction = new FictionService(this.req);
    this.fictions = new FictionsService(this.req);
  }
}
