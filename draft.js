// Presentation and navigation are separate from the original workcell script.
pdfjsLib.GlobalWorkerOptions.workerSrc='vendor/pdf.worker.min.js';
portfolioData.swarm.presentation=['images/project_swarm/swarm.png'];
portfolioData.disinfectant.presentation=['images/project_disinfectant_robo/disinfect_robo.png'];
portfolioData['desk-manipulator'].presentation=[];
portfolioData['tiago-nav'].github='https://github.com/devashishbuilds/autonomous-mobile-manipulation';
portfolioData['ambient-light'].github='https://github.com/devashishbuilds/ambient-light';
portfolioData.follower.github='https://github.com/devashishbuilds/fast-line-follower';
portfolioData.lhp={title:'Simulation Intern',subtitle:'LHP Europe | 14 September – 31 December 2026',summary:'Simulation internship at LHP Europe, from 14 September to 31 December 2026.',bullets:[],presentation:[]};
portfolioData['weather-frame']={
  title:'Ambient Weather Frame',
  subtitle:'Weekend Projects | Ambient IoT, mechanical motion & embedded control',
  summary:'This project is an ambient IoT wall frame that turns real-world daylight and weather data into a physical, glanceable experience.',
  description:[
    'The frame uses an ESP32-C3 to connect to Wi-Fi, synchronize time using NTP, and retrieve live sunrise, sunset, precipitation probability, and weather-condition data from Open-Meteo. Based on the current time and the day’s sunrise/sunset cycle, an illuminated sun moves vertically through the artwork to represent the progression of the day.',
    'The motion is created using a continuous-rotation servo and a rack-and-pinion mechanism, providing approximately 263 mm of vertical travel. Because the servo does not provide absolute position feedback, the system combines calibrated motor timing with touch sensors at the top and bottom of the mechanism. These sensors provide reliable reference points for homing, drift correction, restart recovery, and fail-safe operation. When an endpoint is detected, the motor stops immediately and backs away slightly to prevent the sensor from remaining continuously activated.',
    'The project was inspired by a simple everyday problem: missing weather notifications before leaving home. Instead of relying on another app or screen, the goal is to place the frame somewhere naturally visible near the entrance or shoe rack, so useful information can be noticed while getting ready to leave.',
    'A future version will add a physical cloud with illuminated raindrops and a lightning indicator. Since the weather data is already being retrieved, these elements can visually highlight expected rain or thunderstorms and act as an ambient reminder to take an umbrella before heading out.',
    'The project combines embedded systems, mechanical design, sensor-based control, IoT connectivity, APIs, addressable LEDs, and physical interaction in a single decorative object.'
  ],
  github:'https://github.com/devashishbuilds/Ambient-Weather-Frame',
  readmeNote:'For technical details, calibration data, control logic, APIs, hardware setup, and source code, refer to the project’s GitHub README.',
  bullets:[],
  presentation:['images/project_amb_weather_frame/IMG_20261109_114539.jpg','images/project_amb_weather_frame/IMG_20261109_114622.jpg','images/project_amb_weather_frame/IMG_20261109_114703.jpg','images/project_amb_weather_frame/IMG_20261109_114729.jpg','images/project_amb_weather_frame/system-overview.svg', ]
};
const draftMenu=document.querySelector('.menu-toggle');
const draftNav=document.getElementById('main-nav');
draftMenu.addEventListener('click',()=>{const open=draftMenu.getAttribute('aria-expanded')!=='true';draftMenu.setAttribute('aria-expanded',String(open));draftNav.classList.toggle('open',open)});
draftNav.querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>{draftMenu.setAttribute('aria-expanded','false');draftNav.classList.remove('open')}));
document.getElementById('currentYear').textContent=new Date().getFullYear();

