/**
 * @exports
 * @class BrokenUrls
 * @desc Model for holding broken links information and methods for working with this data
 */
export default class BrokenUrls {
    /**
     * Constructor function
     * @constructor
     */
    constructor() {
        /**
         * Array of broken urls infos
         * @type {Array}
         */
        this._urls = [];
    }

    /**
     * Static initializer for BrokenLinks instance
     * @returns {BrokenLinks}
     * @static
     */
    static create() {
        return new BrokenUrls();
    }

    /**
     * Add url with given response status code to model of broken links
     * @param {String} url - link url
     * @param {Obect} advanced - advanced data hash
     * @param {Number} code - response status code
     * @returns {exports}
     * @public
     */
    add(url, advanced, code) {
        this._urls.push({ url: url, advanced: advanced, code: code });
        return this;
    }

    /**
     * Return all broken url items
     * @returns {Object[]}
     * @public
     */
    getAll() {
        return this._urls;
    }

    /**
     * Return broken url items with given status code
     * @param {Number} code - response status code
     * @returns {Object[]}
     * @public
     */
    getByCode(code) {
        return this.getAll().filter(item => {
            return item.code === code;
        });
    }

    /**
     * Returns broken urls with response status equals to 404. Page not found error
     * @returns {Object[]}
     * @public
     */
    get404() {
        return this.getByCode(404);
    }

    /**
     * Returns broken urls with response status equals to 500. Server error
     * @returns {Object[]}
     * @public
     */
    get500() {
        return this.getByCode(500);
    }

    /**
     * Clears broken links model
     * @returns {exports}
     * @public
     */
    clear() {
        this._urls = [];
        return this;
    }
}
