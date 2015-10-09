'use strict';

var gulp = require('gulp');
var $ = require('gulp-load-plugins')();
var runSequence = require('run-sequence');
var bs = require('browser-sync').create();
var del = require('del');
var wiredep = require('wiredep').stream;

gulp.task('lint', function () {
  return gulp.src('app/js/**/*.js')
    .pipe($.eslint())
    .pipe($.eslint.format())
    .pipe($.eslint.failAfterError());
});

gulp.task('wiredep', function () {
  return gulp.src('app/**/*.html')
    .pipe(wiredep({
      // Force absolute URL
      // "../bower_components/xxxx" -> "/bower_components/xxxx"
      ignorePath: /(\.\.\/)*\.\.(?=\/)/
    }))
    .pipe(gulp.dest('app'));
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
    .pipe(gulp.dest('.tmp/css'));
});

gulp.task('html', ['wiredep', 'styles'], function () {
  var assets = $.useref.assets({searchPath: ['.tmp', 'app', '.']});
  return gulp.src('app/**/*.html')
    .pipe(assets)
    .pipe($.dedupe({same: false}))
    .pipe($.if('*.js', $.uglify()))
    .pipe($.if('*.css', $.minifyCss()))
    .pipe($.rev())
    .pipe(assets.restore())
    .pipe($.useref())
    .pipe($.revReplace())
    .pipe($.if('*.html', $.htmlmin({
      collapseWhitespace: true
    })))
    .pipe(gulp.dest('dist'));
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

gulp.task('serve', ['wiredep', 'styles'], function () {
  bs.init({
    notify: false,
    server: {
      baseDir: ['.tmp', 'app'],
      routes: {
        '/bower_components': 'bower_components'
      }
    }
  });
  gulp.watch([
    'app/**/*.html',
    'app/js/**/*.js'
  ]).on('change', bs.reload);
  gulp.watch('app/_sass/**/*.scss', ['styles', bs.reload]);
  gulp.watch('app/js/**/*.js', ['lint']);
  gulp.watch('bower.json', ['wiredep']);
});

gulp.task('serve:dist', function () {
  bs.init({
    notify: false,
    server: 'dist'
  });
});

gulp.task('build', ['clean'], function (callback) {
  runSequence(['html', 'images'], callback);
});

gulp.task('default', function (callback) {
  runSequence('lint', 'build', callback);
});

try { require('require-dir')('tasks'); } catch (err) {}
