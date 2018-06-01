var standardVersion = require('standard-version')

// Options are the same as command line, except camelCase
standardVersion({
  silent: false
}, function (err) {
  if (err) {
    console.error(`standard-version failed with message: ${err.message}`)
  }else{
    console.log(`请执行npm run build重新构建小程序发布目录`);
  }
  // standard-version is done
})
