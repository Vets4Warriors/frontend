/**
 * Created by austin on 3/2/16.
 *
 * This is a simple build system designed to create production
 *
 * Some examples:
 * https://gist.github.com/kincaidoneil/b7ad507c1bb7bb243828
 */
const gulp = require('gulp');
const vulcanize = require('gulp-vulcanize');
var changed = require('gulp-changed');
var htmlmin = require('gulp-htmlmin');
var cleanCSS = require('gulp-clean-css');
const del = require('del');
const merge = require('merge-stream');

const print = require('gulp-print');

/*
* General compilation process:
*
* vulcanize all pages into /build
* optimize from /build to /dist
*
*
* */
const htmlBuildPaths = [
    'index.html'
    //'app/list-page/list-page.html',
    //'app/shared/location/*.html'
];
const buildDest = {
    prod: "dist",
    dev: "dist-dev"
};
const compileDir = 'build';


/** Todo! Removes all previously built files that have been changed */
gulp.task('clean', function (callback) {
    return gulp.src('index.html')
        .pipe(changed(compileDir))
        .pipe(del());
});


/** Removes all previously built */
gulp.task('cleanAll', function (callback) {
    return del([compileDir, 'dist', 'dist-dev'], callback)
});

/** Only removes the temporary intermediate directories */
gulp.task('cleanBuild', function(callback) {
    return del([compileDir], callback);
});

gulp.task('buildIndex', function() {
   return gulp.src('index.html')
       .pipe(vulcanize({
            exculdes: [],
            stripExcludes: false,
            stripComments: true,
            inlineCss: true,
            inlineScripts: true,
           //abspath: __dirname,
           inputUrl: '/home/austin/Workspace/web/VetsFrontend/index.html'
    })).pipe(gulp.dest('dist_index.html'));
});

gulp.task('build', function() {
    var htmlBuildStream = new merge();
    for (var i = 0; i < htmlBuildPaths.length; i++) {

        // Get the first occurrence of a / until the end
        var firstSlashIndex = htmlBuildPaths[i].indexOf('/');
        var suffixDir, filename;
        if (firstSlashIndex == -1 ) {
            suffixDir = '';
            filename = htmlBuildPaths[i];
        } else {
            var lastSlashIndex = htmlBuildPaths[i].lastIndexOf('/');
            suffixDir = htmlBuildPaths[i].substr(firstSlashIndex+1);
            filename = htmlBuildPaths[i].substr(
                lastSlashIndex+1,  htmlBuildPaths[i].length
            );
        }

        htmlBuildStream.add(
            gulp.src(htmlBuildPaths[i])
                .pipe(changed(compileDir))
                //.pipe(print())
                .pipe(vulcanize({
                    abspath: __dirname,
                    exculdes: [],
                    stripExcludes: false,
                    stripComments: true,
                    inlineCss: true,
                    inlineScripts: true
                }))
                .pipe(gulp.dest(compileDir + '/' + suffixDir)));
    }

    return htmlBuildStream;
});

/** Main goal is to minify all other non polymer components aka css and html */
gulp.task('optimize', function() {
    return gulp.src(compileDir + '/*.html')
        .pipe(print())
        .pipe(htmlmin({collapseWhitespace: true}))
        .pipe(cleanCSS())
        .pipe(gulp.dest('dist'));
});

gulp.task('default', ['cleanAll', 'build', 'optimize', 'cleanBuild']);