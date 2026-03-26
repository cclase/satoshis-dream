// Node.js test runner for Satoshi's Town game logic
global.window = global;
global.localStorage = {_d:{},getItem:function(k){return this._d[k]||null;},setItem:function(k,v){this._d[k]=v;},removeItem:function(k){delete this._d[k];}};
global.requestAnimationFrame = function(){};
global.setInterval = function(){};
global.setTimeout = global.setTimeout;
global.UI = {keys:{up:false,down:false,left:false,right:false},panelOpen:false,modalActive:function(){return false;},toast:function(){},updateHUD:function(){},updateOpenPanel:function(){}};
function mockEl(){return{classList:{contains:()=>false,add:()=>{},remove:()=>{}},addEventListener:()=>{},querySelectorAll:()=>({forEach:()=>{}}),innerHTML:"",style:{},textContent:"",appendChild:()=>{},getBoundingClientRect:()=>({left:0,top:0}),getContext:()=>({fillRect:()=>{},clearRect:()=>{},beginPath:()=>{},moveTo:()=>{},lineTo:()=>{},stroke:()=>{},fill:()=>{},arc:()=>{},ellipse:()=>{},fillText:()=>{},measureText:()=>({width:50}),setLineDash:()=>{},quadraticCurveTo:()=>{},closePath:()=>{},save:()=>{},restore:()=>{},translate:()=>{},setTransform:()=>{}}),clientWidth:800,clientHeight:600,focus:()=>{},blur:()=>{},closest:()=>null,dataset:{}};}
global.document = {addEventListener:()=>{},activeElement:null,getElementById:()=>mockEl(),createElement:()=>mockEl(),querySelectorAll:()=>({forEach:()=>{}}),readyState:"loading",body:{appendChild:()=>{}}};
window.addEventListener = ()=>{};
window.devicePixelRatio = 1;

eval(require("fs").readFileSync("game.js","utf8"));
eval(require("fs").readFileSync("town.js","utf8"));
Game.init();
Town.init(mockEl());
Game.state.avatar = {name:"Test",sprite:"X",bonus:"quickhands",x:500,y:500};

var pass=0,fail=0;
function test(n,fn){try{fn();console.log("PASS:",n);pass++;}catch(e){console.log("FAIL:",n,"-",e.message);fail++;}}
function assert(c,m){if(!c)throw new Error(m||"fail");}

test("Tap mine quickhands", ()=>{
  Game.state.sats=0;Game.state.tokens=0;Game.state.pet=null;
  var g=Game.tapMine();
  assert(g===6,"Expected 6 got "+g);
});

test("Buy laptop costs 15", ()=>{
  Game.state.sats=100;Game.state.owned.u1=0;Game.state.housing="studio";
  assert(Game.getBulkCost(Game.HARDWARE[0],1)===15);
  assert(Game.buyItem(Game.HARDWARE[0],1));
  assert(Game.state.sats===85);
  assert(Game.state.owned.u1===1);
});

test("Cannot buy without sats", ()=>{
  Game.state.sats=5;
  assert(!Game.buyItem(Game.HARDWARE[0],1));
});

test("Slot limit blocks purchase", ()=>{
  Game.state.sats=1000000;Game.state.owned={u1:0,u2:0,u3:0,u4:0,u5:0,u6:0,d1:0,d2:0,d3:0};
  Game.state.housing="studio";
  Game.buyItem(Game.HARDWARE[0],1);Game.buyItem(Game.HARDWARE[0],1);Game.buyItem(Game.HARDWARE[0],1);
  assert(!Game.buyItem(Game.HARDWARE[0],1),"4th should fail");
  assert(Game.state.owned.u1===3);
});

test("Housing slots", ()=>{
  Game.state.housing="apartment";assert(Game.getMaxSlots()===8);
  Game.state.housing="solar";assert(Game.getMaxSlots()===200);
  Game.state.housing="studio";
});

test("Production rate", ()=>{
  Game.state.owned={u1:2,u2:0,u3:0,u4:0,u5:0,u6:0,d1:0,d2:0,d3:0};
  assert(Game.getProductionRate()===2);
});

test("Multiplier with tokens", ()=>{
  Game.state.tokens=5;Game.state.heat=0;Game.state.energy=100;Game.state.research={};Game.state.pet=null;
  var m=Game.getMultiplier();
  assert(Math.abs(m-1.5)<0.01,"Got "+m);
});

test("Heat penalty >90", ()=>{
  Game.state.heat=95;assert(Game.getMultiplier()<0.2);Game.state.heat=0;
});

test("Energy=0 penalty", ()=>{
  Game.state.energy=0;Game.state.tokens=0;
  assert(Game.getMultiplier()<0.1);Game.state.energy=100;
});

