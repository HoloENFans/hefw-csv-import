require('dotenv').config();
const { parse } = require('csv-parse/sync');
const axios = require('axios');
const fs = require('fs');
const FormData = require('form-data');

const { API_KEY, BYPASS_KEY, PROJECT_ID } = process.env;

const file = fs.readFileSync('./data.csv').toString();
const data = parse(file, { columns: false, skip_empty_lines: true, from: 2 });
const dir = fs.readdirSync('./Kronies');
const fileNames = {};

dir.forEach((name) => {
   const split = name.split(/\s|\-/g);
   fileNames[Number.parseInt(split[0], 10)] = name;
});

async function main() {
    const tasks = data.map(async (submission, index) => {        
        let valid = false;
        let congratsMessage = undefined;
        let favoriteMoment = undefined;
        let imageId = undefined;
        
        // Moment
        if (submission[12] === 'Accepted') {
            favoriteMoment = submission[6];
            valid = true;
        }
        
        // Congrats
        if (submission[13] === 'Accepted') {
            congratsMessage = submission[7];
            valid = true;
        }
        
        if (submission[15] === 'Completed') {
            const sub = JSON.parse(fs.readFileSync(`./res/${index + 2}.json`).toString());
            /*const formData = new FormData();
            formData.append('file', fs.createReadStream(`./Kronies/${fileNames[index + 2]}`));

            const res = await axios.post('https://cms.holoen.fans/api/submission-media', formData, {
                headers: {
                    'X-RateLimit-Bypass': BYPASS_KEY,
                    'Authorization': `users API-Key ${API_KEY}`,
                }
            });*/
            
            imageId = sub.doc.media[0].image.id;
            valid = true;
        }
        
        if (valid) {
            const sub = JSON.parse(fs.readFileSync(`./res/${index + 2}.json`).toString());
            
            let doc = {
                project: PROJECT_ID,
                author: submission[0],
            };
            
            const devprops = [];
            
            if (congratsMessage) {
                doc.message = congratsMessage;
                devprops.push({ key: 'congratulations', value: congratsMessage });
            }
            
            if (favoriteMoment) {
                doc.message = `${congratsMessage ? `${doc.message}\n` : ''}Favorite moment:\n${favoriteMoment}`;
                devprops.push({ key: 'favoriteMoment', value: favoriteMoment });
            }
            
            if (imageId) {
                doc.media = [
                    {
                        type: 'image',
                        subtype: 'artwork',
                        image: imageId,
                    }
                ];
            }
            
            if (devprops.length > 0) {
                doc.devprops = devprops;
            }
            
            const res = await axios.patch(`https://cms.holoen.fans/api/submissions/${sub.doc.id}`,
                doc,
                {
                    headers: {
                        'X-RateLimit-Bypass': BYPASS_KEY,
                        'Authorization': `users API-Key ${API_KEY}`,
                    }
                }
            );
            fs.writeFileSync(`./res2/${index + 2}.json`, JSON.stringify(res.data, null, 4));
            console.log(`Finished pushing ${index + 2}!`);
        }
    });
    
    await Promise.all(tasks);
    /*const formData = new FormData();
    formData.append('file', fs.createReadStream('./Kronies/5 - heartunderblade.webp'));
    
    const res = await axios.post('https://cms.holoen.fans/api/submission-media', formData, {
        headers: {
            'X-RateLimit-Bypass': BYPASS_KEY,
            'Authorization': `users API-Key ${API_KEY}`,
        }
    });
    
    console.log(res.data);*/
}

main();