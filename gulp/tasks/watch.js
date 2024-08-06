const gulp = require('gulp');

exports.dependencies = ['docs'];

function task_watch() {
    return gulp.watch(['docs/**/*', 'src/**/!(*.spec)'], gulp.series( 'docs' ) );
}

gulp.task('watch', task_watch );
