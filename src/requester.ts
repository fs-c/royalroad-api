import axios, { AxiosRequestConfig } from 'axios';
import { getBaseAddress, getUserAgent } from './constants.js';
import * as cheerio from 'cheerio';
import { RoyalError } from './responses.js';
import debug from 'debug';

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

    private readonly cookies = new Map<string, string>();

    private readonly url = getBaseAddress();
    private readonly debug = debug('requester');

    get isAuthenticated() {
        const authenticationCookie = this.cookies.get('.AspNetCore.Identity.Application');
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
        data: { [key: string]: unknown },
        options: InternalRequestOptions = {},
    ) {
        this.debug('sending POST to %o with %o options', path, options);

        data['__RequestVerificationToken'] = options.fetchToken
            ? await this.fetchToken(path)
            : undefined;

        return await this.request(
            {
                url: this.url + path,
                data: axios.toFormData(data),
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
        request: AxiosRequestConfig,
        internalOptions: InternalRequestOptions = {},
    ): Promise<string> {
        this.debug('%o > %o', request.method || 'GET', request.url);

        request.headers = {
            ...Requester.headers,
            Cookie: internalOptions.ignoreCookies
                ? ''
                : [...this.cookies.entries()].map(([k, v]) => `${k}=${v}`).join('; '),
        };

        try {
            const response = await axios(request);

            this.debug(
                '%o < %o (%o)',
                request.method || 'GET',
                response.status,
                response.statusText,
            );
            this.logCookies();

            if (
                response.status !== (internalOptions.successStatus || 200) &&
                !internalOptions.ignoreStatus
            ) {
                throw new RoyalError(`Request error: ${response.statusText}`);
            }

            const genericError = this.catchGenericError(response.data);
            if (!internalOptions.ignoreParser && genericError !== null) {
                throw new RoyalError(genericError);
            }

            return response.data;
        } catch (error: unknown) {
            throw new RoyalError(error instanceof Error ? error.message : 'Unkown error');
        }
    }

    /**
     * Log all stored cookies, shortening long values.
     *
     * @param insecure
     */
    private logCookies() {
        this.debug('dumping cookies');

        for (const [key, value] of this.cookies.entries()) {
            this.debug(
                '\tcookie %o = %o',
                key,
                value.length >= 18 ? value.slice(0, 17) + '...' : value,
            );
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
