const conveyor = document.getElementById("conveyor");
const conveyorRollers = document.getElementById("conveyorRollers");
const endRoller = document.getElementById("endRoller");
const statusText = document.getElementById("statusText");

const lightRed = document.getElementById("lightRed");
const lightYellow = document.getElementById("lightYellow");
const lightGreen = document.getElementById("lightGreen");

let currentSection = null;
let isMoving = false; 
let isEmergencyStopped = false;
let currentScale = 1;

// ================= DYNAMIC VIEWPORT SCALING =================
function resizeFactory() {
  const wrapper = document.getElementById("factoryWrapper");
  const cell = document.getElementById("factoryCell");
  if(wrapper && cell) {
    currentScale = wrapper.clientWidth / 850; 
    cell.style.transform = `scale(${currentScale})`;
    wrapper.style.height = `${550 * currentScale}px`; 
  }
}
window.addEventListener("resize", resizeFactory);
setTimeout(resizeFactory, 100);

// ================= GANTRY SYSTEM LOGIC =================
// UPDATED POSITIONS: 'skills' changed to 'creative'
const positions = { 
  experience: 0, 
  projects: -210, 
  publications: -420, 
  creative: -630, 
  contact: -840 
};

const GANTRY_TRAVEL_X = 535; 
const LIFT_HEIGHT_Y = -140;  

const armPos = {
  idle:     { shoulder: 175, elbow: -120, wrist: -80 }, 
  reach:    { shoulder: 130, elbow: -85,  wrist: 45 },  
  transfer: { shoulder: 160, elbow: -150, wrist: 80 }   
};

gsap.set('#jointShoulder', { rotation: armPos.idle.shoulder });
gsap.set('#jointElbow', { rotation: armPos.idle.elbow });
gsap.set('#jointWrist', { rotation: armPos.idle.wrist });

function setLights(state) {
  lightRed.className = "segment red";
  lightYellow.className = "segment yellow";
  lightGreen.className = "segment green";

  if (state === 'idle') lightGreen.classList.add("active");
  if (state === 'moving') lightYellow.classList.add("flash");
  if (state === 'error') lightRed.classList.add("flash");
}

async function selectSection(section) {
  if (isMoving || isEmergencyStopped || currentSection === section) return;
  isMoving = true;
  setLights('moving');
  updateStatus(`SELECTED: ${section.toUpperCase()}`);

  if (currentSection) {
    updateStatus(`RETURNING: ${currentSection.toUpperCase()}`);
    await returnPreviousBox(currentSection);
  }

  updateStatus(`MOVING CONVEYOR...`);
  await moveConveyor(section);

  updateStatus(`PICKING & PLACING...`);
  await pickAndPlace(section);

  updateStatus(`READY`);
  setLights('idle');
  
  document.getElementById(section).scrollIntoView({ behavior: "smooth" });

  currentSection = section;
  isMoving = false;
}

function updateStatus(text) { statusText.innerHTML = text; }

function moveConveyor(section) {
  return new Promise((resolve) => {
    const targetX = positions[section];
    const distanceToMove = Math.abs(gsap.getProperty(conveyor, "x") - targetX);
    
    gsap.to(conveyorRollers, { backgroundPositionX: `+=${distanceToMove}`, duration: 1.5, ease: "power2.inOut" });
    gsap.to(endRoller, { rotation: `+=${distanceToMove}`, duration: 1.5, ease: "power2.inOut" });
    gsap.to(conveyor, { x: targetX, duration: 1.5, ease: "power2.inOut", onComplete: resolve });
  });
}

