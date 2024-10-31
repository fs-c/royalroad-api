import { UserService } from './services/user.js';
import { ProfileService } from './services/profile.js';
import { ChapterService } from './services/chapter.js';
import { FictionService } from './services/fiction.js';
import { FictionsService } from './services/fictions.js';
import { Requester } from './requester.js';

/**
 * Container class, creating instances of the separate Service classes.
 */
export class RoyalRoadAPI {
    private readonly requester = new Requester();

    public readonly user = new UserService(this.requester);
    public readonly profile = new ProfileService(this.requester);
    public readonly chapter = new ChapterService(this.requester);
    public readonly fiction = new FictionService(this.requester);
    public readonly fictions = new FictionsService(this.requester);
}
