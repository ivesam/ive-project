const slides=['official-teaser-1.jpg','official-teaser-2.jpg','official-theater-thumbnail.jpg'];
document.querySelectorAll('.slide').forEach(button=>button.addEventListener('click',()=>{const index=Number(button.dataset.slide);pauseBackground();document.querySelector('.hero-image').src='assets/'+slides[index];document.querySelectorAll('.slide').forEach(b=>{b.classList.toggle('selected',b===button);b.setAttribute('aria-pressed',String(b===button))});document.querySelector('.edition').childNodes[0].textContent=`0${index+1} / 03 `}));
document.querySelectorAll('.slide').forEach((b,i)=>b.setAttribute('aria-pressed',String(i===0)));
const modal=document.querySelector('#lightbox');let previousFocus;
function showImage(file,title){previousFocus=document.activeElement;document.querySelector('#lightbox-image').src='assets/'+file;document.querySelector('#lightbox-image').alt=title;document.querySelector('#lightbox-caption').textContent=title;modal.showModal();document.body.style.overflow='hidden'}
document.querySelectorAll('[data-image]').forEach(button=>button.addEventListener('click',()=>showImage(button.dataset.image,button.dataset.title)));
['view-poster','schedule-image'].forEach(id=>document.getElementById(id).addEventListener('click',()=>showImage('official-schedule-poster.jpg','Official comeback schedule · All times in KST')));
modal.querySelector('.close').addEventListener('click',()=>modal.close());modal.addEventListener('click',e=>{if(e.target===modal)modal.close()});modal.addEventListener('close',()=>{document.body.style.overflow='';previousFocus?.focus()});
const observer=new IntersectionObserver(entries=>{entries.forEach(entry=>{if(entry.isIntersecting){document.querySelectorAll('nav a').forEach(a=>a.classList.toggle('active',a.getAttribute('href')==='#'+entry.target.id))}})},{rootMargin:'-10% 0px -55% 0px'});['home','visuals','schedule'].forEach(id=>observer.observe(document.getElementById(id)));

// Reveal only after YouTube confirms playback, keeping a photo on errors.
let backgroundPlayer;
const videoLayer=document.querySelector('.hero-video');
const videoButton=document.getElementById('video-toggle');
const motionPreference=window.matchMedia('(prefers-reduced-motion: reduce)');
let wantsPlayback=!motionPreference.matches;
function updateVideoControl(playing){videoButton.textContent=playing?'Pause background':'Play background';videoButton.setAttribute('aria-label',playing?'Pause background video':'Play background video');videoButton.setAttribute('aria-pressed',String(playing))}
function pauseBackground(){wantsPlayback=false;backgroundPlayer?.pauseVideo?.();videoLayer.classList.remove('playing');updateVideoControl(false)}
function sizeBackground(){const frame=videoLayer.querySelector('iframe');if(!frame)return;const {width,height}=videoLayer.getBoundingClientRect();frame.style.width=Math.ceil(Math.max(width,height*16/9))+'px';frame.style.height=Math.ceil(Math.max(height,width*9/16))+'px'}
new ResizeObserver(sizeBackground).observe(videoLayer);
window.onYouTubeIframeAPIReady=function(){
 backgroundPlayer=new YT.Player('hero-player',{
 videoId:'iBeo74ujfes',
 playerVars:{autoplay:wantsPlayback?1:0,mute:1,controls:0,loop:1,playlist:'iBeo74ujfes',playsinline:1,disablekb:1,fs:0,rel:0,iv_load_policy:3,...(location.protocol.startsWith('http')?{origin:location.origin}:{})},
 events:{
 onReady:event=>{const frame=event.target.getIframe();frame.tabIndex=-1;frame.title='IVE cinematic background video';frame.setAttribute('aria-hidden','true');frame.setAttribute('allow','autoplay; encrypted-media');frame.setAttribute('referrerpolicy','strict-origin-when-cross-origin');event.target.mute();sizeBackground();if(wantsPlayback)event.target.playVideo()},
 onStateChange:event=>{const playing=event.data===YT.PlayerState.PLAYING;videoLayer.classList.toggle('playing',playing&&wantsPlayback);updateVideoControl(playing&&wantsPlayback);if(event.data===YT.PlayerState.ENDED&&wantsPlayback){event.target.seekTo(0);event.target.playVideo()}},
 onError:()=>{videoLayer.classList.remove('playing');updateVideoControl(false)}
 }
 });
};
videoButton.addEventListener('click',()=>{if(wantsPlayback&&videoLayer.classList.contains('playing')){pauseBackground()}else{wantsPlayback=true;backgroundPlayer?.mute?.();backgroundPlayer?.playVideo?.()}});
motionPreference.addEventListener('change',event=>{if(event.matches)pauseBackground()});
const youtubeAPI=document.createElement('script');youtubeAPI.src='https://www.youtube.com/iframe_api';youtubeAPI.async=true;youtubeAPI.onerror=()=>{videoLayer.classList.remove('playing');updateVideoControl(false)};document.head.appendChild(youtubeAPI);
