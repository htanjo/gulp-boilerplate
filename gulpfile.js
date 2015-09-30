'use strict';

var gulp = require('gulp');
var $ = require('gulp-load-plugins')();
var bs = require('browser-sync').create();

gulp.task('serve', function() {
  bs.init({
    notify: false,
    port: 9000,
    open: true,
    server: {
      baseDir: ['app']
    }
  });
  gulp.watch([
    'app/*.html'
  ]).on('change', bs.reload);
});
