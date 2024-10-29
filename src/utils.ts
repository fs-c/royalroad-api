import * as cheerio from 'cheerio';

export const getLastPage = (html: string): number => {
    const $ = cheerio.load(html);

    const href = $('ul.pagination').find('li').last()
        .find('a').attr('href');

    if (!href || href === 'javascript:;') {
        return -1;
    }

    // Get whatever is before '#' and after '=', (?page=1#comments).
    return parseInt(href.split('#')[0].split('=')[1], 10);
};

export const isAd = (element: CheerioElement): boolean => 
    cheerio(element).hasClass('portlet');
