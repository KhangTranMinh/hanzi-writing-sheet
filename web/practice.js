(() => {
  "use strict";

  const status = document.querySelector("#practice-status");
  const card = document.querySelector("#practice-card");
  const hanzi = document.querySelector("#card-hanzi");
  const pinyin = document.querySelector("#card-pinyin");
  const hint = document.querySelector("#practice-hint");
  const retry = document.querySelector("#practice-retry");
  let items = [];
  let index = 0;
  let flipped = false;
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
    flipped = false;
    card.classList.remove("is-flipped");
    card.disabled = false;
    card.setAttribute("aria-label", "Lật thẻ để xem pinyin");
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
      const response = await fetch("practice-data.json");
      if (!response.ok) throw new Error("Không tải được danh sách luyện tập.");
      const data = await response.json();
      if (!Array.isArray(data) || !data.length) throw new Error("Danh sách luyện tập đang trống hoặc không hợp lệ.");
      const prepared = data.map((item, i) => {
        if (!item || typeof item !== "object" || typeof item.hanzi !== "string" || !item.hanzi.trim()) {
          throw new Error(`Mục ${i + 1} cần có chữ Hán.`);
        }
        if (item.pinyin != null && typeof item.pinyin !== "string") {
          throw new Error(`Pinyin ở mục ${i + 1} không hợp lệ.`);
        }
        const text = item.hanzi.trim();
        let reading = item.pinyin?.trim();
        if (!reading) {
          if (typeof window.pinyinPro?.pinyin !== "function") throw new Error("Không tải được thư viện pinyin.");
          reading = window.pinyinPro.pinyin(text);
          if (!reading || reading === text) throw new Error(`Không tìm được pinyin cho “${text}”.`);
        }
        return { ...item, hanzi: text, pinyin: reading };
      });
      items = shuffle(prepared);
      index = 0;
      showCard();
    } catch (error) {
      status.textContent = error instanceof SyntaxError ? "File danh sách luyện tập không phải JSON hợp lệ." : (error.message || "Không thể chuẩn bị thẻ.");
      retry.textContent = "Thử lại";
      retry.hidden = false;
    }
  }

  card.addEventListener("click", () => {
    if (flipped) return;
    flipped = true;
    card.classList.add("is-flipped");
    card.setAttribute("aria-label", `Pinyin: ${items[index].pinyin}`);
    hint.textContent = "Đang chuyển sang thẻ tiếp theo…";
    timer = setTimeout(() => {
      card.classList.remove("card-enter");
      card.classList.add("card-exit");
    }, 1500);
  });
  card.addEventListener("animationend", (event) => {
    if (event.target !== card) return;
    if (event.animationName === "card-exit") {
      card.classList.remove("card-exit");
      index++;
      hint.textContent = "Chạm vào thẻ để lật";
      showCard();
      if (!card.hidden) card.classList.add("card-enter");
    } else if (event.animationName === "card-enter") {
      card.classList.remove("card-enter");
    }
  });
  retry.addEventListener("click", start);
  start();
})();
