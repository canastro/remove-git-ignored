'use strict';

const path = require('path');
const events = require('events');
const promise = require('bluebird');
const fs = promise.promisifyAll(require('fs-extra'));
const glob = require('glob');
const queryPaths = require('query-paths');

/**
 * Read .gitignore file and return a object with the basePath
 * and the not empty lines in the file
 * @method  readFile
 * @param   {String} basePath
 * @returns {Object} Object composed of basePath and not lines of the gitignore file
 */
const readFile = (basePath) => {
    const filePath = path.join(basePath, '.gitignore');
    const lines = [];

    return fs.readFileAsync(filePath, 'utf-8')
        .then((data) => {
            let index = data.indexOf('\n');
            let last = 0;

            while (index > -1) {
                const line = data.substring(last, index).trim();
                if (line) { lines.push(line); }

                last = index + 1;
                index = data.indexOf('\n', last);
            }

            return { basePath, lines };
        })
        .catch(() => ({ basePath, lines }));
};

/**
 * Remove file
 * @method  removeFile
 * @param   {String}   filePath
 * @returns {Promise}
 */
const removeFile = (filePath) => fs.removeAsync(filePath).then(() => filePath);

/**
 * Iterate by every git ignore line and extract the file paths to be deleted
 * If starts with '#' is a comment and should be ignored
 * If has a '*' its a wildcard and should be expanded using Glob
 * Otherwise is just a direct reference to a file and should be added to the list of files
 * to be deleted
 * @method  expandPaths
 * @param   {Object}    project - Object with `basePath: String` and `lines: Array`
 * @returns {Array}
 */
const expandPaths = (project) => {
    const promises = project.lines.map((line) => {
        // Ignore comments
        if (line.startsWith('#')) {
            return Promise.resolve([]);
        }

        // Return direct file references
        if (line.indexOf('*') === -1) {
            return Promise.resolve([path.join(project.basePath, line)]);
        }

        // Resolve wildcards
        return new Promise((resolve) => {
            glob(path.join(project.basePath, '**', line), (err, files) => {
                if (err) { return resolve([]); }
                return resolve(files);
            });
        });
    });

    return Promise.all(promises).then((files) => files.reduce((x, y) => x.concat(y), []));
};

module.exports = function removeGitIgnored (rootPath) {
    if (!rootPath) {
        throw new Error('REMOVE-GIT-IGNORED: invalid parameters');
    }

    const eventEmitter = new events.EventEmitter();
    const queryPath = queryPaths(rootPath, '.gitignore');

    queryPath.on('data', (path) => {
        eventEmitter.emit('project-start', path);

        readFile(path)
            .then(expandPaths)
            .then((lines) => Promise.all(lines.map((line) => removeFile(line).then(() => {
                eventEmitter.emit('file-deleted', line);
            }))))
            .then(() => {
                eventEmitter.emit('project-completed', path);
            });
    });

    return eventEmitter;
};