// Auto-advancing project images, with explicit controls and motion preferences.
const gallery=document.getElementById('heroGallery');
const heroSlides=[...gallery.querySelectorAll('.hero-slide')];
const slideDots=[...gallery.querySelectorAll('[data-slide]')];
const motionPreference=matchMedia('(prefers-reduced-motion: reduce)');
let currentSlide=0,slidesPaused=motionPreference.matches,slideTimer=null,galleryVisible=true,galleryHovered=false;
function showHeroSlide(index){
  currentSlide=(index+heroSlides.length)%heroSlides.length;
  const selected=heroSlides[currentSlide],data=selected.dataset;
  document.getElementById('heroSlideTrack').style.transform=`translateX(-${currentSlide*100}%)`;
  heroSlides.forEach((slide,i)=>slide.setAttribute('aria-hidden',String(i!==currentSlide)));
  slideDots.forEach((dot,i)=>{dot.classList.toggle('active',i===currentSlide);dot.setAttribute('aria-pressed',String(i===currentSlide))});
  document.getElementById('heroFieldNote').textContent='FIELD NOTES / '+String(currentSlide+1).padStart(3,'0');
  document.getElementById('heroPhotoNote').textContent=data.note;
  document.getElementById('heroProjectName').textContent=data.name;
  document.getElementById('heroProjectLink').dataset.project=data.projectKey;
  document.getElementById('heroProjectLink').setAttribute('aria-label','Explore '+data.name);
}
function scheduleSlide(){
  if(slideTimer)clearTimeout(slideTimer);
  slideTimer=null;
  if(slidesPaused||galleryHovered||!galleryVisible||document.hidden||gallery.contains(document.activeElement))return;
  slideTimer=setTimeout(()=>{showHeroSlide(currentSlide+1);scheduleSlide()},4800);
}
function updateSlideToggle(){
  const toggle=document.getElementById('toggleSlides');toggle.textContent=slidesPaused?'Play ▷':'Pause Ⅱ';toggle.setAttribute('aria-label',slidesPaused?'Start automatic project slideshow':'Pause automatic project slideshow');toggle.setAttribute('aria-pressed',String(slidesPaused));
}
document.getElementById('previousSlide').addEventListener('click',()=>{showHeroSlide(currentSlide-1);scheduleSlide()});
document.getElementById('nextSlide').addEventListener('click',()=>{showHeroSlide(currentSlide+1);scheduleSlide()});
slideDots.forEach(dot=>dot.addEventListener('click',()=>{showHeroSlide(Number(dot.dataset.slide));scheduleSlide()}));
document.getElementById('toggleSlides').addEventListener('click',()=>{slidesPaused=!slidesPaused;updateSlideToggle();scheduleSlide()});
gallery.addEventListener('mouseenter',()=>{galleryHovered=true;scheduleSlide()});
gallery.addEventListener('mouseleave',()=>{galleryHovered=false;scheduleSlide()});
gallery.addEventListener('focusin',scheduleSlide);
gallery.addEventListener('focusout',()=>setTimeout(scheduleSlide,0));
document.addEventListener('visibilitychange',scheduleSlide);
motionPreference.addEventListener?.('change',event=>{if(event.matches){slidesPaused=true;updateSlideToggle();scheduleSlide()}});
let swipeOrigin=null;
document.getElementById('heroPhoto').addEventListener('pointerdown',event=>{swipeOrigin=event.clientX});
document.getElementById('heroPhoto').addEventListener('pointerup',event=>{if(swipeOrigin===null)return;const delta=event.clientX-swipeOrigin;swipeOrigin=null;if(Math.abs(delta)>45){showHeroSlide(currentSlide+(delta<0?1:-1));scheduleSlide()}});
document.getElementById('heroPhoto').addEventListener('pointercancel',()=>{swipeOrigin=null});
if('IntersectionObserver' in window){
  const observer=new IntersectionObserver(entries=>{galleryVisible=entries[0].isIntersecting;scheduleSlide()},{threshold:.1});observer.observe(gallery);
  const portraitObserver=new IntersectionObserver(entries=>{if(entries[0].isIntersecting){document.getElementById('contactPortrait').classList.add('portrait-visible');portraitObserver.disconnect()}},{threshold:.25});portraitObserver.observe(document.getElementById('contactPortrait'));
}else document.getElementById('contactPortrait').classList.add('portrait-visible');
showHeroSlide(0);updateSlideToggle();scheduleSlide();

const projectArchive=document.getElementById('projectArchive');
const archiveShortcut=document.getElementById('openProjectArchive');
archiveShortcut.addEventListener('click',()=>{projectArchive.open=true;projectArchive.scrollIntoView({behavior:motionPreference.matches?'auto':'smooth',block:'start'})});
projectArchive.addEventListener('toggle',()=>{archiveShortcut.setAttribute('aria-expanded',String(projectArchive.open));projectArchive.querySelector('.archive-action-text').textContent=projectArchive.open?'Collapse projects':'Expand projects'});

