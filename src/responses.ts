export class RoyalResponse {
  public data: any;
  public error: any;
  public success: boolean;
  public timestamp: number;

  constructor(data: any, success: boolean = true) {
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

export class RoyalError extends RoyalResponse {
  constructor(data: any) {
    if (typeof data === 'string') {
      data = { message: data };
    }

    super(data, false);
  }
}
