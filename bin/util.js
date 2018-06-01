const { readFile, stat: _stat } = require('fs');
const { promisify } = require('util');
const resolve = promisify(require('resolve'));
const stat = promisify(_stat);

const FILE = 0;
const DIR = 1;

exports.FILE = FILE;
exports.DIR = DIR;

exports.testPath = path =>
  stat(path)
    .then((ret) => {
      if (ret.isFile()) {
        return FILE;
      } else if (ret.isDirectory()) {
        return DIR;
      }
      throw ret;
    });

exports.readJSON = path =>
  new Promise(
    (res, reject) =>
      readFile(path, {
        encoding: 'utf8',
      }, (err, result) => {
        if (err) {
          reject(err);
          return;
        }

        try {
          result = JSON.parse(result);
        } catch (e) {
          reject(e);
          return;
        }

        res(result);
      })
  );

exports.resolve = resolve;
exports.readFile = promisify(readFile);
