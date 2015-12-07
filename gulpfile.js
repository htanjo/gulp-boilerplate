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
  return gulp.src('app/js/**/*.js')
    .pipe($.eslint())
    .pipe($.eslint.format())
    .pipe($.eslint.failAfterError());
});

function buildStyles() {
  var processors = [
    require('postcss-import')({path: '.tmp/css'}),
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
  return gulp.src('app/_sass/*.scss')
    .pipe($.sourcemaps.init())
    .pipe($.sass().on('error', $.sass.logError))
    .pipe($.postcss(processors, {to: '.tmp/css/main.css'}))
    .pipe($.sourcemaps.write())
    .pipe(gulp.dest('.tmp/css'));
}

gulp.task('styles', function () {
  return buildStyles();
});

gulp.task('styles:all', ['sprites'], function () {
  return buildStyles();
});

function buildScripts(watch) {
  var opts = {
    entries: ['app/js/main.js'],
    debug: true
  };
  var bundler = watch ? watchify(browserify(assign({}, watchify.args, opts))) : browserify(opts);
  var bundle = function () {
    return bundler.bundle()
      .on('error', function (error) {
        $.util.log($.util.colors.red('Browserify error:') + '\n' + error.message);
      })
      .pipe(source('main.js'))
      .pipe(buffer())
      .pipe($.sourcemaps.init({loadMaps: true}))
      .pipe($.sourcemaps.write())
      .pipe(gulp.dest('.tmp/js'));
  }
  if (watch) {
    bundler.on('update', bundle);
    bundler.on('log', $.util.log);
  }
  return bundle();
}

gulp.task('scripts', function () {
  return buildScripts();
});

gulp.task('scripts:watch', function () {
  return buildScripts(true);
});

gulp.task('sprites', function () {
  return gulp.src('app/img/_sprites/*.png')
    .pipe($.spritesmith({
      imgName: 'img/sprites.png',
      cssName: 'css/sprites.css',
      padding: 2,
      cssOpts: {
        cssSelector: function (item) {
          return '.sprite-' + item.name;
        }
      }
    }))
    .pipe(gulp.dest('.tmp'));
});

gulp.task('html', ['styles:all', 'scripts'], function () {
  var assets = $.useref.assets({searchPath: ['.tmp', '.']});
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

gulp.task('images', ['sprites'], function () {
  return gulp.src([
    'app/img/**/*',
    '!app/img/_sprites{,/**}',
    '.tmp/img/*'
  ])
    .pipe($.cache($.imagemin({
      progressive: true,
      interlaced: true,
      svgoPlugins: [{cleanupIDs: false}]
    })))
    .pipe(gulp.dest('dist/img'));
});

gulp.task('assets', ['styles:all'], function () {
  return gulp.src('.tmp/node_modules/**')
    .pipe(gulp.dest('dist/node_modules'));
});

gulp.task('clean', del.bind(null, ['.tmp', 'dist']));

gulp.task('serve', ['styles:all', 'scripts:watch'], function () {
  bs.init({
    notify: false,
    server: {
      baseDir: ['.tmp', 'app']
    }
  });
  gulp.watch([
    'app/**/*.html',
    '.tmp/js/**/*.js'
  ]).on('change', bs.reload);
  gulp.watch('app/_sass/**/*.scss', ['styles', bs.reload]);
  gulp.watch('app/js/**/*.js', ['lint']);
  gulp.watch('app/img/_sprites/*.png', ['styles:all', bs.reload]);
});

gulp.task('serve:dist', function () {
  bs.init({
    notify: false,
    server: 'dist'
  });
});

gulp.task('build', ['clean'], function (callback) {
  runSequence(['html', 'images', 'assets'], callback);
});

gulp.task('default', function (callback) {
  runSequence('lint', 'build', callback);
});

try { require('require-dir')('tasks'); } catch (err) {}
