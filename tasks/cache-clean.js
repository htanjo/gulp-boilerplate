'use strict';

var gulp = require('gulp');
var $ = require('gulp-load-plugins')();

gulp.task('cache-clean', function (callback) {
  return $.cache.clearAll(callback);
});
