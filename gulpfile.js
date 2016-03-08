/**
 * Created by austin on 3/2/16.
 *
 * This is a simple build system designed to create production
 *
 * Based off:
 * https://gist.github.com/kincaidoneil/b7ad507c1bb7bb243828
 */
const gulp = require('gulp');
const vulcanize = require('gulp-vulcanize');
const minifyHtml = require('gulp-htmlmin');
const del = require('del');


/**
 * Should compile all the Polymer components into single files for efficiency
 */
gulp.task('clean', function (callback) {
   return del(['build', 'dist'], callback)
});

gulp.task('compileComponents', function() {
    // Todo!
    return gulp.src('app')
        .pipe(vulcanize({
            abspath: '',
            exculdes: [],
            stripExculdes: false,
            stripComments: true,
            inlineCss: true,
            inlineScripts: true
        }))
        .pipe(gulp.dest('dist'));
});

gulp.task('default', ['clean']);