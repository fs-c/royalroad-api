import * as logger from 'debug';
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

    if (this.debug.enabled) {
      this.logCookies();
    }

    const res = await request.get({
      uri,
      jar: this.cookies,
    });

    return res;
  }

  public async post(path: string, data: any, ignoreToken?: boolean) {
    const uri = this.url + path;

    if (this.debug.enabled) {
      this.logCookies();
    }

    if (!ignoreToken) {
      data['__RequestVerificationToken'] = this.getToken(this.insecure);
    }

    console.log(data);

    const res = await request.post({
      uri,
      jar: this.cookies,
      form: data,
    });

    return res;
  }

  private getToken(insecure: boolean = false) {
    const addr = getBaseAddress(insecure);
    const cookies = this.cookies.getCookies(addr);

    for (const cookie of cookies) {
      if (!cookie) {
        continue;
      }

      // TODO: Dangerous! ...but there's no good request cookie typings.
      const c = cookie as any as { key: string, value: string };

      if (c.key === '__RequestVerificationToken') {
        return decodeURIComponent(c.value);
      }
    }
  }

  private logCookies() {
    const addr = getBaseAddress(this.insecure);
    const cookies = this.cookies.getCookies(addr);

    cookies.forEach((c: any) =>
      c ? this.debug('%o - %o', c.key, c.value) : null);
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
