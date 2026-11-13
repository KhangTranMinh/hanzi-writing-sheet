(() => {
  "use strict";

  // Use "manual" to advance on tap, or "automatic" to advance after 1.5 seconds.
  const ADVANCE_MODE = "manual";
  const AUTO_ADVANCE_DELAY = 1500;
  const status = document.querySelector("#practice-status");
  const card = document.querySelector("#practice-card");
  const hanzi = document.querySelector("#card-hanzi");
  const pinyin = document.querySelector("#card-pinyin");
  const meaning = document.querySelector("#card-meaning");
  const hint = document.querySelector("#practice-hint");
  const retry = document.querySelector("#practice-retry");
  let items = [];
  let index = 0;
  let revealed = false;
  let timer;

  function shuffle(list) {
    const result = [...list];
    for (let i = result.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
  }

  function showCard() {
    revealed = false;
    card.classList.remove("is-revealed");
    pinyin.setAttribute("aria-hidden", "true");
    meaning.setAttribute("aria-hidden", "true");
    card.disabled = false;
    card.setAttribute("aria-label", "Chạm để xem pinyin và nghĩa");
    if (index >= items.length) {
      card.hidden = true;
      hint.hidden = true;
      status.textContent = `Đã hoàn thành ${items.length} thẻ!`;
      retry.textContent = "Luyện lại";
      retry.hidden = false;
      return;
    }
    hanzi.textContent = items[index].hanzi;
    pinyin.textContent = items[index].pinyin;
    meaning.textContent = items[index].meaning;
    meaning.hidden = !items[index].meaning;
    status.textContent = `Thẻ ${index + 1} / ${items.length}`;
    card.hidden = false;
    hint.hidden = false;
    retry.hidden = true;
  }

  async function start() {
    clearTimeout(timer);
    card.classList.remove("card-exit", "card-enter");
    card.hidden = true;
    hint.hidden = true;
    retry.hidden = true;
    status.textContent = "Đang chuẩn bị thẻ…";
    try {
      const catalogResponse = await fetch("../lessons/index.json", { cache: "no-cache" });
      if (!catalogResponse.ok) throw new Error("Không tải được danh sách bài học.");
      const catalog = await catalogResponse.json();
      if (!Array.isArray(catalog) || catalog.some(id => typeof id !== "string" || !/^\d{4}-\d{4}$/.test(id))) {
        throw new Error("Danh sách bài học không hợp lệ.");
      }
      const ids = [...new Set(catalog)].filter(id => id !== "0000-0000").sort();
      const lessons = await Promise.all(ids.map(async id => {
        const response = await fetch(`../data/lessons/${id}.json`, { cache: "no-cache" });
        if (!response.ok) throw new Error(`Không tải được bài học ${id}.`);
        const lesson = await response.json();
        if (!lesson || !Array.isArray(lesson.items)) throw new Error(`Bài học ${id} không hợp lệ.`);
        return lesson.items;
      }));
      const data = lessons.flat();
      if (!data.length) throw new Error("Danh sách luyện tập đang trống.");
      const prepared = data.map((item, i) => {
        if (!item || typeof item !== "object" || typeof item.hanzi !== "string" || !item.hanzi.trim()) {
          throw new Error(`Mục ${i + 1} cần có chữ Hán.`);
        }
        if (item.pinyin != null && typeof item.pinyin !== "string") {
          throw new Error(`Pinyin ở mục ${i + 1} không hợp lệ.`);
        }
        if (item.meaning != null && typeof item.meaning !== "string") {
          throw new Error(`Nghĩa ở mục ${i + 1} không hợp lệ.`);
        }
        const text = item.hanzi.trim();
        let reading = item.pinyin?.trim();
        if (!reading) {
          if (typeof window.pinyinPro?.pinyin !== "function") throw new Error("Không tải được thư viện pinyin.");
          reading = window.pinyinPro.pinyin(text);
          if (!reading || reading === text) throw new Error(`Không tìm được pinyin cho “${text}”.`);
        }
        return { ...item, hanzi: text, pinyin: reading, meaning: item.meaning?.trim() || "" };
      });
      const seen = new Set();
      items = shuffle(prepared.filter(item => {
        if (seen.has(item.hanzi)) return false;
        seen.add(item.hanzi);
        return true;
      }));
      index = 0;
      showCard();
    } catch (error) {
      status.textContent = error instanceof SyntaxError ? "File danh sách luyện tập không phải JSON hợp lệ." : (error.message || "Không thể chuẩn bị thẻ.");
      retry.textContent = "Thử lại";
      retry.hidden = false;
    }
  }

  function advance() {
    clearTimeout(timer);
    card.classList.remove("card-enter");
    card.classList.add("card-exit");
  }

  card.addEventListener("click", () => {
    if (card.classList.contains("card-exit")) return;
    if (revealed) {
      advance();
      return;
    }
    revealed = true;
    card.classList.add("is-revealed");
    pinyin.setAttribute("aria-hidden", "false");
    meaning.setAttribute("aria-hidden", "false");
    card.setAttribute("aria-label", `Pinyin: ${items[index].pinyin}.${items[index].meaning ? ` Nghĩa: ${items[index].meaning}.` : ""} Chạm để chuyển thẻ tiếp theo`);
    hint.textContent = ADVANCE_MODE === "automatic"
      ? "Chạm để chuyển ngay, hoặc chờ thẻ tiếp theo…"
      : "Chạm vào thẻ để tiếp tục";
    if (ADVANCE_MODE === "automatic") timer = setTimeout(advance, AUTO_ADVANCE_DELAY);
  });
  card.addEventListener("animationend", (event) => {
    if (event.target !== card) return;
    if (event.animationName === "card-exit") {
      card.classList.remove("card-exit");
      index++;
      hint.textContent = "Chạm vào thẻ để xem pinyin và nghĩa";
      showCard();
      if (!card.hidden) card.classList.add("card-enter");
    } else if (event.animationName === "card-enter") {
      card.classList.remove("card-enter");
    }
  });
  retry.addEventListener("click", start);
  start();
})();
