const { exec } = require('child_process');

exec(`/bin/bash -ic "openclaw --help"`, (error, stdout, stderr) => {
    console.log("ERROR:", error ? error.message : "None");
    console.log("STDOUT:", stdout);
    console.log("STDERR:", stderr);
});
