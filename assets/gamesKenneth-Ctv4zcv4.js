import"./main-qZqwn-yL.js";/* empty css             *//* empty css              */class c{constructor(t){this.container=t,this.state=JSON.parse(localStorage.getItem("kenneth_state")||JSON.stringify({coins:50,level:1,pets:["squeaky"],activePet:"squeaky"})),this.accessibility=JSON.parse(localStorage.getItem("kenneth_a11y")||JSON.stringify({highContrast:!1,largeText:!1,reducedMotion:!1,colorblind:"none"})),this.pets=[{id:"squeaky",name:"Squeaky",type:"Mouse",ability:"Finds samples",unlocked:!0},{id:"whiskers",name:"Prof. Whiskers",type:"Cat",ability:"Sees in dark",cost:100},{id:"beaker",name:"Beaker",type:"Robot",ability:"Carries equipment",cost:250},{id:"hoot",name:"Dr. Hoot",type:"Owl",ability:"Magnifies tiny objects",cost:500}],this.applyA11y(),this.render()}save(){localStorage.setItem("kenneth_state",JSON.stringify(this.state))}saveA11y(){localStorage.setItem("kenneth_a11y",JSON.stringify(this.accessibility))}applyA11y(){document.body.classList.toggle("high-contrast",this.accessibility.highContrast),document.body.classList.toggle("large-text",this.accessibility.largeText),document.body.classList.toggle("reduced-motion",this.accessibility.reducedMotion),this.accessibility.colorblind!=="none"?document.body.dataset.colorblind=this.accessibility.colorblind:delete document.body.dataset.colorblind}render(){const t=this.pets.find(e=>e.id===this.state.activePet);this.container.innerHTML=`
      <div class="kenneth-game">
        <header class="kenneth-header">
          <div class="kenneth-info">
            <h2>Kenneth's Lab</h2>
            <span class="coins-display">${this.state.coins} coins</span>
          </div>
          <div class="active-pet-display">
            <span class="pet-avatar pet-${this.state.activePet}"></span>
            <span>${(t==null?void 0:t.name)||"None"}</span>
          </div>
        </header>
        <nav class="kenneth-menu">
          <button class="btn btn-primary" data-action="play">Play Level ${this.state.level}</button>
          <button class="btn btn-outline" data-action="pets">Pet Lab</button>
          <button class="btn btn-ghost" data-action="settings">Settings</button>
        </nav>
        <div class="kenneth-level-info">
          <p>Current Level: ${this.state.level}</p>
          <p class="text-secondary">Helper: ${t==null?void 0:t.name} - ${t==null?void 0:t.ability}</p>
        </div>
      </div>
    `,this.container.querySelectorAll("[data-action]").forEach(e=>{e.addEventListener("click",()=>this[e.dataset.action]())})}play(){this.container.innerHTML=`
      <div class="kenneth-play">
        <div class="game-header">
          <button class="btn btn-ghost" id="back">Back</button>
          <h2>Level ${this.state.level}</h2>
          <span class="coins-display">${this.state.coins} coins</span>
        </div>
        <div class="game-area">
          <div class="kenneth-sprite"></div>
          <div class="pet-sprite pet-${this.state.activePet}"></div>
          <div class="level-content">
            <p>Help Kenneth collect samples in the lab!</p>
            <div class="samples-grid">
              ${this.renderSamples()}
            </div>
          </div>
        </div>
        <div class="game-controls">
          <button class="btn btn-primary" id="collect-all">Collect All (+${this.state.level*10} coins)</button>
        </div>
      </div>
    `,document.getElementById("back").addEventListener("click",()=>this.render()),document.getElementById("collect-all").addEventListener("click",()=>{this.state.coins+=this.state.level*10,this.state.level++,this.save(),this.play()}),this.container.querySelectorAll(".sample").forEach(t=>{t.addEventListener("click",()=>{t.classList.add("collected"),this.state.coins+=5,this.save(),this.container.querySelector(".coins-display").textContent=`${this.state.coins} coins`})})}renderSamples(){const t=Math.min(this.state.level+2,8);let e="";for(let s=0;s<t;s++){const a=["cell","dna","protein","organoid"],n=a[s%a.length];e+=`<button class="sample sample-${n}" data-type="${n}"></button>`}return e}pets(){this.container.innerHTML=`
      <div class="kenneth-pets">
        <div class="game-header">
          <button class="btn btn-ghost" id="back">Back</button>
          <h2>Pet Lab</h2>
          <span class="coins-display">${this.state.coins} coins</span>
        </div>
        <div class="pets-grid">
          ${this.pets.map(t=>this.renderPetCard(t)).join("")}
        </div>
      </div>
    `,document.getElementById("back").addEventListener("click",()=>this.render()),this.container.querySelectorAll(".select-pet").forEach(t=>{t.addEventListener("click",()=>{this.state.activePet=t.dataset.pet,this.save(),this.pets()})}),this.container.querySelectorAll(".unlock-pet").forEach(t=>{t.addEventListener("click",()=>{const e=parseInt(t.dataset.cost);this.state.coins>=e&&(this.state.coins-=e,this.state.pets.push(t.dataset.pet),this.save(),this.pets())})})}renderPetCard(t){const e=this.state.pets.includes(t.id),s=this.state.activePet===t.id;return`
      <div class="pet-card ${e?"owned":""} ${s?"active":""}">
        <div class="pet-avatar pet-${t.id}"></div>
        <h3>${t.name}</h3>
        <p class="pet-type">${t.type}</p>
        <p class="pet-ability">${t.ability}</p>
        ${e?`<button class="btn ${s?"btn-primary":"btn-outline"} select-pet" data-pet="${t.id}">
               ${s?"Active":"Select"}
             </button>`:`<button class="btn btn-secondary unlock-pet" data-pet="${t.id}" data-cost="${t.cost}"
               ${this.state.coins<t.cost?"disabled":""}>
               Unlock (${t.cost})
             </button>`}
      </div>
    `}settings(){this.container.innerHTML=`
      <div class="kenneth-settings">
        <div class="game-header">
          <button class="btn btn-ghost" id="back">Back</button>
          <h2>Settings</h2>
        </div>
        <div class="settings-grid">
          <label class="setting-item">
            <input type="checkbox" id="contrast" ${this.accessibility.highContrast?"checked":""}>
            <span>High Contrast</span>
          </label>
          <label class="setting-item">
            <input type="checkbox" id="largetext" ${this.accessibility.largeText?"checked":""}>
            <span>Large Text</span>
          </label>
          <label class="setting-item">
            <input type="checkbox" id="motion" ${this.accessibility.reducedMotion?"checked":""}>
            <span>Reduced Motion</span>
          </label>
          <label class="setting-item">
            <span>Color Mode:</span>
            <select id="colorblind">
              <option value="none" ${this.accessibility.colorblind==="none"?"selected":""}>Standard</option>
              <option value="protanopia" ${this.accessibility.colorblind==="protanopia"?"selected":""}>Protanopia</option>
              <option value="deuteranopia" ${this.accessibility.colorblind==="deuteranopia"?"selected":""}>Deuteranopia</option>
              <option value="tritanopia" ${this.accessibility.colorblind==="tritanopia"?"selected":""}>Tritanopia</option>
            </select>
          </label>
        </div>
        <button class="btn btn-primary" id="save-settings">Save Settings</button>
      </div>
    `,document.getElementById("back").addEventListener("click",()=>this.render()),document.getElementById("save-settings").addEventListener("click",()=>{this.accessibility={highContrast:document.getElementById("contrast").checked,largeText:document.getElementById("largetext").checked,reducedMotion:document.getElementById("motion").checked,colorblind:document.getElementById("colorblind").value},this.saveA11y(),this.applyA11y(),this.render()})}}document.addEventListener("DOMContentLoaded",()=>{const i=document.getElementById("kenneth-game-container");if(i){i.innerHTML="";const t=new c(i);window.kennethGame=t}});
// v20260117-FULL
