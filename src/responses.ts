export class RoyalResponse<T> {
  public data: any;
  public error: any;
  public success: boolean;
  public timestamp: number;

  constructor(data: T, success: boolean = true) {
    this.success = success;
    this.timestamp = Date.now();

    if (success) {
      this.data = data;
      this.error = null;
    } else {
      this.data = null;
      this.error = data;
    }
  }
}

export class RoyalError extends RoyalResponse<object> {
  constructor(message: string) {
    super({ message }, false);
  }
}
