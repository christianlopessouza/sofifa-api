const express = require('express');
const puppeteer = require('puppeteer');
const app = express();
const port = 3000;



let browser, page;
async function startServer() {
    browser = await puppeteer.launch({
        headless: 'new',
        args: [
            '--disable-dev-shm-usage',
            '--blink-settings=imagesEnabled=false',
            '--disable-extensions'
        ]
    });
    page = await browser.newPage();

    console.log('Server and browser started');
    return { browser, page }
}

startServer();

// Rota para buscar um time pelo ID
app.get('/league/:id', async (req, res) => {
    const league_id = req.params.id;

    page.goto(`https://sofifa.com/teams?lg=${league_id}`, { waitUntil: "networkidle2" })

    const teamsPageUrl = await page.evaluate(() => {
        const linksArray = Array.from(document.querySelectorAll('tbody > tr'))
            .map(row => row.querySelector('.col-name-wide a').href);
        return linksArray;
    });

    let team_page = await browser.newPage();

    for (const teamUrl of teamsPageUrl) {
        await team_page.goto(playerUrl, { waitUntil: "networkidle2" }) // acessa página do time


    }


    const league = {}
})


async function getTeamInfo(params) {
    const name = params.name;
    console.log(params)
    console.log((name).toString())

    // verifica se já existe instancia da pagina
    if (typeof team_page === 'undefined') {
        team_page = await browser.newPage();

        await team_page.setRequestInterception(true); // desativar interceptação de solicitações temporariamente

        team_page.on('request', (request) => {
            // Desative o carregamento de imagens e outros recursos desnecessários
            if (['image', 'stylesheet', 'font', 'script'].indexOf(request.resourceType()) !== -1) {
                request.abort();
            } else {
                request.continue();
            }
        });
    }




    // procura equipe no lobby de pesquisa
    await team_page.goto(`https://sofifa.com/teams?keyword=${name}`, { waitUntil: "networkidle2" })



    // encontra o link correspondente ao nome do time e clica nele
    await team_page.waitForSelector(team_page_url = '.table > tbody > tr > td.col-name-wide > a');
    await team_page.click(team_page_url);
    await team_page.waitForSelector('.center > h1'); // espera a página carregar

    const team = {}

    team.name = await team_page.evaluate(() => {
        return document.querySelector('.center > h1').textContent;
    });



    if (typeof params.players !== 'undefined') {

        // coleta o link dos jogador para ser acessado posteriormente
        const playersPageUrl = await team_page.evaluate(() => {
            const linksArray = Array.from(document.querySelectorAll('.list')[0].querySelectorAll('.list > tr'))
                .map(row => row.querySelector('.col-name a').href);
            return linksArray;
        });


        const playersListPromises = playersPageUrl.map((playerUrl) => {
            return getPlayerInfo({ url: playerUrl });
        });

        const playersList = await Promise.all(playersListPromises);
        player_page = [];



        team.players = playersList;

    }

    return team;
}


player_page = []
global_cont = 0;
async function getPlayerInfo(params) {
    console.log(params)
    try {


        let by_url = !(typeof params.url === 'undefined');



        let url = (by_url) ? params.url : `https://sofifa.com/players?keyword=${params.query}`;

        if (typeof player_page[params.url] === 'undefined') {

            player_page[params.url] = await browser.newPage();
            if (!player_page[params.url].isInterceptionEnabled) {

                await player_page[params.url].setRequestInterception(true);
                player_page[params.url].isInterceptionEnabled = true;
                player_page[params.url].on('request', (request) => {
                    // Desative o carregamento de imagens e outros recursos desnecessários
                    if (['image', 'stylesheet', 'font', 'script'].indexOf(request.resourceType()) !== -1) {
                        request.abort();
                    } else {
                        request.continue();
                    }
                });
            }



        }

        await player_page[params.url].goto(url, { waitUntil: "networkidle2" });

        if (!by_url) {
            await player_page[params.url].waitForSelector('.table > tbody > tr > td.col-name > a');
            await player_page[params.url].click('.table > tbody > tr > td.col-name > a');
        }


        let player_info = {};

        await player_page[params.url].waitForSelector('.center > h1');

        // Nome 
        player_info.name = await player_page[params.url].evaluate(() => {
            return document.querySelector('.center > h1').textContent;
        });

        // Overall
        player_info.overall = await player_page[params.url].evaluate(() => {
            return document.querySelectorAll('.spacing .block-quarter')[0].querySelector('span').textContent;
        });

        await player_page[params.url].setRequestInterception(false);

        await player_page[params.url].close();

        return player_info;
    } catch (error) {
        console.log(error)
        return null;

    }
}
//playersList.push(player_info)

app.get('/player', async (req, res) => {
    res.send(await getPlayerInfo(req.query));
})

// Rota para buscar um time pelo ID
app.get('/team/:name', async (req, res) => {
    const name = req.params.name;
    const search_player = req.query.players;

    const team = await getTeamInfo({ 'name': name, 'players': search_player });

    res.send(team)
});



app.listen(port, () => {
    console.log(`Server listening on port ${port}`);
});

// pesquisar times
//  TODOS (ID COMPETIÇÃO)
//  1 especifico (nome time)

// pesquisar jogadores
//  TODOS (ID COMPETIÇÃO)
//  1 especifico (nome time)