import * as cheerio from 'cheerio';
import type { AnyNode } from 'domhandler';

export const getLastPage = (html: string): number => {
    const $ = cheerio.load(html);

    const href = $('ul.pagination').find('li').last().find('a').attr('href');

    if (!href || href === 'javascript:;') {
        return -1;
    }

    return parseInt(href.split('#')[0].split('=')[1], 10);
};

export const isAd = <T extends AnyNode>(element: cheerio.Cheerio<T>): boolean => {
    return element.hasClass('portlet');
};
