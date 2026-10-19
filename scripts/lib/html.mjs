export const esc = (v) => String(v ?? "").replace(/[&<>'"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" }[c]));
/** 본문 텍스트: 이스케이프 후 '(의역)' 표시를 작은 배지로 바꿉니다. */
export const txt = (v) => esc(v).replace(/\(의역\)/g, '<span class="para" title="원문을 우리말로 풀어 옮긴 인용입니다">의역</span>');
