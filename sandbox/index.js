var removeGitIgnored = require('../src/index');

removeGitIgnored('/Users/ricardocanastro/dev/canastror/gin')
    .then((files) => {
        console.log('Files removed: ', files);
    });