function pickAndPlace(section) {
  return new Promise((resolve) => {
    const originalBox = document.getElementById(`${section}-box`);
    
    const cellRect = document.getElementById("factoryCell").getBoundingClientRect();
    const boxRect = originalBox.getBoundingClientRect();
    const clone = originalBox.cloneNode(true);
    clone.id = "active-clone";
    clone.style.position = "absolute";
    clone.style.left = ((boxRect.left - cellRect.left) / currentScale) + "px";
    clone.style.top = ((boxRect.top - cellRect.top) / currentScale) + "px";
    clone.style.margin = "0";
    clone.style.zIndex = "15"; 
    document.getElementById("factoryCell").appendChild(clone);
    
    originalBox.style.opacity = 0; 

    const tl = gsap.timeline({ onComplete: resolve });

    tl.to('#jointShoulder', { rotation: armPos.reach.shoulder, duration: 0.8, ease: "power1.inOut" })
      .to('#jointElbow', { rotation: armPos.reach.elbow, duration: 0.8, ease: "power1.inOut" }, "<")
      .to('#jointWrist', { rotation: armPos.reach.wrist, duration: 0.8, ease: "power1.inOut" }, "<");

    tl.addLabel("lift")
      .to('#jointShoulder', { rotation: armPos.transfer.shoulder, duration: 1, ease: "power2.inOut" }, "lift")
      .to('#jointElbow', { rotation: armPos.transfer.elbow, duration: 1, ease: "power2.inOut" }, "lift")
      .to('#jointWrist', { rotation: armPos.transfer.wrist, duration: 1, ease: "power2.inOut" }, "lift")
      .to(clone, { y: LIFT_HEIGHT_Y, duration: 1, ease: "power2.inOut" }, "lift");

    tl.addLabel("gantryMove")
      .to('#robotBase', { x: GANTRY_TRAVEL_X, duration: 1.5, ease: "power1.inOut" }, "gantryMove")
      .to(clone, { x: GANTRY_TRAVEL_X, duration: 1.5, ease: "power1.inOut" }, "gantryMove");

    tl.addLabel("drop")
      .to('#jointShoulder', { rotation: armPos.reach.shoulder, duration: 1, ease: "power2.inOut" }, "drop")
      .to('#jointElbow', { rotation: armPos.reach.elbow, duration: 1, ease: "power2.inOut" }, "drop")
      .to('#jointWrist', { rotation: armPos.reach.wrist, duration: 1, ease: "power2.inOut" }, "drop")
      .to(clone, { y: 0, duration: 1, ease: "power2.inOut" }, "drop"); 

    tl.to('#jointShoulder', { rotation: armPos.idle.shoulder, duration: 0.6, ease: "power1.inOut" })
      .to('#jointElbow', { rotation: armPos.idle.elbow, duration: 0.6, ease: "power1.inOut" }, "<")
      .to('#jointWrist', { rotation: armPos.idle.wrist, duration: 0.6, ease: "power1.inOut" }, "<");
  });
}

function returnPreviousBox(section) {
  return new Promise((resolve) => {
    const originalBox = document.getElementById(`${section}-box`);
    const clone = document.getElementById("active-clone");

    const tl = gsap.timeline({ onComplete: () => {
      clone.remove();
      originalBox.style.opacity = 1; 
      resolve();
    }});

    tl.to('#jointShoulder', { rotation: armPos.reach.shoulder, duration: 0.6, ease: "power1.inOut" })
      .to('#jointElbow', { rotation: armPos.reach.elbow, duration: 0.6, ease: "power1.inOut" }, "<")
      .to('#jointWrist', { rotation: armPos.reach.wrist, duration: 0.6, ease: "power1.inOut" }, "<");

    tl.addLabel("lift")
      .to('#jointShoulder', { rotation: armPos.transfer.shoulder, duration: 1, ease: "power2.inOut" }, "lift")
      .to('#jointElbow', { rotation: armPos.transfer.elbow, duration: 1, ease: "power2.inOut" }, "lift")
      .to('#jointWrist', { rotation: armPos.transfer.wrist, duration: 1, ease: "power2.inOut" }, "lift")
      .to(clone, { y: LIFT_HEIGHT_Y, duration: 1, ease: "power2.inOut" }, "lift");

    tl.addLabel("gantryReturn")
      .to('#robotBase', { x: 0, duration: 1.5, ease: "power1.inOut" }, "gantryReturn")
      .to(clone, { x: 0, duration: 1.5, ease: "power1.inOut" }, "gantryReturn");

    tl.addLabel("drop")
      .to('#jointShoulder', { rotation: armPos.reach.shoulder, duration: 1, ease: "power2.inOut" }, "drop")
      .to('#jointElbow', { rotation: armPos.reach.elbow, duration: 1, ease: "power2.inOut" }, "drop")
      .to('#jointWrist', { rotation: armPos.reach.wrist, duration: 1, ease: "power2.inOut" }, "drop")
      .to(clone, { y: 0, duration: 1, ease: "power2.inOut" }, "drop");

    tl.to('#jointShoulder', { rotation: armPos.idle.shoulder, duration: 0.8, ease: "power1.inOut" })
      .to('#jointElbow', { rotation: armPos.idle.elbow, duration: 0.8, ease: "power1.inOut" }, "<")
      .to('#jointWrist', { rotation: armPos.idle.wrist, duration: 0.8, ease: "power1.inOut" }, "<");
  });
}

