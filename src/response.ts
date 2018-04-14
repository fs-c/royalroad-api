export class RRLResponse {
  public data: any;
  public error: any;
  public success: boolean;
  public timestamp: number;

  constructor(data: any, success: boolean = true) {
    if (success) {
      this.data = data;
      this.error = null;
    } else {
      this.data = null;
      this.error = data;
    }
  }
}

export class RRLError extends RRLResponse {
  constructor(data: any) {
    super(data, false);
  }
}
