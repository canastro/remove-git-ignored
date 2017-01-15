var removeGitIgnored = require('../src/index');

const remove = removeGitIgnored('/Users/ricardocanastro/dev/canastror/gin');

remove.on('project-start', (path) => {
    console.log('project started: ', path);
});

remove.on('file-deleted', (file) => {
    console.log('file deleted: ', file);
});

remove.on('project-completed', (path) => {
    console.log('project completed: ', path);
});

remove.on('end', () => {
    console.log('end');
});
