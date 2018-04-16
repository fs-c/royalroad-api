export class RoyalResponse<T> {
  public data: any;
  public error: any;
  public success: boolean;
  public timestamp: number;

  constructor(data: T, success: boolean = true) {
    this.success = success;
    this.timestamp = Date.now();

    this.data = success ? data : null;
    this.error = success ? null : data;
  }
}

export class RoyalError extends RoyalResponse<object> {
  constructor(message: string, data: object = {}) {
    const stack = new Error().stack.split('\n');
    super(Object.assign({ message }, { stack }, data), false);
  }
}
