const gulp = require('gulp');
const fs = require('fs');

require("./gulp/tasks/build-js");
require("./gulp/tasks/build-scss");
gulp.task('build', gulp.series( 'build-scss', 'build-js' ) );

require("./gulp/tasks/build-module-demo");
require("./gulp/tasks/build-demo");

// include docs gulpfile (should eventually be factored out)
// gulp 4.x requires us to wait until all build tasks have been defined
require('./docs/gulpfile');

require("./gulp/tasks/docs");

require("./gulp/tasks/site");
require("./gulp/tasks/watch");

require("./gulp/tasks/watch-demo");


