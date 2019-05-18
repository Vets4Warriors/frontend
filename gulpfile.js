/**
 * Created by austin on 3/2/16.
 *
 * This is a simple build system designed to create production
 *
 * Some examples:
 * https://gist.github.com/kincaidoneil/b7ad507c1bb7bb243828
 */
const gulp = require('gulp');
var htmlmin = require('gulp-htmlmin');
var cleanCSS = require('gulp-clean-css');
const del = require('del');
const merge = require('merge-stream');

const buildDest = {
    prod: "dist",
    dev: "dist-dev"
};
const compileDir = 'build';


/** Todo! Removes all previously built files that have been changed */
gulp.task('clean', function (callback) {

});

gulp.task('build', function() {
    var htmlBuildStream = new merge();

    return htmlBuildStream;
});

/** Main goal is to minify all css and html */
gulp.task('optimize', function() {
    return gulp.src(compileDir + '/*.html')
        .pipe(htmlmin({collapseWhitespace: true}))
        .pipe(cleanCSS())
        .pipe(gulp.dest('dist'));
});

gulp.task('default', ['clean', 'build', 'optimize']);