'use strict';

var gulp = require('gulp');
var $ = require('gulp-load-plugins')();
var source = require('vinyl-source-stream');
var buffer = require('vinyl-buffer');
var globby = require('globby');
var mergeStream = require('merge-stream');
var path = require('path');
var runSequence = require('run-sequence');
var browserify = require('browserify');
var watchify = require('watchify');
var bs = require('browser-sync').create();
var del = require('del');

var browsers = [
  'last 2 versions',
  'Explorer >= 8',
  'Firefox ESR',
  'Android >= 2.3',
  'iOS >= 7'
];

// Lint JavaScript
gulp.task('lint', function () {
  return gulp.src('app/scripts/**/*.js')
    .pipe($.eslint())
    .pipe($.eslint.format())
    .pipe($.eslint.failAfterError());
});

// Build stylesheets for local development
gulp.task('styles:dev', ['sprites', 'fonts'], function () {
  return gulp.src('app/styles/**/*.scss')
    .pipe($.sourcemaps.init({loadMaps: true}))
    .pipe($.sass().on('error', $.sass.logError))
    .pipe($.autoprefixer({browsers: browsers}))
    .pipe($.sourcemaps.write('.'))
    .pipe(gulp.dest('.tmp/styles'));
});

// Build stylesheets for production
gulp.task('styles', ['sprites', 'fonts'], function () {
  return gulp.src('app/styles/**/*.scss')
    .pipe($.sass().on('error', $.sass.logError))
    .pipe($.autoprefixer({browsers: browsers}))
    .pipe($.minifyCss({sourceMap: false}))
    .pipe(gulp.dest('dist/styles'));
});

// Build and watch scripts for local development
gulp.task('scripts:dev', function () {
  var stream = mergeStream();
  globby.sync('app/scripts/*.js').forEach(function (file) {
    var bundler = browserify({
      entries: file,
      cache: {},
      packageCache: {},
      plugin: [watchify],
      debug: true
    });
    bundler
      .on('log', $.util.log)
      .on('update', bundle);
    stream.add(bundle());
    function bundle() {
      return bundler.bundle()
        .on('error', function (error) {
          $.util.log($.util.colors.red('Browserify error:') + '\n' + error.message);
          this.emit('end');
        })
        .pipe(source(path.relative('app/scripts', file)))
        .pipe(gulp.dest('.tmp/scripts'));
    }
  });
  return stream.isEmpty() ? null : stream;
});

// Build scripts for production
gulp.task('scripts', function () {
  var stream = mergeStream();
  globby.sync('app/scripts/*.js').forEach(function (file) {
    var bundleStream = browserify(file).bundle()
      .on('error', function (error) {
        $.util.log($.util.colors.red('Browserify error:') + '\n' + error.message);
        this.emit('end');
      })
      .pipe(source(path.relative('app/scripts', file)))
      .pipe(buffer())
      .pipe($.uglify())
      .pipe(gulp.dest('dist/scripts'));
    stream.add(bundleStream);
  });
  return stream.isEmpty() ? null : stream;
});

// Minify HTML
gulp.task('html', function () {
  return gulp.src('app/**/*.html')
    .pipe($.htmlmin({
      collapseWhitespace: true
    }))
    .pipe(gulp.dest('dist'));
});

// Optimize images
gulp.task('images', ['sprites'], function () {
  return gulp.src([
    'app/images/**',
    '!app/images/_*{,/**}'
  ])
    .pipe($.cache($.imagemin({
      progressive: true,
      interlaced: true,
      svgoPlugins: [{cleanupIDs: false}]
    })))
    .pipe(gulp.dest('dist/images'));
});

// Copy all extra files like favicon, .htaccess
gulp.task('extras', function () {
  return gulp.src([
    'app/**',
    '!app/{styles,scripts,images}/**',
    '!app/fonts/_*{,/**}',
    '!**/{*.html,.DS_Store}'
  ], {dot: true})
    .pipe(gulp.dest('dist'));
});

// Cean output directories
gulp.task('clean:tmp', del.bind(null, '.tmp'));
gulp.task('clean:dist', del.bind(null, 'dist'));

// Start local development server
//  - Watch files and reload automatically
//  - Sync interaction across browsers
gulp.task('serve', ['pre:serve'], function () {
  bs.init({
    notify: false,
    server: {
      baseDir: ['.tmp', 'app']
    }
  });
  gulp.watch([
    'app/**/*.html',
    '.tmp/scripts/**/*.js'
  ]).on('change', bs.reload);
  gulp.watch('app/scripts/**/*.js', ['lint']);
  gulp.watch('app/styles/**/*.scss', ['styles:dev', bs.reload]);
  gulp.watch('app/images/_sprites/*.png', ['styles:dev', bs.reload]);
  gulp.watch('app/fonts/_glyphs/*.svg', ['styles:dev', bs.reload]);
});

gulp.task('pre:serve', function (callback) {
  runSequence('clean:tmp', ['styles:dev', 'scripts:dev'], callback);
});

// Start local server from the "dist" directory
gulp.task('serve:dist', function () {
  bs.init({
    notify: false,
    server: 'dist'
  });
});

// Build production files
gulp.task('build', function (callback) {
  runSequence('clean:dist', ['html', 'styles', 'scripts', 'images', 'extras'], 'rev', callback);
});

// Default task: lint and build files
gulp.task('default', function (callback) {
  runSequence('lint', 'build', callback);
});

// Load custom tasks from the "task" directory
try {
  require('require-dir')('tasks');
} catch (err) {}
