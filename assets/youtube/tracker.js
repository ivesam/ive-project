(() => {
  const byId = id => document.getElementById(id);
  const status = byId('tracker-status');
  if (!status) return;
  const fmt = new Intl.NumberFormat('en-US');
  const dateFmt = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });
  const timeFmt = new Intl.DateTimeFormat('en-GB', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Seoul' });
  const dayLabel = day => dateFmt.format(new Date(day + 'T00:00:00Z'));
  const signed = n => (n > 0 ? '+' : n < 0 ? '−' : '') + fmt.format(Math.abs(n));
  let records = [];
  function difference(index) {
    if (index < 1) return null;
    const current = records[index], previous = records[index - 1];
    if (Date.parse(current.date) - Date.parse(previous.date) !== 86400000) return null;
    return current.views - previous.views;
  }
  function selectDay(index) {
    const record = records[index], delta = difference(index);
    byId('tracker-day').value = String(index);
    byId('tracker-views').textContent = fmt.format(record.views);
    byId('tracker-gain').textContent = delta === null ? '—' : signed(delta);
    byId('tracker-growth').textContent = delta === null ? 'No snapshot for the previous day' : records[index - 1].views ? signed(Math.round(delta / records[index - 1].views * 10000) / 100) + '%' : 'Percentage unavailable from a zero baseline';
    byId('tracker-captured').textContent = 'Captured ' + timeFmt.format(new Date(record.captured_at)) + ' KST';
    const comment = record.top_comment;
    byId('tracker-comment-text').textContent = comment ? comment.text : record.comment_status === 'disabled' ? 'Comments are disabled for this video.' : 'No comments posted this day were available at capture time.';
    byId('tracker-comment-meta').textContent = comment ? comment.author + ' · ' + fmt.format(comment.likes) + ' likes at capture' : '';
    byId('tracker-comment-link').hidden = !comment;
    if (comment) byId('tracker-comment-link').href = 'https://www.youtube.com/watch?v=XJzRgeX-bwo&lc=' + encodeURIComponent(comment.id);
    byId('tracker-rows').querySelectorAll('button').forEach(button => {
      button.setAttribute('aria-pressed', String(button.dataset.index === String(index)));
    });
  }
  async function load() {
    try {
      const response = await fetch('assets/youtube/daily.json', { cache: 'no-store' });
      if (!response.ok) throw new Error('history unavailable');
      const data = await response.json();
      if (data.video_id !== 'XJzRgeX-bwo' || !Array.isArray(data.snapshots)) throw new Error('invalid history');
      records = [...data.snapshots].sort((a, b) => a.date.localeCompare(b.date));
      const dates = new Set();
      for (const record of records) {
        if (!/^\d{4}-\d{2}-\d{2}$/.test(record.date) || !Number.isFinite(Date.parse(record.date)) || !Number.isFinite(Date.parse(record.captured_at)) || !Number.isSafeInteger(record.views) || record.views < 0 || dates.has(record.date)) throw new Error('invalid snapshot');
        dates.add(record.date);
      }
      if (!records.length) {
        status.textContent = 'Your daily story starts here. The first snapshot will appear once tracking begins; daily changes follow after two consecutive days.';
        return;
      }
      byId('tracker-title').textContent = data.title || 'Daily video tracker';
      const selector = byId('tracker-day'), rows = byId('tracker-rows');
      records.forEach((record, index) => {
        const option = document.createElement('option'); option.value = String(index); option.textContent = dayLabel(record.date); selector.prepend(option);
        const row = document.createElement('tr'), dateCell = document.createElement('td'), button = document.createElement('button');
        button.type = 'button'; button.dataset.index = String(index); button.textContent = dayLabel(record.date); button.addEventListener('click', () => selectDay(index)); dateCell.append(button); row.append(dateCell);
        const totalCell = document.createElement('td'); totalCell.textContent = fmt.format(record.views); row.append(totalCell);
        const deltaCell = document.createElement('td'), delta = difference(index); deltaCell.textContent = delta === null ? '—' : signed(delta); row.append(deltaCell); rows.prepend(row);
      });
      selector.addEventListener('change', () => selectDay(Number(selector.value)));
      selectDay(records.length - 1);
      const latest = records[records.length - 1];
      const age = Date.now() - Date.parse(latest.captured_at);
      status.textContent = age > 36 * 3600000 ? 'The latest snapshot is older than a day. Showing the last recorded counts.' : 'Daily snapshots · comment likes measured at capture time';
      byId('tracker-content').hidden = false;
    } catch {
      byId('tracker-content').hidden = true;
      status.textContent = 'Daily history is unavailable right now. Please try again later.';
    }
  }
  load();
})();
