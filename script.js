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
