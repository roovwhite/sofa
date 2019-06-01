const gulp = require('gulp');
const sass = require('gulp-sass');
const sofa = require('./index');
const dest = require('gulp-dest');

let path = {
    build: {
        html: './build',
        modules: './build/modules'
    },
    src: {
        html: ['./*.html', '!example/modules'],
        modules: {
            css: './modules/**/*.scss'
        }
    }
};

function htmlBuild() {
    return gulp.src(path.src.html)
        .pipe(sofa({path: './modules', inserts: {'js': '<!--forJS-->', css: '<!--forCSS-->'}}))
        .pipe(dest(':name/:name.html')) // (onePlace) put html file in finename_dir
        .pipe(gulp.dest('.')) // (onePlace)
}

function watchFiles() {
    gulp.watch(path.src.html, htmlBuild);
    gulp.watch(path.src.modules.css, htmlBuild);
    gulp.watch(path.src.modules.js, htmlBuild);
}

const build = gulp.series(gulp.parallel(htmlBuild, watchFiles));
const watch = gulp.series(gulp.parallel(watchFiles));

exports.build = build;
exports.watch = watch;
exports.default = build;