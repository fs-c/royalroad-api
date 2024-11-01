import { getBaseAddress, getUserAgent } from './constants.js';
import * as cheerio from 'cheerio';
import { RoyalError } from './responses.js';
import debug from 'debug';
import { CookieJar } from 'tough-cookie';
import got, { OptionsOfTextResponseBody } from 'got';

interface InternalRequestOptions {
    fetchToken?: boolean;
    ignoreStatus?: boolean;
    ignoreParser?: boolean;
    successStatus?: number;
    ignoreCookies?: boolean;
}

/**
 * Class passed to all Services for consistent cookies across requests.
 */
export class Requester {
    private static readonly headers = {
        'User-Agent': getUserAgent(),
    };

    private static catchGenericErrorLegacy(html: string): string | null {
        const $ = cheerio.load(html);

        // Usually 4xx, mostly 404 and 403.
        const error = $('div.page-404').find('h3').text().trim();
        // These often are a result of invalid POSTs.
        const alert = $('div.alert.alert-danger').eq(0).text().trim();

        return error || alert || null;
    }

    private readonly url = getBaseAddress();
    private readonly debug = debug('royalroad-api:requester');

    private readonly cookieJar = new CookieJar();

    get isAuthenticated() {
        const authenticationCookie = this.cookieJar
            .getCookiesSync(this.url)
            .find((cookie) => cookie.key === '.AspNetCore.Identity.Application');
        return authenticationCookie != null;
    }

    /**
     * GET request to the given path, under the base address.
     *
     * @param path
     * @param data
     * @param options
     */
    public async get(
        path: string,
        data: { [key: string]: string } = {},
        options: InternalRequestOptions = {},
    ) {
        const query = new URLSearchParams(data);

        return await this.request(
            {
                url: this.url + path + (query ? '?' + query : ''),
            },
            options,
        );
    }

    /**
     * POST request to the given path, under the base address.
     *
     * @param path
     * @param data
     * @param options
     */
    public async post(
        path: string,
        data: { [key: string]: string },
        options: InternalRequestOptions = {},
    ) {
        this.debug('sending POST to %o with %o options', path, options);

        if (options.fetchToken) {
            data.__RequestVerificationToken = await this.fetchToken(path);
        }

        return await this.request(
            {
                url: this.url + path,
                form: data,
                method: 'POST',
            },
            options,
        );
    }

    /**
     * Helper function for the public, method-specific functions. Asynchronous
     * abstraction over the request module with some additional functionality.
     *
     * @param request
     * @param internalOptions
     */
    private async request(
        request: OptionsOfTextResponseBody,
        internalOptions: InternalRequestOptions = {},
    ): Promise<string> {
        this.debug('%o > %o', request.method || 'GET', request.url);

        request.cookieJar = this.cookieJar;
        request.headers = Requester.headers;

        try {
            const response = await got(request);

            this.debug(
                '%o < %o (%o)',
                request.method || 'GET',
                response.statusCode,
                response.statusMessage,
            );

            if (
                response.statusCode !== (internalOptions.successStatus || 200) &&
                !internalOptions.ignoreStatus
            ) {
                throw new RoyalError(`Request error: ${response.statusMessage}`);
            }

            const genericError = this.catchGenericError(response.body);
            if (!internalOptions.ignoreParser && genericError !== null) {
                throw new RoyalError(genericError);
            }

            return response.body;
        } catch (error: unknown) {
            this.debug('request error %O', error);
            throw new RoyalError(error instanceof Error ? error.message : 'Unkown error');
        }
    }

    /**
     * Fetch a request verification token from a hidden input on the
     * target path. Throws if it couldn't find one.
     *
     * @param path
     */
    private async fetchToken(path: string) {
        const body = await this.get(path);
        const $ = cheerio.load(body);

        // Disregard ignoreParser option here, we need to know when we weren't
        // able to fetch the token, even for operations where it would be set to
        // true.
        const genericError = this.catchGenericError(body);
        if (genericError !== null) {
            throw new RoyalError(genericError);
        }

        const token: string = $('input[name="__RequestVerificationToken"]').prop('value');

        this.debug('got token %o', token);

        if (token && token.length !== 0) {
            return token;
        } else {
            throw new RoyalError('Token not found.');
        }
    }

    /**
     * Catch generic errors like 404 and 403, since RRL always returns with
     * status code 200.
     *
     * @param html
     */
    private catchGenericError(html: string): string | null {
        // TODO: Check if these legacy errors are still used anywhere.
        const legacy = Requester.catchGenericErrorLegacy(html);

        const $ = cheerio.load(html);

        const error = $('div.text-danger').find('li').first().text().trim() || null;

        // TODO: Add other errors and warnings of the 3.x site.

        this.debug('parsed page for generic errors %O', { error, legacy });

        return error || legacy;
    }
}
