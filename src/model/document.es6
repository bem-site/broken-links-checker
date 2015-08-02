import cheerio  from 'cheerio';
import Url  from 'url';

/**
 * @exports
 * @class Document
 * @desc Model for loaded document from link url request
 */
export default class Document {
    /**
     * Constructor function
     * @param {String} url - request url
     * @param {HttpResponse} res - response object
     * @constructor
     */
    constructor (url, res) {
        /**
         * Response object
         * @type {HttpResponse|HttpsResponse} - respose object
         */
        this._res = res;

        /**
         * Url document has been loaded from
         * @type {String}
         */
        this._url = url;

        /**
         * Cheerio
         * @param  {String} res.toString('utf-8') response html data string
         * @return {Function} cherio tree function
         */
        this._$ = cheerio.load(res.toString('utf-8'));
    }

    /**
     * Returns response object
     * @returns {HttpResponse|HttpsResponse}
     * @public
     */
    get res() {
        return this._res;
    }

    /**
     * Returns document url
     * @returns {String}
     * @public
     */
    get url() {
        return this._url;
    }

    /**
     * Parses response body parsed by cheerio
     * @returns {*|any|Object|undefined}
     * @public
     */
    get $() {
        return this._$;
    }

    /**
     * Resolves parsed link against document url
     * @param {String} link - document link
     * @public
     */
    resolve(link) {
        return Url.resolve(this._url, link);
    }
}
