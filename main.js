const express = require('express');
const puppeteer = require('puppeteer');
const app = express();
const port = 3000;



let browser, page;
async function startServer() {
    browser = await puppeteer.launch({
        headless: 'new'
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


function getTeamInfo(){

}

function getPlayerInfo(){

}


// Rota para buscar um time pelo ID
app.get('/team/:name', async (req, res) => {

    const name = req.params.name;

    const team = {}


    page.goto("https://sofifa.com/teams", { waitUntil: "networkidle2" })



    // espera pelo input ser encontrado na página
    await page.waitForSelector('[name="keyword"]');

    console.log((name).toString())
    // preenche o input com um valor
    await page.type('[name="keyword"]', (name).toString());

    // pressiona a tecla Enter para enviar a pesquisa
    await page.keyboard.press('Enter');


    // encontra o link correspondente ao nome do time e clica nele
    await page.waitForSelector(team_page_url = '.table > tbody > tr > td.col-name-wide > a');
    await page.click(team_page_url);

    // encontra lista de jogadores
    await page.waitForSelector('.list');

    // Nome 
    team.name = await page.evaluate(() => {
        return document.querySelector('.center > h1').textContent;
    });

    if (req.query.players === 'true') {
        // coleta o link dos jogador para ser acessado posteriormente
        const playersPageUrl = await page.evaluate(() => {
            const linksArray = Array.from(document.querySelectorAll('.list')[0].querySelectorAll('.list > tr'))
                .map(row => row.querySelector('.col-name a').href);
            return linksArray;
        });


        // // abre uma nova aba para acessar página dos jogadores

        contador = 0
        let player_page = await browser.newPage();

        await player_page.setRequestInterception(true);

        // Intercepte cada solicitação de recurso
        player_page.on('request', (request) => {
            // Desative o carregamento de imagens e outros recursos desnecessários
            if (['image', 'stylesheet', 'font', 'script'].indexOf(request.resourceType()) !== -1) {
                request.abort();
            } else {
                request.continue();
            }
        });


        let playersList = []
        for (const playerUrl of playersPageUrl) {
            await player_page.goto(playerUrl, { waitUntil: "networkidle2" }) // acessa página do jogador

            let player_info = {};

            // Nome 
            player_info.name = await player_page.evaluate(() => {
                return document.querySelector('.center > h1').textContent;
            });

            // Overall
            player_info.overall = await player_page.evaluate(() => {
                return document.querySelectorAll('.spacing .block-quarter')[0].querySelector('span').textContent;
            });

            playersList.push(player_info)


        }
        await player_page.close()
        team.players = playersList;
    }
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