const builtInApps = [{
    id: 'notes',
    name: 'Sticky Notes',
    description: 'A place for your thoughts',
    icon: '📝',
    color: '#fff0c7',
    kind: 'BUILT-IN APP'
  },
  {
    id: 'calculator',
    name: 'Calculator',
    description: 'Make the numbers add up',
    icon: '🧮',
    color: '#dbece8',
    kind: 'BUILT-IN APP'
  },
  {
    id: 'palette',
    name: 'Color Palette',
    description: 'A little splash of color',
    icon: '🎨',
    color: '#f6e0dc',
    kind: 'BUILT-IN APP'
  },
  {
    id: 'timer',
    name: 'Focus Timer',
    description: 'Take it one minute at a time',
    icon: '⏰',
    color: '#e8e3f4',
    kind: 'BUILT-IN APP'
  }
];
const STORAGE_KEY = 'html-os-installed-apps-v1';
let githubApps = [];
try {
  const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  if (Array.isArray(saved)) githubApps = saved.filter(app => app && app.github && app.repo && typeof app.path === 'string');
} catch (error) { console.warn('Could not restore installed apps:', error); }
let currentRepo = githubApps.length ? githubApps[githubApps.length - 1].repo : null;
let currentFilter = 'all';
let zIndex = 10;
let activeWindow = 'explorer';
const grid = document.getElementById('app-grid');
const explorer = document.getElementById('explorer');
const startMenu = document.getElementById('start-menu');

function escapeHTML(value) {
  return String(value).replace(/[&<>"']/g, char => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  } [char]));
}

function iconMarkup(app) {
  if (typeof app.iconImage === 'string' && /^data:image\/(png|jpeg|gif|webp);base64,/i.test(app.iconImage)) {
    return `<img src="${escapeHTML(app.iconImage)}" alt="">`;
  }
  return escapeHTML(app.icon || '🌐');
}

function saveApps(apps) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(apps));
    return true;
  } catch (error) {
    return false;
  }
}

function updateRepoDisplay() {
  const sidebar = document.getElementById('repo-sidebar');
  sidebar.innerHTML = currentRepo ? `<span class="repo-dot connected"></span> ${escapeHTML(currentRepo.fullName)}` : '<span class="repo-dot"></span> Not connected';
  sidebar.title = currentRepo ? currentRepo.fullName : '';
  document.getElementById('address').textContent = 'My Computer \\ HTML Apps';
}

function renderApps() {
  const all = [...builtInApps, ...githubApps];
  const query = document.getElementById('search').value.trim().toLowerCase();
  const filtered = all.filter(app => (currentFilter === 'all' || (currentFilter === 'builtin' ? !app.github : app.github)) && (app.name + ' ' + app.description).toLowerCase().includes(query));
  grid.innerHTML = filtered.map(app => `<div class="app-card-wrap"><button class="app-card" data-open-app="${escapeHTML(app.id)}" title="Open ${escapeHTML(app.name)}"><span class="app-icon" style="background:${escapeHTML(app.color)}">${iconMarkup(app)}</span><strong>${escapeHTML(app.name)}</strong><small>${escapeHTML(app.description)}</small><span class="app-kind">${escapeHTML(app.kind)} ↗</span></button>${app.github ? `<button class="remove-app" data-remove-app="${escapeHTML(app.id)}" title="Remove ${escapeHTML(app.name)}" aria-label="Remove ${escapeHTML(app.name)}">×</button>` : ''}</div>`).join('');
  const shortcuts = document.querySelector('.desktop-icons');
  shortcuts.querySelectorAll('[data-installed-shortcut]').forEach(button => button.remove());
  githubApps.forEach(app => {
    const button = document.createElement('button');
    button.className = 'desktop-icon';
    button.dataset.installedShortcut = '';
    button.dataset.openApp = app.id;
    button.innerHTML = `<span class="desktop-icon-art">${iconMarkup(app)}</span><span>${escapeHTML(app.name)}</span>`;
    shortcuts.appendChild(button);
  });
  updateRepoDisplay();
  document.getElementById('empty-state').hidden = filtered.length > 0;
  document.getElementById('all-count').textContent = all.length;
  document.getElementById('heading-count').textContent = String(filtered.length).padStart(2, '0');
  document.getElementById('collection-title').childNodes[0].textContent = ({
    all: 'All applications ',
    builtin: 'Built-in applications ',
    github: 'From GitHub '
  })[currentFilter];
  document.getElementById('status-text').textContent = `${filtered.length} object(s)`;
  document.querySelectorAll('.side-link').forEach(button => button.classList.toggle('active', button.dataset.filter === currentFilter));
}

