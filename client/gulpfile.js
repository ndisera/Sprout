const gulp = require('gulp');
const clean = require('gulp-clean');
const del = require('del');
const concat = require('gulp-concat');
const filter = require('gulp-filter');
const preprocess = require('gulp-preprocess');
const annotate = require('gulp-ng-annotate');
const uglify = require('gulp-uglify');
const htmlmin = require('gulp-htmlmin');
const cssmin = require('gulp-clean-css');

const debug = true;

const public_path = 'public';

const bower_path = 'src/bower_components/';
const include_paths = [
    // angular
    bower_path + 'angular/angular.min.js',
    bower_path + 'angular-route/angular-route.min.js',
    bower_path + 'angular-charts-js/dist/angular-chart.min.js',
    bower_path + 'angular-animate/angular-animate.min.js',

    bower_path + 'angular/angular.js',
    bower_path + 'angular-route/angular-route.js',
    bower_path + 'angular-charts-js/dist/angular-chart.js',
    bower_path + 'angular-animate/angular-animate.js',

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
	
	// calendar
	bower_path + 'fullcalendar/dist/fullcalendar.js',
	bower_path + 'fullcalendar/dist/fullcalendar.min.js',
	
	bower_path + 'fullcalendar/dist/fullcalendar.css',
	bower_path + 'fullcalendar/dist/fullcalendar.min.css',
	
	bower_path + 'fullcalendar/dist/fullcalendar.print.css',
	bower_path + 'fullcalendar/dist/fullcalendar.print.min.css',
	
	bower_path + 'fullcalendar/dist/gcal.js',
	bower_path + 'fullcalendar/dist/gcal.min.js',
	
	bower_path + 'fullcalendar/dist/locale-all.js',
	
	// angular calendar directive
	bower_path + 'angular-ui-calendar/src/calendar.js', 
	
	// pdf
	bower_path + 'jspdf/dist/jspdf.min.js',
	
	// pdf tables
	bower_path + 'jspdf-autotable/dist/jspdf.plugin.autotable.js',
	bower_path + 'jspdf-autotable/dist/jspdf.plugin.autotable.min.js',

    // datepicker
    bower_path + 'angular-datepicker/dist/angular-datepicker.min.css',
    bower_path + 'angular-datepicker/dist/angular-datepicker.min.js',

    bower_path + 'angular-datepicker/dist/angular-datepicker.css',
    bower_path + 'angular-datepicker/dist/angular-datepicker.js',

    // image upload and cropping
    bower_path + 'ng-file-upload/ng-file-upload.min.js',
    bower_path + 'ng-img-crop/compile/minified/ng-img-crop.css',
    bower_path + 'ng-img-crop/compile/minified/ng-img-crop.js',

    bower_path + 'ng-file-upload/ng-file-upload.js',

    // sortable
    bower_path + 'angular-ui-sortable/sortable.min.js',

    bower_path + 'angular-ui-sortable/sortable.js',

    // toastr
    bower_path + 'toastr/toastr.min.css',
    bower_path + 'toastr/toastr.min.js',

    bower_path + 'toastr/toastr.css',
    bower_path + 'toastr/toastr.js',

    // material icons
    bower_path + 'fontawesome/svg-with-js/js/fontawesome-all.min.js',

    bower_path + 'fontawesome/svg-with-js/css/fa-svg-with-js.css',
    bower_path + 'fontawesome/svg-with-js/js/fontawesome-all.js',

    // helpers
    bower_path + 'moment/min/moment-with-locales.min.js',
    bower_path + 'moment/min/moment-with-locales.js',
    bower_path + 'underscore/underscore-min.js',
    bower_path + 'underscore/underscore.js',
    bower_path + 'tinycolor/dist/tinycolor-min.js',
    bower_path + 'tinycolor/tinycolor.js',
    bower_path + 'Snap.svg/dist/snap.svg-min.js',
    bower_path + 'Snap.svg/dist/snap.svg.js',
    bower_path + 'datalist-polyfill/datalist-polyfill.min.js',
    bower_path + 'datalist-polyfill/datalist-polyfill.js',
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
        src: [
            'src/Images/**',
        ],
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
    partials: {
        src: 'src/Partials/*.html',
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
    if(debug) {
        return gulp.src(paths.views.src)
                .pipe(gulp.dest(paths.views.dest));
    }
    else {
        return gulp.src(paths.views.src)
                .pipe(htmlmin({ collapseWhitespace: true, }))
                .pipe(gulp.dest(paths.views.dest));
    }
}

function copy_partials() {
    if(debug) {
        return gulp.src(paths.partials.src)
                .pipe(gulp.dest(paths.partials.dest));
    }
    else {
        return gulp.src(paths.partials.src)
                .pipe(htmlmin({ collapseWhitespace: true, }))
                .pipe(gulp.dest(paths.partials.dest));
    }
}

function copy_index() {
    if(debug) {
        return gulp.src(paths.index.src)
                .pipe(preprocess({ 
                    context: {
                        DEBUG: true,
                    }
                }))
                .pipe(gulp.dest(paths.index.dest));
    }
    else {
        return gulp.src(paths.index.src)
                .pipe(preprocess({ 
                    //context: {
                        //DEBUG: debug,
                    //}
                }))
                .pipe(htmlmin({ collapseWhitespace: true, }))
                .pipe(gulp.dest(paths.index.dest));
    }
}

function copy_includes() {
    return gulp.src(paths.includes.src)
            .pipe(gulp.dest(paths.includes.dest));
}

function concat_styles() {
    if(debug) {
        return gulp.src(paths.styles.src)
                .pipe(concat('styles.css'))
                .pipe(gulp.dest(paths.styles.dest));
    }
    else {
        return gulp.src(paths.styles.src)
                .pipe(cssmin({ compatibility: 'ie9', level: 2, }))
                .pipe(concat('styles.css'))
                .pipe(gulp.dest(paths.styles.dest));
    }
}

function concat_scripts() {
    if(debug) {
        return gulp.src(paths.scripts.src)
            .pipe(concat('script.js'))
            .pipe(gulp.dest(paths.scripts.dest));
    }
    else {
        return gulp.src(paths.scripts.src)
            .pipe(annotate())
            .pipe(concat('script.js'))
            .pipe(uglify())
            .pipe(gulp.dest(paths.scripts.dest));
    }
}

var build = gulp.series(
                clean_public,
                gulp.parallel(
                    copy_fonts,
                    copy_imgs,
                    copy_views,
                    copy_partials,
                    copy_index,
                    copy_includes, 
                    concat_styles, 
                    concat_scripts
                )
            );

gulp.task('default', build);