test("Sell sats", ()=>{
  Game.state.sats=100000000;Game.state.usd=0;Game.state.price=65000;
  Game.state.priceEvent=null;Game.state.research={};Game.state.pet=null;
  Game.sellSats(0.5);
  assert(Game.state.sats===50000000);
  assert(Game.state.usd>30000,"Got "+Game.state.usd);
});

test("Price event bull", ()=>{
  Game.state.price=65000;
  Game.state.priceEvent={type:"bull",mult:1.3,endsAt:Date.now()+60000,magnitude:30};
  assert(Game.getEffectivePrice()>80000);
  Game.state.priceEvent=null;
});

test("Loan take/repay", ()=>{
  Game.state.usd=0;Game.state.loans=[];
  assert(Game.takeLoan("small"));
  assert(Game.state.usd===100);
  assert(!Game.takeLoan("medium"));
  Game.state.usd=200;assert(Game.repayLoan());
  assert(Game.state.loans.length===0);
});

test("Mail order", ()=>{
  Game.state.sats=100000;Game.state.mailOrders=[];
  assert(Game.orderItem(Game.HARDWARE[0]));
  assert(Game.state.mailOrders.length===1);
});

test("Casino coin flip", ()=>{
  Game.state.sats=1000;
  var r=Game.coinFlip(100);
  assert(r!==null);assert(r===100||r===-100);
});

test("Casino invalid bet", ()=>{
  Game.state.sats=50;
  assert(Game.coinFlip(100)===null);
  assert(Game.coinFlip(0)===null);
});

test("Slots", ()=>{
  Game.state.sats=1000;
  var r=Game.slotMachine(100);assert(r!==null);
});

test("Vehicle speed", ()=>{
  Game.state.vehicle=null;assert(Game.getSpeedMultiplier()===1.0);
  Game.state.vehicle="car";assert(Game.getSpeedMultiplier()===2.0);
  Game.state.vehicle=null;
});

test("Research overclock+quantum", ()=>{
  Game.state.research={overclock:true};Game.state.tokens=0;Game.state.heat=0;Game.state.energy=100;Game.state.pet=null;
  assert(Math.abs(Game.getMultiplier()-1.25)<0.01);
  Game.state.research={overclock:true,quantum:true};
  assert(Math.abs(Game.getMultiplier()-2.5)<0.01);
  Game.state.research={};
});

test("Pet hamster tap", ()=>{
  Game.state.sats=0;Game.state.pet="hamster";Game.state.tokens=0;
  var g=Game.tapMine();
  assert(g===16,"1+5+10=16, got "+g);
  Game.state.pet=null;
});

test("Solar farm free elec", ()=>{
  Game.state.housing="solar";assert(Game.getElectricityCost()===0);
  Game.state.housing="studio";
});

test("Movement left", ()=>{
  Game.state.avatar.x=500;Game.state.avatar.y=500;Game.state.vehicle=null;
  Town.updateAvatar(0.1,{up:false,down:false,left:true,right:false});
  assert(Game.state.avatar.x<500);
});

test("Click-to-move", ()=>{
  Game.state.avatar.x=500;Game.state.avatar.y=500;
  Town.moveTarget={x:600,y:500};
  Town.updateAvatar(0.1,{up:false,down:false,left:false,right:false});
  assert(Game.state.avatar.x>500);
});

test("Collision", ()=>{
  assert(Town.collidesBuilding(200,200));
  assert(!Town.collidesBuilding(500,500));
});

test("Gym energy max", ()=>{
  Game.state.gymLevel=0;assert(Game.getEnergyMax()===100);
  Game.state.gymLevel=3;assert(Game.getEnergyMax()===160);
  Game.state.gymLevel=0;
});

test("100 ticks no crash", ()=>{
  Game.state.sats=1000;Game.state.usd=100;Game.state.energy=50;
  Game.state.owned={u1:2,u2:0,u3:0,u4:0,u5:0,u6:0,d1:0,d2:0,d3:0};
  Game.state.loans=[{id:"small",amount:100,owed:105,takenAt:Date.now()}];
  Game.state.pet="snake";Game.state.mailOrders=[];Game.state.policeRisk=10;
  for(var i=0;i<100;i++)Game.tick(0.1);
  assert(Game.state.sats>1000);
});

test("formatNumber", ()=>{
  assert(Game.formatNumber(500)==="500");
  assert(Game.formatNumber(1500)==="1.5K");
  assert(Game.formatNumber(1500000)==="1.5M");
});

console.log("\n=== " + pass + " passed, " + fail + " failed ===");
if(fail>0) process.exit(1);
