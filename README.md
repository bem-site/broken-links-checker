<!-- # broken-links-checker -->
Broken links checker for website pages

[![NPM version](http://img.shields.io/npm/v/bs-broken-links-checker.svg?style=flat)](http://www.npmjs.org/package/bs-broken-links-checker)
[![Coveralls branch](https://img.shields.io/coveralls/bem-site/broken-links-checker/master.svg)](https://coveralls.io/r/bem-site/broken-links-checker?branch=master)
[![Travis](https://img.shields.io/travis/bem-site/broken-links-checker.svg)](https://travis-ci.org/bem-site/broken-links-checker)
[![Code Climate](https://codeclimate.com/github/bem-site/broken-links-checker/badges/gpa.svg)](https://codeclimate.com/github/bem-site/broken-links-checker)
[![David](https://img.shields.io/david/bem-site/broken-links-checker.svg)](https://david-dm.org/bem-site/broken-links-checker)

![GitHub Logo](./logo.gif)

[RUSSIAN DOCUMENTATION](./README.ru.md)

## Working with help of command line interface (cli)

Broken links checker can be used as single [NodeJS](http://nodejs.org) application and as [npm](https://www.npmjs.com) - dependency which can be plugged to your package.

At first case, you should:

* clone project repo to your local filesystem
* checkout to last stable tag
* install [npm](https://www.npmjs.com) dependencies and compile runtime code
```shell
$ git clone https://github.com/bem-site/broken-links-checker.git
$ cd broken-links-checker
$ git checkout vx.y.z
$ npm run deps
```

At second case you should simply install project as yet another [npm](https://www.npmjs.com) - package:
```shell
$ npm install --save bs-broken-links-checker
```

### Usage:

Usage of broken-links-checker tool from cli consists of 3 steps:

1. Configuration file generation with help of [config](#config) command.
2. Run site analyze process with [run](#run) command.
3. View generated `*.html` report file.

### Commands

* [config](#config) - configuration file generation
* [run](#run) - launch tool
* [version](#version) - view tool version

### config

You can use this command to generate tool configuration file with `.js` extension.
It is suitable to have configuration file by 2 reasons:
* - some options value are too complex and can not be simply passed from cli.
* - usage advantages. (You can set all you parameters in single configuration file.

##### Parameters:

* `name` - configuration file name. It is good practice to use your target website host name
as value of this parameter.

Usage example:

```shell
$ node bin/blc config -n my.broken-site.com
```
Expected console output:
```shell
INFO acts/config.js: Configuration file: => my.broken-site.com.js has been generated successfully
```

**Notation**: generated configuration file `my.broken-site.com.js` will be placed into `./configs` folder
inside process working directory.

#### Configuration file structure:

Configuration file is simple [NodeJS](http://nodejs.org) module, which exports object where keys are
names of options and values are option values.

* `url` - url of website, website section or even single website page which should be analyzed for broken links.

* `logger` - allows to set log verbosity mode. Available values for log level are:
`level`: 'verbose', 'debug', 'info', 'warn', 'error';

* `concurrent` - number of inner website links which would be analyzed concurrently.
The optimal value of this param should be found empirically.
If this value is too low then total time of website analyze will increase.
If this value is too high then workload your website server will increase and cause some network errors and result corruptions.

**Notation**: this parameter is applicable only for inner links. All external links are checked by 100 items concurrently.

* `requestHeaders` - allows to set custom request headers.

* `requestRetriesAmount` - max request attempts for one analyzed url before it will be resolved as broken.

* `requestTimeout` - max server response waiting time per request (in milliseconds).

* `acceptedSchemes` - permitted url schemas. All links which urls contains schemas different from
listed here will be excluded from analyze.

* `checkExternalUrls` - enables or disables external links check. If value of this param is equal to
`false`, then only inner links of website will be analyzed.

* `excludeLinkPatterns` - allows to set url patterns which should be excluded from analyze. For example if
you want to exclude all nested links of `/contacts` website section, then set as value of
`excludeLinkPatterns` option:
```js
module.exports = {
    ...
    "excludeLinkPatterns": [
        /\/contacts/
    ]
}
```

You can pass regular expression or string patterns (including wildcards) as values of this param.

More examples:
```js
module.exports = {
    ...
    excludeLinkPatterns: [
        /\/contacts/,
        http://google.com,
        http://my.site.com/foo/*,
        */foo/bar
    ]
}
```


### run

Launches website analyze process for existed broken links verification.

##### Parameters:

* `-c` or `--config`: Path to [configuration file](#user-content-configuration-file-structure). Required parameter.

* `-u` or `--url`: Allows to override url of website (section, page) from [configuration file](#user-content-configuration-file-structure).

* `-cc` or `--concurrent`: Allows to override `concurrent` parameter from [configuration file](#user-content-configuration-file-structure).

* `-rra` or `--requestRetriesAmount`: Allows to override `requestRetriesAmount` parameter from [configuration file](#user-content-configuration-file-structure).

* `-rt` or `--requestTimeout`: Allows to override `requestTimeout` from [configuration file](#user-content-configuration-file-structure).

* `-ext` or `--checkExternalUrls`: Allows to override `checkExternalUrls` parameter from [configuration file](#user-content-configuration-file-structure).

* `-m` or `--mode`: this parameter can have one of 3 available values: 'website' (by default), 'section' and 'page'.

**Notation:**

Sometimes it conveniently to scan only separate section of website or even single page. Your can use  `mode` option for this.

If value of `mode` option is equal to 'section' then only nested pages of `url` option value will be scanned.
For example if website `my.site.com` (which configuration file is in `./configs` folder and has name `my.site.com.js`) has structure as given here:
```shell
/
/foo
/foo/foo1
/foo/foo2
/bar
```
 then `run` command with given options:
 ```shell
 $ node bin/blc run -c ./configs/my.site.com.js -u http://my.site.com/foo -m section
 ```
will cause the analyze only of pages: `/foo`, `/foo1`, `/foo2`. Page '/bar' will be omitted.

If value of `mode` option is equal to 'page', then `run`:
```shell
$ node bin/blc run -c ./configs/my.site.com.js -u http://my.site.com/foo -m page
```
will cause the links analyze only for `/foo` page.

#### Examples of `run` command usage:

* Simple call with configuration file param
```
$ node bin/blc run -c ./configs/my.site.com.js
```

* Analyze for website `http://my.another.site.com` with configuration file from another website `my.site.com`.
```shell
$ node bin/blc run -c ./configs/my.site.com.js -u http://my.another.site.com
```

* Overriding some of configuration file properties.
```shell
$ node bin/blc run -c ./configs/my.site.com.js -cc 50 -rt 10000 -rra 20
```

* Selective analyze for page `/foo/bar` of website `http://my.site.com`.
```shell
$ node bin/blc run -c ./configs/my.site.com.js -u http://my.site.com/foo/bar -m page
```

#### Result of `run` command execution:

All total results of analyze will be printed into console output after `run` command execution. Also generated reports file paths will be placed there.

### version

This command will simply print current application version to console.
Usage example:
```shell
$ node bin/blc version
```
Expected console output (version can differ from value here):
```shell
INFO cli/cmd-version.js: Application name: => bs-broken-links-checker
INFO cli/cmd-version.js: Application version: => 0.0.1
```

## JavaScript API

Package can be installed as usual [npm](https://www.npmjs.com) dependency.
```shell
$ npm install --save bs-broken-links-checker
```

For tool initialization you should create new instance of `BrokenLinksChecker` class.
```js
var BrokenLinksChecker = require('bs-broken-links-checker').BrokenLinksChecker,
    brokenLinksChecker = new BrokenLinksChecker();
```
You should call method `start` and pass url of your website as argument, for example:
```js
brokenLinksChecker.start('https://my.site.com');
```
`BrokenLinksChecker` class constructor takes options object as argument. More detail about available option fields.

#### Options

##### concurrent

Number of inner website links which would be analyzed concurrently. The optimal value of this param should be found empirically.
If this value is too low then total time of website analyze will increase.
If this value is too high then workload your website server will increase and cause some network errors and result corruptions.

Value by default: `100`.

**Notation**: this parameter is applicable only for inner links. All external links are checked by 100 items concurrently.

##### requestHeaders

Allows to set custom request headers.

Value by default: `{ 'user-agent': 'node-spider' }`.

##### requestRetriesAmount

Max request attempts for single analyzed url before it will be resolved as broken.

Value by default: 5.

##### requestTimeout

Request timeout in milliseconds.

Value by default: 5000.

##### acceptedSchemes

Permitted url schemas. All links which urls contains schemas different from
listed here will be excluded from analyze.

Value by default: `['http:', 'https:']`.

##### checkExternalUrls

Enables or disables external links check. If value of this param is equal to
`false`, then only inner links of website will be analyzed..

Value by default: `false`

##### excludeLinkPatterns

Allows to exclude some url patterns from processing. You can pass the array of regular expressions or
string patterns (including wildcards) as value of this option.
All url that matches on any of listed expressions will be excluded from processing.
For example if you want to exclude pages that urls contains `foo` or `bar` you can set this option value as: `[/\/foo/i, /\/bar/i]`.

Value by default: `[]`

More examples:
```js
module.exports = {
    ...
    excludeLinkPatterns: [
        /\/contacts/,
        http://google.com,
        http://my.site.com/foo/*,
        */foo/bar
    ]
}
```

##### onDone

Callback function which will be fired on the end of analyze. This function takes instance of [Statistic](./src/model/statistic.es6) class. It has all fields and methods for working with results of
scan.

You can see usage examples [here](./examples).

## Testing

Launch of tests with [istanbul](https://www.npmjs.com/package/istanbul) coverage calculation:
```shell
$ npm test
```

Code syntax check with help of:
[jshint](https://www.npmjs.com/package/jshint),
[jscs](https://www.npmjs.com/package/jscs)

```shell
$ npm run codestyle
```

Special thanks to:

* [Ilchenko Nikolai](http://github.com/tavriaforever)
* [Konstantinova Gela](http://github.com/gela-d)
* [Grinenko Vladimir](http://github.com/tadatuta)
* [Abramov Andrey](https://github.com/blond)
* [Isupov Ilia](https://github.com/SwinX)

Developer: [Kuznetsov Andrey](https://github.com/tormozz48)

You can send your questions and proposals to [adress](mailto:andrey.kuznetsov48@yandex.ru) or create issues [here](https://github.com/bem-site/broken-links-checker/issues).
