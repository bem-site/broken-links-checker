export default class RequestQueue {

    constructor(concurrent, requestFunc, doneFunc) {
        this._concurrent = concurrent;
        this._requestFunc = requestFunc;
        this._doneFunc = doneFunc;

        this._pending = [];
        this._active = [];
        this._processed = new Map();
    }

    getPendingCount() {
        return this._pending.length;
    }

    getActiveCount() {
        return this._active.length;
    }

    /**
     * Checks if queue is full
     * @returns {Boolean}
     * @private
     */
    isFull() {
        return this._active.length >= this._concurrent;
    }

    /**
     * Adds item to check queue
     * @param {String} url - link url
     * @param {Object} advanced - object with advanced data
     * @private
     */
    add(url, advanced) {
        url = url.replace(/\/$/, '');

        if (this._processed.has(url)) {
            return;
        }

        this._processed.set(url, true);
        if (this.isFull()) {
            this._pending.push({ url: url, advanced: advanced });
        } else {
            this._active.push(url);
            this._requestFunc(url, advanced);
        }
    }

    /**
     * Removes item from request queue
     * @param  {String} id of request item
     * @return {*}
     * @private
     */
    remove(id) {
        var i = this._active.indexOf(id);
        this._active.splice(i, 1);

        if (!this.isFull()) {
            var next = this._pending.shift();
            if (next) {
                this._requestFunc(next.url, next.advanced);
            } else if (!this._active.length) {
                this._doneFunc();
            }
        }
    }
}