const videoChoices=[...document.querySelectorAll('.video-choice')];
const videoList=document.getElementById('videoList');
const videoScrollHint=document.getElementById('videoScrollHint');
document.getElementById('videoCount').textContent=String(videoChoices.length).padStart(2,'0')+' VIDEOS';
function updateVideoListHint(){
  const overflowing=videoList.scrollHeight>videoList.clientHeight+2;
  videoScrollHint.hidden=!overflowing;
  videoList.tabIndex=overflowing?0:-1;
}
if('ResizeObserver' in window){const observer=new ResizeObserver(updateVideoListHint);observer.observe(videoList)}
window.addEventListener('resize',updateVideoListHint);
updateVideoListHint();
let selectedVideo=videoChoices[0];
function selectVideo(button){
  selectedVideo=button;
  videoChoices.forEach(b=>{const active=b===button;b.classList.toggle('active',active);b.setAttribute('aria-pressed',String(active))});
  const d=button.dataset;
  const poster=document.createElement('button');poster.className='video-poster';poster.id='playVideo';poster.setAttribute('aria-label',`Play ${d.title} video`);
  const img=document.createElement('img');img.src=d.poster;img.alt=d.title;
  const play=document.createElement('span');play.className='large-play';play.textContent='▶';play.setAttribute('aria-hidden','true');
  const label=document.createElement('span');label.className='poster-label';label.textContent='PLAY PROJECT DEMO ↗';
  poster.append(img,play,label);poster.addEventListener('click',playSelectedVideo);
  document.getElementById('videoPlayer').replaceChildren(poster);
  document.getElementById('videoTitle').textContent=d.title;
  document.getElementById('videoDescription').textContent=d.description;
  document.getElementById('videoCategory').textContent=d.category.toUpperCase();
  document.getElementById('videoProject').dataset.project=d.related;
  document.getElementById('youtubeLink').href=`https://www.youtube.com/watch?v=${d.video}`;
}
function playSelectedVideo(){
  const d=selectedVideo.dataset, frame=document.createElement('iframe');
  frame.src=`https://www.youtube-nocookie.com/embed/${d.video}?autoplay=1&rel=0&playsinline=1`;
  frame.title=`${d.title} — project demonstration`;frame.allow='accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share';frame.allowFullscreen=true;frame.referrerPolicy='strict-origin-when-cross-origin';
  document.getElementById('videoPlayer').replaceChildren(frame);
}
videoChoices.forEach(b=>b.addEventListener('click',()=>selectVideo(b)));
document.getElementById('playVideo').addEventListener('click',playSelectedVideo);
document.querySelectorAll('[data-filter]').forEach(button=>button.addEventListener('click',()=>{
  const filter=button.dataset.filter;
  document.querySelectorAll('[data-filter]').forEach(b=>{const active=b===button;b.classList.toggle('active',active);b.setAttribute('aria-pressed',String(active))});
  videoChoices.forEach(b=>b.hidden=filter!=='All'&&b.dataset.category!==filter);
  if(selectedVideo.hidden)selectVideo(videoChoices.find(b=>!b.hidden));
  videoList.scrollTop=0;
  updateVideoListHint();
}));
document.querySelectorAll('[data-watch-video]').forEach(link=>link.addEventListener('click',()=>{
  const choice=videoChoices.find(button=>button.dataset.related===link.dataset.watchVideo);
  if(!choice)return;
  document.querySelector('[data-filter="All"]').click();
  selectVideo(choice);
  choice.scrollIntoView({block:'nearest',inline:'nearest',behavior:'auto'});
}));

