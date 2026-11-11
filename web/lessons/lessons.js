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
      const cards = await loadJSON(`data/${part}-${lesson}.json`);
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
      const catalog = await loadJSON('data/index.json');
      if (!Array.isArray(catalog) || catalog.some(id => typeof id !== 'string' || !/^\d{4}-\d{4}$/.test(id))) throw new Error('Danh sách bài học không hợp lệ.');
      const ids = [...new Set(catalog)].sort();
      const list = document.createElement('nav');
      list.className = 'home-options';
      if (part) {
        title.textContent = `Phần ${Number(part)}`;
        description.textContent = 'Chọn bài học để xem các thẻ chữ Hán.';
        back.href = './';
        back.textContent = '← Danh sách phần';
        const lessons = ids.filter(id => id.startsWith(`${part}-`));
        if (!lessons.length) { status.textContent = 'Phần này chưa có bài học.'; return; }
        lessons.forEach(id => list.append(link(`Bài ${Number(id.slice(5))}`, `?part=${part}&lesson=${id.slice(5)}`)));
        list.setAttribute('aria-label', 'Chọn bài học');
      } else {
        const parts = [...new Set(ids.map(id => id.slice(0, 4)))];
        if (!parts.length) { status.textContent = 'Chưa có bài học nào.'; return; }
        parts.forEach(id => {
          const count = ids.filter(item => item.startsWith(`${id}-`)).length;
          list.append(link(`Phần ${Number(id)}`, `?part=${id}`, `${count} bài học`));
        });
        list.setAttribute('aria-label', 'Chọn phần');
      }
      content.append(list);
    }
    status.textContent = '';
  } catch (error) {
    status.textContent = error.message === 'Đường dẫn bài học không hợp lệ.' ? error.message : 'Không thể tải bài học. Vui lòng kiểm tra dữ liệu và thử lại.';
  }
}
show();
