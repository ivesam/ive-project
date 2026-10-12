(() => {
  const byId = id => document.getElementById(id);
  const status = byId('tracker-status');
  if (!status) return;
  const fmt = new Intl.NumberFormat('en-US');
  const dateFmt = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });
  const timeFmt = new Intl.DateTimeFormat('en-GB', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Seoul' });
  const dayLabel = day => dateFmt.format(new Date(day + 'T00:00:00Z'));
  const signed = n => (n > 0 ? '+' : n < 0 ? '−' : '') + fmt.format(Math.abs(n));
  let records = [], selectedId;
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
    if (comment) byId('tracker-comment-link').href = 'https://www.youtube.com/watch?v=' + selectedId + '&lc=' + encodeURIComponent(comment.id);
    byId('tracker-rows').querySelectorAll('button').forEach(button => {
      button.setAttribute('aria-pressed', String(button.dataset.index === String(index)));
    });
  }
  function renderChart() {
    const holder = byId('tracker-chart'); holder.replaceChildren();
    if (records.length < 2) { holder.textContent = 'The trend appears after two daily snapshots.'; return; }
    const ns = 'http://www.w3.org/2000/svg', svg = document.createElementNS(ns, 'svg');
    svg.setAttribute('viewBox', '0 0 800 180'); svg.setAttribute('role', 'img');
    svg.setAttribute('aria-label', 'Total views from ' + dayLabel(records[0].date) + ' to ' + dayLabel(records.at(-1).date));
    const min = Math.min(...records.map(r => r.views)), max = Math.max(...records.map(r => r.views));
    const first = Date.parse(records[0].date), span = Date.parse(records.at(-1).date) - first;
    const points = records.map(r => [20 + (Date.parse(r.date) - first) / span * 760, 155 - (r.views - min) / (max - min || 1) * 130]);
    const line = document.createElementNS(ns, 'polyline'); line.setAttribute('points', points.map(p => p.join(',')).join(' ')); line.setAttribute('fill', 'none'); line.setAttribute('stroke', 'currentColor'); line.setAttribute('stroke-width', '3'); svg.append(line);
    points.forEach(([x, y], i) => {
      const dot = document.createElementNS(ns, 'circle'); dot.setAttribute('cx', x); dot.setAttribute('cy', y); dot.setAttribute('r', '4'); dot.setAttribute('fill', 'currentColor');
      const title = document.createElementNS(ns, 'title'); title.textContent = dayLabel(records[i].date) + ': ' + fmt.format(records[i].views) + ' views'; dot.append(title); svg.append(dot);
    });
    holder.append(svg);
    const range = document.createElement('p'); range.className = 'tracker-note'; range.textContent = dayLabel(records[0].date) + ' — ' + dayLabel(records.at(-1).date) + ' · ' + fmt.format(min) + '–' + fmt.format(max) + ' total views'; holder.append(range);
  }
  function selectVideo(video) {
    selectedId = video.video_id;
    records = [...video.snapshots].sort((a, b) => a.date.localeCompare(b.date));
    byId('tracker-videos').querySelectorAll('button').forEach(button => {
      const active = button.dataset.video === selectedId;
      button.setAttribute('aria-pressed', String(active));
      button.querySelector('.tracker-card-action').textContent = active ? 'Viewing daily stats' : 'View daily stats →';
      button.querySelector('.tracker-card-state').textContent = active ? 'SELECTED' : 'TRACKING';
    });
    byId('tracker-watch').href = 'https://www.youtube.com/watch?v=' + selectedId;
    byId('tracker-title').textContent = video.title || 'YouTube video';
    const selector = byId('tracker-day'), rows = byId('tracker-rows'); selector.replaceChildren(); rows.replaceChildren();
    byId('tracker-content').hidden = !records.length;
    if (!records.length) { status.textContent = 'Tracking starts with the next daily capture. Daily changes appear after two consecutive days.'; return; }
    records.forEach((record, index) => {
      const option = document.createElement('option'); option.value = String(index); option.textContent = dayLabel(record.date); selector.prepend(option);
      const row = document.createElement('tr'), dateCell = document.createElement('td'), button = document.createElement('button');
      button.type = 'button'; button.dataset.index = String(index); button.textContent = dayLabel(record.date); button.addEventListener('click', () => selectDay(index)); dateCell.append(button); row.append(dateCell);
      const totalCell = document.createElement('td'); totalCell.textContent = fmt.format(record.views); row.append(totalCell);
      const deltaCell = document.createElement('td'), delta = difference(index); deltaCell.textContent = delta === null ? '—' : signed(delta); row.append(deltaCell); rows.prepend(row);
    });
    selectDay(records.length - 1); renderChart();
    status.textContent = Date.now() - Date.parse(records.at(-1).captured_at) > 36 * 3600000 ? 'Showing the last recorded counts. This video’s latest snapshot is older than a day.' : 'Daily snapshots · comment likes measured at capture time';
  }
  async function load() {
    try {
      const response = await fetch('assets/youtube/daily.json', { cache: 'no-store' });
      if (!response.ok) throw new Error('history unavailable');
      const data = await response.json(), videos = data.videos || [data], ids = new Set();
      if (!Array.isArray(videos) || !videos.length) throw new Error('empty watchlist');
      for (const video of videos) {
        if (!/^[A-Za-z0-9_-]{11}$/.test(video.video_id) || ids.has(video.video_id) || !Array.isArray(video.snapshots)) throw new Error('invalid video'); ids.add(video.video_id);
        const dates = new Set();
        for (const record of video.snapshots) {
          if (!/^\d{4}-\d{2}-\d{2}$/.test(record.date) || !Number.isFinite(Date.parse(record.date)) || !Number.isFinite(Date.parse(record.captured_at)) || !Number.isSafeInteger(record.views) || record.views < 0 || dates.has(record.date)) throw new Error('invalid snapshot'); dates.add(record.date);
        }
      }
      byId('tracker-count').textContent = videos.length + (videos.length === 1 ? ' video' : ' videos') + ' · updated daily in KST';
      for (const video of videos) {
        const button = document.createElement('button'); button.type = 'button'; button.className = 'tracker-video-card'; button.dataset.video = video.video_id;
        const media = document.createElement('span'); media.className = 'tracker-card-media';
        const image = document.createElement('img'); image.src = 'https://i.ytimg.com/vi/' + video.video_id + '/hqdefault.jpg'; image.alt = ''; image.width = 480; image.height = 270; image.loading = 'lazy';
        const fallback = document.createElement('span'); fallback.className = 'tracker-thumbnail-fallback'; fallback.textContent = '▶︎'; fallback.setAttribute('aria-hidden', 'true');
        image.addEventListener('error', () => { image.hidden = true; }); media.append(fallback, image);
        const state = document.createElement('span'); state.className = 'tracker-card-state'; state.textContent = 'TRACKING'; media.append(state); button.append(media);
        const copy = document.createElement('span'); copy.className = 'tracker-video-copy';
        const title = document.createElement('strong'); title.textContent = (video.title || 'YouTube video').replace(/^IVE 아이브\s*/i, '').replace(/\s*Video$/i, '').replace(/^[‘'"]|[’'"]$/g, ''); copy.append(title);
        const latest = [...video.snapshots].sort((a, b) => a.date.localeCompare(b.date)).at(-1);
        const total = document.createElement('span'); total.className = 'tracker-card-total'; total.textContent = latest ? fmt.format(latest.views) + ' views' : 'Awaiting first capture'; copy.append(total);
        const date = document.createElement('span'); date.className = 'tracker-card-date'; date.textContent = latest ? 'Last captured ' + dayLabel(latest.date) + ' · KST' : 'Daily capture at 23:55 KST'; copy.append(date);
        const action = document.createElement('span'); action.className = 'tracker-card-action'; action.textContent = 'View daily stats →'; copy.append(action); button.append(copy);
        button.addEventListener('click', () => selectVideo(video)); byId('tracker-videos').append(button);
      }
      byId('tracker-day').addEventListener('change', () => selectDay(Number(byId('tracker-day').value)));
      selectVideo(videos[0]);
    } catch {
      byId('tracker-content').hidden = true; status.textContent = 'Daily history is unavailable right now. Please try again later.';
    }
  }
  load();
})();
