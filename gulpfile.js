var fs = require('fs'),
    gulp = require('gulp'),
    clean = require('gulp-clean'),
    babel = require('gulp-babel'),
    jscs = require('gulp-jscs'),
    jshint = require('gulp-jshint'),
    esdoc = require('gulp-esdoc'),
    ghPages = require('gulp-gh-pages'),
    stylish = require('jshint-stylish');

gulp.task('clean-jsdoc', function () {
    return gulp.src('./jsdoc', { read: false })
        .pipe(clean());
});

gulp.task('clean-lib', function () {
    return gulp.src('./lib', { read: false })
        .pipe(clean());
});

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

gulp.task('compile', ['clean-lib'], function () {
    return gulp.src('./src/**/*.es6')
        .pipe(babel({ optional: 'runtime' }))
        .pipe(gulp.dest('lib'));
});

gulp.task('pretest', ['codestyle', 'compile']);

gulp.task('esdoc', ['clean-jsdoc'], function () {
    var esdocConfig = fs.readFileSync('./esdoc.json', 'utf-8');
    esdocConfig = JSON.parse(esdocConfig);
    gulp.src("./src")
        .pipe(esdoc(esdocConfig));
});

gulp.task('copy-logo', ['esdoc'], function() {
    return gulp.src('./logo.gif')
        .pipe(gulp.dest('./jsdoc'));
});

gulp.task('ghPages', ['esdoc', 'copy-logo'], function () {
    return gulp.src('./jsdoc/**/*')
        .pipe(ghPages());
});

gulp.task('publish-doc', ['esdoc', 'copy-logo', 'ghPages']);
