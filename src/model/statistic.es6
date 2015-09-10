import Broken  from './broken';

/**
 * @exports
 * @class Statistic
 * @desc Model for collection analyze results
 */
export default class Statistic {

    /**
     * Constructor function
     * @constructor
     */
    constructor() {
        /**
         * Brokens links model
         * @return {Broken}
         */
        this._broken = Broken.create();

        /**
         * Number of processed external links
         * @type {Number}
         */
        this._countExternal = 0;

        /**
         * Number of processed internal links
         * @type {Number}
         */
        this._countInternal = 0;

        /**
         * Start time of crawler processing (in milliseconds)
         * @type {number}
         * @private
         */
        this._startTime = +(new Date());

        /**
         * End time of crawler processing (in milliseconds)
         * @type {number}
         * @private
         */
        this._endTime = +(new Date());
    }

    /**
     * Static constructor for Statistic class
     * @return {Statistic}
     * @static
     */
    static create() {
        return new Statistic();
    }

    /**
     * Increase count of processed internal website links
     * @returns {Statistic}
     * @public
     */
    increaseInternalCount() {
        this._countInternal++;
        return this;
    }

    /**
     * Increase count of processed external website links
     * @returns {Statistic}
     * @public
     */
    increaseExternalCount() {
        this._countExternal++;
        return this;
    }

    /**
     * Mark statistic as finished
     */
    finish() {
        this._endTime = +(new Date());
    }

    /**
     * Returns time of link scanning (in milliseconds)
     * @returns {number}
     */
    getTime() {
        return this._endTime - this._startTime;
    }

    /**
     * Returns amount of processed internal website links
     * @returns {Number}
     * @public
     */
    getInternalCount() {
        return this._countInternal;
    }

    /**
     * Returns amount of processed external website links
     * @returns {Number}
     * @public
     */
    getExternalCount() {
        return this._countExternal;
    }

    /**
     * Returns total amount of processed links (internal and external)
     * @returns {Number}
     * @public
     */
    getAllCount() {
        return this.getExternalCount() + this.getInternalCount();
    }

    /**
     * Returns model of broken links
     * @returns {Broken}
     * @public
     */
    getBroken() {
        return this._broken;
    }

    /**
     * Returns amount of founded broken links
     * @returns {Number}
     * @public
     */
    getBrokenCount() {
        return this.getBroken().getAll().length;
    }
}
