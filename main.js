const express = require('express');
const puppeteer = require('puppeteer');
const app = express();
const port = 3000;



let browser, page;
async function startServer() {
    browser = await puppeteer.launch({
        headless: false,
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

async function checkPageContent(page) {
    let tries = 0;
    while (tries < 3) {
        try {
            await page.waitForTimeout(3000); // Espera 3 segundos
            const readyState = await page.evaluate(() => document.readyState); // Verifica o estado da página
            if (readyState === 'complete') {
                // Verifica se a página carregou corretamente
                const bodyHTML = await page.evaluate(() => document.body.innerHTML);
                if (bodyHTML.trim() !== '') {
                    // Se o conteúdo não estiver em branco, retorna true
                    return true;
                }
            }
            // Se a página estiver em branco, faz o refresh
            await page.reload({ waitUntil: 'networkidle0' });
            tries++;
        } catch (error) {
            // Encerra a verificação caso a página seja fechada
            if (error.message.includes('Protocol error') || error.message.includes('Target closed')) {
                return false;
            }
            // Se não for um erro de página fechada, lança o erro
            throw error;
        }
    }
    // Se não conseguir carregar a página depois de 3 tentativas, retorna false
    return false;
}



// Rota para buscar um time pelo ID
app.get('/league/:id', async (req, res) => {
    const league_id = req.params.id;
    const search_player = req.query.players;

    let teams = [];

    // verifica se já existe instancia da pagina
    if (typeof league_page === 'undefined') {
        league_page = await browser.newPage();

        await league_page.setRequestInterception(true); // desativar interceptação de solicitações temporariamente

        league_page.on('request', (request) => {
            // Desative o carregamento de imagens e outros recursos desnecessários
            if (['image', 'stylesheet', 'font', 'script'].indexOf(request.resourceType()) !== -1) {
                request.abort();
            } else {
                request.continue();
            }
        });
    }

    await league_page.goto(`https://sofifa.com/teams?lg=${league_id}`, { waitUntil: "networkidle2" })

    const teamsPageUrl = await league_page.evaluate(() => {
        const linksArray = Array.from(document.querySelectorAll('tbody > tr'))
            .map(row => row.querySelector('.col-name-wide a').href);
        return linksArray;
    });

    for (const page of teamsPageUrl) {
        teams.push(await getTeamInfo({ url: page, players: search_player }));

    }


    res.send(teams)
})


async function getTeamInfo(params) {
    try {
        const by_url = !(typeof params.url === 'undefined');

        let url = (by_url) ? params.url : `https://sofifa.com/teams?keyword=${params.name}`;


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
        await team_page.goto(url, { waitUntil: "networkidle2" })

        if (!by_url) {
            // encontra o link correspondente ao nome do time e clica nele
            await team_page.waitForSelector(team_page_url = '.table > tbody > tr > td.col-name-wide > a');
            await team_page.click(team_page_url);
        }




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
            return team;

        }

    } catch (error) {
        console.log("DEU BIGAS NA LIGA")
    }
    return null;

}


player_page = []
global_cont = 0;
timeoutId = [];
async function getPlayerInfo(params) {
    console.log(params)
    try {


        let by_url = !(typeof params.url === 'undefined');



        let url = (by_url) ? params.url : `https://sofifa.com/players?keyword=${params.name}`;

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

        const timeout = 3000; // Tempo limite de 3 segundos

        timeoutId[params.url] = setInterval(async () => {
            console.log('Tempo limite de carregamento excedido, recarregando...');
            console.log(url);
            if (player_page[params.url]) {
                await player_page[params.url].close();
            }
            player_page[params.url] = [];
            try {
                player_page[params.url] = await browser.newPage();
                console.log("fechei", player_page[params.url]);
                await player_page[params.url].goto(url, { waitUntil: "networkidle2" });
            } catch (err) {
                console.error(err);
            }
        }, timeout);



        if (!by_url) {
            await player_page[params.url].waitForSelector('.table > tbody > tr > td.col-name > a');
            await player_page[params.url].click('.table > tbody > tr > td.col-name > a');
        }


        let player_info = {};

        await player_page[params.url].waitForSelector('.center > h1');
        clearInterval(timeoutId[params.url]);


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
        // console.log(error)
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