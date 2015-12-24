'use strict';

var gulp = require('gulp');
var $ = require('gulp-load-plugins')();
var source = require('vinyl-source-stream');
var buffer = require('vinyl-buffer');
var runSequence = require('run-sequence');
var browserify = require('browserify');
var watchify = require('watchify');
var glob = require('glob');
var es = require('event-stream');
var path = require('path');
var assign = require('lodash.assign');
var bs = require('browser-sync').create();
var del = require('del');

// Lint JavaScript
gulp.task('lint', function () {
  return gulp.src('app/scripts/**/*.js')
    .pipe($.eslint())
    .pipe($.eslint.format())
    .pipe($.eslint.failAfterError());
});

// Core function to build stylesheets
//  - Compile styles and inject @import contents
//  - Add (or remove) vendor prefixes
//  - Resolve relative paths and copy assets
//  - [development] Attach sourcemaps
//  - [production] Minify source code
function buildStyles(options) {
  options = options || {};
  var processors = [
    require('postcss-import')({path: '.tmp/styles'}),
    require('autoprefixer')({
      browsers: [
        'last 2 versions',
        'Explorer >= 8',
        'Firefox ESR',
        'Android >= 2.3',
        'iOS >= 7'
      ]
    }),
    require('postcss-url')({url: 'rebase'}),
    require('postcss-copy-assets')({base: '.tmp'})
  ];
  var stream = gulp.src('app/styles/*.scss', {base: '.'})
    .pipe($.sourcemaps.init({loadMaps: true}))
    .pipe($.sass().on('error', $.sass.logError))
    .pipe($.postcss(processors, {to: '.tmp/styles/main.css'}))
    .pipe($.rename({dirname: '.'}))
    .pipe($.sourcemaps.write('.'))
    .pipe(gulp.dest('.tmp/styles'));
  if (!options.dev) {
    stream
      .pipe($.filter('*.css'))
      .pipe($.minifyCss({sourceMap: false}))
      .pipe(gulp.dest('dist/styles'));
  }
  return stream;
}

// Compile stylesheets for production
gulp.task('styles', ['sprites', 'fonts'], buildStyles.bind(null));

// Compile stylesheets for local development
gulp.task('styles:dev', ['sprites', 'fonts'], buildStyles.bind(null, {dev: true}));

// Core function to build JavaScripts
//  - Compile scripts using Browserify
//  - [development] Watch files and build incrementally
//  - [development] Attach sourcemaps
//  - [production] Minify source code
function buildScripts(options, callback) {
  if (typeof options === 'function') {
    callback = options;
    options = {};
  }
  options = options || {};
  callback = callback || function () {};
  glob('app/scripts/*.js', function (error, files) {
    if (error) {
      callback(error);
    }
    var tasks = files.map(function (entry) {
      var args = {
        entries: entry,
        debug: true
      };
      var bundler = options.dev ? watchify(browserify(assign({}, watchify.args, args))) : browserify(args);
      var bundle = function () {
        var stream = bundler.bundle()
          .on('error', function (error) {
            $.util.log($.util.colors.red('Browserify error:') + '\n' + error.message);
          })
          .pipe(source(path.basename(entry)))
          .pipe(buffer())
          .pipe($.sourcemaps.init({loadMaps: true}))
          .pipe($.sourcemaps.write('.'))
          .pipe(gulp.dest('.tmp/scripts'));
        if (!options.dev) {
          stream
            .pipe($.filter('*.js'))
            .pipe($.uglify())
            .pipe(gulp.dest('dist/scripts'));
        }
        return stream;
      };
      if (options.dev) {
        bundler.on('update', bundle);
        bundler.on('log', $.util.log);
      }
      return bundle();
    });
    es.merge(tasks).on('end', callback);
  });
}

// Compile scripts for production
gulp.task('scripts', buildScripts.bind(null));

// Compile scripts for local development
gulp.task('scripts:dev', buildScripts.bind(null, {dev: true}));

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
    '!app/images/_*{,/**}',
    '.tmp/images/**'
  ])
    .pipe($.cache($.imagemin({
      progressive: true,
      interlaced: true,
      svgoPlugins: [{cleanupIDs: false}]
    })))
    .pipe(gulp.dest('dist/images'));
});

// Copy assets used in npm packages
gulp.task('assets', ['styles'], function () {
  return gulp.src('.tmp/node_modules/**')
    .pipe(gulp.dest('dist/node_modules'));
});

// Copy all extra files like favicon, .htaccess
gulp.task('extras', function () {
  return gulp.src([
    'app/**',
    '!app/{styles,scripts,images}/**',
    '!**/.DS_Store'
  ], {dot: true})
    .pipe(gulp.dest('dist'));
});

// Cean output directories
gulp.task('clean', del.bind(null, ['.tmp', 'dist']));

// Start local development server
//  - Watch files and reload automatically
//  - Sync interaction across browsers
gulp.task('serve', ['styles:dev', 'scripts:dev'], function () {
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

// Start local server from the "dist" directory
gulp.task('serve:dist', function () {
  bs.init({
    notify: false,
    server: 'dist'
  });
});

// Build production files
gulp.task('build', ['clean'], function (callback) {
  runSequence(['html', 'styles', 'scripts', 'images', 'assets', 'extras'], 'rev', callback);
});

// Default task: lint and build files
gulp.task('default', function (callback) {
  runSequence('lint', 'build', callback);
});

// Load custom tasks from the "task" directory
try {
  require('require-dir')('tasks');
} catch (err) {}
