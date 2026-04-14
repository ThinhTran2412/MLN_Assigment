/**
 * parser.js — Chương III: Giai cấp & Dân tộc
 * Đọc file questions_ch3.txt và parse thành mảng câu hỏi JS
 * Tái sử dụng: chỉ cần thay đường dẫn file TXT → dùng cho chương khác
 */

const QuestionParser = (() => {
  /**
   * Parse raw TXT content thành mảng câu hỏi
   * @param {string} rawText - Nội dung file TXT
   * @returns {Array<Object>} - Mảng câu hỏi đã parse
   */
  function parseText(rawText) {
    const questions = [];

    // Tách thành các block theo dấu "---"
    const blocks = rawText.split(/^---$/m).map(b => b.trim()).filter(b => b && !b.startsWith('#'));

    for (const block of blocks) {
      try {
        const q = parseBlock(block);
        if (q) questions.push(q);
      } catch (e) {
        console.warn('Lỗi parse block:', e, block.substring(0, 50));
      }
    }

    return questions;
  }

  /**
   * Parse một block câu hỏi thành object
   */
  function parseBlock(block) {
    const lines = block.split('\n').map(l => l.trim()).filter(l => l);
    const obj = {};

    for (const line of lines) {
      const colonIdx = line.indexOf(':');
      if (colonIdx === -1) continue;

      const key = line.substring(0, colonIdx).trim().toUpperCase();
      const value = line.substring(colonIdx + 1).trim();

      switch (key) {
        case 'ID':        obj.id = value; break;
        case 'DIFFICULTY': obj.difficulty = parseInt(value, 10); break;
        case 'TYPE':      obj.type = value; break;
        case 'QUESTION':  obj.question = value; break;
        case 'A':         obj.optionA = value; break;
        case 'B':         obj.optionB = value; break;
        case 'C':         obj.optionC = value; break;
        case 'D':         obj.optionD = value; break;
        case 'ANSWER':    obj.answer = value.toUpperCase(); break;
        case 'EXPLANATION': obj.explanation = value; break;
        default: break;
      }
    }

    // Validate
    if (!obj.id || !obj.question || !obj.answer) return null;
    if (!obj.optionA || !obj.optionB || !obj.optionC || !obj.optionD) return null;

    // Tạo mảng options để dễ render
    obj.options = [
      { key: 'A', text: obj.optionA },
      { key: 'B', text: obj.optionB },
      { key: 'C', text: obj.optionC },
      { key: 'D', text: obj.optionD },
    ];

    return obj;
  }

  /**
   * Fetch file TXT từ server (hoạt động khi chạy qua localhost/live server)
   * @param {string} filePath - Đường dẫn tới file TXT (relative)
   * @returns {Promise<Array>} - Mảng câu hỏi
   */
  async function loadFromFile(filePath) {
    try {
      const response = await fetch(filePath);
      if (!response.ok) throw new Error(`HTTP ${response.status}: ${filePath}`);
      const text = await response.text();
      return parseText(text);
    } catch (err) {
      console.error('Không thể tải file câu hỏi:', err);
      return [];
    }
  }

  /**
   * Lọc câu hỏi theo độ khó
   * @param {Array} questions
   * @param {number|null} difficulty - null = tất cả
   */
  function filterByDifficulty(questions, difficulty = null) {
    if (difficulty === null) return [...questions];
    return questions.filter(q => q.difficulty === difficulty);
  }

  /**
   * Xáo trộn mảng (Fisher-Yates shuffle)
   */
  function shuffle(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  /**
   * Lấy câu hỏi theo cấu trúc chặng (Stages)
   * @param {Array} questions - Tất cả câu hỏi đã parse
   * @param {string} mode - 'learn' (50 câu) hoặc 'test' (15 câu)
   */
  function buildBattleQueue(questions, mode = 'learn') {
    const pools = [
      {
        name: "Chặng 1: Nguồn gốc",
        ids: ["001", "002", "003", "006", "021", "043"],
        testCount: 3
      },
      {
        name: "Chặng 2: Mâu thuẫn",
        ids: ["004", "010", "013", "014", "015", "016", "030", "041", "042", "048", "049"],
        testCount: 4
      },
      {
        name: "Chặng 3: Cách mạng",
        ids: ["005", "008", "009", "011", "012", "022", "023", "024", "026", "027", "031", "033", "034", "037", "040", "044", "047"],
        testCount: 4
      },
      {
        name: "Chặng 4: Thời đại",
        ids: ["007", "017", "018", "019", "020", "025", "028", "029", "032", "035", "036", "038", "039", "045", "046", "050"],
        testCount: 4
      }
    ];

    let queue = [];
    
    for (const pool of pools) {
      // Find all questions in this pool
      const poolQs = questions.filter(q => pool.ids.includes(q.id));
      let selected = [];

      if (mode === 'test') {
        // Shuffle and pick specific count
        const shuffled = shuffle(poolQs);
        selected = shuffled.slice(0, pool.testCount);
      } else {
        // Learn mode: use all questions in the pool sequentially
        selected = poolQs;
      }

      // Assign stage name
      selected.forEach(q => {
        q.stageName = pool.name;
      });
      queue = queue.concat(selected);
    }
    
    return queue;
  }

  // Public API
  return {
    parseText,
    loadFromFile,
    filterByDifficulty,
    shuffle,
    buildBattleQueue,
  };
})();

// Export cho module environment (nếu dùng)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = QuestionParser;
}
