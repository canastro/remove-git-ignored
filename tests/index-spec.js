const sinon = require('sinon');
const expect = require('chai').expect;
const requireUncached = require('require-uncached');
const mock = require('mock-require');

describe('index', function() {
    var sandbox;

    beforeEach(function() {
        // Create a sandbox for the test
        sandbox = sinon.sandbox.create();
    });

    afterEach(function() {
        // Restore all the things made through the sandbox
        sandbox.restore();
    });

    context('when no options are provided', () => {
        it('should throw error', () => {
            const removeGitIgnored = requireUncached('../src/index');

            expect(() => removeGitIgnored()).to.throw(/REMOVE-GIT-IGNORED: invalid parameters/);
        });
    });

    context('when no rootPath is provided', () => {
        it('should throw error', () => {
            const removeGitIgnored = requireUncached('../src/index');

            expect(() => removeGitIgnored({})).to.throw(/REMOVE-GIT-IGNORED: invalid parameters/);
        });
    });

    context('when is in silent mode', function () {
        context('when everything goes according the plan', function () {
            it('should delete the expected files', function (done) {
                const file = `
                #comment
                *.wildcard
                normal.json
                `;

                const fs = {
                    readFileAsync: sandbox.stub().returns(Promise.resolve(file)),
                    removeAsync: sandbox.stub().returns(Promise.resolve())
                };

                mock('bluebird', {
                    promisifyAll: () => fs
                });

                mock('glob', (file, cb) => {
                    cb(null, ['/dummy/folderA/a.wildcard', '/dummy/folderA/folderB/b.wildcard']);
                });

                mock('query-paths', () => ({
                    on: (e, cb) =>  cb('/dummy/folderA')
                }));

                const removeGitIgnored = requireUncached('../src/index');

                var count = 0;
                const evt = removeGitIgnored({
                    rootPath: '/dummy',
                    isSilent: true
                });

                evt.on('project-start', (path) => {
                    expect(path).to.equal('/dummy/folderA');
                });

                evt.on('file-deleted', (path) => {
                    count++;

                    if (count === 1) {
                        expect(path).to.equal('/dummy/folderA/a.wildcard');
                        return;
                    } else if (count === 2) {
                        expect(path).to.equal('/dummy/folderA/folderB/b.wildcard');
                        return;
                    }

                    expect(path).to.equal('/dummy/folderA/normal.json');
                });

                evt.on('project-completed', (path) => {
                    expect(path).to.equal('/dummy/folderA');
                    done();
                });
            });
        });

        context('when readFileAsync fails', function () {
            it('should continue without breaking', function (done) {
                const fs = {
                    readFileAsync: sandbox.stub().returns(Promise.reject()),
                    removeAsync: sandbox.stub().returns(Promise.resolve())
                };

                mock('bluebird', {
                    promisifyAll: () => fs
                });

                mock('glob', (file, cb) => {
                    cb(null, ['/dummy/folderA/a.wildcard', '/dummy/folderA/folderB/b.wildcard']);
                });

                mock('query-paths', () => ({
                    on: (e, cb) =>  cb('/dummy/folderA')
                }));

                const removeGitIgnored = requireUncached('../src/index');

                const evt = removeGitIgnored({
                    rootPath: '/dummy',
                    isSilent: true
                });
                evt.on('project-start', (path) => {
                    expect(path).to.equal('/dummy/folderA');
                });

                evt.on('file-deleted', (path) => {
                    console.log('file-deleted', path);
                });

                evt.on('project-completed', (path) => {
                    expect(path).to.equal('/dummy/folderA');
                    done();
                });
            });
        });

        context('when glob fails', function () {
            it('should continue without breaking', function (done) {
                const file = `
                #comment
                *.wildcard
                normal.json
                `;

                const fs = {
                    readFileAsync: sandbox.stub().returns(Promise.resolve(file)),
                    removeAsync: sandbox.stub().returns(Promise.resolve())
                };

                mock('bluebird', {
                    promisifyAll: () => fs
                });

                mock('glob', (file, cb) => { cb('ERROR'); });

                mock('query-paths', () => ({
                    on: (e, cb) =>  cb('/dummy/folderA')
                }));

                const removeGitIgnored = requireUncached('../src/index');

                const evt = removeGitIgnored({
                    rootPath: '/dummy',
                    isSilent: true
                });
                evt.on('project-start', (path) => {
                    expect(path).to.equal('/dummy/folderA');
                });

                evt.on('file-deleted', (path) => {
                    expect(path).to.equal('/dummy/folderA/normal.json');
                });

                evt.on('project-completed', (path) => {
                    expect(path).to.equal('/dummy/folderA');
                    done();
                });
            });
        });
    });

    context('when is not in silent mode', function () {
        context('when everything goes according the plan', function () {
            it('should delete the expected files', function (done) {
                const file = `
                #comment
                *.wildcard
                normal.json
                `;

                const fs = {
                    readFileAsync: sandbox.stub().returns(Promise.resolve(file)),
                    removeAsync: sandbox.stub().returns(Promise.resolve())
                };

                mock('inquirer', {
                    prompt: () => Promise.resolve({ isConfirmed: true })
                });

                mock('bluebird', {
                    promisifyAll: () => fs
                });

                mock('glob', (file, cb) => {
                    cb(null, ['/dummy/folderA/a.wildcard', '/dummy/folderA/folderB/b.wildcard']);
                });

                mock('query-paths', () => ({
                    on: (e, cb) =>  cb('/dummy/folderA')
                }));

                const removeGitIgnored = requireUncached('../src/index');

                var count = 0;
                const evt = removeGitIgnored({
                    rootPath: '/dummy',
                    isSilent: false
                });

                evt.on('project-start', (path) => {
                    expect(path).to.equal('/dummy/folderA');
                });

                evt.on('file-deleted', (path) => {
                    count++;

                    if (count === 1) {
                        expect(path).to.equal('/dummy/folderA/a.wildcard');
                        return;
                    } else if (count === 2) {
                        expect(path).to.equal('/dummy/folderA/folderB/b.wildcard');
                        return;
                    }

                    expect(path).to.equal('/dummy/folderA/normal.json');
                });

                evt.on('project-completed', () => {
                    done();
                });
            });
        });

        context('when user doesn\'t confirm', function () {
            it('should delete the expected files', function (done) {
                const file = `
                #comment
                *.wildcard
                normal.json
                `;

                const fs = {
                    readFileAsync: sandbox.stub().returns(Promise.resolve(file)),
                    removeAsync: sandbox.stub().returns(Promise.resolve())
                };

                mock('inquirer', {
                    prompt: () => Promise.resolve({ isConfirmed: false })
                });

                mock('bluebird', {
                    promisifyAll: () => fs
                });

                mock('glob', (file, cb) => {
                    cb(null, ['/dummy/folderA/a.wildcard', '/dummy/folderA/folderB/b.wildcard']);
                });

                mock('query-paths', () => ({
                    on: (e, cb) =>  cb('/dummy/folderA')
                }));

                const removeGitIgnored = requireUncached('../src/index');

                var count = 0;
                const evt = removeGitIgnored({
                    rootPath: '/dummy',
                    isSilent: false
                });

                evt.on('project-start', (path) => {
                    expect(path).to.equal('/dummy/folderA');
                });

                evt.on('project-completed', () => {
                    done();
                });
            });
        });

        context('when readFileAsync fails', function () {
            it('should continue without breaking', function (done) {
                const fs = {
                    readFileAsync: sandbox.stub().returns(Promise.reject()),
                    removeAsync: sandbox.stub().returns(Promise.resolve())
                };

                mock('bluebird', {
                    promisifyAll: () => fs
                });

                mock('glob', (file, cb) => {
                    cb(null, ['/dummy/folderA/a.wildcard', '/dummy/folderA/folderB/b.wildcard']);
                });

                mock('query-paths', () => ({
                    on: (e, cb) =>  cb('/dummy/folderA')
                }));

                const removeGitIgnored = requireUncached('../src/index');

                const evt = removeGitIgnored({
                    rootPath: '/dummy',
                    isSilent: false
                });
                evt.on('project-start', (path) => {
                    expect(path).to.equal('/dummy/folderA');
                });

                evt.on('file-deleted', (path) => {
                    console.log('file-deleted', path);
                });

                evt.on('project-completed', () => {
                    done();
                });
            });
        });

        context('when glob fails', function () {
            it('should continue without breaking', function (done) {
                const file = `
                #comment
                *.wildcard
                normal.json
                `;

                const fs = {
                    readFileAsync: sandbox.stub().returns(Promise.resolve(file)),
                    removeAsync: sandbox.stub().returns(Promise.resolve())
                };

                mock('bluebird', {
                    promisifyAll: () => fs
                });

                mock('glob', (file, cb) => { cb('ERROR'); });

                mock('query-paths', () => ({
                    on: (e, cb) =>  cb('/dummy/folderA')
                }));

                const removeGitIgnored = requireUncached('../src/index');

                const evt = removeGitIgnored({
                    rootPath: '/dummy',
                    isSilent: false
                });

                evt.on('project-start', (path) => {
                    expect(path).to.equal('/dummy/folderA');
                });

                evt.on('file-deleted', (path) => {
                    expect(path).to.equal('/dummy/folderA/normal.json');
                });

                evt.on('project-completed', () => {
                    done();
                });
            });
        });
    });
});