function triggerEmergencyStop() {
  gsap.killTweensOf("*"); 
  isEmergencyStopped = true;
  isMoving = false;
  setLights('error');
  updateStatus(`<span style="color:red">SYS FAULT - E-STOP<br>REFRESH TO RESET</span>`);
}


// ================= AUTO-SCROLLING SPLIT MODAL LOGIC =================

// ================= INITIALIZE PDF.js WORKER =================
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
// Replace the 'presentation' array links with your actual image paths for each slide
const portfolioData = {
  // Roadmap Data
  "hindustan": { title: "B.Tech in Mechatronics Engineering", subtitle: "Hindustan Institute of Technology and Science | Chennai, India (Nov 2020 – Jun 2024)", bullets: [], presentation: [] },
  "atumx": { title: "Engineering Intern – Robotics, Simulation & Assembly", subtitle: "AtumX | Chennai, India (Jun 2022 – Nov 2022)", bullets: ["Designed mechanical components in SolidWorks, producing 2D drawings and 3D assemblies, and manufactured parts using both additive and subtractive processes.", "Managed and maintained component lists and assembly documentation, supporting accurate BOM tracking.", "Collaborated closely with cross-functional engineering teams to validate design assumptions.", "Assisted in mechanical assembly, functional testing, and structured troubleshooting of robotic subsystems.", "Used ROS for robot simulation and motion validation to support design verification prior to hardware build."], presentation: [] },
  "cair": { title: "Research Intern – Robotics & Computer Vision", subtitle: "Centre for Artificial Intelligence & Robotics (CAIR), DRDO | Bangalore, India (Jun 2023 – Aug 2023)", bullets: ["Conducted an in depth literature survey on dual-arm serial manipulators (ABB- YuMi Robot) for vision-based grasp pose estimation.", "Analyzed grasp planning strategies integrating robotic kinematics and computer vision methods.", "Studied perception driven manipulation approaches for improving grasp reliability in robotic systems."], presentation: [] },
  "iitb": { title: "Research Intern & Project Associate", subtitle: "Indian Institute of Technology (IIT) Bombay | Mumbai, India (Jan 2024 – Nov 2024)", bullets: ["Designed and fabricated mechanical hardware for a snake-like robot, creating part drawings and assemblies in SolidWorks and producing components via FDM and SLA 3D printing technologies.", "Developed and implemented mechanical test methods to evaluate link durability, motor coupling reliability, and structural performance.", "Designed experimental procedures to verify actuator specifications including torque behaviour, repeatability, and load response.", "Developed Python scripts for sensor and actuator data logging, performance evaluation, and visualization of experimental results.", "Conducted repeatability and robustness testing during prototype validation, performing structured troubleshooting and root-cause analysis."], presentation: [] },
  "bologna-edu": { title: "Master’s in Automation Engineering", subtitle: "Alma Mater Studiorum – Università di Bologna | Bologna, Italy (Nov 2024 – Present)", bullets: [], presentation: [] },
  "bologna-exp": { title: "Automation & Manufacturing Intern", subtitle: "University of Bologna – Montecuccolino Laboratory | Bologna, Italy (Oct 2025 – Dec 2025)", bullets: ["Designed and conducted experiments for robotics test bench calibration, sensor validation and repeatability analysis, including 3D modelling and fabrication using FDM technologies.", "Characterized performance and reliability of electromechanical prototypes against defined specifications.", "Defined structured test procedures and validation workflows; documented results and failure modes for engineering review.", "Implemented control algorithms in TwinCAT for system verification."], presentation: [] },

  // Project Data 
  "snake": {
    title: "Serpenoid Robots for Exploration",
    subtitle: "Bio-Inspired Adaptive Locomotion",
    summary: "Developed a bio-inspired snake robot with multiple rotary joints, driven by Dynamixel MX-64R motors...",
    bullets: ["Hardware fabricated using FDM and SLA.", "Implemented traveling wave motion algorithms."],
    pdf: "https://github.com/devashishbuilds/devashish-sharma.io/blob/main/images/project_ai_knee_rehab/ai_knee.pdf" // Simply link your PDF here!
  },
  "knee": {
    title: "AI Knee Rehabilitation Mechanism",
    subtitle: "Smart Healthcare Automation",
    summary: "The system is able to tell whether the patient is suffering from Osteoarthritis or not and if yes at what level of the same. In addition to this, it suggests the actuation parameters of the assistive mechanism such that rehabilitation process can be made faster with a good accuracy.",
    bullets: ["AI-based Osteoarthritis assessment.", "Dynamic assistive mechanism parameter suggestion."],
    pdf: "documents/snake-presentation.pdf"
    // presentation: [ "https://github.com/devashishbuilds/devashish-sharma.io/blob/main/images/project_ai_knee_rehab/prediction.png?raw=true", "knee-img-2.jpg" ]
  },
  "swarm": {
    title: "Homogeneous Swarm of Cooperative Robots",
    subtitle: "Virtual Environment Simulation",
    summary: "Setting up communication between robots in a 3-D virtual simulator (WeBots).",
    bullets: ["Webots 3D Simulation.", "Multi-agent communication setup."],
    pdf: "documents/snake-presentation.pdf"
    // presentation: [ "swarm-img-1.jpg" ]
  },
  "disinfectant": {
    title: "Robotic Disinfectant System",
    subtitle: "Autonomous Path Planning & Sanitization",
    summary: "A robot which is capable of avoiding obstacles in the pathway and parallelly capable of disinfecting the near-by surfaces in range.",
    bullets: ["Autonomous path navigation.", "Simultaneous spatial sanitization logic."],
    pdf: "documents/snake-presentation.pdf"
    // presentation: [ "disinfectant-img-1.jpg", "disinfectant-img-2.jpg" ]
  },
  "follower": {
    title: "Fastest Line Follower Robot",
    subtitle: "Sensor Integration & Control Logic",
    summary: "Made a fast running bot which follows black line, worked with multiple sensors and different controllers and obtained a ideal competition winning robot.",
    bullets: ["High-speed sensory response.", "Optimal controller calibration."],
    pdf: "documents/snake-presentation.pdf"
    // presentation: [ "follower-img-1.jpg" ]
  },
  "backpack": {
    title: "Next Generation Backpack",
    subtitle: "Programmable RGB LED Matrix",
    summary: "A smart backpack featuring a programmable pixel display built using a custom matrix of RGB LEDs.",
    bullets: ["Custom LED hardware assembly.", "Custom graphics mapping."],
    pdf: "documents/snake-presentation.pdf"
    // presentation: [ "backpack-img-1.jpg" ]
  }
};

