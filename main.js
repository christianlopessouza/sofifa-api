const express = require('express');
const puppeteer = require('puppeteer');
const timeout = require('connect-timeout');
const app = express();
const port = 3000;



let browser, page;
async function startServer() {
    browser = await puppeteer.launch({
        headless: false, args: ['--blink-settings=imagesEnabled=false', '--fast-2g']
    });
    page = await browser.newPage({ timeout: 0 });
    await page.setViewport({
        width: 2000,
        height: 1000,
    });
    await page.goto('https://www.sofifa.com');
    console.log('Server and browser started');
    return { browser, page }
}

startServer();

const playersMiddleware = (req, res, next) => {
    const includePlayers = req.query.players;
    if (includePlayers) {
        req.includePlayers = includePlayers.toLowerCase() === 'true';
    } else {
        req.includePlayers = false;
    }
    next();
};

// Rota para buscar um time pelo ID
app.get('/team/:nome', playersMiddleware, async (req, res) => {

    const nome = req.params.nome;


    const url = "https://sofifa.com/teams"
    page.goto(url)

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

    await page.waitForSelector(linhas_jogadores = 'tr.starting');
    const playerRows = await page.$$(linhas_jogadores); // seleciona todos os elementos <tr> com a classe "starting"

    let players = [];
    let player_page = await browser.newPage({ timeout: 0 });
    for (const row of playerRows) {
        const playerLink = await row.$('td.col-name a'); // seleciona o elemento <a> com o link do jogador
        const playerPageUrl = await page.evaluate(link => link.href, playerLink);

        await player_page.goto(playerPageUrl);


        let player_info = {};

        player_info.name = await player_page.evaluate(() => {
            return document.querySelector('.center > h1').textContent;
        });

        player_info.overall = await player_page.evaluate(() => {
            return document.querySelectorAll('.spacing .block-quarter')[0].querySelector('span');
        });

        players.push(player_info)

    }
    await player_page.close()

    res.send(players)


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