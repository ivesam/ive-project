const modal=document.querySelector('#lightbox');let previousFocus;
function showImage(file,title){previousFocus=document.activeElement;document.querySelector('#lightbox-image').src='assets/'+file;document.querySelector('#lightbox-image').alt=title;document.querySelector('#lightbox-caption').textContent=title;modal.showModal();document.body.style.overflow='hidden'}
document.querySelectorAll('[data-image]').forEach(button=>button.addEventListener('click',()=>showImage(button.dataset.image,button.dataset.title)));
['view-poster','schedule-image'].forEach(id=>document.getElementById(id).addEventListener('click',()=>showImage('official-schedule-poster.jpg','Official comeback schedule · All times in KST')));
modal.querySelector('.close').addEventListener('click',()=>modal.close());modal.addEventListener('click',e=>{if(e.target===modal)modal.close()});modal.addEventListener('close',()=>{document.body.style.overflow='';previousFocus?.focus()});
const observer=new IntersectionObserver(entries=>{entries.forEach(entry=>{if(entry.isIntersecting){document.querySelectorAll('nav a').forEach(a=>a.classList.toggle('active',a.getAttribute('href')==='#'+entry.target.id))}})},{rootMargin:'-10% 0px -55% 0px'});['home','visuals','schedule'].forEach(id=>observer.observe(document.getElementById(id)));

// The iframe autoplays independently of the YouTube API loading.
const videoLayer=document.querySelector('.hero-video');
const videoFrame=document.getElementById('hero-player');
const motionPreference=window.matchMedia('(prefers-reduced-motion: reduce)');
let backgroundPlayer;
function sizeBackground(){const {width,height}=videoLayer.getBoundingClientRect();videoFrame.style.width=Math.ceil(Math.max(width,height*16/9))+'px';videoFrame.style.height=Math.ceil(Math.max(height,width*9/16))+'px'}
new ResizeObserver(sizeBackground).observe(videoLayer);
sizeBackground();
function loadBackground(){
 const params=new URLSearchParams({autoplay:motionPreference.matches?'0':'1',mute:'1',controls:'0',loop:'1',playlist:'iBeo74ujfes',playsinline:'1',disablekb:'1',fs:'0',rel:'0',iv_load_policy:'3',enablejsapi:'1'});
 if(location.protocol.startsWith('http'))params.set('origin',location.origin);
 videoFrame.src='https://www.youtube.com/embed/iBeo74ujfes?'+params;
 videoLayer.classList.toggle('unavailable',motionPreference.matches);
}
loadBackground();
window.onYouTubeIframeAPIReady=function(){
 backgroundPlayer=new YT.Player('hero-player',{events:{
 onReady:event=>{event.target.mute();if(!motionPreference.matches)event.target.playVideo()},
 onStateChange:event=>{if(event.data===YT.PlayerState.ENDED&&!motionPreference.matches){event.target.seekTo(0);event.target.playVideo()}},
 onError:()=>videoLayer.classList.add('unavailable')
 }});
};
motionPreference.addEventListener('change',event=>{videoLayer.classList.toggle('unavailable',event.matches);if(event.matches)backgroundPlayer?.pauseVideo?.();else{backgroundPlayer?.mute?.();backgroundPlayer?.playVideo?.()}});
const youtubeAPI=document.createElement('script');youtubeAPI.src='https://www.youtube.com/iframe_api';youtubeAPI.async=true;document.head.appendChild(youtubeAPI);

