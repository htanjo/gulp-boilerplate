'use strict';

var gulp = require('gulp');
var $ = require('gulp-load-plugins')();

gulp.task('sprites', function () {
  return gulp.src('app/images/_sprites/*.png')
    .pipe($.newer('.tmp/images/sprites.png'))
    .pipe($.spritesmith({
      imgName: 'images/sprites.png',
      cssName: 'styles/sprites.css',
      padding: 2,
      cssOpts: {
        cssSelector: function (item) {
          return '.sprite-' + item.name;
        }
      }
    }))
    .pipe(gulp.dest('.tmp'));
});