function updateClock() {
  document.getElementById('clock').textContent = new Date().toLocaleTimeString([], {
    hour: 'numeric',
    minute: '2-digit'
  });
}
updateClock();
setInterval(updateClock, 10000);
renderApps();

function activateWindow(id) {
  const win = document.querySelector(`[data-window="${CSS.escape(id)}"]`);
  if (!win) return;
  win.classList.remove('hidden-window');
  win.style.zIndex = ++zIndex;
  activeWindow = id;
  document.querySelectorAll('.task-button').forEach(button => button.classList.toggle('active', button.dataset.task === id));
}

function addTask(id, title, icon) {
  if (document.querySelector(`[data-task="${CSS.escape(id)}"]`)) return;
  const button = document.createElement('button');
  button.className = 'task-button';
  button.dataset.task = id;
  button.innerHTML = `${icon} <span>${escapeHTML(title)}</span>`;
  document.getElementById('task-buttons').appendChild(button);
}

function closeWindow(win) {
  if (win.id === 'explorer') win.classList.add('hidden-window');
  else {
    document.querySelector(`[data-task="${CSS.escape(win.dataset.window)}"]`)?.remove();
    win.remove();
  }
  document.querySelectorAll('.task-button').forEach(button => button.classList.remove('active'));
}

function makeWindow(id, title, icon, dialog = false) {
  const existing = document.querySelector(`[data-window="${CSS.escape(id)}"]`);
  if (existing) {
    activateWindow(id);
    return null;
  }
  const win = document.createElement('section');
  win.className = `window floating-window${dialog ? ' dialog-window' : ''}`;
  win.dataset.window = id;
  win.setAttribute('aria-label', title);
  win.innerHTML = `<div class="title-bar draggable"><div class="title-bar-text">${icon} &nbsp;${escapeHTML(title)}</div><div class="title-bar-controls"><button aria-label="Minimize" data-window-action="minimize"></button>${dialog ? '' : '<button aria-label="Maximize" data-window-action="maximize"></button>'}<button aria-label="Close" data-window-action="close"></button></div></div><div class="window-body"></div>`;
  document.getElementById('window-layer').appendChild(win);
  addTask(id, title, icon);
  activateWindow(id);
  return win;
}

function showConnect() {
  const win = makeWindow('connect', 'Connect a GitHub repository', '🌐', true);
  if (!win) return;
  win.querySelector('.window-body').innerHTML = `<form class="dialog-content" id="connect-form"><h2>Bring your apps along.</h2><p>Find HTML files in a public GitHub repository, choose the ones you want, and give each an icon. No sign-in needed.</p><label for="repo-input">GitHub repository or HTML file URL</label><input id="repo-input" required placeholder="owner/repository" autocomplete="off" value="${escapeHTML(currentRepo ? currentRepo.fullName : '')}"><div class="dialog-example">Paste owner/repository, a repository URL, or a GitHub file URL.</div><p id="connect-message" role="status" aria-live="polite"></p><div class="dialog-actions"><button type="button" data-window-action="close">Cancel</button><button type="submit">Find HTML files</button></div></form>`;
  win.querySelector('input').focus();
}

