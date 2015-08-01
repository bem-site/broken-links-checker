/**
 * Makes request to given url
 * @param {String} url - link url (url that should be requested)
 * @param {String} baseUrl - url of page where link was discovered
 * @param {Function} callback - callback function
 */
/*
 load: function (url, baseUrl, callback) {
 this._active.push(url);
 curl.request({
 url: url,
 headers: this.getOption('requestHeaders'),
 retries: this.getOption('requestRetriesAmount'),
 timeout: this.getOption('requestTimeout'),
 redirects: this.getOption('requestMaxRedirectsAmount'),
 scope: this,
 include: true
 }, function (error, data) {
 var res = parser.parseResponse(data),
 statusCode = +res.statusCode;

 if (error || !data || statusCode >= 400) {
 this._logger.error('Broken [%s] url: => %s on page: => %s', statusCode, url, baseUrl);
 this.appendToReportFile([url, baseUrl, statusCode].join(' '));
 }

 if (url.indexOf(this._url.hostname) < 0) {
 this._logger.verbose('[%s] [%s] External url: => %s',
 this._pending.length, this._active.length, url);
 return this._onFinishLoad(url);
 }

 if (statusCode === 301 || statusCode === 302) {
 var redirect = res.headers['Location'];
 if (redirect && this.__self.isString(redirect)) {
 return this.load(Url.resolve(this._url.href, redirect), baseUrl, callback);
 } else {
 return this._onFinishLoad(url);
 }
 }

 this._logger.verbose('[%s] [%s] Receive [%s] for url: => %s',
 this._pending.length, this._active.length, statusCode, url);
 callback.call(this, new Document(url, res));
 });
 },
 */
