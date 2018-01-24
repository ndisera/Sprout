const gulp = require('gulp');
const clean = require('gulp-clean');
const del = require('del');
const concat = require('gulp-concat');
const filter = require('gulp-filter');
const preprocess = require('gulp-preprocess');

const public_path = 'public';

const bower_path = 'src/bower_components/';
const include_paths = [
    // angular
    bower_path + 'angular/angular.min.js',
    bower_path + 'angular-route/angular-route.min.js',
    bower_path + 'angular-charts-js/dist/angular-chart.min.js',

    bower_path + 'angular/angular.js',
    bower_path + 'angular-route/angular-route.js',
    bower_path + 'angular-charts-js/dist/angular-chart.js',

    // bootstrap
    bower_path + 'bootstrap/dist/css/bootstrap.min.css',
    bower_path + 'bootstrap/dist/js/bootstrap.min.js',
    bower_path + 'bootstrap-datepicker-eyecon/js/bootstrap-datepicker.js',

    bower_path + 'bootstrap/dist/css/bootstrap.css',
    bower_path + 'bootstrap/dist/js/bootstrap.js',

    // jquery and jquery-ui
    bower_path + 'jquery-ui/themes/smoothness/jquery-ui.min.css',
    bower_path + 'jquery-ui/jquery-ui.min.js',
    bower_path + 'jquery/dist/jquery.min.js',

    bower_path + 'jquery-ui/themes/smoothness/jquery-ui.css',
    bower_path + 'jquery-ui/jquery-ui.js',
    bower_path + 'jquery/dist/jquery.js',

    // chart.js
    bower_path + 'chart.js/dist/Chart.min.js',
    bower_path + 'chart.js/dist/Chart.bundle.min.js',

    bower_path + 'chart.js/dist/Chart.js',
    bower_path + 'chart.js/dist/Chart.bundle.js',

    // helpers
    bower_path + 'moment/min/moment-with-locales.min.js',
    bower_path + 'moment/min/moment-with-locales.js',
    bower_path + 'underscore/underscore-min.js',
    bower_path + 'underscore/underscore.js',
];

const paths = {
    styles: {
        src: 'src/Content/*.css',
        dest: 'public/css',
    },
    fonts: {
        src: 'src/fonts/*',
        dest: 'public/fonts',
    },
    imgs: {
        src: 'src/Images/*',
        dest: 'public/img',
    },
    scripts: {
        src: [
            'src/*.js', 
            'src/Controllers/*.js', 
            'src/Services/*.js', 
            'src/Directives/*.js'
        ],
        dest: 'public',
    },
    views: {
        src: 'src/Views/*.html',
        dest: 'public/html',
    },
    index: {
        src: 'src/index.html',
        dest: 'public',
    },
    includes: {
        src: include_paths,
        dest: 'public/includes',
    },
};

function clean_public() {
    return del([
        public_path + '/**', 
        '!' + public_path, 
        '!' + public_path + '/.gitignore',
    ]);
}

function copy_fonts() {
    return gulp.src(paths.fonts.src)
            .pipe(gulp.dest(paths.fonts.dest));
}

function copy_imgs() {
    return gulp.src(paths.imgs.src)
            .pipe(gulp.dest(paths.imgs.dest));
}

function copy_views() {
    return gulp.src(paths.views.src)
            .pipe(gulp.dest(paths.views.dest));
}

function copy_index() {
    return gulp.src(paths.index.src)
            .pipe(preprocess({ 
                context: {
                    DEBUG: true,
                }
            }))
            .pipe(gulp.dest(paths.index.dest));
}

function copy_includes() {
    return gulp.src(paths.includes.src)
            .pipe(gulp.dest(paths.includes.dest));
}

function concat_styles() {
    return gulp.src(paths.styles.src)
            .pipe(concat('styles.css'))
            .pipe(gulp.dest(paths.styles.dest));
}

function concat_scripts() {
    return gulp.src(paths.scripts.src)
            .pipe(concat('script.js'))
            .pipe(gulp.dest(paths.scripts.dest));
}

var build = gulp.series(
                clean_public,
                gulp.parallel(
                    copy_fonts,
                    copy_imgs,
                    copy_views,
                    copy_index,
                    copy_includes, 
                    concat_styles, 
                    concat_scripts,
                ),
            );

gulp.task('default', build);




