export class RoyalResponse<T> {
  public data: T;
  public success: boolean;
  public timestamp: number;

  constructor(data: T, success: boolean = true) {
    this.data = data;
    this.success = success;
    this.timestamp = Date.now();
  }
}

export class RoyalError extends RoyalResponse<object> {
  constructor(message: string, data: object = {}) {
    const stack = new Error().stack.split('\n');
    super(Object.assign({ message }, { stack }, data), false);
  }
}
