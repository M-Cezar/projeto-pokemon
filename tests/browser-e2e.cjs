const assert = require('node:assert/strict');
const { chromium } = require('playwright');

(async()=>{
  const browser = await chromium.launch({headless:true});
  try {
    for (const width of [320, 390, 768, 1440]) {
      const context = await browser.newContext({viewport:{width,height:750}});
      const page = await context.newPage();
      const exceptions = [];
      page.on('pageerror',error=>exceptions.push(String(error)));
      const response = await page.goto('http://127.0.0.1:4173/',{waitUntil:'load'});
      assert.equal(response.status(),200);
      assert.equal(await page.locator('li.cartao-pokemon').count(),15);
      assert.equal(await page.locator('li.cartao-pokemon img.gif').count(),15);
      const missing = await page.locator('li.cartao-pokemon img.gif').evaluateAll(imgs =>
        imgs.filter(image => !image.complete || image.naturalWidth <= 0).map(image => image.src));
      assert.deepEqual(missing,[],'Missing sprites at viewport '+width);
      const overflowing = await page.evaluate(() => {
        const viewport = document.documentElement.clientWidth;
        return [...document.querySelectorAll('li.cartao-pokemon')]
          .map(x=>({left:x.getBoundingClientRect().left,right:x.getBoundingClientRect().right}))
          .filter(x=>x.left < -1 || x.right > viewport + 1);
      });
      assert.deepEqual(overflowing,[],'Cards outside viewport at '+width);
      const button = page.locator('#botao-alterar-tema');
      assert.equal(await button.getAttribute('aria-pressed'),'false');
      await button.focus();
      await page.keyboard.press('Enter');
      assert.equal(await button.getAttribute('aria-pressed'),'true');
      assert.equal(await page.locator('body').evaluate(el=>el.classList.contains('modo-escuro')),true);
      assert.ok((await page.locator('.imagem-botao').getAttribute('src')).endsWith('moon.png'));
      await page.keyboard.press('Enter');
      assert.equal(await button.getAttribute('aria-pressed'),'false');
      assert.equal(await page.locator('body').evaluate(el=>el.classList.contains('modo-escuro')),false);
      const search = page.locator('#buscar-pokemon');
      const type = page.locator('#filtrar-tipo');
      await search.fill('bulba');
      assert.equal(await page.locator('li.cartao-pokemon:visible').count(),1);
      await search.fill('#015');
      assert.equal(await page.locator('li.cartao-pokemon:visible').count(),1);
      await search.fill('');
      await type.selectOption('fogo');
      assert.ok((await page.locator('li.cartao-pokemon:visible').count()) > 0);
      await search.fill('bulbasaur');
      assert.equal(await page.locator('li.cartao-pokemon:visible').count(),0);
      assert.match(await page.locator('#resultado-busca').innerText(),/Nenhum Pokémon encontrado/);
      await type.selectOption('');
      assert.equal(await page.locator('li.cartao-pokemon:visible').count(),1);
      await search.fill('');
      assert.equal(await page.locator('li.cartao-pokemon:visible').count(),15);
      assert.deepEqual(exceptions,[]);
      await context.close();
    }
    console.log('Pokemon browser acceptance PASS: 4 viewports, 15 sprites, keyboard theme toggle');
  }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