const journeyContent={
  hindustan:{kind:'EDUCATION',date:'NOV 2020 – JUN 2024',title:'B.Tech in Mechatronics Engineering',org:'Hindustan Institute of Technology & Science · Chennai, India',summary:'Built a foundation in mechanical design, embedded systems, control theory, and robotics through hands-on electromechanical projects.',skills:['SolidWorks','Arduino','MATLAB','Fabrication'],logo:'hits.png'},
  atumx:{kind:'EXPERIENCE',date:'JUN 2022 – NOV 2022',title:'Engineering Intern — Robotics & Assembly',org:'AtumX · Chennai, India',summary:'Designed components and assemblies, supported FDM and CNC prototyping, and used ROS simulation to check motion before hardware assembly and functional testing.',skills:['SolidWorks','ROS','CNC / FDM','Mechanical assembly'],logo:'atumx-logo.png'},
  cair:{kind:'EXPERIENCE',date:'JUN 2023 – AUG 2023',title:'Research Intern — Robotics & Computer Vision',org:'CAIR, DRDO · Bangalore, India',summary:'Studied vision-based grasp-pose estimation for dual-arm manipulation, reviewing how perception, kinematics, and grasp planning come together around the ABB YuMi platform.',skills:['ABB YuMi','Computer vision','Grasp planning','Literature review'],logo:'cair.jfif'},
  iitb:{kind:'EXPERIENCE',date:'JAN 2024 – NOV 2024',title:'Research Intern → Project Associate',org:'IIT Bombay · Mumbai, India',summary:'Designed and fabricated snake-robot hardware on an ISRO-funded project. Developed actuator tests, Python data-logging workflows, and repeatability and robustness evaluations across prototype iterations.',skills:['SolidWorks','Python / MATLAB','Actuator testing','Hardware validation'],logo:'download.png',project:'snake'},
  'bologna-edu':{kind:'EDUCATION',date:'NOV 2024 – PRESENT',title:'Master’s in Automation Engineering',org:'Alma Mater Studiorum — University of Bologna · Italy',summary:'Advanced study in control engineering, robotics, and industrial automation, combining theoretical foundations with practical lab work and electromechanical system validation.',skills:['Control systems','MATLAB / Simulink','ROS','TwinCAT'],logo:'uinbo.png'},
  'bologna-exp':{kind:'EXPERIENCE',date:'OCT 2025 – DEC 2025',title:'Automation & Manufacturing Intern',org:'Montecuccolino Laboratory · University of Bologna, Italy',summary:'Designed test fixtures and calibration experiments for a robotics bench. Characterized sensors and prototype repeatability, documented results, and implemented control algorithms in Beckhoff TwinCAT.',skills:['TwinCAT','Sensor calibration','Test fixtures','Repeatability analysis'],logo:'uinbo.png'},
  lhp:{kind:'EXPERIENCE',date:'14 SEP 2026 – 31 DEC 2026',title:'Simulation Intern',org:'LHP Europe',summary:'Simulation internship at LHP Europe, from 14 September to 31 December 2026.',skills:['Simulation'],logo:'lhp-europe.png',current:true}
};
const journeyOrder=['hindustan','atumx','cair','iitb','bologna-edu','bologna-exp','lhp'];
const stops=journeyOrder.map(key=>document.querySelector(`[data-milestone="${key}"]`));let currentStop=6;
function setJourney(index){
  currentStop=Math.max(0,Math.min(stops.length-1,index));
  const stop=stops[currentStop],key=stop.dataset.milestone,d=journeyContent[key];
  stops.forEach((b,i)=>{b.classList.toggle('active',i===currentStop);b.setAttribute('aria-pressed',String(i===currentStop))});
  const signal=document.getElementById('signalProgress');
  signal.style.width=stop.dataset.position+'%';
  signal.classList.toggle('education-signal',d.kind==='EDUCATION');
  document.getElementById('mapStatus').textContent='SELECTED / '+d.org.split(' · ')[0].toUpperCase();
  const status=document.getElementById('experienceStatus');status.hidden=!d.current;
  document.getElementById('journeyKind').textContent=d.kind+' / '+String(currentStop+1).padStart(2,'0');
  document.getElementById('journeyDate').textContent=d.date;
  document.getElementById('journeyTitle').textContent=d.title;
  document.getElementById('journeyOrg').textContent=d.org;
  document.getElementById('journeySummary').textContent=d.summary;
  const skills=d.skills.map(s=>{const el=document.createElement('span');el.textContent=s;return el});document.getElementById('journeySkills').replaceChildren(...skills);
  const logo=document.getElementById('journeyLogo');logo.src='images/logo/'+d.logo;logo.alt=d.org+' logo';
  document.getElementById('journeyMore').dataset.project=key;
  document.getElementById('journeyCount').textContent=String(currentStop+1).padStart(2,'0')+' / '+String(stops.length).padStart(2,'0');
  document.getElementById('previousStop').disabled=currentStop===0;
  document.getElementById('nextStop').disabled=currentStop===stops.length-1;
}
stops.forEach((b,i)=>b.addEventListener('click',()=>setJourney(i)));
document.getElementById('previousStop').addEventListener('click',()=>setJourney(currentStop-1));
document.getElementById('nextStop').addEventListener('click',()=>setJourney(currentStop+1));setJourney(6);