let autoScrollInterval;

async function renderPDF(url, container) {
  // Show a loading state while PDF.js does the heavy lifting
  container.innerHTML = '<p style="color:#a0a4ab; padding: 20px; text-align:center;">Loading Presentation...</p>';
  
  try {
    const pdf = await pdfjsLib.getDocument(url).promise;
    container.innerHTML = ''; // Clear loading text
    
    // Render each page
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      
      // Calculate scale to perfectly fit the container width
      const viewportForWidth = page.getViewport({ scale: 1 });
      const scale = container.clientWidth / viewportForWidth.width;
      const viewport = page.getViewport({ scale: scale });
      
      // Create and append canvas
      const canvas = document.createElement('canvas');
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      container.appendChild(canvas);
      
      // Render the page onto the canvas
      await page.render({ canvasContext: canvas.getContext('2d'), viewport }).promise;
    }
    
    // Start auto-scroll ONLY after all pages are finished rendering
    startAutoScroll();
    
  } catch (error) {
    container.innerHTML = '<p style="color:#fa5b60; padding: 20px;">Error loading presentation file.</p>';
    console.error("PDF Load Error:", error);
  }
}

function openModal(id) {
  const modal = document.getElementById('universalModal');
  const modalContent = document.querySelector('.modal-content');
  const data = portfolioData[id];
  if (!data) return;

  // 1. Setup Text Container (Right Side)
  document.getElementById('modalTitle').innerText = data.title;
  document.getElementById('modalSubtitle').innerText = data.subtitle || '';
  
  const summaryEl = document.getElementById('modalSummary');
  if(data.summary) {
    summaryEl.innerText = data.summary;
    summaryEl.style.display = "block";
  } else {
    summaryEl.style.display = "none";
  }

  const bulletsContainer = document.getElementById('modalBullets');
  if (data.bullets && data.bullets.length > 0) {
    bulletsContainer.innerHTML = data.bullets.map(b => `<li>${b}</li>`).join('');
    document.getElementById('modalTextContent').style.display = 'block';
  } else {
    document.getElementById('modalTextContent').style.display = 'none';
  }

  // 2. Setup Auto-Scrolling Presentation (Left Side)
  const presentationContainer = document.getElementById('presentationContainer');
  presentationContainer.innerHTML = ''; // Clear previous content
  presentationContainer.scrollTop = 0;

  if (data.pdf) {
    // If a PDF exists, trigger the PDF.js engine
    presentationContainer.style.display = 'block';
    renderPDF(data.pdf, presentationContainer);
  } else if (data.presentation && data.presentation.length > 0) {
    // Fallback: If using images instead of a PDF
    presentationContainer.innerHTML = data.presentation.map(img => `<img src="${img}" alt="Slide">`).join('');
    presentationContainer.style.display = 'block';
    startAutoScroll(); // Start scrolling immediately
  } else {
    presentationContainer.style.display = 'none';
  }

  // Show Modal
  modal.style.display = 'flex';
  setTimeout(() => {
    modal.style.opacity = '1';
    modalContent.style.transform = 'scale(1)';
  }, 10);
}

