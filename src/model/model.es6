/**
 * @exports
 * @desc
 * Main checker model class
 */
export default class Model {
    constructor () {
        /**
         * Pending queue
         * @type {Array}
         */
        this._pending = [];

        /**
         * Performed items
         * @type {Array}
         */
        this._active = [];

        /**
         * Map of external link items
         * @type {Map}
         */
        this._external = new Map();

        /**
         * Map of processed link items
         * @type {Map}
         */
        this._processed = new Map();
    }

    /**
     * Getter for external links items map
     * @return {Map} external items map
     */
    get external() {
        return this._external;
    }

    /**
     * Add item to external links model
     * @param {String} url resolved from href
     * @param {String} baseUrl page url where href was discovered
     * @param {String} href found in document
     * @returns {Model}
     */
    addToExternal(url, baseUrl, href) {
        this._external.set(url, { page: baseUrl, href: href });
        return this;
    }

    /**
     * Add link url to list of active (checked at this moment)
     * @param {String} url of href found on page
     */
    addToActive(url) {
        this._active.push(url);
        return this;
    }

    /**
     * Adds item to array of pending items
     * @param {String} url      resolved url of link
     * @param {Object} advanced info object
     * @returns {Model}
     */
    addToPending(url, advanced) {
        this._pending.push({ url: url, advanced: advanced });
        return this;
    }

    /**
     * Returns length of active items array
     * @return {Number}
     */
    getActiveLength() {
        return this._active.length;
    }

    /**
     * Returns length of pending items array
     * @return {Number}
     */
    getPendingLength() {
        return this._pending.length;
    }

    /**
     * Returns true if external items map contains items
     * @return {Boolean}
     */
    areExternal() {
        return !!this._external.size;
    }

    /**
     * Returns true if active items array contains items
     * @return {Boolean}
     */
    areActive() {
        return !!this.getActiveLength();
    }

    /**
     * Returns true of length of active items greater then given max number
     * @param  {[type]}  max [description]
     * @return {Boolean}     [description]
     */
    isQueueFull(max) {
        return this._active.length >= max;
    }

    /**
     * Returns true if items was not at provessed items
     * Also item is put into processed map
     * @param {String} url resolved from link
     */
    addToProcessed(url) {
        if (this._processed.has(url)) {
            return false;
        }
        this._processed.set(url, true);
        return true;
    }

    /**
     * Removes item corresponded to given url from active items array
     * @param  {String} url resolved from link
     * @return {Model}
     */
    removeFromActive(url) {
        this._active.splice(this._active.indexOf(url), 1);
        return this;
    }

    /**
     * Removes first item from pending items array and returns it
     * @return {Object}
     */
    removeFromPending() {
        return this._pending.shift();
    }
}
