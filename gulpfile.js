var gulp = require('gulp');
var sass = require('gulp-sass');
var autoprefixer = require('gulp-autoprefixer');
var concat = require('gulp-concat');
var cssnano = require('gulp-cssnano');
var rename = require('gulp-rename');
var compass = require('gulp-compass');
var clean = require('gulp-clean');
var notify = require('gulp-notify');
var plumber = require('gulp-plumber');
var sourcemaps = require('gulp-sourcemaps');
var uglify = require('gulp-uglify');
var wiredep = require('gulp-wiredep');
var useref = require('gulp-useref');
var browserSync = require('browser-sync').create();
var jade = require('gulp-jade');


//Переменные для SVG
var svgSprite = require('gulp-svg-sprite'),
  	svgmin = require('gulp-svgmin'),
  	cheerio = require('gulp-cheerio'),
 	  replace = require('gulp-replace');

var config = {
  mode: {
    symbol: {
      sprite: "../sprite.svg",
      render: {
        scss: {
          dest: '../../../../styles/misc/sprite.scss'
        }
      }
    }
  }
};


// Задача с названием 'default' запускается автоматически по команде 'gulp' в консоле.
// Эта конструкция работает синхронно, сначала выполняется задача 'clean' и только после ее завершнения запускается 'dev'.
gulp.task('default', ['clean'], function() {
	gulp.run('dev');
});
// Аналогично с предыдушей задачей.
// Выполняет задача 'clean' и после ее завершения запускается 'build'.
gulp.task('production', ['clean'], function() {
	gulp.run('build');
});
// Задача 'dev' представляется собой сборку в режиме разработки.
// Запускает build - сборку, watcher - слежку за файлами и browser-sync.
gulp.task('dev', ['build', 'watch', 'browser-sync']);
// Задача 'build' представляет собой сборку в режиме продакшен.
// Собирает проект.
gulp.task('build', ['jade', 'styles', 'scripts', 'assets']);
// Задача 'watch' следит за всеми нашими файлами в проекте и при изменении тех или иных перезапустает соответсвующую задачу.
gulp.task('watch', function() {
	gulp.watch('src/styles/**/*.scss', ['styles']); //стили
    gulp.watch('src/js/**/*.js', ['scripts']); //скрипты
    gulp.watch('src/html/**/*.jade', ['jade']); //jade
    // gulp.watch(['./bower.json', 'src/index.html'], ['html']); // html
    gulp.watch('./src/assets/**/*.*', ['assets']); //наши локальные файлы(картинки, шрифты)
    gulp.watch('src/**/*.*').on('change', browserSync.reload); //Перезапуск browserSynс
});
// Задача 'styles' выполняет сборку наших стилей.
gulp.task('styles', function() {
	return gulp.src('src/styles/*.scss')
		.pipe(plumber({ // plumber - плагин для отловли ошибок.
			errorHandler: notify.onError(function(err) { // nofity - представление ошибок в удобном для вас виде.
				return {
					title: 'Styles',
					message: err.message
				}
			})
		}))
		.pipe(sourcemaps.init()) //История изменения стилей, которая помогает нам при отладке в devTools.
		.pipe(sass()) //Компиляция sass.
		.pipe(autoprefixer({ //Добавление autoprefixer.
			browsers: ['last 2 versions']
		}))
		.pipe(concat('styles.css')) //Соедение всех файлом стилей в один и задание ему названия 'styles.css'.
		.pipe(cssnano()) //Минификация стилей
		.pipe(sourcemaps.write())
		.pipe(rename('build.css')) //Переименование
		.pipe(gulp.dest('build/styles'));
});

//Задача для удаление спрайта.
gulp.task('cleanSprite', function() {
	return gulp.src('src/assets/img/sprite/')
		.pipe(clean());
})

//Задача для удаление папки build.
gulp.task('clean', function() {
	return gulp.src('build/')
		.pipe(clean());
});

gulp.task('jade', function(){
  gulp.src('src/html/*.jade')
    .pipe(jade())
    .pipe(gulp.dest('build/'))
    .on('end', function() { //запуск задачу 'useref' по завершению задачи 'html'.
      gulp.run('useref');
    });
});

// gulp.task('html', function() {
// 	gulp.src('src/index.html')
// 		.pipe(wiredep({ //Добавление ссылок на плагины bower.
// 			directory: 'bower_components/'
// 		}))
// 		.pipe(gulp.dest('build/'))
// 		.on('end', function() { //запуск задачу 'useref' по завершению задачи 'html'.
// 			gulp.run('useref');
// 		});
// });

gulp.task('useref', function() {
	return gulp.src('build/index.html')
		.pipe(useref()) //Выполняет объединение файлов в один по указанным в разметке html комментариев.
		.pipe(gulp.dest('build/'));
});

gulp.task('scripts', function() {
	gulp.src('src/js/*.js')
		.pipe(uglify()) //Минификация скриптов.
		.pipe(gulp.dest('build/js'));
});
//Задача для запуска сервера.
gulp.task('browser-sync', function() {
	return browserSync.init({
		server: {
			baseDir: './build/'
		}
	});
});
//Перемешение наших локальных файлов в папку build
gulp.task('assets', function() {
	return gulp.src('./src/assets/**/*.*')
		.pipe(gulp.dest('./build/assets'));
});



//Задача для сборки спрайта SVG
gulp.task('sprite', function() {
  return gulp.src('./src/assets/img/icons/*.svg')
    // минифицируем svg
    .pipe(svgmin({
      js2svg: {
        pretty: true
      }
    }))
    // удалить все атрибуты fill, style and stroke в фигурах
    .pipe(cheerio({
      run: function($) {
        $('[fill]').removeAttr('fill');
        $('[stroke]').removeAttr('stroke');
        $('[style]').removeAttr('style');
      },
      parserOptions: { xmlMode: true }
    }))
    // cheerio плагин заменит, если появилась, скобка '&gt;', на нормальную.
    .pipe(replace('&gt;', '>'))
    // build svg sprite
    .pipe(svgSprite(config))
    .pipe(gulp.dest('./src/assets/img/sprite'));
});
