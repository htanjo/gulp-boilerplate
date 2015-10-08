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

gulp.task('serve', ['styles'], function () {
  bs.init({
    notify: false,
    port: 9000,
    open: true,
    server: {
      baseDir: ['.tmp', 'app']
    }
  });
  gulp.watch([
    'app/**/*.html',
    'app/js/**/*.js'
  ]).on('change', bs.reload);
  gulp.watch('app/_sass/**/*.scss', ['styles', bs.reload]);
  gulp.watch('app/js/**/*.js', ['lint']);
});

gulp.task('clean', del.bind(null, ['dist']));

gulp.task('styles', function () {
  return gulp.src('app/_sass/*.scss')
    .pipe($.sass().on('error', $.sass.logError))
    .pipe(gulp.dest('.tmp/css'))
    .pipe($.minifyCss())
    .pipe(gulp.dest('dist/css'));
});

gulp.task('scripts', function () {
  return gulp.src('app/js/**/*.js')
    .pipe($.uglify())
    .pipe(gulp.dest('dist/js'));
});

gulp.task('html', function () {
  return gulp.src('app/**/*.html')
    .pipe($.htmlmin({
      collapseWhitespace: true
    }))
    .pipe(gulp.dest('dist'));
});

gulp.task('build', ['clean'], function (callback) {
  runSequence(['styles', 'scripts', 'html'], callback);
});

gulp.task('default', function (callback) {
  runSequence('lint', 'build', callback);
});
