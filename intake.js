(() => {
  const SERVICE_MAP = {
    website: {name:'Website Development', next:'website-project-brief.html'},
    intelligence: {name:'Custom Social Intelligence', next:'intelligence-request.html'},
    'digital-identity': {name:'Launch Your Digital Identity', next:'digital-identity-brief.html'}
  };
  const qs = new URLSearchParams(location.search);

  const consentPage = document.querySelector('[data-consent-page]');
  if (consentPage) {
    const service = qs.get('service') || 'website';
    const cfg = SERVICE_MAP[service] || SERVICE_MAP.website;
    const plan = qs.get('plan') || '';
    const requestedNext = qs.get('next') || cfg.next;
    const allowedNext = ['website-project-brief.html','intelligence-request.html','digital-identity-brief.html'];
    const next = allowedNext.includes(requestedNext) ? requestedNext : cfg.next;
    const label = document.getElementById('consentServiceName');
    const intro = document.getElementById('consentServiceIntro');
    if (label) label.textContent = plan ? `${cfg.name} • ${plan === 'advanced' ? 'Advanced / Custom' : 'Standard'}` : cfg.name;
    if (intro) intro.textContent = `Review the key terms for ${cfg.name} before opening the project brief.`;
    const checks = ['consentLimitations','consentPrivacy','consentTerms'].map(id=>document.getElementById(id));
    const continueBtn = document.getElementById('consentContinue');
    const update = () => { if (continueBtn) continueBtn.disabled = !checks.every(c=>c && c.checked); };
    checks.forEach(c=>c && c.addEventListener('change', update));
    continueBtn && continueBtn.addEventListener('click', () => {
      if (!checks.every(c=>c && c.checked)) return;
      sessionStorage.setItem(`maximpress_consent_${service}`, new Date().toISOString());
      if (plan) sessionStorage.setItem('maximpress_website_plan', plan);
      location.href = next + (plan ? `?plan=${encodeURIComponent(plan)}` : '');
    });
  }

  const intakePage = document.querySelector('[data-intake-page]');
  if (!intakePage) return;
  const service = intakePage.dataset.service;
  if (!sessionStorage.getItem(`maximpress_consent_${service}`)) {
    const cfg = SERVICE_MAP[service] || SERVICE_MAP.website;
    location.replace(`service-terms.html?service=${encodeURIComponent(service)}&next=${encodeURIComponent(cfg.next)}`);
    return;
  }

  const planInput = document.getElementById('websitePlan');
  if (planInput) {
    const plan = qs.get('plan') || sessionStorage.getItem('maximpress_website_plan') || 'standard';
    planInput.value = plan === 'advanced' ? 'Advanced / Custom Website Development' : 'Standard Website Development';
  }

  const form = intakePage.querySelector('.intake-form');
  if (!form) return;

  const valueGroups = (fd) => {
    const out = [];
    const handled = new Set();
    for (const el of form.elements) {
      if (!el.name || handled.has(el.name) || ['submit','button'].includes(el.type)) continue;
      handled.add(el.name);
      if (el.type === 'checkbox') {
        const vals = [...form.querySelectorAll(`input[type="checkbox"][name="${CSS.escape(el.name)}"]`)].filter(x=>x.checked).map(x=>x.value);
        out.push([el.name, vals.length ? vals.join(', ') : 'Not selected']);
      } else if (el.type === 'radio') {
        const picked = form.querySelector(`input[type="radio"][name="${CSS.escape(el.name)}"]:checked`);
        out.push([el.name, picked ? picked.value : 'Not selected']);
      } else {
        out.push([el.name, (fd.get(el.name) || '').toString().trim() || 'Not provided']);
      }
    }
    return out;
  };

  const makeReport = () => {
    const fd = new FormData(form);
    const title = form.dataset.serviceTitle || 'MaxImpress Service Request';
    const rows = valueGroups(fd);
    const lines = [
      'MAXIMPRESS SERVICE REQUEST',
      '==========================',
      `Service: ${title}`,
      `Submitted: ${new Date().toLocaleString()}`,
      '',
      ...rows.flatMap(([k,v]) => [`${k}:`, v, '']),
      'CLIENT ACKNOWLEDGEMENT:',
      'The client completed the MaxImpress service acknowledgement before opening this form, including service limitations, privacy notice, and Terms & Conditions.',
      '',
      'NOTE:',
      'This request is a project brief. Final scope, timing, cost, feasibility and any third-party requirements are confirmed after review.'
    ];
    return lines.join('\n');
  };

  const downloadReport = (report) => {
    const blob = new Blob([report], {type:'text/plain;charset=utf-8'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const slug = (form.dataset.serviceTitle || 'MaxImpress Request').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/(^-|-$)/g,'');
    a.href = url; a.download = `maximpress-${slug}-request.txt`;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(()=>URL.revokeObjectURL(url), 1000);
  };

  const copyReport = async (report) => {
    try { await navigator.clipboard.writeText(report); return true; }
    catch (e) {
      const ta=document.createElement('textarea'); ta.value=report; ta.style.position='fixed'; ta.style.opacity='0'; document.body.appendChild(ta); ta.select();
      try { document.execCommand('copy'); } catch(_) {}
      ta.remove(); return false;
    }
  };

  const showResult = (report, gmailUrl, xUrl) => {
    let box = document.getElementById('intakeResult');
    if (!box) {
      box = document.createElement('div'); box.id='intakeResult'; box.className='intake-result';
      form.appendChild(box);
    }
    box.innerHTML = `<div class="result-check">✓</div><div><h3>Your request is prepared.</h3><p>A text report was downloaded and copied to your clipboard. X and Gmail were opened with the MaxImpress destination prepared. Review the message and press <strong>Send</strong> in each platform.</p><div class="result-actions"><a class="secondary-btn" href="${xUrl}" target="_blank" rel="noopener">Open X DM <b>→</b></a><a class="secondary-btn" href="${gmailUrl}" target="_blank" rel="noopener">Open Gmail <b>→</b></a><button class="secondary-btn report-copy" type="button">Copy Report Again</button></div><small>For privacy and platform security, this static website cannot press Send inside your X or Gmail account without your action.</small></div>`;
    box.querySelector('.report-copy')?.addEventListener('click',()=>copyReport(report));
    box.scrollIntoView({behavior:'smooth',block:'center'});
  };

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (!form.reportValidity()) return;
    const report = makeReport();
    downloadReport(report);
    await copyReport(report);

    const title = form.dataset.serviceTitle || 'MaxImpress Service Request';
    const subject = `MaxImpress ${title} Request`;
    const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=maximpress.org%40gmail.com&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(report)}`;
    const xSummary = report.length > 3400 ? report.slice(0,3350) + '\n\n[Full report copied to clipboard and included in email.]' : report;
    const xUrl = `https://twitter.com/messages/compose?recipient_id=1582710858614018050&text=${encodeURIComponent(xSummary)}`;

    // Create windows from the submit gesture. Some browsers may still block one;
    // the confirmation box provides explicit fallback links.
    const xWin = window.open(xUrl, '_blank', 'noopener');
    const mailWin = window.open(gmailUrl, '_blank', 'noopener');
    showResult(report, gmailUrl, xUrl);
  });
})();
