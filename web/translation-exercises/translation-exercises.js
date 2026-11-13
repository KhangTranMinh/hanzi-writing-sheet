const content = document.querySelector('#content');
const status = document.querySelector('#status');
const id = new URLSearchParams(location.search).get('id');
const idPattern = /^\d{4}-\d{2}-\d{2}_\d{2}-\d{2}-\d{2}(?:-\d+)?$/;

async function loadJSON(path) {
  const response = await fetch(path, { cache: 'no-cache' });
  if (!response.ok) throw new Error('Không tải được dữ liệu');
  return response.json();
}

function dateLabel(id) {
  const match = id.match(/^(\d{4})-(\d{2})-(\d{2})_(\d{2})-(\d{2})-(\d{2})/);
  const date = new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])));
  const weekday = ['Chủ nhật', 'Thứ hai', 'Thứ ba', 'Thứ tư', 'Thứ năm', 'Thứ sáu', 'Thứ bảy'][date.getUTCDay()];
  return `Tạo lúc ${match[4]}:${match[5]}:${match[6]}, ${weekday.toLowerCase()}, ngày ${match[3]}/${match[2]}/${match[1]}`;
}

function normalizeAnswer(value) {
  return value.normalize('NFKC').replace(/[\s\p{P}]/gu, '');
}

function makeCard(exercise, index) {
  const card = document.createElement('article');
  card.className = 'translation-card';
  const label = document.createElement('label');
  label.htmlFor = `answer-${index}`;
  const number = document.createElement('span');
  number.className = 'translation-number';
  number.textContent = `Câu ${index + 1}`;
  const question = document.createElement('strong');
  question.textContent = exercise.question;
  label.append(number, question);
  const input = document.createElement('textarea');
  input.id = label.htmlFor;
  input.className = 'translation-input';
  input.rows = 1;
  input.placeholder = 'Nhập câu tiếng Hoa…';
  input.lang = 'zh-Hans';
  const button = document.createElement('button');
  button.className = 'translation-check';
  button.type = 'button';
  button.textContent = 'Check đáp án';
  button.setAttribute('aria-expanded', 'false');
  const answer = document.createElement('div');
  answer.className = 'translation-answer';
  answer.hidden = true;
  answer.id = `solution-${index}`;
  button.setAttribute('aria-controls', answer.id);
  const answerLabel = document.createElement('span');
  answerLabel.textContent = 'Đáp án';
  const hanzi = document.createElement('strong');
  hanzi.lang = 'zh-Hans';
  hanzi.textContent = exercise.hanzi;
  const pinyin = document.createElement('p');
  pinyin.textContent = exercise.pinyin;
  answer.append(answerLabel, hanzi, pinyin);
  const feedback = document.createElement('p');
  feedback.className = 'translation-feedback';
  feedback.setAttribute('role', 'status');
  input.addEventListener('input', () => {
    input.classList.remove('is-correct', 'is-incorrect', 'is-shaking');
    input.removeAttribute('aria-invalid');
    feedback.textContent = '';
  });
  button.addEventListener('click', () => {
    const correct = normalizeAnswer(input.value) === normalizeAnswer(exercise.hanzi);
    input.classList.remove('is-correct', 'is-incorrect', 'is-shaking');
    void input.offsetWidth; // Restart the shake for repeated incorrect checks.
    input.classList.add(correct ? 'is-correct' : 'is-incorrect');
    if (!correct) input.classList.add('is-shaking');
    input.setAttribute('aria-invalid', String(!correct));
    feedback.textContent = correct ? 'Chính xác!' : 'Chưa đúng, hãy xem đáp án bên dưới.';
    answer.hidden = false;
    button.setAttribute('aria-expanded', 'true');
  });
  card.append(label, input, button, feedback, answer);
  return card;
}

async function show() {
  try {
    if (id !== null) {
      if (!idPattern.test(id)) throw new Error('invalid');
      const data = await loadJSON(`../data/translation-exercises/${id}.json`);
      if (!Array.isArray(data.exercises) || data.exercises.some(item => !item || ['question', 'hanzi', 'pinyin'].some(key => typeof item[key] !== 'string' || !item[key].trim()))) throw new Error('invalid');
      document.querySelector('#page-title').textContent = 'Luyện dịch';
      document.querySelector('#page-description').textContent = `${dateLabel(id)} · ${data.exercises.length} câu`;
      const back = document.querySelector('#back-link');
      back.href = './';
      back.textContent = '← Danh sách bài tập';
      if (!data.exercises.length) { status.textContent = 'Bài tập này chưa có câu hỏi.'; return; }
      const cards = document.createElement('div');
      cards.className = 'translation-cards';
      data.exercises.forEach((exercise, index) => cards.append(makeCard(exercise, index)));
      content.append(cards);
    } else {
      const ids = await loadJSON('index.json');
      if (!Array.isArray(ids) || ids.some(item => typeof item !== 'string' || !idPattern.test(item))) throw new Error('invalid');
      if (!ids.length) { status.textContent = 'Chưa có bài tập nào.'; return; }
      const list = document.createElement('nav');
      list.className = 'home-options';
      list.setAttribute('aria-label', 'Chọn bài tập dịch');
      [...new Set(ids)].sort().reverse().forEach(item => {
        const link = document.createElement('a');
        link.className = 'home-option';
        link.href = `?id=${encodeURIComponent(item)}`;
        const label = document.createElement('strong');
        label.textContent = dateLabel(item);
        const arrow = document.createElement('span');
        arrow.className = 'option-arrow';
        arrow.setAttribute('aria-hidden', 'true');
        arrow.textContent = '→';
        link.append(label, arrow);
        list.append(link);
      });
      content.append(list);
    }
    status.textContent = '';
  } catch {
    status.textContent = 'Không thể tải bài tập. Vui lòng kiểm tra dữ liệu và thử lại.';
  }
}
show();