function showAbout() {
  const win = makeWindow('about', 'About HTML OS', '📝', true);
  if (!win) return;
  win.querySelector('.window-body').innerHTML = `<div class="dialog-content"><h2>Welcome to HTML OS ✳</h2><p>A nostalgic little desktop for discovering and running HTML apps. Start with the built-in collection, or connect a public GitHub repository to explore your own.</p><p>We look for <b>.html</b> and <b>.htm</b> files in the repository’s default branch. Apps run in a sandbox; some may need external services or permissions that aren’t available here.</p><p>Choose the HTML files you want to install, give each a name and an emoji or uploaded icon, and find them on your desktop. Installed apps are saved in this browser; use × on an app card to remove it.</p><p>Public repositories are accessed through the GitHub API, which may apply rate limits. Relative assets load through jsDelivr. Apps that require server-side code may not work.</p><div class="dialog-actions"><button data-window-action="close">OK</button></div></div>`;
}
async function connectRepo(form) {
  const input = form.querySelector('input').value.trim().replace(/\/$/, '');
  const match = input.match(/^(?:https?:\/\/(?:www\.)?github\.com\/)?([\w.-]+)\/([\w.-]+?)(?:\.git)?(?:\/(?:blob|tree)\/(.+))?$/i);
  const message = form.querySelector('#connect-message');
  if (!match) {
    message.className = 'dialog-error';
    message.textContent = 'Please enter a repository like owner/repository.';
    return;
  }
  const fullName = `${match[1]}/${match[2]}`;
  const submit = form.querySelector('[type="submit"]');
  submit.disabled = true;
  message.className = 'loading';
  message.textContent = 'Connecting to GitHub and looking for HTML files…';
  try {
    const repoResponse = await fetch(`https://api.github.com/repos/${encodeURIComponent(match[1])}/${encodeURIComponent(match[2])}`);
    if (!repoResponse.ok) throw new Error(repoResponse.status === 404 ? 'Repository not found. Check the name and make sure it is public.' : `GitHub could not be reached (${repoResponse.status}). You may have hit the API rate limit.`);
    const repo = await repoResponse.json();
    const treeResponse = await fetch(`https://api.github.com/repos/${encodeURIComponent(match[1])}/${encodeURIComponent(match[2])}/git/trees/${encodeURIComponent(repo.default_branch)}?recursive=1`);
    if (!treeResponse.ok) throw new Error('Could not read the repository files. Please try again.');
    const tree = await treeResponse.json();
    const files = (tree.tree || []).filter(item => item.type === 'blob' && /\.html?$/i.test(item.path));
    if (!files.length) throw new Error('No HTML files found in the default branch of this repository.');
    const repoInfo = { fullName: repo.full_name, owner: repo.owner.login, name: repo.name, branch: repo.default_branch };
    let requestedPath = '';
    if (match[3]) {
      try { requestedPath = decodeURIComponent(match[3]); } catch (_) { requestedPath = match[3]; }
      if (requestedPath.startsWith(repo.default_branch + '/')) requestedPath = requestedPath.slice(repo.default_branch.length + 1);
    }
    showImportPicker(form.closest('.window'), repoInfo, files, requestedPath, tree.truncated);
  } catch (error) {
    message.className = 'dialog-error';
    message.textContent = error.message || 'Something went wrong. Please try again.';
  } finally {
    submit.disabled = false;
  }
}
function showImportPicker(win, repo, files, requestedPath, truncated) {
  win.classList.add('import-dialog');
  const selectedMatch = files.some(file => file.path === requestedPath);
  win.querySelector('.window-body').innerHTML = `<form class="dialog-content" id="import-form"><h2>Choose your apps.</h2><p class="import-intro">Found ${files.length} HTML file${files.length === 1 ? '' : 's'} in <b>${escapeHTML(repo.fullName)}</b>. Select files and make them your own.</p>${truncated ? '<p class="dialog-error">GitHub returned a partial file list for this large repository.</p>' : ''}${requestedPath && !selectedMatch ? '<p class="dialog-error">That file was not found in the default branch. Choose a file below.</p>' : ''}<div class="import-file-list">${files.map((file, i) => {
    const already = githubApps.some(app => app.repo.fullName.toLowerCase() === repo.fullName.toLowerCase() && app.path === file.path);
    const name = file.path.split('/').pop().replace(/\.html?$/i, '').replace(/[-_]/g, ' ');
    return `<div class="import-file" data-file-index="${i}"><div class="import-file-top"><input type="checkbox" id="pick-${i}" ${selectedMatch ? (file.path === requestedPath ? 'checked' : '') : (already ? '' : 'checked')}><label for="pick-${i}">${escapeHTML(file.path)}<small>${already ? 'Already installed — select to update' : 'Ready to add'}</small></label></div><div class="import-file-fields"><div><label for="name-${i}">App name</label><input id="name-${i}" class="import-name" value="${escapeHTML(name)}" maxlength="60"></div><div><label for="icon-${i}">Emoji</label><input id="icon-${i}" class="import-icon" value="🌐" maxlength="12"></div><div class="icon-upload"><label for="image-${i}">Or upload an icon</label><input id="image-${i}" class="import-image" type="file" accept="image/png,image/jpeg,image/gif,image/webp"></div></div></div>`;
  }).join('')}</div><p class="import-summary">Icons and apps are saved in this browser. Uploaded icons should be small (under 200 KB).</p><p id="import-message" role="status" aria-live="polite"></p><div class="dialog-actions"><button type="button" data-import-back>Back</button><button type="submit">Add selected apps</button></div></form>`;
  win.querySelector('#import-form').addEventListener('submit', async event => {
    event.preventDefault();
    const message = win.querySelector('#import-message');
    const rows = [...win.querySelectorAll('.import-file')].filter(row => row.querySelector('input[type=checkbox]').checked);
    if (!rows.length) { message.className = 'dialog-error'; message.textContent = 'Select at least one HTML file.'; return; }
    const submit = win.querySelector('[type=submit]');
    submit.disabled = true;
    try {
      const additions = await Promise.all(rows.map(async row => {
        const file = files[Number(row.dataset.fileIndex)];
        const name = row.querySelector('.import-name').value.trim();
        if (!name) throw new Error('Please give each selected app a name.');
        const image = row.querySelector('.import-image').files[0];
        let iconImage = '';
        if (image) {
          if (!/^image\/(png|jpeg|gif|webp)$/.test(image.type) || image.size > 200 * 1024) throw new Error('Use a PNG, JPEG, GIF, or WebP icon under 200 KB.');
          iconImage = await new Promise((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(reader.result); reader.onerror = () => reject(new Error('Could not read the icon file.')); reader.readAsDataURL(image); });
        }
        return { id: `github-${encodeURIComponent(repo.fullName.toLowerCase())}-${encodeURIComponent(file.path)}`, name, description: `${repo.fullName} / ${file.path}`, icon: row.querySelector('.import-icon').value.trim() || '🌐', iconImage, color: '#dcece8', kind: 'GITHUB APP', github: true, path: file.path, repo };
      }));
      const next = githubApps.filter(app => !additions.some(item => item.id === app.id)).concat(additions);
      if (!saveApps(next)) throw new Error('Could not save apps in this browser. Try smaller icons or free up browser storage.');
      githubApps = next;
      currentRepo = repo;
      currentFilter = 'github';
      document.getElementById('search').value = '';
      renderApps();
      closeWindow(win);
      activateWindow('explorer');
    } catch (error) { message.className = 'dialog-error'; message.textContent = error.message || 'Could not add your apps.'; }
    finally { submit.disabled = false; }
  });
  win.querySelector('[data-import-back]').addEventListener('click', () => { closeWindow(win); showConnect(); });
}

