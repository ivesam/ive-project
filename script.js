const modal=document.querySelector('#lightbox');let previousFocus;
function showImage(file,title){previousFocus=document.activeElement;document.querySelector('#lightbox-image').src='assets/'+file;document.querySelector('#lightbox-image').alt=title;document.querySelector('#lightbox-caption').textContent=title;modal.showModal();document.body.style.overflow='hidden'}
document.querySelectorAll('[data-image]').forEach(button=>button.addEventListener('click',()=>showImage(button.dataset.image,button.dataset.title)));
['view-poster','schedule-image'].forEach(id=>document.getElementById(id).addEventListener('click',()=>showImage('official-schedule-poster.jpg','Official comeback schedule · All times in KST')));
modal.querySelector('.close').addEventListener('click',()=>modal.close());modal.addEventListener('click',e=>{if(e.target===modal)modal.close()});modal.addEventListener('close',()=>{document.body.style.overflow='';previousFocus?.focus()});
const observer=new IntersectionObserver(entries=>{entries.forEach(entry=>{if(entry.isIntersecting){document.querySelectorAll('nav a').forEach(a=>a.classList.toggle('active',a.getAttribute('href')==='#'+entry.target.id))}})},{rootMargin:'-10% 0px -55% 0px'});['home','visuals','schedule'].forEach(id=>observer.observe(document.getElementById(id)));

