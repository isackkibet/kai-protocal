const fs = require('fs');
const https = require('https');

const speciesList = [
    { id: 'silver_oak', title: 'Grevillea_robusta' },
    { id: 'thika_palm', title: 'Hyphaene_compressa' },
    { id: 'african_cherry', title: 'Prunus_africana' },
    { id: 'avocado', title: 'Persea_americana' },
    { id: 'matomoko', title: 'Ficus_thonningii' },
    { id: 'makhamia', title: 'Markhamia_lutea' },
    { id: 'acacia', title: 'Vachellia_tortilis' },
    { id: 'teclea', title: 'Teclea' },
    { id: 'chestnut', title: 'Castanea_sativa' },
    { id: 'drypetes', title: 'Drypetes' },
    { id: 'croton', title: 'Croton_megalocarpus' },
    { id: 'toothbrush_tree', title: 'Salvadora_persica' },
    { id: 'pepper_bark', title: 'Warburgia_ugandensis' },
    { id: 'jackfruit', title: 'Artocarpus_heterophyllus' },
    { id: 'sisal', title: 'Agave_sisalana' }
];

async function fetchUrls() {
    let map = {};
    for (const species of speciesList) {
        try {
            const apiUrl = `https://en.wikipedia.org/api/rest_v1/page/summary/${species.title}`;
            const summaryData = await new Promise((resolve, reject) => {
                https.get(apiUrl, { headers: { 'User-Agent': 'oloolua_app/1.0 (hi@example.com)' } }, (res) => {
                    let data = '';
                    res.on('data', chunk => data += chunk);
                    res.on('end', () => {
                        if (res.statusCode === 200) {
                            resolve(JSON.parse(data));
                        } else {
                            resolve({}); // Ignore errors
                        }
                    });
                }).on('error', reject);
            });

            const imgSrc = (summaryData.thumbnail && summaryData.thumbnail.source) 
                            ? summaryData.thumbnail.source 
                            : (summaryData.originalimage ? summaryData.originalimage.source : null);
            
            if (imgSrc) {
                map[species.id] = imgSrc;
            }
        } catch (e) {
            console.error(e);
        }
    }
    fs.writeFileSync('image_map.json', JSON.stringify(map, null, 2));
    console.log('Saved image_map.json');
}

fetchUrls();
