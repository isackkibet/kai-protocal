const fs = require('fs');
const https = require('https');
const path = require('path');

const speciesList = [
    { name: 'silver_oak', title: 'Grevillea_robusta' },
    { name: 'thika_palm', title: 'Hyphaene_compressa' },
    { name: 'african_cherry', title: 'Prunus_africana' },
    { name: 'avocado', title: 'Persea_americana' },
    { name: 'matomoko', title: 'Ficus_thonningii' },
    { name: 'makhamia', title: 'Markhamia_lutea' },
    { name: 'acacia', title: 'Vachellia_tortilis' },
    { name: 'teclea', title: 'Teclea' },
    { name: 'chestnut', title: 'Castanea_sativa' },
    { name: 'drypetes', title: 'Drypetes' },
    { name: 'croton_megalocarpus', title: 'Croton_megalocarpus' },
    { name: 'toothbrush_tree', title: 'Salvadora_persica' },
    { name: 'pepper_bark', title: 'Warburgia_ugandensis' },
    { name: 'jackfruit', title: 'Artocarpus_heterophyllus' },
    { name: 'sisal', title: 'Agave_sisalana' }
];

const imgDir = path.join(__dirname, '..', 'assets', 'images', 'tree-species');
if (!fs.existsSync(imgDir)) {
    fs.mkdirSync(imgDir);
}

const sleep = ms => new Promise(r => setTimeout(r, ms));

function download(url, dest) {
    return new Promise((resolve, reject) => {
        const file = fs.createWriteStream(dest);
        https.get(url, {
            headers: { 'User-Agent': 'NodeJS/1.0 (oloolua_fetcher; hi@example.com)' }
        }, (response) => {
            if (response.statusCode === 301 || response.statusCode === 302) {
                return download(response.headers.location, dest).then(resolve).catch(reject);
            }
            if (response.statusCode !== 200) {
                reject(new Error(`Failed to get '${url}' (${response.statusCode})`));
                return;
            }
            response.pipe(file);
            file.on('finish', () => {
                file.close(resolve);
            });
        }).on('error', (err) => {
            fs.unlink(dest, () => {});
            reject(err);
        });
    });
}

async function fetchImages() {
    for (const species of speciesList) {
        try {
            console.log(`Fetching info for ${species.title}...`);
            const apiUrl = `https://en.wikipedia.org/api/rest_v1/page/summary/${species.title}`;
            const summaryData = await new Promise((resolve, reject) => {
                https.get(apiUrl, { headers: { 'User-Agent': 'NodeJS/1.0 (oloolua_fetcher; hi@example.com)' } }, (res) => {
                    let data = '';
                    res.on('data', chunk => data += chunk);
                    res.on('end', () => {
                        if (res.statusCode === 200) {
                            resolve(JSON.parse(data));
                        } else {
                            reject(new Error(`API failed: ${res.statusCode}`));
                        }
                    });
                }).on('error', reject);
            });

            const imgSrc = (summaryData.originalimage && summaryData.originalimage.source) 
                            ? summaryData.originalimage.source 
                            : (summaryData.thumbnail ? summaryData.thumbnail.source : null);
                            
            if (imgSrc) {
                const ext = path.extname(imgSrc) || '.jpg';
                const dest = path.join(imgDir, `${species.name}${ext}`);
                // Skip if valid file exists
                if (fs.existsSync(dest) && fs.statSync(dest).size > 1000) {
                    console.log(`Skipping ${species.name}, already exists.`);
                    continue;
                }
                console.log(`Downloading image for ${species.name}...`);
                await download(imgSrc, dest);
                console.log(`Saved ${dest}`);
                await sleep(2000); // 2 second delay to avoid 429
            } else {
                console.log(`No image found for ${species.title}`);
            }
        } catch (e) {
            console.error(`Error processing ${species.title}: ${e.message}`);
        }
    }
}

fetchImages();
