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

gulp.task('html', function () {
  return gulp.src('app/**/*.html')
    .pipe($.htmlmin({
      collapseWhitespace: true
    }))
    .pipe(gulp.dest('dist'));
});

gulp.task('styles', function () {
  return gulp.src('app/_sass/*.scss')
    .pipe($.sourcemaps.init())
    .pipe($.sass().on('error', $.sass.logError))
    .pipe($.autoprefixer({
      browsers: [
        'last 2 versions',
        'Explorer >= 8',
        'Firefox ESR',
        'Android >= 2.3',
        'iOS >= 7'
      ]
    }))
    .pipe($.sourcemaps.write())
    .pipe(gulp.dest('.tmp/css'))
    .pipe($.minifyCss())
    .pipe(gulp.dest('dist/css'));
});

gulp.task('scripts', function () {
  return gulp.src('app/js/**/*.js')
    .pipe($.uglify())
    .pipe(gulp.dest('dist/js'));
});

gulp.task('images', function () {
  return gulp.src('app/img/**/*')
    .pipe($.cache($.imagemin({
      progressive: true,
      interlaced: true,
      svgoPlugins: [{cleanupIDs: false}]
    })))
    .pipe(gulp.dest('dist/img'));
});

gulp.task('clean', del.bind(null, ['.tmp', 'dist']));

gulp.task('serve', ['styles'], function () {
  bs.init({
    notify: false,
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

gulp.task('serve:dist', function () {
  bs.init({
    notify: false,
    server: 'dist'
  });
});

gulp.task('build', ['clean'], function (callback) {
  runSequence(['html', 'styles', 'scripts', 'images'], callback);
});

gulp.task('default', function (callback) {
  runSequence('lint', 'build', callback);
});
