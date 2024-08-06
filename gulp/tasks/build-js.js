const gulp = require('gulp');
const util = require('../util');

gulp.task('build-js', function( done ) {
    util.buildJs();
    done();
});

