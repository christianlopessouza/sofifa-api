const express = require('express');
const puppeteer = require('puppeteer');
const timeout = require('connect-timeout');
const app = express();
const port = 3000;



let browser, page;
async function startServer() {
    browser = await puppeteer.launch({
        headless: 'new'
    });
    page = await browser.newPage();

    // await page.setViewport({
    //     width: 2000,
    //     height: 1000,
    // });
    console.log('Server and browser started');
    return { browser, page }
}

startServer();


// Rota para buscar um time pelo ID
app.get('/team/:nome', async (req, res) => {

    const nome = req.params.nome;

    const time = {}


    page.goto("https://sofifa.com/teams", { waitUntil: "networkidle2" })



    // espera pelo input ser encontrado na página
    await page.waitForSelector('[name="keyword"]');

    console.log((nome).toString())
    // preenche o input com um valor
    await page.type('[name="keyword"]', (nome).toString());

    // pressiona a tecla Enter para enviar a pesquisa
    await page.keyboard.press('Enter');


    // encontra o link correspondente ao nome do time e clica nele
    await page.waitForSelector(link_pagina_time = '.table > tbody > tr > td.col-name-wide > a');
    await page.click(link_pagina_time);

    // encontra lista de jogadores
    await page.waitForSelector('.list');

    // Nome 
    time.name = await page.evaluate(() => {
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
            console.log(playerUrl)
            contador++;

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
        time.players = playersList;
    }
    res.send(time)


    /*const team = teams.find((t) => t.id === id);
    if (!team) {
        res.status(404).send('Time não encontrado');
    } else {
        const response = { id: team.id, name: team.name };
        if (req.includePlayers) {
            response.players = team.players;
        }
        res.send(response);
    }*/
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