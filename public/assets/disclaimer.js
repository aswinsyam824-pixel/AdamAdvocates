(() => {
  const key = 'adam-disclaimer-accepted-v1';
  const unlock = () => {
    document.documentElement.classList.remove('entry-locked');
    document.querySelectorAll('main').forEach(main => { main.inert = false; });
  };
  let accepted = false;
  try { accepted = sessionStorage.getItem(key) === 'yes'; } catch {}
  const isEntry = document.body.dataset.entryPage === 'true';
  if (accepted) {
    if (isEntry) { location.replace('home.html'); return; }
    unlock(); return;
  }
  if (!isEntry) { location.replace('index.html'); return; }
  document.querySelectorAll('main').forEach(main => { main.inert = true; });
  const dialog = document.createElement('dialog');
  dialog.className = 'entry-dialog';
  dialog.setAttribute('closedby', 'none');
  dialog.setAttribute('aria-labelledby', 'entry-title');
  dialog.innerHTML = `
    <div class="entry-layout">
      <aside class="entry-art" aria-hidden="true">
        <img src="assets/justice.jpg" alt="">
        <div class="entry-art-copy"><small>ADAM ADVOCATES</small><strong>Legal clarity.<br>Lasting <em>confidence.</em></strong></div>
      </aside>
      <div class="entry-content">
        <p class="entry-brand">ADVOCATES &amp; LEGAL CONSULTANTS</p>
        <h2 class="entry-heading" id="entry-title" tabindex="-1" autofocus><span class="entry-symbol" aria-hidden="true">!</span>DISCLAIMER</h2>
        <div class="entry-copy">
          <p>The Bar Council of India does not permit advertisement or solicitation by advocates in any form or manner. By accessing this website, you acknowledge and confirm that you are seeking information relating to Adam Advocates and Legal Consultants Private Limited of your own accord and that there has been no form of solicitation, advertisement or inducement by Adam Advocates and Legal Consultants Private Limited or any of its members.</p>
          <p>The content of this website is for informational purposes only and shall not be interpreted as soliciting or advertising. No material or information provided on this website should be construed as legal advice. Adam Advocates and Legal Consultants Private Limited shall not be liable for any consequences of any action taken by relying on the material or information provided on this website.</p>
          <p>The contents of this website are the intellectual property of Adam Advocates and Legal Consultants Private Limited.</p>
        </div>
        <label class="entry-accept"><input type="checkbox" id="entry-accept"> <span>I Accept the above</span></label>
        <button class="entry-proceed" type="button" disabled>PROCEED TO WEBSITE</button>
      </div>
    </div>`;
  document.body.append(dialog);
  const check = dialog.querySelector('input');
  const button = dialog.querySelector('button');
  check.addEventListener('change', () => { button.disabled = !check.checked; });
  // The entry notice cannot be dismissed by Escape or a backdrop click.
  dialog.addEventListener('cancel', event => event.preventDefault());
  dialog.addEventListener('keydown', event => {
    if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); }
  }, true);
  dialog.addEventListener('close', () => {
    if (document.documentElement.classList.contains('entry-locked')) dialog.showModal();
  });
  button.addEventListener('click', () => {
    if (!check.checked) return;
    try { sessionStorage.setItem(key, 'yes'); } catch {
      let notice = dialog.querySelector('[role=alert]');
      if (!notice) { notice = document.createElement('p'); notice.setAttribute('role', 'alert'); button.after(notice); }
      notice.textContent = 'Please allow browser session storage for this website, then try again.';
      return;
    }
    location.assign('home.html');
  });
  dialog.showModal();
})();
