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
  child.on('exit', function (c, s) {
    child = null; // the child process might crash and/or end by itself (not only by our kill)
  });
}

var grace_period = 1;
var last_modify = process.hrtime();

var watcher = inotifywatch(args[0]);

watcher.on('modify', function () {
  var delta = process.hrtime(last_modify);
  if (delta[0] > grace_period) {
    last_modify = process.hrtime();
    if (child) {
      // child not null, register a spawn and kill it
      child.on('exit', function (c, s) {
        spawn();
      });
      child.kill();
    } else {
      // child is null, just spanw it
      spawn();
    }
  }
});

spawn();

process.stdin.resume();
process.stdin.setEncoding('utf8');
