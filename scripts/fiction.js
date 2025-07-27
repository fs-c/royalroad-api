// run with 'npx tsx scripts/fiction.js'

import { RoyalRoadAPI } from '../src/royalroad.js';

async function main() {
    const rr = new RoyalRoadAPI();
    const fictionId = 123277;
    const result = await rr.fiction.getFiction(fictionId);

    console.log(JSON.stringify(result, null, 2));
}

main().catch(console.error);