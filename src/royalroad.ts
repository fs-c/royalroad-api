import { FictionService } from './services/fiction';
import { FictionsService } from './services/fictions';
/**
 * Container class, creating instances of the seperate Service classses.
 */
export class RoyalRoadAPI {
  public readonly fiction: FictionService;
  public readonly fictions: FictionsService;

  constructor() {
    this.fiction = new FictionService();
    this.fictions = new FictionsService();
  }
}
