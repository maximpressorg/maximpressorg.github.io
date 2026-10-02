(function () {
  'use strict';

  var clients = Array.isArray(window.MAXIMPRESS_CLIENT_STORIES) ? window.MAXIMPRESS_CLIENT_STORIES : [];

  function esc(value) {
    return String(value == null ? '' : value)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#039;');
  }

  function arr(value) { return Array.isArray(value) ? value.filter(Boolean) : []; }
  function exists(value) { return value !== undefined && value !== null && String(value).trim() !== ''; }

  function handleUrl(handle) {
    if (!exists(handle)) return '';
    return 'https://x.com/' + encodeURIComponent(String(handle).replace(/^@/, ''));
  }

  function verifiedBadge(c) {
    return c && c.xVerified ? '<span class="client-x-verified" title="Verified status shown in the supplied X delegation record" aria-label="Verified on X">✓</span>' : '';
  }

  function nameHtml(c) {
    return '<span class="client-name-line">' + esc(c.name) + verifiedBadge(c) + '</span>';
  }

  function identityMeta(c) {
    // Keep the top role line deliberately concise. Detailed organization / niche
    // context sits below it as secondary metadata so the hierarchy reads cleanly.
    var primary = exists(c.position) ? esc(c.position) : (exists(c.company) ? esc(c.company) : '');
    var secondary = [c.company, c.industry, c.location].filter(exists).map(esc).join(' · ');
    return { primary: primary, secondary: secondary };
  }

  function handleHtml(c, compact) {
    if (!exists(c.handle)) return '';
    var url = handleUrl(c.handle);
    return '<a class="client-x-handle" href="' + esc(url) + '" target="_blank" rel="noopener noreferrer"' + (compact ? ' tabindex="-1"' : '') + '>' + esc(c.handle) + '</a>';
  }

  function media(c, className) {
    if (exists(c.photo)) return '<img class="' + className + '" src="' + esc(c.photo) + '" alt="' + esc(c.name || 'Client') + ' profile image" width="256" height="256" loading="lazy" decoding="async">';
    return '<div class="' + className + ' client-avatar-fallback" aria-hidden="true"><span></span></div>';
  }

  function tags(items, extraClass) {
    return arr(items).map(function (x) { return '<span class="client-chip ' + (extraClass || '') + '">' + esc(x) + '</span>'; }).join('');
  }

  function results(c, limit) {
    var list = arr(c.results).slice(0, limit || c.results.length);
    if (!list.length) return '';
    return '<div class="client-card-results">' + list.map(function (r) {
      var value = exists(r.value) ? esc(r.value) : (exists(r.before) && exists(r.after) ? esc(r.before) + ' → ' + esc(r.after) : '');
      if (!value || !exists(r.label)) return '';
      return '<div class="client-mini-result"><strong>' + value + '</strong><span>' + esc(r.label) + '</span></div>';
    }).join('') + '</div>';
  }

  function hasFullStory(c) {
    return exists(c.testimonial) || exists(c.challenge) || exists(c.approach) || arr(c.results).length || arr(c.businessImpact).length || exists(c.whatStoodOut) || exists(c.finalRecommendation) || arr(c.evidence).length;
  }

  function card(c, compact) {
    if (!c || !exists(c.name) || !exists(c.slug)) return '';
    var meta = identityMeta(c);
    var quote = exists(c.testimonial) ? esc(c.testimonial) : '';
    var excerpt = compact && quote.length > 220 ? quote.slice(0, 217).replace(/\s+\S*$/, '') + '…' : quote;
    var chipItems = arr(c.services).slice(0, compact ? 1 : 2).concat(arr(c.platforms).slice(0, compact ? 1 : 2));
    var trust = arr(c.trustSignals);
    var story = hasFullStory(c);
    return '<article class="client-story-card' + (!quote ? ' client-profile-card' : '') + '">' +
      '<div class="client-story-card-head">' + media(c, 'client-story-avatar') +
        '<div class="client-story-identity"><h3>' + nameHtml(c) + '</h3>' +
          handleHtml(c, compact) +
          (meta.primary ? '<p class="client-role-line">' + meta.primary + '</p>' : '') +
          (meta.secondary ? '<small>' + meta.secondary + '</small>' : '') +
        '</div>' +
        (exists(c.companyLogo) ? '<img class="client-company-logo" src="' + esc(c.companyLogo) + '" alt="' + esc(c.company || 'Company') + ' logo" loading="lazy" decoding="async">' : '') +
      '</div>' +
      (exists(c.cardSummary) ? '<p class="client-card-summary">' + esc(c.cardSummary) + '</p>' : '') +
      (quote ? '<blockquote>“' + excerpt + '”</blockquote>' : '') +
      results(c, compact ? 3 : 4) +
      (chipItems.length ? '<div class="client-chip-row">' + tags(chipItems) + '</div>' : '') +
      (c.metaManaged ? '<div class="client-cross-platform-note"><strong>X + Meta Managed</strong><span>' + esc(c.metaPortfolioStatus || 'Meta portfolio coming soon') + '</span></div>' : '') +
      (trust.length ? '<div class="client-card-trust">✓ ' + esc(trust[0]) + '</div>' : '') +
      '<div class="client-card-footer">' +
        '<div class="client-record-summary"><span>PORTFOLIO NOTE</span><p>Only supplied client information is shown. Testimonials and performance evidence are added only when documented.</p></div>' +
        '<a class="client-story-link" href="client-story-' + encodeURIComponent(c.slug || '') + '.html">' + (story ? 'View Client Story' : 'View Client Profile') + ' <b>→</b></a>' +
      '</div>' +
    '</article>';
  }

  function renderList(id, compact) {
    var mount = document.getElementById(id);
    if (!mount) return;
    var usable = clients.filter(function (c) { return c && exists(c.name) && exists(c.slug); });
    if (compact) {
      var featured = usable.filter(function(c){ return c.featured === true; });
      usable = (featured.length ? featured : usable).slice(0, 6);
    }
    if (!usable.length) {
      mount.innerHTML = '<div class="client-empty-state"><span>CLIENT PORTFOLIO</span><h3>No client profiles are published yet.</h3><p>Client-specific information appears only after it has been supplied and approved for use.</p></div>';
      return;
    }
    mount.innerHTML = usable.map(function (c) { return card(c, compact); }).join('');
  }

  function textSection(label, title, body) {
    if (!exists(body) && !arr(body).length) return '';
    var content = Array.isArray(body)
      ? '<ul>' + body.filter(exists).map(function(x){ return '<li>' + esc(x) + '</li>'; }).join('') + '</ul>'
      : '<p>' + esc(body) + '</p>';
    return '<section class="case-story-section"><span class="case-kicker">' + esc(label) + '</span><h2>' + esc(title) + '</h2>' + content + '</section>';
  }

  function profileFactsSection(c) {
    var facts = arr(c.profileFacts).filter(function(f){ return f && exists(f.label) && exists(f.value); });
    if (!facts.length) return '';
    return '<section class="case-story-section"><span class="case-kicker">PROFILE CONTEXT</span><h2>Available Profile Information</h2><div class="client-profile-facts">' + facts.map(function(f){ return '<div><span>' + esc(f.label) + '</span><strong>' + esc(f.value) + '</strong></div>'; }).join('') + '</div></section>';
  }

  function renderCaseStudy() {
    var mount = document.getElementById('dynamic-client-story');
    if (!mount) return;
    var model = document.getElementById('client-story-model');
    if (model) model.hidden = true;
    var params = new URLSearchParams(window.location.search);
    var slug = params.get('client');
    if (!slug) {
      mount.innerHTML = '<div class="client-empty-state case-directory-state"><span>CLIENT PORTFOLIO</span><h3>Select a client profile from the portfolio.</h3><p>Only supplied client information is published. Testimonials, performance figures and evidence remain absent until documented.</p><a class="secondary-action-btn" href="reviews.html">View Client Portfolio <b>→</b></a></div>';
      return;
    }
    var c = clients.find(function(x){ return x && x.slug === slug; });
    if (!c) {
      mount.innerHTML = '<div class="client-empty-state"><span>CLIENT PROFILE NOT FOUND</span><h3>No client record matches this link.</h3><p>Return to the portfolio to view available client profiles.</p><a class="secondary-action-btn" href="reviews.html">View Client Portfolio <b>→</b></a></div>';
      return;
    }
    var meta = identityMeta(c);
    var trust = arr(c.trustSignals);
    var services = arr(c.services), platforms = arr(c.platforms), evidence = arr(c.evidence), resultList = arr(c.results);
    var detailed = hasFullStory(c);
    var xProfile = handleUrl(c.handle);

    var html = '<article class="case-story-live">' +
      '<header class="case-client-header">' + media(c, 'case-client-avatar') +
        '<div class="case-client-copy"><span class="case-kicker">CLIENT PROFILE</span><h1>' + nameHtml(c) + '</h1>' +
        handleHtml(c, false) +
        (meta.primary ? '<p class="case-role-line">' + meta.primary + '</p>' : '') +
        (meta.secondary ? '<small>' + meta.secondary + '</small>' : '') +
        (exists(c.cardSummary) ? '<p class="case-profile-summary">' + esc(c.cardSummary) + '</p>' : '') +
        ((services.length || platforms.length || exists(c.projectDuration)) ? '<div class="client-chip-row">' + tags(platforms, 'platform-chip') + tags(services) + (exists(c.projectDuration) ? '<span class="client-chip duration-chip">' + esc(c.projectDuration) + '</span>' : '') + '</div>' : '') +
        (trust.length ? '<div class="trust-signal-row">' + trust.map(function(t){ return '<span>✓ ' + esc(t) + '</span>'; }).join('') + '</div>' : '') +
        (c.metaManaged ? '<div class="case-cross-platform-note"><strong>X + Meta Managed</strong><span>' + esc(c.metaPortfolioStatus || 'Meta portfolio coming soon') + '</span></div>' : '') +
        '</div>' +
        (xProfile ? '<a class="case-x-profile-btn" href="' + esc(xProfile) + '" target="_blank" rel="noopener noreferrer">View X Profile <b>↗</b></a>' : '') +
        (exists(c.companyLogo) ? '<img class="case-company-logo" src="' + esc(c.companyLogo) + '" alt="' + esc(c.company || 'Company') + ' logo" loading="lazy" decoding="async">' : '') +
      '</header>' +
      (exists(c.testimonial) ? '<section class="case-testimonial"><span>CLIENT TESTIMONIAL</span><blockquote>“' + esc(c.testimonial) + '”</blockquote></section>' : '') +
      profileFactsSection(c) +
      textSection('THE CHALLENGE', 'The Challenge', c.challenge) +
      (services.length ? '<section class="case-story-section"><span class="case-kicker">SCOPE</span><h2>What We Worked On</h2><div class="client-chip-row large">' + tags(services) + '</div></section>' : '') +
      textSection('STRATEGY', 'Our Approach', c.approach) +
      (resultList.length ? '<section class="case-story-section"><span class="case-kicker">MEASURED OUTCOMES</span><h2>Results</h2><div class="case-results-grid">' + resultList.map(function(r){ var v = exists(r.value) ? esc(r.value) : (exists(r.before)&&exists(r.after) ? esc(r.before)+' → '+esc(r.after) : ''); return (v && exists(r.label)) ? '<div class="case-result"><strong>'+v+'</strong><span>'+esc(r.label)+'</span></div>' : ''; }).join('') + '</div></section>' : '') +
      textSection('BUSINESS EFFECT', 'Business Impact', c.businessImpact) +
      textSection('CLIENT PERSPECTIVE', 'What Stood Out', c.whatStoodOut) +
      (evidence.length ? '<section class="case-story-section"><span class="case-kicker">SUPPORTING MATERIAL</span><h2>Work Samples / Evidence</h2><div class="case-evidence-grid">' + evidence.map(function(e){ return exists(e.src) ? '<figure><img src="'+esc(e.src)+'" alt="'+esc(e.alt || 'Client evidence')+'" loading="lazy" decoding="async">'+(exists(e.caption)?'<figcaption>'+esc(e.caption)+'</figcaption>':'')+'</figure>' : ''; }).join('') + '</div></section>' : '') +
      (exists(c.finalRecommendation) ? '<section class="case-final-comment"><span>FINAL COMMENT</span><blockquote>“' + esc(c.finalRecommendation) + '”</blockquote></section>' : '') +
      (!detailed ? '<section class="case-record-note"><span>DOCUMENTATION STATUS</span><h2>Only confirmed information is shown.</h2><p>No testimonial, performance result, business-impact claim, project duration, or supporting evidence has been added for this client unless it was separately supplied.</p></section>' : '') +
    '</article>';
    mount.innerHTML = html;
  }

  document.addEventListener('DOMContentLoaded', function () {
    renderList('home-client-stories', true);
    renderList('portfolio-client-stories', false);
    renderCaseStudy();
  });
})();
