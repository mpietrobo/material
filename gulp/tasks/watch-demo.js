const gulp = require('gulp');
const gutil = require('gulp-util');
const util = require('../util');


function task_watch_demo () {
  const module = util.readModuleArg();
  const name = module.split('.').pop();
  const dir = "/dist/demos/" + name.trim();
  console.log('\n',
    '-- Rebuilding', dir, 'when source files change...\n',
    '-- Navigate to', gutil.colors.green('"dist/demos/' + name + '/"'),
    'in your browser to develop.'
  );

  return gulp.watch('src/**/!(*.spec)', ['build-demo']);
}


gulp.task('watch-demo', gulp.series( 'build-demo', task_watch_demo ) );