// Native, silent video playback with no external player requests.
const videoLayer=document.querySelector('.hero-video');
const backgroundVideo=document.getElementById('hero-player');
const motionPreference=window.matchMedia('(prefers-reduced-motion: reduce)');
let heroOnScreen=true;
backgroundVideo.muted=true;
function syncBackgroundPlayback(){
 const shouldPlay=!motionPreference.matches&&!document.hidden&&heroOnScreen;
 videoLayer.classList.toggle('unavailable',motionPreference.matches||backgroundVideo.error!==null);
 if(!shouldPlay){backgroundVideo.pause();return}
 if(backgroundVideo.error)return;
 backgroundVideo.play().catch(error=>{if(error.name!=='AbortError')videoLayer.classList.add('unavailable')});
}
backgroundVideo.addEventListener('playing',()=>{if(!motionPreference.matches)videoLayer.classList.remove('unavailable')});
backgroundVideo.addEventListener('error',()=>videoLayer.classList.add('unavailable'));
motionPreference.addEventListener('change',syncBackgroundPlayback);
document.addEventListener('visibilitychange',syncBackgroundPlayback);
if(motionPreference.matches)backgroundVideo.removeAttribute('autoplay');
syncBackgroundPlayback();

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
let visitorTimeZone='Asia/Seoul';
let locationTimeState='pending';
let isMalaysiaTime=['Asia/Kuala_Lumpur','Asia/Kuching'].includes(visitorTimeZone);
let localTimeHeading='KST';
let localDateFormatter=new Intl.DateTimeFormat('en-GB',{month:'short',day:'numeric',timeZone:visitorTimeZone});
const koreaDateFormatter=new Intl.DateTimeFormat('en-GB',{month:'short',day:'numeric',timeZone:'Asia/Seoul'});
let localTimeFormatter=new Intl.DateTimeFormat('en-US',{hour:'numeric',minute:'2-digit',hour12:true,timeZone:visitorTimeZone});
let zoneNameFormatter=new Intl.DateTimeFormat('en-US',{timeZone:visitorTimeZone,timeZoneName:'short'});
function scheduleInstant(event){return new Date(event.at===null?event.date+'T12:00:00+09:00':event.at)}
function formatScheduleDate(event){return event.at===null?koreaDateFormatter.format(scheduleInstant(event)):localDateFormatter.format(scheduleInstant(event))}
function formatKoreaDate(event){return koreaDateFormatter.format(scheduleInstant(event))}
function eventZoneLabel(event){return visitorTimeZone==='Asia/Seoul'?'KST':isMalaysiaTime?'MYT':zoneNameFormatter.formatToParts(scheduleInstant(event)).find(part=>part.type==='timeZoneName').value}
function formatLocalTime(event){return event.at===null?'TBA':localTimeFormatter.format(scheduleInstant(event))+' '+eventZoneLabel(event)}
const formatScheduleHour=hour=>hour===null?'TBA':`${hour%12||12} ${hour>=12?'PM':'AM'}`;
function koreaReference(event){return formatScheduleHour(event.hour)+' KST'+(event.at!==null&&formatScheduleDate(event)!==formatKoreaDate(event)?' · '+formatKoreaDate(event):'')}
function scheduleStatus(event,now,next){if(event===next)return 'Up next';if(event.at!==null)return event.at<=now?'Past':'Upcoming';const endOfDate=Date.parse(event.date+'T23:59:59+09:00');return endOfDate<now?'Date passed':'Time TBA'}
const epRelease=comebackSchedule.find(event=>event.name==='Looks Can Kill release');
function renderZoneDetails(){
 document.getElementById('schedule-zone-intro').textContent=locationTimeState==='pending'?'Detecting IP location · showing KST':locationTimeState==='unavailable'?'IP location unavailable · showing KST':(isMalaysiaTime?'Malaysia time (MYT)':'IP location time ('+visitorTimeZone.replaceAll('_',' ')+')')+' · Korea time (KST)';
 document.getElementById('local-time-heading').textContent=localTimeHeading;
 const epReleaseParts=localDateFormatter.formatToParts(scheduleInstant(epRelease));
 document.getElementById('ep-release-date').innerHTML=epReleaseParts.find(part=>part.type==='month').value.toUpperCase()+'<span>'+epReleaseParts.find(part=>part.type==='day').value+'</span>';
 document.getElementById('ep-release-local').textContent=formatLocalTime(epRelease);
}
renderZoneDetails();
function renderSchedule(now=Date.now()){
 const next=nextScheduledEvent(now);
 document.getElementById('schedule-table-body').innerHTML=comebackSchedule.map(event=>{const status=scheduleStatus(event,now,next);return `<tr class="${event===next?'next-row':status==='Past'||status==='Date passed'?'past-row':''}"><td data-label="Local date">${formatScheduleDate(event)}${event.at===null?'<small class="schedule-date-note">KST date</small>':''}</td><td data-label="Reveal">${event.name}</td><td data-label="${localTimeHeading}">${formatLocalTime(event)}</td><td data-label="KST">${formatScheduleHour(event.hour)}${event.at!==null&&formatScheduleDate(event)!==formatKoreaDate(event)?'<small class="schedule-date-note">'+formatKoreaDate(event)+'</small>':''}</td><td data-label="Status"><span class="event-status">${status}</span></td></tr>`}).join('');
 document.getElementById('schedule-timeline').innerHTML=comebackSchedule.map(event=>{const parts=(event.at===null?koreaDateFormatter:localDateFormatter).formatToParts(scheduleInstant(event));const month=parts.find(part=>part.type==='month').value.toUpperCase();const day=parts.find(part=>part.type==='day').value;return `<div class="schedule-row ${event===next?'next-row':''} ${event.name==='Looks Can Kill release'?'highlight':''}"><time>${month} <b>${day}</b></time><div><strong>${event.name}</strong><span>${scheduleStatus(event,now,next)} · 2026${event.at===null?' · KST date':''}</span></div><span class="time">${formatLocalTime(event)}<small>${koreaReference(event)}</small></span></div>`}).join('');
}
let currentNextTimestamp;
function updateCountdown(now=Date.now()){
 const next=nextScheduledEvent(now);
 if(currentNextTimestamp!==(next?.at??null)){
  currentNextTimestamp=next?.at??null;
  document.getElementById('next-event-name').textContent=next?next.name:'All timed reveals have arrived.';
  document.getElementById('next-event-date').textContent=next?`${formatScheduleDate(next)} 2026 · ${formatLocalTime(next)} / ${koreaReference(next)}`:'Explore the full schedule and visual archive.';
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

const albumLinkArt=document.getElementById('album-link-art');
function restoreAlbumArt(){albumLinkArt.src='assets/official-logo.jpg'}
albumLinkArt.addEventListener('error',restoreAlbumArt,{once:true});
if(albumLinkArt.complete&&albumLinkArt.naturalWidth===0)restoreAlbumArt();

const heroVisibility=new IntersectionObserver(entries=>{heroOnScreen=entries[0].isIntersecting;document.body.classList.toggle('past-hero',!heroOnScreen);syncBackgroundPlayback()},{threshold:0});heroVisibility.observe(document.querySelector('.hero'));

// Small five-point star bursts for clicks and taps; never intercept input.
const activeStarbursts=new Set();
const starSvgNamespace='http://www.w3.org/2000/svg';
function clearStarbursts(){for(const burst of activeStarbursts){burst.getAnimations({subtree:true}).forEach(animation=>animation.cancel());burst.remove()}activeStarbursts.clear()}
function showClickStarburst(event){
 if(motionPreference.matches||event.button>0)return;
 let x=event.clientX,y=event.clientY;
 if(event.detail===0&&event.target instanceof Element){const rect=event.target.getBoundingClientRect();x=rect.left+rect.width/2;y=rect.top+rect.height/2}
 if(activeStarbursts.size>=6){const oldest=activeStarbursts.values().next().value;oldest.remove();activeStarbursts.delete(oldest)}
 const burst=document.createElement('div');burst.className='click-starburst';burst.setAttribute('aria-hidden','true');
 (document.querySelector('dialog[open]')||document.body).appendChild(burst);activeStarbursts.add(burst);
 setTimeout(()=>{burst.getAnimations({subtree:true}).forEach(animation=>animation.cancel());burst.remove();activeStarbursts.delete(burst)},900);
 let remaining=6;
 const finish=()=>{remaining--;if(remaining<=0){burst.remove();activeStarbursts.delete(burst)}};
 for(let index=0;index<6;index++){
  const star=document.createElementNS(starSvgNamespace,'svg');star.setAttribute('viewBox','0 0 100 100');star.setAttribute('focusable','false');star.classList.add('click-star');
  const polygon=document.createElementNS(starSvgNamespace,'polygon');polygon.setAttribute('points','50,4 61,36 95,36 68,57 78,90 50,70 22,90 32,57 5,36 39,36');star.appendChild(polygon);
  star.style.left=x+'px';star.style.top=y+'px';star.style.width=star.style.height=(12+Math.random()*9)+'px';star.style.color=index%2?'var(--yellow)':'var(--pink)';burst.appendChild(star);
  const angle=index*Math.PI/3+(Math.random()-.5)*.4;const distance=32+Math.random()*35;const dx=Math.cos(angle)*distance,dy=Math.sin(angle)*distance;const rotation=(Math.random()-.5)*160;
  const animation=star.animate([{transform:'translate(-50%,-50%) scale(.3) rotate(0deg)',opacity:0},{transform:`translate(calc(-50% + ${dx*.25}px),calc(-50% + ${dy*.25}px)) scale(1) rotate(${rotation*.3}deg)`,opacity:1,offset:.18},{transform:`translate(calc(-50% + ${dx}px),calc(-50% + ${dy+12}px)) scale(.45) rotate(${rotation}deg)`,opacity:0}],{duration:650+Math.random()*180,easing:'cubic-bezier(.15,.6,.35,1)',fill:'forwards'});
  animation.finished.then(finish,finish);
 }
}
document.addEventListener('click',showClickStarburst);
motionPreference.addEventListener('change',event=>{if(event.matches)clearStarbursts()});

// Automatic IP location only: never infer location from device settings.
const timezoneStatus=document.getElementById('timezone-status');
const timezoneRetry=document.getElementById('timezone-retry');
function applyScheduleZone(zone,message){
 const validated=new Intl.DateTimeFormat('en-US',{timeZone:zone}).resolvedOptions().timeZone;
 visitorTimeZone=validated;isMalaysiaTime=['Asia/Kuala_Lumpur','Asia/Kuching'].includes(validated);localTimeHeading=validated==='Asia/Seoul'?'KST':isMalaysiaTime?'MYT':'Local time';
 localDateFormatter=new Intl.DateTimeFormat('en-GB',{month:'short',day:'numeric',timeZone:validated});
 localTimeFormatter=new Intl.DateTimeFormat('en-US',{hour:'numeric',minute:'2-digit',hour12:true,timeZone:validated});
 zoneNameFormatter=new Intl.DateTimeFormat('en-US',{timeZone:validated,timeZoneName:'short'});
 renderZoneDetails();currentNextTimestamp=undefined;updateCountdown();timezoneStatus.textContent=message+' '+validated.replaceAll('_',' ');
}

let timezoneRequestNumber=0;
async function detectVisitorTimeZone(){
 const requestNumber=++timezoneRequestNumber;
 locationTimeState='pending';renderZoneDetails();timezoneRetry.disabled=true;
 timezoneStatus.textContent='Detecting your IP location… Showing KST until detected.';
 applyScheduleZone('Asia/Seoul','Detecting your IP location; temporarily showing KST:');
 const controller=new AbortController();const timeout=setTimeout(()=>controller.abort(),4500);
 try{
  const response=await fetch('https://ipapi.co/json/',{signal:controller.signal,credentials:'omit',referrerPolicy:'no-referrer'});
  if(!response.ok)throw new Error('Location lookup unavailable');const result=await response.json();
  if(result.error||typeof result.timezone!=='string')throw new Error('Location time zone unavailable');
  if(requestNumber!==timezoneRequestNumber)return;
  locationTimeState='detected';
  const country=typeof result.country_name==='string'?result.country_name+' · ':'';
  applyScheduleZone(result.timezone,'IP location: '+country);
 }catch{if(requestNumber===timezoneRequestNumber){locationTimeState='unavailable';applyScheduleZone('Asia/Seoul','IP location unavailable; showing Korea time (KST):')}}
 finally{clearTimeout(timeout);if(requestNumber===timezoneRequestNumber)timezoneRetry.disabled=false}
}
try{localStorage.removeItem('ive-schedule-timezone')}catch{}
timezoneRetry.addEventListener('click',detectVisitorTimeZone);detectVisitorTimeZone();
