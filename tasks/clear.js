'use strict';

var gulp = require('gulp');
var $ = require('gulp-load-plugins')();

gulp.task('clear', function (callback) {
  return $.cache.clearAll(callback);
});
