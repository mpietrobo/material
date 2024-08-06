const gulp = require('gulp');
const Dgeni = require('dgeni');
const _ = require('lodash');
const concat = require('gulp-concat');
const fs = require('fs');
const gulpif = require('gulp-if');
const lazypipe = require('lazypipe');
const mkdirp = require('mkdirp');
const ngHtml2js = require('gulp-ng-html2js');
const path = require('path');
const sass = require('gulp-sass')(require('sass'));
const through2 = require('through2');
const uglify = require('gulp-uglify');
const utils = require('../scripts/gulp-utils.js');
const karma = require('karma').server;
const argv = require('minimist')(process.argv.slice(2));
const gutil = require('gulp-util');
const series = require('stream-series');


function generateDemos() {
  return gulp.src('src/{components,services}/*/')
    .pipe(through2.obj(function(folder, enc, next) {
      const self = this;
      const split = folder.path.split(path.sep);
      const name = split.pop();
      const moduleName = 'material.' + split.pop() + '.' + name;

      utils.copyDemoAssets(name, 'src/components/', 'dist/docs/demo-partials/');

      utils.readModuleDemos(moduleName, function(demoId) {
        return lazypipe()
          .pipe(gulpif, /^(?!.+global\.).*css/, transformCss(demoId))
          .pipe(gulp.dest, 'dist/docs/demo-partials/' + name)
        ();
      })
        .on('data', function(demo) {
          self.push(demo);
        })
        .on('end', next);

      function transformCss(demoId) {
        return lazypipe()
          .pipe(through2.obj, function(file, enc, next) {
            file.contents = Buffer.from(
              '.' + demoId + ' {\n' + file.contents.toString() + '\n}'
            );
            next(null, file);
          })
          .pipe(sass)
        ();
      }
    }));
}

function task_demos() {
  const demos = [];
  return generateDemos()
    .pipe(through2.obj(function(demo, enc, next) {
      // Don't include file contents into the docs app,
      // it saves space
      demo.css.concat(demo.js).concat(demo.html).concat(demo.index)
        .forEach(function(file) {
          delete file.contents;
        });
      demos.push(demo);
      next();
    }, function(done) {
      const demoIndex = _(demos)
        .groupBy('moduleName')
        .map(function(moduleDemos, moduleName) {
          const componentName = moduleName.split('.').pop();
          return {
            name: componentName,
            moduleName: moduleName,
            label: utils.humanizeCamelCase(componentName),
            demos: moduleDemos,
            url: 'demo/' + componentName
          };
        })
        .value();

      const dest = path.resolve(__dirname, '../dist/docs/js');
      const file = "angular.module('docsApp').constant('DEMOS', " +
        JSON.stringify(demoIndex, null, 2) + ");";
      mkdirp.sync(dest);
      fs.writeFileSync(dest + '/demo-data.js', file);

      done();
    }));
}
gulp.task('demos', task_demos );



function task_docs_generate() {
  const dgeni = new Dgeni([
    require('./config')
  ]);
  return dgeni.generate();
}


function task_docs_app() {
  return gulp.src(['docs/app/**/*', '!docs/app/partials/**/*.html'])
    .pipe(gulp.dest('dist/docs'));
}


function task_docs_demo_scripts () {
  return gulp.src('dist/docs/demo-partials/**/*.js')
    .pipe(concat('docs-demo-scripts.js'))
    .pipe(gulp.dest('dist/docs'));
}


function task_docs_js_dependencies () {
  return gulp.src(['dist/angular-material.js', 'dist/angular-material.min.js', 'docs/app/contributors.json'], { allowEmpty: true })
    .pipe(gulp.dest('dist/docs'));
}


function task_docs_js () {
  const preLoadJs = ['docs/app/js/preload.js'];
  if (process.argv.indexOf('--jquery') !== -1) {
    preLoadJs.push('node_modules/jquery/dist/jquery.js');
  }

  return series(
    gulp.src([
      'node_modules/angularytics/dist/angularytics.js',
      'dist/docs/js/app.js', // Load the AngularJS module initialization at first.
      'dist/docs/js/**/*.js'
    ])
      .pipe(concat('docs.js'))
      .pipe(gulpif(!argv.dev, uglify())),
    gulp.src(preLoadJs)
      .pipe(concat('preload.js'))
      .pipe(gulpif(!argv.dev, uglify()))
  )
  .pipe(gulp.dest('dist/docs'));
}


function task_docs_css_dependencies () {
  return gulp.src([
    'dist/angular-material.css',
    'dist/angular-material.min.css'
  ])
  .pipe(gulp.dest('dist/docs'));
}


function task_docs_css () {
  return gulp.src([
    //'dist/themes/*.css',
    'docs/app/css/highlightjs-material.css',
    'docs/app/css/layout-demo.css',
    'docs/app/css/style.css'
  ])
  .pipe(concat('docs.css'))
  .pipe(utils.autoprefix())
  .pipe(gulp.dest('dist/docs'));
}

function task_docs_html2js () {
  return gulp.src('docs/app/**/*.tmpl.html')
    .pipe(ngHtml2js({
      moduleName: 'docsApp',
      declareModule: false
    }))
    .pipe(concat('docs-templates.js'))
    .pipe(gulp.dest('dist/docs/js'));
}


function task_docs_karma (done) {
  const karmaConfig = {
    singleRun: true,
    autoWatch: false,
    browsers: argv.browsers ? argv.browsers.trim().split(',') : ['Chrome'],
    configFile: path.join(__dirname, '/../config/karma-docs.conf.js')
  };

  karma.start(karmaConfig, function(exitCode) {
    if (exitCode !== 0) {
      gutil.log(gutil.colors.red("Karma exited with the following exit code: " + exitCode));
      // eslint-disable-next-line no-process-exit
      process.exit(exitCode);
    }
    done();
  });
}

gulp.task('docs-html2js',          task_docs_html2js );
gulp.task('docs-generate',         gulp.series( 'build', task_docs_generate ) );
gulp.task('docs-js-dependencies',  gulp.series( 'build', task_docs_js_dependencies ) );
gulp.task('docs-css-dependencies', gulp.series( 'build', task_docs_css_dependencies ) );
gulp.task('docs-app',              gulp.series( 'docs-generate', task_docs_app ) );
gulp.task('docs-demo-scripts',     gulp.series( 'demos', task_docs_demo_scripts ) );

gulp.task('docs-js-no-build',      gulp.series(
      'docs-html2js',
      task_docs_generate,
      task_docs_app,
      'demos',
      task_docs_js_dependencies,
      task_docs_js
    ));

gulp.task('docs-css-no-build', gulp.series(
    task_docs_generate,
    task_docs_app,
    task_docs_css_dependencies,
    task_docs_css
  ));


gulp.task('docs-js',               gulp.series( 'build', 'docs-js-no-build' ) );
gulp.task('docs-css', gulp.series( 'build', 'docs-css-no-build' ));

gulp.task('docs-all-no-build', gulp.series(
    'docs-html2js',
    task_docs_generate,
    task_docs_app,
    gulp.parallel(
        gulp.series(
            'demos',
            task_docs_js_dependencies,
            task_docs_js
        ),
        gulp.series(
            task_docs_css_dependencies,
            task_docs_css
        )
    ),
    task_docs_demo_scripts
  ));


gulp.task('docs-karma', gulp.series( 'docs-js', task_docs_karma ) );

