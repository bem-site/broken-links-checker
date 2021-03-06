<!-- # broken-links-checker -->
Broken links checker for website pages

[![NPM version](http://img.shields.io/npm/v/bs-broken-links-checker.svg?style=flat)](http://www.npmjs.org/package/bs-broken-links-checker)
[![Coveralls branch](https://img.shields.io/coveralls/bem-site/broken-links-checker/master.svg)](https://coveralls.io/r/bem-site/broken-links-checker?branch=master)
[![Travis](https://img.shields.io/travis/bem-site/broken-links-checker.svg)](https://travis-ci.org/bem-site/broken-links-checker)
[![Code Climate](https://codeclimate.com/github/bem-site/broken-links-checker/badges/gpa.svg)](https://codeclimate.com/github/bem-site/broken-links-checker)
[![David](https://img.shields.io/david/bem-site/broken-links-checker.svg)](https://david-dm.org/bem-site/broken-links-checker)

![GitHub Logo](./logo.gif)

## Работа с инструментом с помощью инструмента командной строки (cli)

Broken links checker может быть использован как самостоятельное [NodeJS](http://nodejs.org) приложение так и [npm](https://www.npmjs.com) - зависимость которая может быть подключена к вашему проекту.

В первом случае, для установки потребуется склонировать репозиторий проекта, переключится на
последний стабильный тег, установить [npm](https://www.npmjs.com) - зависимости и скомпилировать код
для выполнения:
```
$ git clone https://github.com/bem-site/broken-links-checker.git
$ cd broken-links-checker
$ git checkout vx.y.z
$ npm run deps
```

Во втором случае его достаточно подключить как npm-зависимость:
```
$ npm install --save bs-broken-links-checker
```

### Использование:

Работа с инструментом с помощью cli состоит из 3-х шагов:

1. Генерация конфигурационного файла для анализа сайта с помощью команды [config](#config).
2. Запуск анализа сайта с помощью команды [run](#run).
3. Просмотр сгенерированного `*.html` файла отчета.

### Команды

* [config](#config) - генерация конфигурационного файла
* [run](#run) - запуск инструмента
* [version](#version) - просмотр версии инструмента

### config

Данная команда предназначена для создания конфигурационного файла в `.js` формате.
Необходимость в конфигурационном файле обусловлена 2-мя причинами:
* - громоздкостью значений части опций.
* - удобством использования. (отсутствием необходимости перечислять все опции при каждом запуске команды [run](#run) с помощью cli).

##### Параметры:

* `name` - имя конфигурационного файла. Для удобства в качетве значения данного параметра рекомендуется указывать имя хоста web-ресурса для которого будет производиться анализ

Пример использования:

```
$ node bin/blc config -n my.broken-site.com
```
Ожидаемый результат вывода в консоль:
```
INFO acts/config.js: Configuration file: => my.broken-site.com.js has been generated successfully
```

**Примечание**: после выполнения данной команды сгенерированный конфигурационный файл `my.broken-site.com.js` будет помещен в директорию `./configs` внутри рабочей директории приложения.

#### Структура конфигурационного файла:

Конфигурационый файл представляет из себя обычный [NodeJS](http://nodejs.org) модуль, экпортирующий
объект в котором ключами являются имена опций а значениями - значения опций.

* `url` - адрес сайта, раздела или страницы которые необходимо просканировать на предмет "битых" ссылок.

* `logger` - позволяет настроить режим логгирования. Возможные значения для параметра уровня логгирования
`level`: 'verbose', 'debug', 'info', 'warn', 'error';

* `concurrent` - число внутренних ссылок сайта, которые будут проверяться одновременно. Данный параметр для каждого сайта необходимо подбирать опытным путем, так как слишком низкое значение данного параметра увеличит время анализа сайта, а слишком высокое увеличит нагрузку на сервер сайта и может привести к некорректным результатам.

**Примечание**: данный параметр имеет действие только для внутренних ссылок анализируемого сайта. Внешние ссылки проверяются порциями по 100 штук одновременно.

* `requestHeaders` - данный параметр позволяет задавать произвольные заголовки для запросов к серверу анализируемого сайта.

* `requestRetriesAmount` - максимальное число попыток получить ответ от сайта по заданному урлу.

* `requestTimeout` - максимальное время ожидания ответа от сервера во время запроса в миллисекундах.

* `acceptedSchemes` - разрешенные протоколы ссылок. Все ссылки url-ы которых содержат протоколы отличные
от тех, которые указаны в значении данного параметра будут проигнорированы.

* `checkExternalUrls` - флаг вклчения проверки внешних ссылок. Если значением данного параметра является
`false`, то будут проанализированы только внутренние ссылки сайта.

* `excludeLinkPatterns` - с помощью регулярных выражений или шаблонов строк позволяет указать паттерны урлов, которые
будут проигнорированы при анализе сайта. Например, если в анализе сайта не должны участвовать ссылки
на разделы сайта `/contacts`, то страницы данного раздела можно исключить из анализа путем выставления
значением опции `excludeLinkPatterns` следующего кода:
```
module.exports = {
    ...
    "excludeLinkPatterns": [
        /\/contacts/
    ]
}
```

Примеры различных вариантов шаблонов для исключения адресов ссылок:
```
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

Данная команда предназначена для запуска анализа сайта на предмет "битых" ссылок.

##### Параметры:

* `-c` или `--config`: Путь к конфигурационному файлу который будет использован для анализа сайта. Обязательный параметр.

* `-u` или `--url`: Позволяет переопределить url сайта (раздела, страницы) для анализа, который указан в конфигурационном файле.

* `-cc` или `--concurrent`: Позволяет переопределить параметр `concurrent` который указан в конфигурационном файле.

* `-rra` или `--requestRetriesAmount`: Позволяет переопределить параметр `requestRetriesAmount` который указан в конфигурационном файле.

* `-rt` или `--requestTimeout`: Позволяет переопределить параметр `requestTimeout` который указан в конфигурационном файле.

* `-ext` или `--checkExternalUrls`: Позволяет переопределить параметр `checkExternalUrls` который указан в конфигурационном файле.

* `-m` или `--mode`: Данный параметр может принимать 3 возможных значения: 'website' (по умолчанию), 'section' и 'page'.

**Примечание:**

Иногда бывает удобно просканировать только часть сайта: определенный раздел или страницу. В этом случае использование параметра `mode` бывает очень удобно.

В случае если значение параметра `mode` равно 'section', то будет просканирован только раздел сайта корневой страницей которого является значение параметра `url`. Например, если сайт `my.site.com` (конфигурационный файл которого лежит в директории `./configs` под именем `my.site.com.js`) имеет следующую структуру:
```
/
/foo
/foo/foo1
/foo/foo2
/bar
```
 то при вызове команды `run`:
 ```
 $ node bin/blc run -c ./configs/my.site.com.js -u http://my.site.com/foo -m section
 ```
будут просканированы страницы: `/foo`, `/foo1`, `/foo2`, а страница '/bar' не будет участвовать а анализе.

В случае если значение параметра `mode` равно 'page', то результатом вызова команды `run`:
```
$ node bin/blc run -c ./configs/my.site.com.js -u http://my.site.com/foo -m page
```
будет анализ ссылок только на странице `/foo`.

#### Примеры вызова команды `run`:

* Простой вызов с указанием пути к конфигурационному файлу
```
$ node bin/blc run -c ./configs/my.site.com.js
```

* Анализ сайта `http://my.another.site.com` c использованием конфигурационного файла для сайта `my.site.com`.
```
$ node bin/blc run -c ./configs/my.site.com.js -u http://my.another.site.com
```

* Использование параметров запросов отличных от указаных в конфигурационном файле.
```
$ node bin/blc run -c ./configs/my.site.com.js -cc 50 -rt 10000 -rra 20
```

* Выборочный анализ страницы `/foo/bar` сайта `http://my.site.com`.
```
$ node bin/blc run -c ./configs/my.site.com.js -u http://my.site.com/foo/bar -m page
```

#### Результат работы команды `run`:

Результатом работы должен стать вывод в консоль итоговых данных о результатах
анализа сайта и ссылок на файлы отчетов которые были сохранены на файловой системе.

### version

Данная команда предназначена для просмотра текущей используемой версии инструмента.
Пример использования:
```
$ node bin/blc version
```
Ожидаемый результат вывода в консоль (c точностью до значения версии):
```
INFO cli/cmd-version.js: Application name: => bs-broken-links-checker
INFO cli/cmd-version.js: Application version: => 0.0.1
```

## Работа с инструментом с помощью JavaScript API

Пакет устанавливается как обычная [npm](https://www.npmjs.com) зависимость
```
$ npm install --save bs-broken-links-checker
```

Для инициализации инструмента необходимо создать новый экземпляр класса `BrokenLinksChecker`.
```
var BrokenLinksChecker = require('bs-broken-links-checker').BrokenLinksChecker,
    brokenLinksChecker = new BrokenLinksChecker();
```
Для запуска инструмента следует вызвать метод `start` и передать ему в качестве аргумента url сайта на страницах которого необходимо проверить поломанные ссылки, например:
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

Позволяет исключить определенные разделы сайта из анализа. Значением этой опции яляется массив регулярных выражений
и строковых шаблонов при матчинге на которые url будет включен или исключен из анализа. Например, для того чтобы исключить разделы `foo` и `bar`
из процесса анализа cайта, нужно указать значением опции
`[/\/foo/i, /\/bar/i]`.

Значение по умолчанию: `[]`

Примеры различных вариантов шаблонов для исключения адресов ссылок:
```
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

Функция, которая будет вызвана по завершению анализа сайта. Данная функция принимает аргументом экземпляр класса `Statistic`, в котором хранятся все результаты анализа и методы для работы с ними.

Примеры использования инструмента можно посмотреть [здесь](./examples).

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
