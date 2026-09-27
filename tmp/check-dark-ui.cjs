const { chromium } = require('C:/Users/Lenovo/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const fs=require('fs');
(async()=>{
const browser=await chromium.launch({headless:true,channel:"msedge"});
const page=await browser.newPage({viewport:{width:390,height:844},deviceScaleFactor:1});
page.on('pageerror',e=>console.log('Page error:',e.message));page.on('console',m=>{if(m.type()==='error')console.log('Browser:',m.text())});
await page.addInitScript(()=>{localStorage.setItem('delivery_theme','dark');localStorage.setItem('delivery_token','local-visual-fixture');});
await page.route('**/api/**',route=>{
const path=new URL(route.request().url()).pathname;
if(!path.startsWith('/api/'))return route.continue();
if(path==='/api/auth/me')return route.fulfill({json:{id:'visual',fullName:'Sherif',email:'visual@example.test',role:'COURIER'}});
if(path==='/api/dashboard')return route.fulfill({json:{toBeDelivered:1,delivered:8,cancelled:1,inCustody:1,recentActivity:['CANCELLED','DELIVERED','OTP_SENT'].map((status,i)=>({id:'a'+i,cardId:'c'+i,identifier:'C0000'+(i+2),last4:'000'+i,status,createdAt:new Date().toISOString(),customerName:'Test customer',action:status}))}});
return route.fulfill({json:[]});
});
await page.goto('http://127.0.0.1:5174/');await page.getByText('Cancelled Cards',{exact:true}).waitFor({timeout:15000}).catch(async e=>{console.log('Page:',await page.locator('body').innerText());throw e;});
fs.mkdirSync('tmp/ui-review',{recursive:true});
for(const theme of ['dark','light']){
 await page.evaluate(t=>document.documentElement.dataset.theme=t,theme);
 await page.screenshot({path:`tmp/ui-review/${theme}-mobile.png`,fullPage:true});
 const badge=page.getByText('Cancelled',{exact:true});
 console.log(theme,await badge.evaluate(e=>({color:getComputedStyle(e).color,background:getComputedStyle(e).backgroundColor,display:getComputedStyle(e).display})));
 if(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth))throw Error('Horizontal overflow');
}
await page.evaluate(()=>document.documentElement.dataset.theme='dark');await page.setViewportSize({width:1280,height:900});await page.screenshot({path:'tmp/ui-review/dark-desktop.png',fullPage:true});
await browser.close();
})().catch(e=>{console.error(e.message);process.exit(1)});