function closeModal() {
  const modal = document.getElementById('universalModal');
  const modalContent = document.querySelector('.modal-content');
  
  clearInterval(autoScrollInterval); // Stop scrolling immediately
  
  modal.style.opacity = '0';
  modalContent.style.transform = 'scale(0.9)';
  setTimeout(() => {
    modal.style.display = 'none';
    document.getElementById('presentationContainer').innerHTML = ''; // Clear canvases to free memory
  }, 300);
}

window.onclick = function(event) {
  const modal = document.getElementById('universalModal');
  if (event.target === modal) {
    closeModal();
  }
}

// === AUTO SCROLL FUNCTIONS ===
function startAutoScroll() {
  const container = document.getElementById('presentationContainer');
  clearInterval(autoScrollInterval); // Prevent duplicates
  
  // Scroll Logic
  autoScrollInterval = setInterval(() => {
    container.scrollTop += 1.5; // Adjust this number for scroll speed
    
    // Stop scrolling if it reaches the bottom
    if (container.scrollTop + container.clientHeight >= container.scrollHeight) {
      clearInterval(autoScrollInterval);
    }
  }, 30); 
}

function pauseAutoScroll() {
  clearInterval(autoScrollInterval);
}

function resumeAutoScroll() {
  startAutoScroll();
}