// Poster dates are interpreted as 2026; unknown times remain undated for countdowns.
const comebackSchedule=[
 ['09-30','Cast',20],['10-02','Cast II',20],['10-04','Tracklist',20],
 ['10-05','Hero in Everywhere',18],['10-06','Post Credits Scene: Girl Hero',20],
 ['10-07','Girl Hero concept photo',20],['10-08','Girl Hero concept photo',20],['10-09','Girl Hero concept photo',20],
 ['10-11','Hero Training Center: Hero Comics',20],
 ['10-12','Hero Comics concept photo',20],['10-13','Hero Comics concept photo',20],['10-14','Hero Comics concept photo',20],
 ['10-16','LCK MV teaser #1',18],['10-16','LCK BTS',20],
 ['10-17','LCK MV teaser #2',null],['10-18','Hero on Set concept photo',20],
 ['10-19','Looks Can Kill release',18],['10-21','Highlight medley',20],
 ['10-26','Spin-off concept photo',17],['10-26','Spin-off film',18],['10-26','Album release',null]
].map(([date,name,hour])=>({date:'2026-'+date,name,hour,at:hour===null?null:Date.parse(`2026-${date}T${String(hour).padStart(2,'0')}:00:00+09:00`)}));
function nextScheduledEvent(now=Date.now()){return comebackSchedule.filter(e=>e.at!==null&&e.at>now).sort((a,b)=>a.at-b.at)[0]||null}
const formatScheduleDate=date=>new Intl.DateTimeFormat('en-MY',{month:'short',day:'numeric',timeZone:'Asia/Seoul'}).format(new Date(date+'T12:00:00+09:00'));
const formatScheduleHour=hour=>hour===null?'TBA':`${hour%12||12} ${hour>=12?'PM':'AM'}`;
function scheduleStatus(event,now,next){if(event===next)return 'Up next';if(event.at!==null)return event.at<=now?'Past':'Upcoming';const endOfDate=Date.parse(event.date+'T23:59:59+09:00');return endOfDate<now?'Date passed':'Time TBA'}
function renderSchedule(now=Date.now()){
 const next=nextScheduledEvent(now);
 document.getElementById('schedule-table-body').innerHTML=comebackSchedule.map(event=>{const status=scheduleStatus(event,now,next);return `<tr class="${event===next?'next-row':status==='Past'||status==='Date passed'?'past-row':''}"><td>${formatScheduleDate(event.date)}</td><td>${event.name}</td><td>${formatScheduleHour(event.hour===null?null:event.hour-1)}</td><td>${formatScheduleHour(event.hour)}</td><td><span class="event-status">${status}</span></td></tr>`}).join('');
 document.getElementById('schedule-timeline').innerHTML=comebackSchedule.map(event=>`<div class="schedule-row ${event===next?'next-row':''} ${event.name==='Looks Can Kill release'?'highlight':''}"><time datetime="${event.date}">${event.date.slice(5,7)==='09'?'SEP':'OCT'} <b>${event.date.slice(8)}</b></time><div><strong>${event.name}</strong><span>${scheduleStatus(event,now,next)} · 2026</span></div><span class="time">${formatScheduleHour(event.hour===null?null:event.hour-1)} MYT<small>${formatScheduleHour(event.hour)} KST</small></span></div>`).join('');
}
let currentNextTimestamp;
function updateCountdown(now=Date.now()){
 const next=nextScheduledEvent(now);
 if(currentNextTimestamp!==(next?.at??null)){
  currentNextTimestamp=next?.at??null;
  document.getElementById('next-event-name').textContent=next?next.name:'All timed reveals have arrived.';
  document.getElementById('next-event-date').textContent=next?`${formatScheduleDate(next.date)} 2026 · ${formatScheduleHour(next.hour-1)} MYT / ${formatScheduleHour(next.hour)} KST`:'Explore the full schedule and visual archive.';
  renderSchedule(now);
 }
 const seconds=next?Math.max(0,Math.ceil((next.at-now)/1000)):0;
 const parts=[Math.floor(seconds/86400),Math.floor(seconds%86400/3600),Math.floor(seconds%3600/60),seconds%60];
 ['days','hours','minutes','seconds'].forEach((unit,index)=>document.getElementById('count-'+unit).textContent=String(parts[index]).padStart(2,'0'));
}
updateCountdown();setInterval(updateCountdown,1000);
document.addEventListener('visibilitychange',()=>{if(!document.hidden)updateCountdown()});
const scheduleDrawer=document.getElementById('schedule-drawer');
const scheduleDock=document.getElementById('schedule-dock');
let scheduleTrigger;
function openSchedule(){scheduleTrigger=document.activeElement;renderSchedule();scheduleDrawer.showModal();scheduleDock.setAttribute('aria-expanded','true');document.body.style.overflow='hidden'}
scheduleDock.addEventListener('click',openSchedule);document.querySelectorAll('[data-open-schedule]').forEach(button=>button.addEventListener('click',openSchedule));
scheduleDrawer.querySelector('.drawer-close').addEventListener('click',()=>scheduleDrawer.close());
scheduleDrawer.addEventListener('click',event=>{if(event.target===scheduleDrawer){const rect=scheduleDrawer.getBoundingClientRect();if(event.clientX<rect.left||event.clientX>rect.right||event.clientY<rect.top||event.clientY>rect.bottom)scheduleDrawer.close()}});
scheduleDrawer.addEventListener('close',()=>{scheduleDock.setAttribute('aria-expanded','false');document.body.style.overflow='';scheduleTrigger?.focus()});
