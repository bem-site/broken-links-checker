var fs = require('fs'),
    gulp = require('gulp'),
    babel = require('gulp-babel'),
    jscs = require('gulp-jscs'),
    notify = require('gulp-notify'),
    jshint = require('gulp-jshint'),
    esdoc = require('gulp-esdoc'),
    ghPages = require('gulp-gh-pages'),
    stylish = require('jshint-stylish');

gulp.task('jshint', function() {
    return gulp.src('./src/**/*.es6')
        .pipe(jshint({ lookup: true, esnext: true }))
        .pipe(jshint.reporter('jshint-stylish'))
        .pipe(jshint.reporter('fail'));
});

gulp.task('jscs', function() {
    return gulp.src('./src/**/*.es6')
        .pipe(jscs({ esnext: true }))
        .pipe(gulp.dest('src'));
});

gulp.task('codestyle', ['jshint', 'jscs']);

gulp.task('compile', function () {
    return gulp.src('./src/**/*.es6')
        .pipe(babel({ optional: 'runtime' }))
        .pipe(gulp.dest('lib'));
});

gulp.task('pretest', ['codestyle', 'compile']);

gulp.task('esdoc', function () {
    var esdocConfig = fs.readFileSync('./esdoc.json', 'utf-8');
    esdocConfig = JSON.parse(esdocConfig);
    gulp.src("./src")
        .pipe(esdoc(esdocConfig));
});

gulp.task('ghPages', function () {
    return gulp.src('./jsdoc/**/*')
        .pipe(ghPages())
        .pipe(notify({ message: 'gh-pages task complete' }));
});

gulp.task('publish-doc', ['esdoc', 'ghPages']);
