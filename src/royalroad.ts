import { FictionService } from './services/fiction';
import { FictionsService } from './services/fictions';

export class RoyalRoadAPI {
  public readonly fiction: FictionService;
  public readonly fictions: FictionsService;

  constructor() {
    this.fiction = new FictionService();
    this.fictions = new FictionsService();
  }
}
