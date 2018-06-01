const fs = require('fs')
const path = require('path')
const del = require('del')
const inquirer = require('inquirer')
const gulp = require('gulp')
const strip = require('gulp-strip-comments')
const gulpLoadPlugins = require('gulp-load-plugins')
const lazyPipe = require('lazypipe')
const runSequence = require('run-sequence')
const generatePage = require('@dp/generate-weapp-page')
const buildJS = require('./bin/build');

// load all gulp plugins
const plugins = gulpLoadPlugins()
const env = process.env.NODE_ENV || 'development'
const isProduction = () => env === 'production'
const isDevelopment = () => env !== 'production'
const DIST_PATH = 'dist'

function swallowError(error) {
    console.error(error.toString())
    this.emit('end')
}

// utils functions
function generateFile(options) {
    const files = generatePage({
        root: path.resolve(__dirname, './src/'),
        name: options.pageName,
        less: options.styleType === 'less',
        scss: options.styleType === 'scss',
        css: options.styleType === 'css',
        json: options.needConfig
    })
    files.forEach && files.forEach(file => plugins.util.log('[generate]', file))
    return files
}

/**
 * Clean distribution directory
 */
gulp.task('clean', function() {
    plugins.cached.caches = {};
    return del([`${DIST_PATH}/*`])
})


/**
 * Lint source code
 */
gulp.task('lint', () => {
    return gulp.src(['**/*.js', '!node_modules/', '!dist/', '!build/'])
        .pipe(plugins.eslint())
        .pipe(plugins.eslint.format('node_modules/eslint-friendly-formatter'))
        .pipe(plugins.eslint.failAfterError())
})

gulp.task('compile:config', () => {
    //  配置中的VERSION,DEBUG字段读取系统配置
    var replace = require('gulp-replace')
    var version = require('./package.json').version
    var debug = env !== 'production'
    return gulp.src('./src/config/index.js')
        .pipe(replace(/VERSION\:(.*),/, `VERSION: '${version}',`))
        .pipe(replace(/DEBUG:(.*),/, `DEBUG: ${JSON.stringify(debug)},`))
        .pipe(gulp.dest('src/config/'))
})

/**
 * Compile js source to distribution directory
 */

const pipeJS = lazyPipe()
    .pipe(plugins.babel)
    .pipe(buildJS)
    .pipe(() =>
      plugins.babel({
        babelrc: false,
        plugins: [
          'transform-inline-environment-variables',
        ],
      })
    )

gulp.task('compile:js', () => {
    return gulp.src(['src/**/*.js', '!src/**/*.bak', '!src/**/*.bak/**'])
        .pipe(plugins.cached('compile:js'))
        .pipe(plugins.plumber())
        .pipe(pipeJS())
        // .pipe(plugins.if(isDevelopment, plugins.remember('compile:js')))
        .pipe(plugins.if(isProduction, plugins.uglify()))
        .on('error', swallowError)
        .pipe(gulp.dest(DIST_PATH))
})

/**
 * Compile html source to distribution directory
 */
gulp.task('compile:html', () => {
    return gulp.src(['src/**/*.html', '!src/**/*.bak', '!src/**/*.bak/**'])
        .pipe(plugins.cached('compile:html'))
        .pipe(plugins.plumber())
        .pipe(plugins.sourcemaps.init())
        .pipe(plugins.if(isProduction, plugins.htmlmin({
          collapseWhitespace: true,
          keepClosingSlash: true, // wxml
          removeComments: true,
          removeEmptyAttributes: true,
          removeScriptTypeAttributes: true,
          removeStyleLinkTypeAttributes: true
        })))
        .pipe(plugins.rename({
            extname: '.wxml'
        }))
        .on('error', swallowError)
        .pipe(gulp.dest(DIST_PATH))
})


gulp.task('compile:wxml', () => {
    return gulp.src(['src/**/*.wxml', '!src/**/*.bak', '!src/**/*.bak/**'])
        .on('error', swallowError)
        .pipe(gulp.dest(DIST_PATH))
})

/**
 * Compile less source to distribution directory
 */