// Retain the original project information and improve modal keyboard handling.
const originalOpenModal=window.openModal, originalCloseModal=window.closeModal;
const projectModal=document.getElementById('universalModal');
let modalReturnFocus=null;
const oldClose=projectModal.querySelector('.close-modal');
const closeButton=document.createElement('button');closeButton.className='close-modal';closeButton.type='button';closeButton.textContent='×';closeButton.setAttribute('aria-label','Close project details');closeButton.addEventListener('click',()=>window.closeModal());oldClose.replaceWith(closeButton);
projectModal.setAttribute('role','dialog');projectModal.setAttribute('aria-modal','true');projectModal.setAttribute('aria-labelledby','modalTitle');projectModal.setAttribute('aria-hidden','true');
window.openModal=function(id){
  if(!portfolioData[id])return;
  modalReturnFocus=document.activeElement;originalOpenModal(id);projectModal.setAttribute('aria-hidden','false');document.body.style.overflow='hidden';
  const matchingVideo=videoChoices.find(b=>b.dataset.related===id);
  const data=portfolioData[id];
  const summary=document.getElementById('modalSummary');
  document.querySelector('.modal-project-links')?.remove();
  document.querySelector('.modal-project-description')?.remove();
  document.querySelector('.modal-video-link')?.remove();
  const links=document.createElement('div');links.className='modal-project-links';
  if(matchingVideo){const a=document.createElement('a');a.className='modal-video-link';a.href='#videos';a.textContent='▶ Watch project demo';a.addEventListener('click',()=>{window.closeModal();document.querySelector('[data-filter="All"]').click();selectVideo(matchingVideo);matchingVideo.scrollIntoView({block:'nearest',inline:'nearest',behavior:'auto'});document.getElementById('videos').scrollIntoView({behavior:motionPreference.matches?'auto':'smooth'})});links.append(a)}
  if(data.github){const a=document.createElement('a');a.className='modal-github-link';a.href=data.github+'#readme';a.target='_blank';a.rel='noopener noreferrer';a.textContent='GitHub README ↗';links.append(a)}
  if(links.childElementCount)summary.before(links);
  if(data.description){
    const description=document.createElement('div');description.className='modal-project-description';
    data.description.forEach(text=>{const p=document.createElement('p');p.textContent=text;description.append(p)});
    if(data.readmeNote&&data.github){const p=document.createElement('p');p.className='modal-readme-note';const a=document.createElement('a');a.href=data.github+'#readme';a.target='_blank';a.rel='noopener noreferrer';const strong=document.createElement('strong');strong.textContent=data.readmeNote;a.append(strong);p.append(a);description.append(p)}
    summary.after(description);
  }
  setTimeout(()=>closeButton.focus(),20);
};
window.closeModal=function(){originalCloseModal();projectModal.setAttribute('aria-hidden','true');document.body.style.overflow='';modalReturnFocus?.focus({preventScroll:true})};
document.addEventListener('click',event=>{const button=event.target.closest('[data-project]');if(button)window.openModal(button.dataset.project)});
document.addEventListener('keydown',event=>{
  if(event.key==='Escape'){if(projectModal.getAttribute('aria-hidden')==='false')window.closeModal();draftMenu.setAttribute('aria-expanded','false');draftNav.classList.remove('open')}
  if(event.key==='Tab'&&projectModal.getAttribute('aria-hidden')==='false'){
    const focusable=[...projectModal.querySelectorAll('button,a[href],iframe,input,[tabindex="0"]')].filter(el=>el.getClientRects().length);
    const first=focusable[0],last=focusable.at(-1);
    if(event.shiftKey&&document.activeElement===first){event.preventDefault();last?.focus()}
    else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first?.focus()}
  }
});

// Explain absent original media instead of showing a broken image.
document.getElementById('presentationContainer').addEventListener('error',event=>{
  const img=event.target;if(img.tagName!=='IMG')return;
  const message=document.createElement('p');message.className='asset-fallback';message.textContent='Additional project imagery will be added here. Explore the project description alongside.';img.replaceWith(message);
},true);
