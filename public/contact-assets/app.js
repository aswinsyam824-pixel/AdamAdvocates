const cards=document.querySelector('#cards');
if(cards)for(const [id,sign] of [['prev',-1],['next',1]])document.getElementById(id)?.addEventListener('click',()=>cards.scrollBy({left:sign*(cards.querySelector('article').offsetWidth+18),behavior:'smooth'}));
document.querySelectorAll('[data-service]').forEach(b=>b.addEventListener('click',()=>location.href='contact.html?practice='+encodeURIComponent(b.dataset.service)));
const form = document.querySelector('#contact-enquiry');
if (form) {
  const practice = new URLSearchParams(location.search).get('practice');
  if ([...form.elements.practice.options].some(o => o.value === practice)) form.elements.practice.value = practice;
  const button = form.querySelector('[type="submit"]');
  const status = document.querySelector('#send-status');
  const result = document.querySelector('#result');
  const original = button.innerHTML;
  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (button.disabled || !form.reportValidity()) return;
    button.disabled = true;
    button.textContent = 'Sending…';
    form.setAttribute('aria-busy', 'true');
    status.textContent = 'Sending your enquiry…';
    status.dataset.error = 'false';
    try {
      const response = await fetch('/api/enquiry', {
        method: 'POST', headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(Object.fromEntries(new FormData(form)))
      });
      const data = await response.json();
      if (!response.ok || !data.ok) throw new Error(data.error || 'Unable to send your enquiry. Please try again later.');
      form.hidden = true;
      result.hidden = false;
      result.focus();
      form.reset();
      status.textContent = '';
    } catch (error) {
      status.dataset.error = 'true';
      status.textContent = error instanceof TypeError || error instanceof SyntaxError
        ? 'We could not confirm that your enquiry was sent. Please keep your details and try again later, or email Info@adamadvocates.com.'
        : error.message;
    } finally {
      button.disabled = false;
      button.innerHTML = original;
      form.removeAttribute('aria-busy');
    }
  });
  document.querySelector('#new-enquiry').addEventListener('click', () => {
    result.hidden = true; form.hidden = false; form.elements.name.focus();
  });
}

if(document.querySelector('#year'))document.querySelector('#year').textContent=new Date().getFullYear();

const motionVideo=document.querySelector('#hero-video');
const motionToggle=document.querySelector('.video-toggle');
if(motionVideo&&motionToggle){
 const sync=()=>{motionToggle.textContent=motionVideo.paused?'Play':'Pause';motionToggle.setAttribute('aria-label',motionVideo.paused?'Play video':'Pause video');};
 motionVideo.addEventListener('play',sync);motionVideo.addEventListener('pause',sync);
 if(window.matchMedia('(prefers-reduced-motion: reduce)').matches){motionVideo.autoplay=false;motionVideo.pause();}
 motionToggle.addEventListener('click',()=>{if(motionVideo.paused)motionVideo.play().catch(sync);else motionVideo.pause();});
 sync();
}
