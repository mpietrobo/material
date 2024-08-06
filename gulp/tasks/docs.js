const gulp = require('gulp');
const connect = require('gulp-connect');
const constants = require('../const');
const IS_DEV = constants.IS_DEV;

function task_docs () {
    return gulp.src('.')
        .pipe(connect.reload());
}


if (IS_DEV) {
    gulp.task('docs', gulp.series(
        'build',
        'docs-all-no-build',
        task_docs
    ) );

} else {

    gulp.task('docs', gulp.series(
        'build',
        'docs-all-no-build',
        // this requires access to github
        // 'build-contributors',
        task_docs
    ) );

}


