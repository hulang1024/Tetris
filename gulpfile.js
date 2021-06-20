const fs = require('fs');
const { src, dest, series, parallel, watch } = require('gulp');
const gulpClean = require('gulp-clean');
const browserify = require('browserify');
const tsify = require('tsify');
const gls = require('gulp-live-server');
const sass = require('gulp-sass');
sass.compiler = require('node-sass');

if (!fs.existsSync('dist')) {
  fs.mkdirSync('dist');
}

function javascript() {
  return browserify('src/index.ts')
    .plugin(tsify)
    .transform('babelify', {
      presets: ['@babel/preset-env'],
      extensions: ['.ts']
    })
    .bundle()
    .pipe(fs.createWriteStream('dist/bundle.js'));
}

function css() {
  return src('src/index.scss')
    .pipe(sass().on('error', sass.logError))
    .pipe(dest('dist'));
}

function static() {
  return src(['index.html', 'public/**']).pipe(dest('dist'));
}

function clean() {
  return src('dist/*', { read: false }).pipe(gulpClean());
}

const build = series(clean, parallel(javascript, css, static));

function doWatch(cb) {
  watch(['src/**/*.ts'], javascript);
  watch(['src/**/*.scss'], css);

  cb();
}

function serve(cb) {
  build();

  const server = gls.static(['.', 'dist', 'public']);
  server.start();
  doWatch(cb);
}

exports.build = build;
exports.serve = serve;
