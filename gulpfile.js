/**
 * Created by austin on 3/2/16.
 *
 * This is a simple build system designed to create production
 *
 */
var gulp = require('gulp');
var vulcanize = require('gulp-vulcanize');

/**
 * Should compile all the Polymer components into single files for efficiency
 */
gulp.task('compileComponents', function() {
    // Todo!
    return gulp.src('')
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

gulp.task('default', function() {
    return 'Good';
});