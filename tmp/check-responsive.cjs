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

fs.mkdirSync('tmp/responsive-review',{recursive:true});
for(const width of [320,390,899,900,1366,1920]) {
 await page.setViewportSize({width,height:900});
 for(const path of ['/profile/scan','/']) {
  await page.goto('http://127.0.0.1:5174'+path);
  await page.getByText(path==='/'?'Cancelled Cards':'Scan Feedback',{exact:true}).waitFor();
  if(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth))throw Error('Overflow at '+width+' '+path);
  const main=await page.locator('main').boundingBox();
  if(width>=900 && Math.abs(main.x+main.width-width)>1)throw Error('Desktop content does not fill available width');
  if(width<900 && main.width>560)throw Error('Mobile content width changed');
  if([390,1366,1920].includes(width))await page.screenshot({path:'tmp/responsive-review/'+(path==='/'?'dashboard':'preferences')+'-'+width+'.png',fullPage:true});
 }
}
console.log('Responsive checks passed at 320, 390, 899, 900, 1366 and 1920 pixels. No horizontal overflow; desktop uses full available width.');
await browser.close();
})().catch(e=>{console.error(e.message);process.exit(1)});
