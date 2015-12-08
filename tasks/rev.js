'use strict';

var gulp = require('gulp');
var $ = require('gulp-load-plugins')();
var del = require('del');
var vinylPaths = require('vinyl-paths');

gulp.task('filerev', function () {
  return gulp.src('dist/**/*.{css,js,png,jpg,gif,ico,eot,svg,ttf,woff,woff2}')
    .pipe(vinylPaths(del))
    .pipe($.rev())
    .pipe(gulp.dest('dist'))
    .pipe($.rev.manifest())
    .pipe(gulp.dest('.tmp'))
});

gulp.task('rev', ['filerev'], function () {
  var manifest = gulp.src('.tmp/rev-manifest.json');
  return gulp.src('dist/**/*.{html,css}')
    .pipe($.revReplace({manifest: manifest}))
    .pipe(gulp.dest('dist'));
});
