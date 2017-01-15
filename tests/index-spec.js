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

    context('when no path is provided', () => {
        it('should throw error', () => {
            const removeGitIgnored = requireUncached('../src/index');

            expect(() => removeGitIgnored()).to.throw(/REMOVE-GIT-IGNORED: invalid parameters/);
        });
    });

    context('when a path is provided', function () {
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

                mock('query-paths', () => Promise.resolve(['/dummy/folderA']));

                const removeGitIgnored = requireUncached('../src/index');

                removeGitIgnored('/dummy').then((files) => {
                    expect(files).to.deep.equal([
                        '/dummy/folderA/a.wildcard',
                        '/dummy/folderA/folderB/b.wildcard',
                        '/dummy/folderA/normal.json'
                    ]);

                    expect(fs.removeAsync.callCount).to.equal(3);
                    done();
                });
            });
        });

        context('when readFileAsync fails', function () {
            it('should continue without breaking', function (done) {
                const file = `
                #comment
                *.wildcard
                normal.json
                `;

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

                mock('query-paths', () => Promise.resolve(['/dummy/folderA']));

                const removeGitIgnored = requireUncached('../src/index');

                removeGitIgnored('/dummy').then((files) => {
                    expect(files).to.deep.equal([]);
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

                mock('query-paths', () => Promise.resolve(['/dummy/folderA']));

                const removeGitIgnored = requireUncached('../src/index');

                removeGitIgnored('/dummy').then((files) => {
                    expect(files).to.deep.equal(['/dummy/folderA/normal.json']);
                    done();
                });
            });
        });

    });
});
