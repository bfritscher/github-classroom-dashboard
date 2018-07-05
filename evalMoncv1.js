const fs = require('fs');
const unzip = require('node-unzip-2');
const folders = fs.readdirSync('moncv1/');


function getFirstFile(search, list) {
    for(let i=0; i < list.length; i++) {
        if (list[i].includes(search)) {
            return list[i];
        }
    }
    return "";
}

const results = folders.map((folder) => {
    const name = folder.split('_')[0].split(' ');
    const files = fs.readdirSync(`moncv1/${folder}`);
    const zipName = getFirstFile('.zip', files);
    let isZipNameValid = false
    try {
        isZipNameValid = zipName.split('.')[0].split('_')[1].toUpperCase() === name[0].toUpperCase();
    }  catch (e) {
    }
    let isReadme = false;
    let isStyle = false;
    let isIndex = false;
    if(zipName) {
        fs.createReadStream(`moncv1/${folder}/${zipName}`).pipe(unzip.Extract({ path: `moncv1/${folder}/`}));
        isReadme = fs.existsSync(`moncv1/${folder}/README.txt`);
        isStyle = fs.existsSync(`moncv1/${folder}/style.css`);
        isIndex = fs.existsSync(`moncv1/${folder}/index.html`);
    }
    return {
        folder,
        zipName,
        isZipNameValid,
        isReadme,
        isStyle,
        isIndex
    };
});
const r = JSON.stringify(results, null, 2);
console.log(r);
fs.writeFileSync('evalMoncv1.json', r);
