import { Requester } from '../royalroad';

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
      '/user/login', { username, password }, true,
    );

    if (res.statusCode === 200) {
      return;
    }
  }

  public async getAccount() {
    const res = await this.req.get('/account');

    return res;
  }
}
