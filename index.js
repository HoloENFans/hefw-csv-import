require('dotenv').config();
const { parse } = require('csv-parse/sync');
const axios = require('axios');
const fs = require('fs');
const FormData = require('form-data');

const { API_KEY, BYPASS_KEY, PROJECT_ID } = process.env;

const file = fs.readFileSync('./data.csv').toString();
const data = parse(file, { columns: false, skip_empty_lines: true, from: 2 });

const dir = fs.readdirSync('./dir');
const fileNames = {};

dir.forEach((name) => {
   const split = name.split(/\s|\-|\./g);
   fileNames[Number.parseInt(split[0], 10)] = name;
});

async function main() {
    const tasks = data.map(async (submission, index) => {
        let valid = false;
        let message = undefined;
        let imageId = undefined;

        // Message
        if (submission[5] === 'Accepted') {
            message = submission[3];
            valid = true;
        }


        if (submission[6] === 'Accepted') {
            const formData = new FormData();
            formData.append('file', fs.createReadStream(`./dir/${fileNames[index + 2]}`), {
                filename: `${PROJECT_ID}-${index+2}.webp`
            });

            const res = await axios.post('https://cms.holoen.fans/api/submission-media', formData, {
                headers: {
                    'X-RateLimit-Bypass': BYPASS_KEY,
                    'Authorization': `users API-Key ${API_KEY}`,
                }
            });
            fs.writeFileSync(`./res/${index + 2}-img.json`, JSON.stringify(res.data, null, 4));

            imageId = res.data.doc.id;
            valid = true;
        }

        if (valid) {
            let doc = {
                project: PROJECT_ID,
                author: submission[2],
                message: message ? message : '-',
            };

            const devprops = [];

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

            const res = await axios.post(`https://cms.holoen.fans/api/submissions`,
                doc,
                {
                    headers: {
                        'X-RateLimit-Bypass': BYPASS_KEY,
                        'Authorization': `users API-Key ${API_KEY}`,
                    }
                }
            );
            fs.writeFileSync(`./res/${index + 2}.json`, JSON.stringify(res.data, null, 4));
            console.log(`Finished pushing ${index + 2}!`);
        }
    });

    await Promise.all(tasks);
}

main();
