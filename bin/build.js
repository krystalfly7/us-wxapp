const { PluginError } = require('gulp-util');
const { obj } = require('through2');

const { join, relative, dirname } = require('path');
const detective = require('detective');
const Vinyl = require('vinyl');
const { resolve, readFile, } = require('./util');


const cwd = process.cwd();


const node_modules = join(cwd, 'node_modules');

const isNPM = path => path.startsWith(node_modules);

const transformPath = (path) => {
  if (!path.startsWith(cwd)) {
    throw new Error(`Path not valid: ${path}`);
  }
  if (path.startsWith(node_modules)) {
    const relPath = path.slice(node_modules.length).replace(/node_modules/g, 'npm');
    const ret = join(cwd, 'src/npm', relPath);
    return ret;
  }
  return path;
};

const transform = async ({
  entry,
  push,
  setDupeCheck, // prevent duplicated check
}) => {
  setDupeCheck = setDupeCheck || new Set()
  const reg = /require\(['"]([@?\w\d_\-./]+)['"]\)/ig;

  const pathMap = new Map();

  const pending = new Set();

  const code = entry.contents.toString();

  const {
    base,
  } = entry;

  const basedir = dirname(entry.path);

  const deps = detective(code);

  // rewrite deps
  for (const lib of deps) {
    if (pathMap.has(lib)) {
      continue;
    }

    const resolved = await resolve(lib, {
      basedir,
    });

    if (!setDupeCheck.has(resolved)) {
      setDupeCheck.add(resolved);
      pending.add(
        resolved
      );
    }

    let relPath = relative(
      transformPath(basedir),
      transformPath(resolved)
    );

    if (relPath[0] !== '.') {
      relPath = `./${relPath}`;
    }

    pathMap.set(
      lib,
      relPath
    );
  }

  if (pathMap.size !== 0) {
    const transformed = code.replace(
      reg,
      (match, lib) =>
        (
          pathMap.has(lib) ?
            `require('${pathMap.get(lib)}')` :
            match
        )
    );

    entry.contents = new Buffer(transformed);
  }

  if (isNPM(entry.path)) {
    entry.path = transformPath(entry.path);
  }

  push(entry);

  // create npm vinyl files
  for (const pendingPath of pending) {
    const inNpm = isNPM(pendingPath);

    if (!inNpm) {
      continue;
    }

    const contents = await readFile(pendingPath);

    const vinyl = new Vinyl({
      cwd,
      base,
      contents,
      path: pendingPath,
    });

    await transform({
      entry: vinyl,
      push,
      setDupeCheck,
    });
  }
};

const PLUGIN_NAME = 'wxapp-build';

const plugin =
  async function (file, enc, cb) {
    if (file.isNull()) {
      this.push(file);
      cb();
      return;
    }
    if (file.isStream()) {
      this.emit('error', new PluginError(PLUGIN_NAME, 'Stream not supported!'));
      cb();
      return;
    }
    try {
      await transform({
        entry: file,
        push: (f) => {
          this.push(f);
        },
      });
    } catch (e) {
      console.error(e);
      this.emit('error', new PluginError(PLUGIN_NAME, e.message));
    } finally {
      cb();
    }
  };

module.exports = () =>
  obj(
    plugin
  );
