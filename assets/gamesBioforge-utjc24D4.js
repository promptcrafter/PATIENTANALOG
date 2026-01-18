import"./main-qZqwn-yL.js";/* empty css             *//* empty css              */class i{constructor(e){this.container=e,this.progress=JSON.parse(localStorage.getItem("bioforge_progress")||"{}"),this.labs=[{id:"crispr",name:"CRISPR Gene Editing",unlocked:!0,description:"Design guide RNAs to target specific gene sequences"},{id:"protein",name:"Protein Folding",unlocked:!0,description:"Explore how amino acids fold into functional 3D structures"},{id:"drug",name:"Drug Discovery",unlocked:!1,unlocksAfter:"crispr",description:"Screen compounds against disease targets"},{id:"cart",name:"CAR-T Engineering",unlocked:!1,unlocksAfter:"protein",description:"Engineer T-cells to fight cancer"},{id:"stem",name:"Stem Cell Differentiation",unlocked:!1,unlocksAfter:"drug",description:"Guide stem cells to become specialized cells"},{id:"epidemic",name:"Epidemic Response",unlocked:!1,unlocksAfter:"cart",description:"Model disease spread and interventions"}],this.currentLab=null,this.init()}init(){this.updateUnlocks(),this.render()}updateUnlocks(){this.labs.forEach(e=>{var t;e.unlocksAfter&&((t=this.progress[e.unlocksAfter])!=null&&t.completed)&&(e.unlocked=!0)})}save(){localStorage.setItem("bioforge_progress",JSON.stringify(this.progress))}render(){this.container.innerHTML=`
      <div class="bioforge">
        <div class="bioforge-header">
          <h2>Select a Lab</h2>
          <p>Complete labs to unlock new research areas</p>
        </div>
        <div class="lab-grid">
          ${this.labs.map(e=>this.renderLabCard(e)).join("")}
        </div>
      </div>
    `,this.container.querySelectorAll(".lab-card:not(.locked)").forEach(e=>{e.addEventListener("click",()=>this.startLab(e.dataset.lab))})}renderLabCard(e){var a;const t=(a=this.progress[e.id])==null?void 0:a.completed,s=!e.unlocked;return`
      <button class="lab-card ${s?"locked":""} ${t?"completed":""}"
              data-lab="${e.id}"
              ${s?"disabled":""}>
        <span class="lab-status">${s?"Locked":t?"Complete":"Available"}</span>
        <span class="lab-name">${e.name}</span>
        <span class="lab-description">${e.description}</span>
      </button>
    `}startLab(e){this.currentLab=this.labs.find(t=>t.id===e),this.currentLab&&(this.container.innerHTML=`
      <div class="lab-active">
        <div class="lab-header">
          <button class="btn btn-ghost" id="back-btn">Back to Labs</button>
          <h2>${this.currentLab.name}</h2>
        </div>
        <div class="lab-game" id="game-area">
          ${this.renderLabGame(e)}
        </div>
        <div class="lab-controls">
          <button class="btn btn-primary" id="complete-btn">Complete Lab</button>
        </div>
      </div>
    `,document.getElementById("back-btn").addEventListener("click",()=>this.render()),document.getElementById("complete-btn").addEventListener("click",()=>this.completeLab(e)),this.initLabGame(e))}renderLabGame(e){switch(e){case"crispr":return this.renderCRISPRGame();case"protein":return this.renderProteinGame();default:return`
          <div class="lab-placeholder">
            <h3>${this.currentLab.name}</h3>
            <p>${this.currentLab.description}</p>
            <p class="text-secondary">Interactive simulation loading...</p>
          </div>
        `}}renderCRISPRGame(){return`
      <div class="crispr-game">
        <h3>CRISPR Target Selection</h3>
        <p>Click on the DNA sequence to select your target site:</p>
        <div class="dna-sequence" id="dna-display">
          <div class="dna-strand top">ATCGATCGATCGATCG</div>
          <div class="dna-strand bottom">TAGCTAGCTAGCTAGC</div>
        </div>
        <div class="guide-rna" id="guide-display">
          <p>Guide RNA: <span id="guide-sequence">-</span></p>
        </div>
      </div>
    `}renderProteinGame(){return`
      <div class="protein-game">
        <h3>Protein Folding</h3>
        <p>Drag amino acids to form the correct structure:</p>
        <div class="amino-acids" id="amino-display">
          <span class="amino" data-type="hydrophobic">Ala</span>
          <span class="amino" data-type="polar">Ser</span>
          <span class="amino" data-type="charged">Lys</span>
          <span class="amino" data-type="hydrophobic">Val</span>
        </div>
        <div class="folding-area" id="fold-area">
          <p class="text-secondary">Drop amino acids here to fold</p>
        </div>
      </div>
    `}initLabGame(e){const t=document.getElementById("game-area");if(!t)return;t.querySelectorAll(".amino").forEach(a=>{a.draggable=!0,a.addEventListener("dragstart",r=>{r.dataTransfer.setData("text/plain",r.target.textContent)})});const s=document.getElementById("fold-area");s&&(s.addEventListener("dragover",a=>a.preventDefault()),s.addEventListener("drop",a=>{a.preventDefault();const r=a.dataTransfer.getData("text/plain");s.innerHTML+=`<span class="amino dropped">${r}</span>`}))}completeLab(e){this.progress[e]={completed:!0,timestamp:Date.now()},this.save(),this.updateUnlocks(),this.render()}}document.addEventListener("DOMContentLoaded",()=>{const n=document.getElementById("bioforge-game-container");if(n){n.innerHTML="";const e=new i(n);window.bioforgeGame=e}o()});function o(){const n=document.getElementById("progress-tracker");if(!n)return;const e=JSON.parse(localStorage.getItem("bioforge_progress")||"{}"),t=["crispr","protein","drug","cart","stem","epidemic"],s=t.filter(a=>{var r;return(r=e[a])==null?void 0:r.completed}).length;n.innerHTML=`
    <div class="progress-bar">
      <div class="progress-fill" style="width: ${s/t.length*100}%"></div>
    </div>
    <p class="text-secondary">${s} of ${t.length} labs completed</p>
  `}
// v20260117-FULL
