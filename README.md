<!-- # broken-links-checker -->
Broken links checker for website pages

[![NPM version](http://img.shields.io/npm/v/bs-broken-links-checker.svg?style=flat)](http://www.npmjs.org/package/bs-broken-links-checker)
[![Coveralls branch](https://img.shields.io/coveralls/bem-site/broken-links-checker/master.svg)](https://coveralls.io/r/bem-site/broken-links-checker?branch=master)
[![Travis](https://img.shields.io/travis/bem-site/broken-links-checker.svg)](https://travis-ci.org/bem-site/broken-links-checker)
[![Code Climate](https://codeclimate.com/github/bem-site/broken-links-checker/badges/gpa.svg)](https://codeclimate.com/github/bem-site/broken-links-checker)
[![David](https://img.shields.io/david/bem-site/broken-links-checker.svg)](https://david-dm.org/bem-site/broken-links-checker)

![GitHub Logo](./logo.gif)

## Работа с инструментом  с помощью JavaScript API

Пакет устанавливается как обычная [npm](https://www.npmjs.com) зависимость
```
$ npm install --save bs-broken-links-checker
```

Для инициализации инструмента необходимо создать новый экземпляр класса `BrokenLinksChecker`.
```
var BrokenLinksChecker = require('bs-broken-links-checker').BrokenLinksChecker,
    brokenLinksChecker = new BrokenLinksChecker();
```
Для запуска инструмента следует вызвать метод `start` и передать ему в качестве аргумента url сайта на страницах
которого необходимо проверить поломанные ссылки, например:
```
brokenLinksChecker.start('https://ru.bem.info');
```
Конструктор класса `BrokenLinksChecker` в качестве аргумента принимает объект в котором могут находится опции для
более детальной настройки инструмента.

#### Опции

##### concurrent

Число запросов для проверки ссылок выполняемых одновременно. Увеличивая значение этого параметра
можно уменьшить время анализа для всего сайта, но повысить нагрузку на сервер.

Значение по умолчанию: `100`.

##### requestHeaders

Позволяет переопределить заголовки запросов посылаемых на сервер сайта при его анализе.

Значение по умолчанию: `{ 'user-agent': 'node-spider' }`.

##### requestRetriesAmount

Количество повторных запросов, которые будут посланы на url сайта, первоначальный запрос
к которому был завершен с ошибкой без определенного кода. По достижению значения параметра `requestRetriesAmount` url будет помечен ошибкой.

Значение по умолчанию: `1`.

##### requestTimeout

Таймаут запроса в миллисекундах.

Значение по умолчанию: `5000`.

##### acceptedSchemes

Массив с допустимыми значениеми протоколов адресов проверяемых ссылок. Например, чтобы проверять
только url-ы, вида `http://...` и `https://...`, необходимо выставить значением данной опции: `['http:', 'https:']`.

Значение по умолчанию: `['http:', 'https:']`.

##### checkExternalUrls

Флаг который позволяет управлять проверкой ссылок на внешние ресурсы. По умолчанию, значение
данного параметра равно `false`, что означает, что проверяться будут только ссылки на страницы проверяемого сайта.

Значение по умолчанию: `false`

##### excludeLinkPatterns

Позволяет исключить определенные разделы сайта из анализа. Значением этой опции яляется массив регулярных выражений при матчинге на которые url будет включен или исключен из анализа. Например, для того чтобы исключить разделы `foo` и `bar` из процесса анализа cайта, нужно указать значением опции
`[/\/foo/i, /\/bar/i]`.

Значение по умолчанию: `[]`

##### onDone

Функция, которая будет вызвана по завершению анализа сайта. Данная функция принимает аргументом экземпляр класса `Statistic`, в котором хранятся все результаты анализа и методы для работы с ними.

## Тестирование

Запуск тестов с вычислением покрытия кода тестами с помощью инструмента [istanbul](https://www.npmjs.com/package/istanbul):
```
$ npm test
```

Проверка синтаксиса кода с помощью:
[jshint](https://www.npmjs.com/package/jshint),
[jscs](https://www.npmjs.com/package/jscs)

```
$ npm run codestyle
```

Особая благодарность за помощь в разработке:

* [Ильченко Николай](http://github.com/tavriaforever)
* [Константинова Гела](http://github.com/gela-d)
* [Гриненко Владимир](http://github.com/tadatuta)
* [Абрамов Андрей](https://github.com/blond)
* [Исупов Илья](https://github.com/SwinX)

Разработчик: [Кузнецов Андрей](https://github.com/tormozz48)

Вопросы и предложения присылать по [адресу](mailto:andrey.kuznetsov48@yandex.ru) или в раздел [issues](https://github.com/bem-site/broken-links-checker/issues) репозитория данного инструмента.
