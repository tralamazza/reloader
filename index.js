#!/usr/bin/env node

var cp = require('child_process');
var inotifywatch = require('inotifywatch');

var args = Array.prototype.slice.call(process.argv, 2);
if (args.length === 0) {
  console.log('missing <script filename> argument');
  process.exit(1);
}

var child;

function spawn() {
  child = cp.spawn('node', args, { stdio: ['pipe', process.stdout, process.stderr] });
}

var grace_period = 1;
var last_modify = process.hrtime();

var watcher = inotifywatch(args[0]);

watcher.on('modify', function () {
  var delta = process.hrtime(last_modify);
  if (delta[0] > grace_period) {
    last_modify = process.hrtime();
    child.kill();
    child.on('exit', function (c, s) {
      process.nextTick(spawn);
    });
  }
});

spawn();

process.stdin.resume();
process.stdin.setEncoding('utf8');
