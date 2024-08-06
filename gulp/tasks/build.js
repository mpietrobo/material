const gulp = require('gulp');

gulp.task('build', gulp.series( 'build-scss', 'build-js' ) );

