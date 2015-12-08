'use strict';

var gulp = require('gulp');
var $ = require('gulp-load-plugins')();
var source = require('vinyl-source-stream');
var buffer = require('vinyl-buffer');
var runSequence = require('run-sequence');
var browserify = require('browserify');
var watchify = require('watchify');
var assign = require('lodash.assign');
var bs = require('browser-sync').create();
var del = require('del');

gulp.task('lint', function () {
  return gulp.src('app/scripts/**/*.js')
    .pipe($.eslint())
    .pipe($.eslint.format())
    .pipe($.eslint.failAfterError());
});

function buildStyles(options) {
  var opts = options || {};
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
  return gulp.src('app/styles/*.scss')
    .pipe($.sourcemaps.init())
    .pipe($.sass().on('error', $.sass.logError))
    .pipe($.postcss(processors, {to: '.tmp/styles/main.css'}))
    .pipe($.sourcemaps.write())
    .pipe(gulp.dest('.tmp/styles'))
    .pipe($.if(!opts.dev, $.minifyCss({sourceMap: false})))
    .pipe($.if(!opts.dev, gulp.dest('dist/styles')));
}

gulp.task('styles', ['sprites'], function () {
  return buildStyles();
});

gulp.task('styles:dev', ['sprites'], function () {
  return buildStyles({dev: true});
});

function buildScripts(options) {
  var opts = options || {};
  var args = {
    entries: ['app/scripts/main.js'],
    debug: true
  };
  var bundler = opts.dev ? watchify(browserify(assign({}, watchify.args, args))) : browserify(args);
  var bundle = function () {
    return bundler.bundle()
      .on('error', function (error) {
        $.util.log($.util.colors.red('Browserify error:') + '\n' + error.message);
      })
      .pipe(source('main.js'))
      .pipe(buffer())
      .pipe($.sourcemaps.init({loadMaps: true}))
      .pipe($.sourcemaps.write())
      .pipe(gulp.dest('.tmp/scripts'))
      .pipe($.if(!opts.dev, $.uglify()))
      .pipe($.if(!opts.dev, gulp.dest('dist/scripts')));
  }
  if (opts.dev) {
    bundler.on('update', bundle);
    bundler.on('log', $.util.log);
  }
  return bundle();
}

gulp.task('scripts', function () {
  return buildScripts();
});

gulp.task('scripts:dev', function () {
  return buildScripts({dev: true});
});

gulp.task('html', function () {
  return gulp.src('app/**/*.html')
    .pipe($.htmlmin({
      collapseWhitespace: true
    }))
    .pipe(gulp.dest('dist'));
});

gulp.task('images', ['sprites'], function () {
  return gulp.src([
    'app/images/**/*',
    '!app/images/_*{,/**}',
    '.tmp/images/**/*'
  ])
    .pipe($.cache($.imagemin({
      progressive: true,
      interlaced: true,
      svgoPlugins: [{cleanupIDs: false}]
    })))
    .pipe(gulp.dest('dist/images'));
});

gulp.task('assets', ['styles'], function () {
  return gulp.src('.tmp/node_modules/**')
    .pipe(gulp.dest('dist/node_modules'));
});

gulp.task('clean', del.bind(null, ['.tmp', 'dist']));

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
});

gulp.task('serve:dist', function () {
  bs.init({
    notify: false,
    server: 'dist'
  });
});

gulp.task('build', ['clean'], function (callback) {
  runSequence(['html', 'styles', 'scripts', 'images', 'assets'], 'rev', callback);
});

gulp.task('default', function (callback) {
  runSequence('lint', 'build', callback);
});

try { require('require-dir')('tasks'); } catch (err) {}
