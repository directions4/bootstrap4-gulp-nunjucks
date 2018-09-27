var gulp = require("gulp");
var del = require("del");
var nunjucksRender = require("gulp-nunjucks-render");
var data = require("gulp-data");
var browserSync = require("browser-sync").create();
var sass = require("gulp-sass");
var runSequence = require("run-sequence");
var postcss = require("gulp-postcss");
var cssnext = require("postcss-cssnext");
var rename = require("gulp-rename");
var cleanCSS = require("gulp-clean-css");
var spacelessExt = require("nunjucks-tag-spaceless");

var manageEnvironment = function(environment) {
  environment.addGlobal("spaceless", spacelessExt);
};

gulp.paths = {
  src: "./src/",
  dist: "./dist/",
};

var paths = gulp.paths;

// Static Server + watching scss/html files
gulp.task("serve", ["build"], function() {
  browserSync.init({
    server: paths.dist,
  });
});

gulp.task("bs-reload", function() {
  browserSync.reload();
});

gulp.task("sass", function() {
  var processor = [
    cssnext({
      browsers: ["last 2 version", "ie >= 9"],
      features: {},
    }),
  ];

  return (
    gulp
      .src(paths.src + "assets/scss/app.scss")
      .pipe(
        sass({
          outputStyle: "expanded",
        }).on("error", sass.logError)
      )
      .pipe(postcss(processor))
      .pipe(
        cleanCSS({
          level: 2,
        })
      )
      .pipe(
        rename({
          basename: "app",
          extname: ".css",
        })
      )
      .pipe(
        gulp.dest(paths.dist + "css")
      )
  );
});

gulp.task("sass:watch", function() {
  gulp.watch(paths.src + "assets/scss/**/*.scss");
});

gulp.task("clean:dist", function() {
  return del(paths.dist);
});

gulp.task("copy:img", function() {
  return gulp.src(paths.src + "assets/img/**/*").pipe(gulp.dest(paths.dist + "img"));
});

gulp.task("copy:js", function() {
  return gulp.src("node_modules/bootstrap/dist/js/**/*.js").pipe(gulp.dest(paths.dist + "js"));
});

gulp.task("pages", function() {
  return gulp
    .src(["src/templates/**/*.njk", "!src/templates/**/_*.njk"])
    .pipe(
      data(function() {
        var metaData = require("./src/data/site.json");
        metaData.root_path = "/";
        return metaData;
      })
    )
    .pipe(
      nunjucksRender({
        path: ["src/templates/"],
        manageEnv: manageEnvironment,
      })
    )
    .pipe(gulp.dest(paths.dist));
});


gulp.task("build", function(callback) {
  runSequence("clean:dist", "copy:img", "copy:js", "pages", "sass", callback);
});

gulp.task("default", ["serve"], function() {
  gulp.watch(paths.dist + "**/*.*", ["bs-reload"]);
  gulp.watch(paths.src + "styles/**/*.scss", ["sass"]);
  gulp.watch(paths.src + "templates/**/*.njk", ["pages"]);
  gulp.watch(paths.src + "javascripts/**/*.js", ["copy:js"]);
});
