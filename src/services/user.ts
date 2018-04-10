import { Requester } from '../royalroad';

export class UserService {
  private readonly req: Requester;

  constructor(req: Requester) {
    this.req = req;
  }

  public async login(username: string, password: string) {
    const res = await this.req.post('/user/login', { username, password });

    if (res.statusCode === 200) {
      return;
    }
  }
}