gulp.task('compile:less', () => {
  var postcss      = require('gulp-postcss');
  var autoprefixer = require('autoprefixer');
  return gulp.src(['src/**/*.less', '!src/**/*.bak', '!src/**/*.bak/**', '!src/stylesheets/**'])
    .pipe(plugins.cached('compile:less'))
    .pipe(plugins.plumber())
    .pipe(plugins.sourcemaps.init())
    .pipe(plugins.less())
    // .pipe(plugins.postcss([
    //   autoprefixer({
    //     browsers: ["iOS >= 8", "Android >= 4.1"]
    //   })
    // ]))
    .pipe(plugins.base64({
      baseDir: 'src/images/base64',
      extensions: ['svg', 'png', 'jpg', 'jpeg'],
      maxImageSize: 10 * 1024,
      deleteAfterEncoding: false,
      debug: false
    }))
    // .pipe(plugins.if(isProduction, plugins.cssnano({ compatibility: '*' })))
    .pipe(plugins.if(isProduction, plugins.cleanCss()))
    .pipe(plugins.rename({
      extname: '.wxss'
    }))
    .on('error', swallowError)
    .pipe(gulp.dest(DIST_PATH))
})
gulp.task('compile:wxss', () => {
    return gulp.src(['src/**/*.wxss', '!src/**/*.bak', '!src/**/*.bak/**'])
        .on('error', swallowError)
        .pipe(gulp.dest(DIST_PATH))
})

/**
 * Compile json source to distribution directory
 */
gulp.task('compile:json', () => {
    return gulp.src(['src/**/*.json', '!src/**/*.bak', '!src/**/*.bak/**'])
        .pipe(plugins.cached('compile:json'))
        .pipe(plugins.sourcemaps.init())
        .pipe(strip())
        .pipe(plugins.if(isProduction, plugins.jsonminify()))
        .on('error', swallowError)
        .pipe(gulp.dest(DIST_PATH))
})

/**
 * Compile img source to distribution directory
 */
gulp.task('compile:img', () => {
    return gulp.src(['src/images/icons/**/*.{jpg,jpeg,png,gif}'])
        .on('error', swallowError)
        .pipe(gulp.dest(`${DIST_PATH}/images`))
})


/**
 * Compile searchWidget source to distribution directory
 */
gulp.task('searchWidget', () => {
    return gulp.src(['src/searchWidget/**/*.*'])
        .pipe(gulp.dest(`${DIST_PATH}/searchWidget`))
})

/**
 * Compile source to distribution directory
 */
gulp.task('compile', ['clean'], next => {
    runSequence([
        'compile:html',
        'compile:wxml',
        'compile:less',
        'compile:wxss',
        'compile:json',
        'compile:config',
        'compile:js',
        'compile:img'
    ], next)
})


/**
 * Build
 */
gulp.task('build', ['clean'], next => runSequence(['compile'], 'searchWidget', next))

/**
 * Watch source change
 */
gulp.task('watch', ['build'], () => {
    gulp.watch(['src/**/*.js', '!src/**/*.bak', '!src/**/*.bak/**'], ['compile:js'])
    gulp.watch('src/**/*.html', ['compile:html'])
    gulp.watch('src/**/*.wxml', ['compile:wxml'])
    gulp.watch('src/**/*.less', ['compile:less'])
    gulp.watch('src/**/*.wxss', ['compile:wxss'])
    gulp.watch('src/**/*.json', ['compile:json'])
    gulp.watch('src/**/*.{jpe?g,png,gif}', ['compile:img'])
})

/**
 * Generate new page
 */
gulp.task('generate', next => {
    inquirer.prompt([{
        type: 'input',
        name: 'pageName',
        message: 'Input the page name',
        default: 'index'
    },
        {
            type: 'confirm',
            name: 'needConfig',
            message: 'Do you need a configuration file',
            default: false
        }
    ])
        .then(options => {
            const res = generateFile(options)
        })
        .catch(err => {
            throw new plugins.util.PluginError('generate', err)
        })
})

/**
 * Default task
 */

gulp.task('compile:cdnimg', () => {
   return gulp.src(['src/images/cdn/**/*.{jpg,jpeg,png,gif}'])
       .on('error', swallowError)
       .pipe(gulp.dest(`${DIST_PATH}/images`))
})

gulp.task('ci', [], next => runSequence(['clean', 'compile:cdnimg'], next))

gulp.task('default', ['ci'])