const frameStyle = `<style>body{font:14px Arial,sans-serif;background:#f6f6ee;color:#263b33;margin:0;padding:24px}h1{font-size:22px;margin:0 0 8px}p{color:#718077;line-height:1.5}button,input,textarea{font:inherit}button{background:#008078;color:white;border:0;padding:9px 14px;cursor:pointer}input,textarea{box-sizing:border-box;border:1px solid #bdcfc2;padding:10px}small{color:#84958c}</style>`;
const builtInHTML = {
  notes: `${frameStyle}<h1>📝 Sticky Notes</h1><p>A little space to put your thoughts. Your notes are saved on this device.</p><textarea id="note" placeholder="Dear diary..." style="width:100%;height:240px;background:#fff9d6;resize:vertical;line-height:1.6"></textarea><p><small id="saved">Your notes save automatically.</small></p><script>try{note.value=localStorage.getItem('html-os-notes')||''}catch(e){} note.oninput=()=>{try{localStorage.setItem('html-os-notes',note.value);saved.textContent='Saved!'}catch(e){saved.textContent='Saving is unavailable in this sandbox.'}}<\/script>`,
  calculator: `${frameStyle}<h1>🧮 Calculator</h1><p>For all the little calculations.</p><div style="max-width:270px"><input id="display" aria-label="Calculator display" readonly value="0" style="width:100%;text-align:right;font-size:25px;margin-bottom:8px"><div id="keys" style="display:grid;grid-template-columns:repeat(4,1fr);gap:5px"></div></div><script>let expr='';const keys=['7','8','9','/','4','5','6','*','1','2','3','-','C','0','=','+'];keys.forEach(k=>{let b=document.createElement('button');b.textContent=k;b.onclick=()=>{if(k==='C')expr='';else if(k==='='){try{if(!/^[0-9+*/. -]+$/.test(expr))throw 0;expr=String(Function('return ('+expr+')')());if(!isFinite(Number(expr)))expr='Error'}catch(e){expr='Error'}}else{if(expr==='Error')expr='';expr+=k}display.value=expr||'0'};document.querySelector('#keys').appendChild(b)})<\/script>`,
  palette: `${frameStyle}<h1>🎨 Color Palette</h1><p>A little inspiration for your next big idea. Click a color to copy its hex code.</p><div id="colors" style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px"></div><p id="message"><small>Pick a color you love.</small></p><script>['#008080','#F4C995','#E5A99F','#A6C9AD','#889BC0','#DFD3AC','#D99F7C','#B8ADD4','#587B6E'].forEach(c=>{let b=document.createElement('button');b.style.cssText='height:90px;background:'+c+';color:#fff;text-shadow:0 1px 3px #333';b.textContent=c;b.onclick=()=>{(navigator.clipboard ? navigator.clipboard.writeText(c) : Promise.reject()).then(()=>message.textContent='Copied '+c+'!').catch(()=>message.textContent='Color: '+c)};colors.appendChild(b)})<\/script>`,
  timer: `${frameStyle}<h1>⏰ Focus Timer</h1><p>A little time to focus on what matters.</p><div id="time" style="font-size:58px;font-weight:bold;color:#008078;margin:30px 0">25:00</div><button id="start">Start</button> <button id="reset" style="background:#91a99e">Reset</button><script>let seconds=1500,interval;function draw(){time.textContent=String(Math.floor(seconds/60)).padStart(2,'0')+':'+String(seconds%60).padStart(2,'0')}start.onclick=()=>{if(interval){clearInterval(interval);interval=null;start.textContent='Start'}else{start.textContent='Pause';interval=setInterval(()=>{if(seconds>0)seconds--;draw();if(!seconds){clearInterval(interval);interval=null;start.textContent='Start';alert('Time is up!')}},1000)}};reset.onclick=()=>{clearInterval(interval);interval=null;seconds=1500;start.textContent='Start';draw()}<\/script>`
};
async function openApp(id) {
  const app = [...builtInApps, ...githubApps].find(item => item.id === id);
  if (!app) return;
  const windowId = `app-${id}`;
  const win = makeWindow(windowId, app.name, escapeHTML(app.icon || '🌐'));
  if (!win) return;
  const body = win.querySelector('.window-body');
  const iframe = document.createElement('iframe');
  iframe.title = app.name;
  iframe.setAttribute('sandbox', 'allow-scripts allow-forms allow-modals allow-popups allow-downloads');
  if (!app.github) {
    // Built-in content is trusted and needs its origin for local storage.
    iframe.setAttribute('sandbox', 'allow-scripts allow-same-origin allow-modals');
    iframe.setAttribute('allow', 'clipboard-write');
    iframe.srcdoc = builtInHTML[app.id];
    body.appendChild(iframe);
    return;
  }
  body.innerHTML = '<div class="dialog-content"><p>Opening your app from GitHub…</p></div>';
  const repo = app.repo;
  try {
    const encodedPath = app.path.split('/').map(encodeURIComponent).join('/');
    const url = `https://raw.githubusercontent.com/${encodeURIComponent(repo.owner)}/${encodeURIComponent(repo.name)}/${encodeURIComponent(repo.branch)}/${encodedPath}`;
    const response = await fetch(url);
    if (!response.ok) throw new Error(`GitHub returned ${response.status}.`);
    const html = await response.text();
    const directory = app.path.includes('/') ? app.path.slice(0, app.path.lastIndexOf('/') + 1).split('/').map(encodeURIComponent).join('/') : '';
    const base = `https://cdn.jsdelivr.net/gh/${encodeURIComponent(repo.owner)}/${encodeURIComponent(repo.name)}@${encodeURIComponent(repo.branch)}/${directory}`;
    iframe.srcdoc = `<base href="${escapeHTML(base)}">${html}`;
    body.innerHTML = '';
    body.appendChild(iframe);
    const status = document.createElement('div');
    status.className = 'app-window-status';
    status.textContent = `${repo.fullName} / ${app.path} · Running in a sandbox`;
    win.appendChild(status);
  } catch (error) {
    body.innerHTML = `<div class="dialog-content"><h2>Couldn’t open this app</h2><p>${escapeHTML(error.message)} Please try again.</p></div>`;
  }
}

