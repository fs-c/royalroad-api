import * as request from 'request-promise-native';

import { UserService } from './services/user';
import { FictionService } from './services/fiction';
import { FictionsService } from './services/fictions';
import { getBaseAddress, getUserAgent } from './constants';

export class Requester {
  private static readonly headers = {
    'User-Agent': getUserAgent(),
  };

  private readonly url: string;

  constructor(insecure = false) {
    this.url = getBaseAddress(insecure);
  }

  public async get(path: string) {
    const uri = this.url + path;

    const res = await request.get({
      uri,
      jar: true,
    });

    return res;
  }

  public async post(path: string, data: any) {
    const uri = this.url + path;

    const res = await request.post({
      uri,
      jar: true,
      form: data,
    });

    return res;
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
