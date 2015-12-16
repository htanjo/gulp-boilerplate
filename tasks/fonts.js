'use strict';

var gulp = require('gulp');
var $ = require('gulp-load-plugins')();

gulp.task('fonts', function () {
  return gulp.src('app/fonts/_glyphs/*.svg')
    .pipe($.newer('.tmp/styles/glyphs.css'))
    .pipe($.iconfontCss({
      fontName: 'glyphs',
      targetPath: '../styles/glyphs.css',   // Relative path from gulp.dest()
      fontPath: '../fonts/',                // Base url(...) in CSS code
      cssClass: 'glyph'
    }))
    .pipe($.iconfont({
      fontName: 'glyphs',
      appendUnicode: true,
      formats: ['eot', 'woff2', 'woff', 'ttf', 'svg']
    }))
    .pipe(gulp.dest('.tmp/fonts'))
    .pipe($.filter(['*', '!*.css']))
    .pipe(gulp.dest('dist/fonts'));
});