document.addEventListener('click', event => {
  const winControl = event.target.closest('[data-window-action]');
  if (winControl) {
    const win = winControl.closest('.window');
    if (!win) return;
    const action = winControl.dataset.windowAction;
    if (action === 'close') closeWindow(win);
    if (action === 'minimize') {
      win.classList.add('hidden-window');
      document.querySelector(`[data-task="${CSS.escape(win.dataset.window)}"]`)?.classList.remove('active');
    }
    if (action === 'maximize') win.classList.toggle('maximized');
    return;
  }
  const task = event.target.closest('[data-task]');
  if (task) {
    const win = document.querySelector(`[data-window="${CSS.escape(task.dataset.task)}"]`);
    if (win && !win.classList.contains('hidden-window') && activeWindow === task.dataset.task) {
      win.classList.add('hidden-window');
      task.classList.remove('active');
    } else activateWindow(task.dataset.task);
    return;
  }
  const removeButton = event.target.closest('[data-remove-app]');
  if (removeButton) {
    const app = githubApps.find(item => item.id === removeButton.dataset.removeApp);
    if (app && confirm(`Remove ${app.name} from HTML OS?`)) {
      const next = githubApps.filter(item => item.id !== app.id);
      if (!saveApps(next)) { alert('Could not save this change in your browser.'); return; }
      githubApps = next;
      currentRepo = githubApps.length ? githubApps[githubApps.length - 1].repo : null;
      const open = document.querySelector(`[data-window="${CSS.escape(`app-${app.id}`)}"]`);
      if (open) closeWindow(open);
      renderApps();
    }
    return;
  }
  const appButton = event.target.closest('[data-open-app]');
  if (appButton) {
    openApp(appButton.dataset.openApp);
    return;
  }
  const filter = event.target.closest('[data-filter]');
  if (filter) {
    currentFilter = filter.dataset.filter;
    renderApps();
    return;
  }
  const action = event.target.closest('[data-action]')?.dataset.action;
  if (action) {
    startMenu.hidden = true;
    if (action === 'explorer') activateWindow('explorer');
    if (action === 'connect') showConnect();
    if (action === 'about') showAbout();
    if (action === 'back') {
      currentFilter = 'all';
      document.getElementById('search').value = '';
      renderApps();
    }
    if (action === 'refresh') renderApps();
    if (action === 'show-desktop') {
      document.querySelectorAll('[data-window]').forEach(win => win.classList.add('hidden-window'));
      document.querySelectorAll('.task-button').forEach(button => button.classList.remove('active'));
      activeWindow = null;
    }
  }
  if (!event.target.closest('#start-menu') && !event.target.closest('#start-button')) startMenu.hidden = true;
});
document.getElementById('start-button').addEventListener('click', () => {
  startMenu.hidden = !startMenu.hidden;
});
document.getElementById('search').addEventListener('input', renderApps);
document.addEventListener('submit', event => {
  if (event.target.id === 'connect-form') {
    event.preventDefault();
    connectRepo(event.target);
  }
});
document.addEventListener('pointerdown', event => {
  const win = event.target.closest('.window');
  if (win) activateWindow(win.dataset.window);
  const bar = event.target.closest('.draggable');
  if (!bar || event.target.closest('button') || win.classList.contains('maximized')) return;
  const rect = win.getBoundingClientRect();
  const startX = event.clientX;
  const startY = event.clientY;
  win.style.left = `${rect.left}px`;
  win.style.top = `${rect.top}px`;
  win.style.transform = 'none';
  bar.setPointerCapture(event.pointerId);
  const move = e => {
    win.style.left = `${Math.max(0, Math.min(window.innerWidth - 80, rect.left + e.clientX - startX))}px`;
    win.style.top = `${Math.max(0, Math.min(window.innerHeight - 70, rect.top + e.clientY - startY))}px`;
  };
  const end = () => {
    bar.removeEventListener('pointermove', move);
    bar.removeEventListener('pointerup', end);
    bar.removeEventListener('pointercancel', end);
  };
  bar.addEventListener('pointermove', move);
  bar.addEventListener('pointerup', end);
  bar.addEventListener('pointercancel', end);
});
