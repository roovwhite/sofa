const gulp = require('gulp');
const sass = require('gulp-sass');
const sofa = require('./index');
const dest = require('gulp-dest');
const babel = require('gulp-babel');
const cssmin = require('gulp-minify-css');

let path = {
    build: {
        html: './build',
        modules: './build/modules'
    },
    src: {
        html: ['./*.html', '!example/modules'],
        modules: {
            css: './modules/**/*.scss',
            js: './modules/**/*.js'
        }
    }
};

function htmlSofaBuild() {
    return gulp.src(path.src.html)
        .pipe(sofa({ path: './modules', inserts: {'js': '<!--forJS-->', css: '<!--forCSS-->'}}))
        .pipe(gulp.dest(path.build.html))
}

function htmlSofaOnePlaceBuild() {
    return gulp.src(path.src.html)
        .pipe(sofa({ path: './modules', inserts: {'js': '<!--forJS-->', css: '<!--forCSS-->'}, onePlace: true }))
}

function cssModulesBuild() {
    return gulp.src(path.src.modules.css)
        .pipe(sass().on('error', sass.logError))
        .pipe(cssmin())
        .pipe(gulp.dest(path.build.modules))
}

function jsModulesBuild() {
    return gulp.src(path.src.modules.js)
        .pipe(babel({
            presets: ['@babel/env']
        }))
        .pipe(gulp.dest(path.build.modules))
}

function watchFiles() {
    gulp.watch(path.src.html, htmlSofaBuild);
    gulp.watch(path.src.modules.css, cssModulesBuild);
    gulp.watch(path.src.modules.js, jsModulesBuild);
}

const build = gulp.series(gulp.parallel(htmlSofaBuild, cssModulesBuild, jsModulesBuild, watchFiles));
const place = gulp.series(htmlSofaOnePlaceBuild, watchFiles);
const watch = gulp.series(watchFiles);

exports.default = build;
exports.build = build;
exports.place = place;
exports.watch = watch;