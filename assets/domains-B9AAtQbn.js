import"./main-qZqwn-yL.js";/* empty css             *//* empty css                 */const g={"patient-simulation":{icon:"🧬",label:"DNA"},"organ-on-chip":{icon:"🩺",label:"Chip"},organoids:{icon:"🦫",label:"Organoid"},"ai-computational":{icon:"🤖",label:"AI"},"cell-gene-therapy":{icon:"🧬",label:"Gene"},immunology:{icon:"🩸",label:"Blood"},"rna-therapeutics":{icon:"🔬",label:"RNA"},"liquid-biopsy":{icon:"🧪",label:"Biopsy"},metabolic:{icon:"⚗️",label:"Metabolic"},neurotech:{icon:"🧠",label:"Brain"},"emerging-tech":{icon:"🚀",label:"Emerging"},robotics:{icon:"🤖",label:"Robot"},specialty:{icon:"⭐",label:"Specialty"},"fragrance-botanical":{icon:"🌹",label:"Rose"},"arabic-idn":{icon:"🌙",label:"Crescent"},"chinese-idn":{icon:"🐉",label:"Dragon"}};document.addEventListener("DOMContentLoaded",async()=>{b(),x();try{const e=["/data/domains.json","/src/data/domains.json"];let o=null;for(const t of e)try{const n=await fetch(t);if(n.ok){o=await n.json();break}}catch{continue}if(!o)throw new Error("Could not load domains");f(o),w(),k()}catch(e){console.error("Failed to load domain portfolio:",e),document.getElementById("domain-categories").innerHTML=`
      <div class="loading-error">
        <p class="text-secondary">Portfolio data temporarily unavailable</p>
        <button onclick="location.reload()" class="retry-btn">Retry</button>
      </div>
    `}});function b(){const e=document.createElement("div");e.id="domainInquiryModal",e.className="domain-inquiry-modal",e.innerHTML=`
    <div class="modal-overlay" onclick="closeInquiryModal()"></div>
    <div class="modal-content">
      <button class="modal-close" onclick="closeInquiryModal()" aria-label="Close">&times;</button>
      <div class="modal-header">
        <div class="modal-icon">&#x1F4E7;</div>
        <h3>Premium Domain Inquiry</h3>
        <p id="modalDomainName" class="modal-domain"></p>
      </div>
      <p class="modal-description">Request information about this premium biotech domain for your organization.</p>
      <form id="domainInquiryForm" action="https://api.web3forms.com/submit" method="POST">
        <input type="hidden" name="access_key" value="eefefa49-2e87-4a1d-9897-25d4b2d7d4d5">
        <input type="hidden" name="subject" id="formSubject" value="Domain Inquiry - Patient Analog">
        <input type="hidden" name="redirect" value="https://patientanalog.com/thank-you.html">
        <input type="hidden" name="from_name" value="Domain Portfolio Inquiry">
        <input type="hidden" name="domain_term" id="hiddenDomain" value="">

        <div class="form-group">
          <label>Domain</label>
          <input type="text" name="terminology" id="displayDomain" class="form-input" readonly>
        </div>
        <div class="form-group">
          <label>Your Name</label>
          <input type="text" name="name" class="form-input" placeholder="Full Name" required>
        </div>
        <div class="form-group">
          <label>Organization</label>
          <input type="text" name="organization" class="form-input" placeholder="Company or Institution">
        </div>
        <div class="form-group">
          <label>Email</label>
          <input type="email" name="email" class="form-input" placeholder="your.email@company.com" required>
        </div>
        <div class="form-group">
          <label>Inquiry Type</label>
          <select name="inquiry_type" class="form-input" required>
            <option value="">Select type...</option>
            <option value="Purchase Interest">Purchase Interest</option>
            <option value="Lease Discussion">Lease Discussion</option>
            <option value="Partnership">Partnership</option>
            <option value="General Information">General Information</option>
          </select>
        </div>
        <div class="form-group">
          <label>Message</label>
          <textarea name="message" class="form-textarea" placeholder="Tell us about your interest in this domain..." rows="4" required></textarea>
        </div>
        <button type="submit" class="form-submit">
          <span>Send Inquiry</span>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/>
          </svg>
        </button>
      </form>
    </div>
  `,document.body.appendChild(e);const o=document.createElement("style");o.textContent=`
    .domain-inquiry-modal {
      display: none;
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      z-index: 10000;
      justify-content: center;
      align-items: center;
    }
    .domain-inquiry-modal.active {
      display: flex;
      animation: modalFadeIn 0.3s ease;
    }
    @keyframes modalFadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }
    .modal-overlay {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 8, 24, 0.92);
      backdrop-filter: blur(12px);
      -webkit-backdrop-filter: blur(12px);
    }
    .modal-content {
      position: relative;
      background: linear-gradient(135deg, rgba(0, 21, 64, 0.98) 0%, rgba(0, 32, 96, 0.95) 100%);
      border: 1px solid rgba(14, 165, 233, 0.4);
      border-radius: 24px;
      padding: 45px;
      max-width: 520px;
      width: 90%;
      max-height: 90vh;
      overflow-y: auto;
      box-shadow:
        0 30px 100px rgba(0, 0, 0, 0.7),
        0 0 80px rgba(14, 165, 233, 0.15),
        inset 0 0 60px rgba(14, 165, 233, 0.03);
      animation: modalSlideIn 0.4s cubic-bezier(0.4, 0, 0.2, 1);
    }
    @keyframes modalSlideIn {
      from {
        opacity: 0;
        transform: translateY(30px) scale(0.95);
      }
      to {
        opacity: 1;
        transform: translateY(0) scale(1);
      }
    }
    .modal-content::before {
      content: '';
      position: absolute;
      inset: 0;
      border-radius: 24px;
      padding: 1px;
      background: linear-gradient(135deg,
        rgba(14, 165, 233, 0.5) 0%,
        rgba(0, 221, 119, 0.3) 50%,
        rgba(255, 204, 0, 0.2) 100%
      );
      -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
      -webkit-mask-composite: xor;
      mask-composite: exclude;
      pointer-events: none;
    }
    .modal-close {
      position: absolute;
      top: 20px;
      right: 25px;
      background: none;
      border: none;
      color: rgba(148, 163, 184, 0.7);
      font-size: 32px;
      cursor: pointer;
      transition: all 0.3s;
      width: 40px;
      height: 40px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 50%;
    }
    .modal-close:hover {
      color: #ffffff;
      background: rgba(14, 165, 233, 0.2);
    }
    .modal-header {
      text-align: center;
      margin-bottom: 25px;
    }
    .modal-icon {
      font-size: 3rem;
      margin-bottom: 15px;
    }
    .modal-header h3 {
      font-family: 'Sora', sans-serif;
      font-size: 1.6rem;
      font-weight: 600;
      color: #fff;
      margin: 0 0 12px 0;
      text-shadow: 0 0 20px rgba(14, 165, 233, 0.4);
    }
    .modal-domain {
      font-family: 'JetBrains Mono', monospace;
      font-size: 1.2rem;
      color: #0ea5e9;
      font-weight: 600;
      padding: 10px 20px;
      background: rgba(14, 165, 233, 0.1);
      border: 1px solid rgba(14, 165, 233, 0.3);
      border-radius: 8px;
      display: inline-block;
    }
    .modal-description {
      color: rgba(148, 163, 184, 0.9);
      font-size: 0.95rem;
      margin-bottom: 30px;
      line-height: 1.7;
      text-align: center;
    }
    .modal-content .form-group {
      margin-bottom: 20px;
    }
    .modal-content label {
      display: block;
      color: rgba(224, 242, 254, 0.9);
      font-family: 'Sora', sans-serif;
      font-size: 0.85rem;
      font-weight: 500;
      margin-bottom: 8px;
    }
    .modal-content .form-input,
    .modal-content .form-textarea {
      width: 100%;
      padding: 14px 18px;
      border: 1px solid rgba(14, 165, 233, 0.25);
      border-radius: 12px;
      background: rgba(0, 16, 48, 0.8);
      color: #fff;
      font-family: 'Inter', sans-serif;
      font-size: 1rem;
      transition: all 0.3s;
      box-sizing: border-box;
    }
    .modal-content .form-input:focus,
    .modal-content .form-textarea:focus {
      outline: none;
      border-color: #0ea5e9;
      box-shadow: 0 0 0 3px rgba(14, 165, 233, 0.15), 0 0 25px rgba(14, 165, 233, 0.2);
      background: rgba(0, 21, 64, 0.9);
    }
    .modal-content .form-input::placeholder,
    .modal-content .form-textarea::placeholder {
      color: rgba(148, 163, 184, 0.5);
    }
    .modal-content .form-input[readonly] {
      background: rgba(14, 165, 233, 0.1);
      color: #38bdf8;
      font-weight: 500;
      cursor: default;
    }
    .modal-content select.form-input {
      cursor: pointer;
      appearance: none;
      background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' fill='%2394a3b8' viewBox='0 0 16 16'%3E%3Cpath d='M8 11L3 6h10l-5 5z'/%3E%3C/svg%3E");
      background-repeat: no-repeat;
      background-position: right 15px center;
    }
    .modal-content .form-submit {
      width: 100%;
      padding: 16px 32px;
      background: linear-gradient(135deg, #0284c7 0%, #0ea5e9 100%);
      border: none;
      border-radius: 12px;
      color: #fff;
      font-family: 'Sora', sans-serif;
      font-size: 1rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
      margin-top: 15px;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 10px;
      text-transform: uppercase;
      letter-spacing: 1px;
      box-shadow: 0 4px 20px rgba(14, 165, 233, 0.3);
    }
    .modal-content .form-submit:hover {
      background: linear-gradient(135deg, #0ea5e9 0%, #38bdf8 100%);
      box-shadow: 0 8px 35px rgba(14, 165, 233, 0.4);
      transform: translateY(-3px);
    }

    /* Additional dynamic styles */
    .ripple {
      position: absolute;
      border-radius: 50%;
      background: rgba(14, 165, 233, 0.3);
      transform: scale(0);
      animation: ripple-animation 0.6s ease-out;
      pointer-events: none;
    }
    @keyframes ripple-animation {
      to {
        transform: scale(4);
        opacity: 0;
      }
    }
    .form-input.highlight {
      animation: input-highlight 2s ease-out;
    }
    @keyframes input-highlight {
      0% { box-shadow: 0 0 0 3px rgba(14, 165, 233, 0.5); }
      100% { box-shadow: none; }
    }
    .loading-error {
      text-align: center;
      padding: 80px;
    }
    .retry-btn {
      margin-top: 25px;
      padding: 14px 35px;
      background: linear-gradient(135deg, #0284c7, #0ea5e9);
      border: none;
      border-radius: 10px;
      color: #ffffff;
      font-family: 'Sora', sans-serif;
      font-size: 0.95rem;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.3s ease;
    }
    .retry-btn:hover {
      transform: translateY(-3px);
      box-shadow: 0 8px 25px rgba(14, 165, 233, 0.35);
    }
    .domain-category.revealed,
    .domain-item.revealed {
      opacity: 1 !important;
      transform: translateY(0) !important;
    }
  `,document.head.appendChild(o)}function c(e,o){const t=document.getElementById("domainInquiryModal");document.getElementById("modalDomainName").textContent=e,document.getElementById("displayDomain").value=e,document.getElementById("hiddenDomain").value=e,document.getElementById("formSubject").value=`Domain Inquiry: ${e} - Patient Analog`,t.classList.add("active"),document.body.style.overflow="hidden"}function m(){document.getElementById("domainInquiryModal").classList.remove("active"),document.body.style.overflow=""}document.addEventListener("keydown",e=>{e.key==="Escape"&&m()});function f(e){const o=document.getElementById("domain-categories");if(!o)return;const t=e.categories||[];o.innerHTML=t.map((n,a)=>{const l=g[n.id]||{icon:"💻",label:"Domain"},r=n.domains.length;return`
      <div class="domain-category" data-category="${i(n.id)}" style="animation-delay: ${a*.05}s">
        <div class="category-header">
          <div class="category-icon" aria-label="${l.label}">${l.icon}</div>
          <h3 class="category-title">${i(n.name)}</h3>
          <span class="category-count">${r} domain${r!==1?"s":""}</span>
        </div>
        <p class="category-description">${i(n.description)}</p>
        <div class="domain-list">
          ${n.domains.map((s,d)=>h(s,d)).join("")}
        </div>
      </div>
    `}).join("")}function h(e,o){const t=e.tier||"standard",n=Math.min(o*.03,.5);return`
    <div class="domain-item tier-${t}"
         style="animation-delay: ${n}s"
         tabindex="0"
         role="button"
         aria-label="${i(e.domain)} - ${i(e.label)} - ${t} tier"
         onclick="openInquiryModal('${i(e.domain)}', '${i(e.label)}')"
         onkeypress="handleDomainKeypress(event, '${i(e.domain)}', '${i(e.label)}')">
      <span class="domain-name">${i(e.domain)}</span>
      <span class="domain-label">${i(e.label)}</span>
      <span class="domain-tier">${t}</span>
    </div>
  `}function y(e,o,t){(e.key==="Enter"||e.key===" ")&&(e.preventDefault(),c(o))}function x(){const e=document.querySelectorAll(".stat-value"),o={threshold:.5,rootMargin:"0px"},t=new IntersectionObserver(n=>{n.forEach(a=>{a.isIntersecting&&(v(a.target),t.unobserve(a.target))})},o);e.forEach(n=>{t.observe(n)})}function v(e){const o=parseInt(e.textContent.replace(/[^\d]/g,""),10);if(isNaN(o))return;const t=2e3,n=performance.now(),a=r=>1-Math.pow(1-r,4);function l(r){const s=r-n,d=Math.min(s/t,1),p=a(d),u=Math.round(o*p);e.textContent=u,d<1?requestAnimationFrame(l):e.textContent=o}requestAnimationFrame(l)}function w(){const e=document.querySelectorAll(".domain-category"),o={threshold:.1,rootMargin:"0px 0px -50px 0px"},t=new IntersectionObserver(n=>{n.forEach(a=>{a.isIntersecting&&(a.target.classList.add("revealed"),a.target.querySelectorAll(".domain-item").forEach((r,s)=>{setTimeout(()=>{r.classList.add("revealed")},s*30)}))})},o);e.forEach(n=>{t.observe(n)})}function k(){document.addEventListener("click",function(e){const o=e.target.closest(".domain-item");if(!o)return;const t=document.createElement("span");t.className="ripple";const n=o.getBoundingClientRect(),a=Math.max(n.width,n.height);t.style.width=t.style.height=a+"px",t.style.left=e.clientX-n.left-a/2+"px",t.style.top=e.clientY-n.top-a/2+"px",o.appendChild(t),setTimeout(()=>t.remove(),600)}),document.addEventListener("mousemove",function(e){const o=e.target.closest(".domain-item");if(!o)return;const t=o.getBoundingClientRect(),n=e.clientX-t.left,a=e.clientY-t.top,l=t.width/2,r=t.height/2,s=(a-r)/25,d=(l-n)/25;o.style.transform=`translateY(-4px) scale(1.01) perspective(1000px) rotateX(${s}deg) rotateY(${d}deg)`}),document.addEventListener("mouseleave",function(e){e.target.classList&&e.target.classList.contains("domain-item")&&(e.target.style.transform="")},!0)}function i(e){const o=document.createElement("div");return o.textContent=e||"",o.innerHTML}window.openInquiryModal=c;window.closeInquiryModal=m;window.handleDomainKeypress=y;
// v20260117-FULL
