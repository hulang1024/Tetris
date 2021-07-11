const fs = require('fs');
const { src, dest, series, parallel, watch } = require('gulp');
const data = require('gulp-data');
const gulpClean = require('gulp-clean');
const browserify = require('browserify');
const tsify = require('tsify');
const gls = require('gulp-live-server');
const sass = require('gulp-sass');
sass.compiler = require('node-sass');
const template = require('gulp-template');

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
  return src('src/style/index.scss')
    .pipe(sass().on('error', sass.logError))
    .pipe(dest('dist'));
}

function static() {
  return src('public/**').pipe(dest('dist'));
}

function index() {
  return src('index.html')
    .pipe(data(() => ({ hash: + new Date().getTime() }))) // fake hash
    .pipe(template())
    .pipe(dest('dist'));
}

function clean() {
  return src('dist/*', { read: false }).pipe(gulpClean());
}

const build = series(clean, parallel(javascript, css, static, index));

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
