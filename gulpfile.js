'use strict';

var gulp = require('gulp');
var $ = require('gulp-load-plugins')();
var runSequence = require('run-sequence');
var bs = require('browser-sync').create();
var del = require('del');

gulp.task('lint', function () {
  return gulp.src('app/js/**/*.js')
    .pipe($.eslint())
    .pipe($.eslint.format())
    .pipe($.eslint.failAfterError());
});

gulp.task('serve', function () {
  bs.init({
    notify: false,
    port: 9000,
    open: true,
    server: {
      baseDir: ['app']
    }
  });
  gulp.watch([
    'app/**/*.html',
    'app/js/**/*.js'
  ]).on('change', bs.reload);
  gulp.watch('app/js/**/*.js', ['lint']);
});

gulp.task('clean', del.bind(null, ['dist']));

gulp.task('scripts', function () {
  return gulp.src([
    'app/js/**/*.js'
  ])
    .pipe($.uglify())
    .pipe(gulp.dest('dist/js'));
});

gulp.task('html', function () {
  return gulp.src([
    'app/**/*.html'
  ])
    .pipe($.htmlmin({
      collapseWhitespace: true
    }))
    .pipe(gulp.dest('dist'));
});

gulp.task('build', ['clean'], function (callback) {
  runSequence(['scripts', 'html'], callback);
});

gulp.task('default', ['build']);
