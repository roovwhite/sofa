const gulp = require('gulp');
const sass = require('gulp-sass');
const sofa = require('./index');
const dest = require('gulp-dest');

let config = {
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

function htmlBuild() {
    return gulp.src(config.src.html)
        .pipe(sofa({path: './modules', onePlace: true}))
        .pipe(dest(':name/:name.html')) // (onePlace) put html file in finename_dir
        .pipe(gulp.dest('.')) // (onePlace)
}

function cssBuild() {
    return gulp.src(config.src.modules.css)
        .pipe(sass().on('error', sass.logError))
        .pipe(gulp.dest(config.build.modules))
}

function jsBuild() {
    return gulp.src(config.src.modules.js)
        .pipe(gulp.dest(config.build.modules))
}

function watchFiles() {
    gulp.watch(config.src.html, htmlBuild);
    gulp.watch(config.src.modules.css, cssBuild);
    gulp.watch(config.src.modules.js, jsBuild);
}

const build = gulp.series(gulp.parallel(htmlBuild,cssBuild,jsBuild,watchFiles));
const watch = gulp.series(gulp.parallel(watchFiles));

exports.default = build;
exports.build = build;
exports.watch = watch;