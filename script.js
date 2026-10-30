const searchInput = document.getElementById('searchInput');
const categoryFilter = document.getElementById('categoryFilter');
const statusFilter = document.getElementById('statusFilter');
const programList = document.getElementById('programList');
const categoryNav = document.getElementById('categoryNav');
const resultCount = document.getElementById('resultCount');
const detailPane = document.getElementById('detailPane');
const allProgramsButton = document.getElementById('allPrograms');

let selectedId = null;
const categories = [...new Set(programs.map(p => p.category))];
const compiledCount = programs.filter(p => p.status === 'Compiled').length;

document.getElementById('totalPrograms').textContent = programs.length;
document.getElementById('sideTotal').textContent = programs.length;
document.getElementById('totalCategories').textContent = categories.length;
document.getElementById('compiledPrograms').textContent = compiledCount;

function make(tag, className, text) {
  const el = document.createElement(tag);
  if (className) el.className = className;
  if (text !== undefined) el.textContent = text;
  return el;
}
function setCategory(category) {
  categoryFilter.value = category;
  selectedId = null;
  allProgramsButton.classList.toggle('active', !category);
  [...categoryNav.querySelectorAll('.nav-link')].forEach(b => b.classList.toggle('active', b.dataset.category === category));
  renderList();
}
function buildCategoryNav() {
  const all = allProgramsButton;
  all.addEventListener('click', () => setCategory(''));
  categories.forEach(category => {
    const count = programs.filter(p => p.category === category).length;
    const button = make('button', 'nav-link');
    button.dataset.category = category;
    const icon = make('span', '', '›');
    const label = make('span', '', category);
    label.style.width = 'auto';
    label.style.fontSize = '12px';
    const num = make('b', '', count);
    button.append(icon, label, num);
    button.addEventListener('click', () => setCategory(category));
    categoryNav.append(button);
    const option = document.createElement('option');
    option.value = category;
    option.textContent = `${category} (${count})`;
    categoryFilter.append(option);
  });
}
function filteredPrograms() {
  const q = searchInput.value.trim().toLowerCase();
  const c = categoryFilter.value;
  const s = statusFilter.value;
  return programs.filter(p => (!c || p.category === c)
    && (!s || p.status === s || (s === 'Legacy applet' && p.category === 'Applets'))
    && (!q || `${p.title} ${p.category} ${p.number}`.toLowerCase().includes(q)));
}
function renderList() {
  const items = filteredPrograms();
  resultCount.textContent = `${items.length} matching program${items.length === 1 ? '' : 's'}`;
  programList.replaceChildren();
  if (!items.length) {
    programList.append(make('div', 'no-results', 'No programs match this search. Try another word or category.'));
    return;
  }
  items.forEach(p => {
    const row = make('button', 'program-row' + (selectedId === p.sourcePath ? ' selected' : ''));
    const title = make('span', 'row-title', `${String(p.number).padStart(2, '0')}. ${p.title}`);
    const meta = make('span', 'row-meta');
    meta.append(make('span', 'row-no', p.category));
    meta.append(make('span', 'dot' + (p.category === 'Applets' ? ' legacy' : '')));
    meta.append(document.createTextNode(p.status));
    row.append(title, meta);
    row.addEventListener('click', () => {
      selectedId = p.sourcePath;
      renderList();
      renderDetail(p);
    });
    programList.append(row);
  });
  const current = items.find(p => p.sourcePath === selectedId);
  if (!current) {
    selectedId = items[0].sourcePath;
    renderListSelectionOnly();
    renderDetail(items[0]);
  }
}
function renderListSelectionOnly() {
  [...programList.querySelectorAll('.program-row')].forEach(row => row.classList.remove('selected'));
  const idx = filteredPrograms().findIndex(p => p.sourcePath === selectedId);
  const row = programList.querySelectorAll('.program-row')[idx];
  if (row) row.classList.add('selected');
}
function renderDetail(p) {
  detailPane.replaceChildren();
  const head = make('div', 'detail-head');
  const left = make('div');
  left.append(make('p', 'detail-kicker', `Program ${String(p.number).padStart(2, '0')}`));
  left.append(make('h2', '', p.title));
  left.append(make('div', 'detail-category', p.category));
  const status = make('span', 'status-pill' + (p.category === 'Applets' ? ' legacy' : ''), p.status);
  head.append(left, status);
  detailPane.append(head);

  const actions = make('div', 'action-row');
  const copy = make('button', 'action primary', 'Copy source code');
  copy.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(p.code);
      copy.textContent = 'Copied!';
      setTimeout(() => copy.textContent = 'Copy source code', 1400);
    } catch (e) {
      const area = document.createElement('textarea');
      area.value = p.code;
      document.body.append(area);
      area.select();
      document.execCommand('copy');
      area.remove();
      copy.textContent = 'Copied!';
      setTimeout(() => copy.textContent = 'Copy source code', 1400);
    }
  });
  const download = make('button', 'action', 'Download .java');
  download.addEventListener('click', () => {
    const blob = new Blob([p.code], {type:'text/x-java-source;charset=utf-8'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = p.sourcePath.split('/').pop();
    a.click();
    URL.revokeObjectURL(url);
  });
  const sourceLink = make('a', 'action', 'Open source file');
  sourceLink.href = `../${p.sourcePath}`;
  sourceLink.target = '_blank';
  sourceLink.rel = 'noopener';
  actions.append(copy, download, sourceLink);
  detailPane.append(actions);

  detailPane.append(make('div', 'section-label', 'JAVA SOURCE CODE'));
  const code = make('pre');
  const codeEl = make('code', '', p.code);
  code.append(codeEl);
  detailPane.append(code);

  detailPane.append(make('div', 'section-label', 'OUTPUT / RUN NOTES'));
  const note = make('div', 'run-note');
  note.append(make('strong', '', 'What to expect'));
  note.append(document.createTextNode(p.output || 'Run the program with the requested inputs and check the console output.'));
  detailPane.append(note);

  detailPane.append(make('div', 'section-label', 'FILE LOCATION'));
  detailPane.append(make('div', 'path', p.sourcePath));
  if (p.category === 'Applets') {
    const warning = make('div', 'run-note');
    warning.style.marginTop = '10px';
    warning.append(make('strong', '', 'Compatibility note'));
    warning.append(document.createTextNode('Applet APIs were removed from modern JDKs. These examples are kept as legacy syllabus source and may require an older compatible Java environment.'));
    detailPane.append(warning);
  }
  if (p.category === 'Java Database Connectivity') {
    const warning = make('div', 'run-note');
    warning.style.marginTop = '10px';
    warning.append(make('strong', '', 'Database note'));
    warning.append(document.createTextNode('JDBC programs require MySQL Connector/J, a running MySQL service, and database credentials configured locally.'));
    detailPane.append(warning);
  }
}
searchInput.addEventListener('input', renderList);
categoryFilter.addEventListener('change', () => {
  selectedId = null;
  allProgramsButton.classList.toggle('active', !categoryFilter.value);
  [...categoryNav.querySelectorAll('.nav-link')].forEach(b => b.classList.toggle('active', b.dataset.category === categoryFilter.value));
  renderList();
});
statusFilter.addEventListener('change', renderList);
buildCategoryNav();
renderList();
