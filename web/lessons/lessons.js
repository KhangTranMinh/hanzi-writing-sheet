const content = document.querySelector('#lesson-content');
const status = document.querySelector('#lesson-status');
const title = document.querySelector('#page-title');
const description = document.querySelector('#page-description');
const back = document.querySelector('#back-link');
const params = new URLSearchParams(location.search);
const part = params.get('part');
const lesson = params.get('lesson');
const idPattern = /^\d{4}$/;

function link(label, href, detail) {
  const a = document.createElement('a');
  a.className = 'home-option';
  a.href = href;
  const text = document.createElement('span');
  const strong = document.createElement('strong');
  strong.textContent = label;
  text.append(strong);
  if (detail) {
    const small = document.createElement('small');
    small.textContent = detail;
    text.append(small);
  }
  const arrow = document.createElement('span');
  arrow.className = 'option-arrow';
  arrow.setAttribute('aria-hidden', 'true');
  arrow.textContent = '→';
  a.append(text, arrow);
  return a;
}

async function loadJSON(path) {
  const response = await fetch(path, { cache: 'no-cache' });
  if (!response.ok) throw new Error('Không tải được dữ liệu');
  return response.json();
}

async function show() {
  try {
    if ((part && !idPattern.test(part)) || (lesson && (!part || !idPattern.test(lesson)))) {
      throw new Error('Đường dẫn bài học không hợp lệ.');
    }
    if (lesson) {
      title.textContent = `Phần ${Number(part)} · Bài ${Number(lesson)}`;
      description.textContent = 'Chữ Hán, pinyin và nghĩa của bài học.';
      back.href = `?part=${part}`;
      back.textContent = '← Danh sách bài học';
      const data = await loadJSON(`../data/lessons/${part}-${lesson}.json`);
      if (!data || typeof data.title !== 'string' || !data.title.trim()) throw new Error('Dữ liệu bài học không hợp lệ.');
      title.textContent = `Bài ${Number(lesson)} · ${data.title}`;
      description.textContent = `Phần ${Number(part)} · Bài ${Number(lesson)}`;
      const cards = data.items;
      if (!Array.isArray(cards) || cards.some(card => !card || typeof card.hanzi !== 'string' || !card.hanzi.trim() || typeof card.pinyin !== 'string' || !card.pinyin.trim() || typeof card.meaning !== 'string' || !card.meaning.trim())) {
        throw new Error('Dữ liệu bài học không hợp lệ.');
      }
      if (!cards.length) { status.textContent = 'Bài học này chưa có thẻ.'; return; }
      const grid = document.createElement('div');
      grid.className = 'lesson-cards';
      cards.forEach(card => {
        const article = document.createElement('article');
        article.className = 'lesson-card';
        for (const [value, className] of [[card.hanzi, 'lesson-hanzi'], [card.pinyin, 'lesson-pinyin'], [card.meaning, 'lesson-meaning']]) {
          const item = document.createElement('p');
          item.className = className;
          item.textContent = value;
          article.append(item);
        }
        grid.append(article);
      });
      content.append(grid);
    } else {
      const catalog = await loadJSON('index.json');
      if (!Array.isArray(catalog) || catalog.some(id => typeof id !== 'string' || !/^\d{4}-\d{4}$/.test(id))) throw new Error('Danh sách bài học không hợp lệ.');
      const ids = [...new Set(catalog)].sort().reverse();
      const lessonTitles = new Map(await Promise.all(ids.map(async id => {
        try {
          const data = await loadJSON(`../data/lessons/${id}.json`);
          return [id, typeof data?.title === 'string' && data.title.trim() ? data.title : 'Chưa có tên'];
        } catch {
          return [id, 'Chưa có tên'];
        }
      })));
      const list = document.createElement('nav');
      list.className = 'home-options';
      const parts = [...new Set(ids.map(id => id.slice(0, 4)))];
      if (!parts.length) { status.textContent = 'Chưa có bài học nào.'; return; }
      if (part && !parts.includes(part)) { status.textContent = 'Phần này chưa có bài học.'; return; }
      list.setAttribute('aria-label', 'Chọn phần và bài học');
      parts.forEach(id => {
        const lessons = ids.filter(item => item.startsWith(`${id}-`));
        const section = document.createElement('details');
        section.className = 'lesson-section';
        section.open = id === part;
        const summary = document.createElement('summary');
        summary.className = 'lesson-section-title';
        const label = document.createElement('span');
        const strong = document.createElement('strong');
        strong.textContent = `Phần ${Number(id)}`;
        const count = document.createElement('small');
        count.textContent = `${lessons.length} bài học`;
        label.append(strong, count);
        summary.append(label);
        const lessonList = document.createElement('div');
        lessonList.className = 'lesson-section-list';
        lessons.forEach(item => lessonList.append(link(`Bài ${Number(item.slice(5))} · ${lessonTitles.get(item)}`, `?part=${id}&lesson=${item.slice(5)}`)));
        section.append(summary, lessonList);
        section.addEventListener('toggle', () => {
          if (section.open) {
            list.querySelectorAll('details').forEach(other => {
              if (other !== section) other.open = false;
            });
          }
        });
        list.append(section);
      });
      content.append(list);
    }
    status.textContent = '';
  } catch (error) {
    status.textContent = error.message === 'Đường dẫn bài học không hợp lệ.' ? error.message : 'Không thể tải bài học. Vui lòng kiểm tra dữ liệu và thử lại.';
  }
}
show();
