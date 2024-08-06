const gulp = require('gulp');
const util = require('../util');

function task_build_demo () {
    return util.buildModule(util.readModuleArg());
};

gulp.task ( 'build-demo', gulp.series( 'build', 'build-module-demo', task_build_demo ) );
