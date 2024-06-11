const express = require('express');
const axios = require('axios');
require('dotenv').config();  // dotenvの設定

const app = express();
const port = 9001;

const apiKey = process.env.RIOT_API_KEY;

app.get('/riot.txt',(req,res)=> res.send("7719b39b-91ee-4466-94c3-89e4cf28f990"))

app.get('/', async (req.res) => {
    
})

app.get('/getMatchList/:gameName/:tagline', async (req, res) => {
    const { gameName, tagline } = req.params;

    try {
        // Step 1: Get puuid
        const puuidResponse = await axios.get(`https://asia.api.riotgames.com/riot/account/v1/accounts/by-riot-id/${gameName}/${tagline}?api_key=${apiKey}`);
        const puuid = puuidResponse.data.puuid;

        // Step 2: Get activeShard
        const shardResponse = await axios.get(`https://asia.api.riotgames.com/riot/account/v1/active-shards/by-game/val/by-puuid/${puuid}?api_key=${apiKey}`);
        const activeShard = shardResponse.data.activeShard;

        // Step 3: Get matchlist
        const matchlistResponse = await axios.get(`https://${activeShard}.api.riotgames.com/val/match/v1/matchlists/by-puuid/${puuid}?api_key=${apiKey}`);
        const matchlist = matchlistResponse.data.history;

        // Step 4: Get match details for each matchId
        const matchDetailsPromises = matchlist.map(match => {
            return axios.get(`https://${activeShard}.api.riotgames.com/val/match/v1/matches/${match.matchId}?api_key=${apiKey}`);
        });

        const matchDetailsResponses = await Promise.all(matchDetailsPromises);
        const matchDetails = matchDetailsResponses.map(response => response.data);

        // Step 5: Replace puuid with gameName and tagline
        const puuidMappingPromises = matchDetails.flatMap(match => {
            return match.players.map(player => {
                return axios.get(`https://asia.api.riotgames.com/riot/account/v1/accounts/by-puuid/${player.puuid}?api_key=${apiKey}`)
                    .then(response => {
                        player.gameName = response.data.gameName;
                        player.tagline = response.data.tagLine;
                        delete player.puuid;
                    });
            });
        });

        await Promise.all(puuidMappingPromises);

        // Step 6: Return result
        res.json(matchDetails);
    } catch (error) {
        console.error(error);
        res.status(500).send('An error occurred while fetching data.');
    }
});

app.get('/getUser/:gameName/:tagline', async (req, res) => {
    const { gameName, tagline } = req.params;

    try {
        // Step 1: Get puuid
        const puuidResponse = await axios.get(`https://asia.api.riotgames.com/riot/account/v1/accounts/by-riot-id/${gameName}/${tagline}?api_key=${apiKey}`);
        const puuid = puuidResponse.data.puuid;

        // Step 2: Get activeShard
        const shardResponse = await axios.get(`https://asia.api.riotgames.com/riot/account/v1/active-shards/by-game/val/by-puuid/${puuid}?api_key=${apiKey}`);
        const activeShard = shardResponse.data.activeShard;

        // Return the data
        res.json({
            puuid: puuid,
            activeShard: activeShard
        });
    } catch (error) {
        console.error(error);
        res.status(500).send('An error occurred while fetching data.');
    }
});

const validPlatforms = ['AP', 'BR', 'EU', 'KR', 'LATAM', 'NA'];

app.get('/getPlatformStatus/:platform', async (req, res) => {
    const { platform } = req.params;
    if (!validPlatforms.includes(platform)) {
        return res.status(400).send('Invalid platform specified.');
    }

    try {
        // Get platform status
        const statusResponse = await axios.get(`https://${platform}.api.riotgames.com/val/status/v1/platform-data?api_key=${apiKey}`);
        const platformStatus = statusResponse.data;

        // Return the data
        res.json(platformStatus);
    } catch (error) {
        console.error(error);
        res.status(500).send('An error occurred while fetching data.');
    }
});

app.get('/getUserByPuuid/:puuid', async (req, res) => {
    const { puuid } = req.params;

    try {
        // Get user by puuid
        const userResponse = await axios.get(`https://asia.api.riotgames.com/riot/account/v1/accounts/by-puuid/${puuid}?api_key=${apiKey}`);
        const userData = userResponse.data;

        // Return the data
        res.json(userData);
    } catch (error) {
        console.error(error);
        res.status(500).send('An error occurred while fetching data.');
    }
});

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
