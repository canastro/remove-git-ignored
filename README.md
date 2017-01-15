![build status](https://travis-ci.org/canastro/remove-git-ignored.svg?branch=master)
[![npm version](https://badge.fury.io/js/remove-git-ignored.svg)](https://badge.fury.io/js/remove-git-ignored)
[![codecov](https://codecov.io/gh/canastro/remove-git-ignored/branch/master/graph/badge.svg)](https://codecov.io/gh/canastro/remove-git-ignored)

# remove-git-ignored
Small library that will find all `.gitignore` files from a `rootPath` folder and will delete all the ignored files.

## Why?
I had a lot of old projects that I didn't worked for a while and I was running out of free space on my disk. I ran a command that would delete all the `node_modules` folders in a given rootPath and I "instantly" gained 20GB of free disk.

After that I thought I should have a better way to deal with this and started creating a electron application to manage my workspace, and created a few of core modules to support it, such as:
* [query-paths](https://github.com/canastro/query-paths)
* [remove-git-ignored](https://github.com/canastro/remove-git-ignored)
* [bulk-run-nsp](https://github.com/canastro/bulk-run-nsp)

## How it works?
This module uses [query-paths](https://github.com/canastro/query-paths) to recursively find all the folders with a .gitignore. Then it reads all these files and deletes all files that match what you have defined in it.

## Usage
```js
const removeGitIgnored = require('../src/index');
const remove = removeGitIgnored('/Users/username/dev');

remove.on('project-start', (path) => {
    console.log('project started: ', path);
});

remove.on('file-deleted', (file) => {
    console.log('file deleted: ', file);
});

remove.on('project-completed', (path) => {
    console.log('project completed: ', path);
});
```
