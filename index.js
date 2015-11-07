#!/usr/bin/env node
var exec   = require('child_process').execSync;
var spawn  = require('child_process').spawnSync;
var logger = require('winston');
var path   = require('path');
var docopt = require('docopt').docopt;
var dotenv = require('dotenv');

dotenv.load({ silent: true });

var args = docopt("\
  Usage: \
      newton start \
      newton package \
      newton dist \
", {} );

process.env.PATH = [].concat(path.join(path.dirname(require.resolve('.')),
                                       'node_modules/.bin'),
                             process.env.PATH.split(path.delimiter))
                       .join(path.delimiter);

function eval(cmd) {
  return exec(cmd).toString().trim();
}

var config = require( path.join(process.cwd(), 'package') );

logger.info(config.name);

var version = eval('electron -v');

logger.info(version);

if (args.start) {
  eval('electron .');
}
else if (args.package) {

  var tmp_dir = path.join(process.cwd(), 'tmp');
  var app_dir = process.cwd(); // path.join(tmp_dir, 'app');

  var args = [
    app_dir,
    config.name,
    '--out=' + tmp_dir,
    '--version=' + version.substr(1),
    '--all',
    '--icon=' + path.resolve(process.cwd(), 'resources', 'app'),
    '--app-version=' + config.version,
    // '--prune',
    '--ignore=tmp/.*',
    '--version-string.CompanyName=' + (config.config && config.config.companyName) || config.name,
    '--version-string.LegalCopyright=' + (config.config && config.config.copyright) || config.copyright || config.author,
    '--version-string.FileDescription=' + config.name,
    '--version-string.FileVersion=' + config.version,
    '--version-string.OriginialFilename=' + config.name + '.exe',
    '--version-string.ProductVersion=' + config.version,
    '--version-string.ProductName=' + config.name,
    '--version-string.InternalName=' + config.name + '.exe'
  ];

  if ('BUNDLE_ID' in process.env) args.push('--app-bundle-id=' + process.env.BUNDLE_ID);
  if ('HELPER_BUNDLE_ID' in process.env) args.push('--app-helper-bundle-id=' + process.env.HELPER_BUNDLE_ID);
  if ('SIGN' in process.env) args.push('--sign=' + process.env.SIGN);

  var result = spawn('electron-packager', args, {
    stdio: 'inherit'
  });
  if (result.error) logger.error(result.error);

}
else if(args.dist) {
  var tmp_dir = path.join(process.cwd(), 'tmp');
  var gh_token = process.env.GITHUB_TOKEN;
console.log(gh_token);
  spawn('electron-release', [
    '--app=' + path.join(tmp_dir, config.name + '-darwin-x64', config.name + '.app'),
    '--token=' + gh_token,
  ], { stdio: 'inherit' });
}
