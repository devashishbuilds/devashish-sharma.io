pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

const conveyor = document.getElementById("conveyor");
const conveyorRollers = document.getElementById("conveyorRollers");
const endRoller = document.getElementById("endRoller");
const statusText = document.getElementById("statusText");

const lightRed = document.getElementById("lightRed");
const lightYellow = document.getElementById("lightYellow");
const lightGreen = document.getElementById("lightGreen");

const scannerText = document.getElementById("scannerText");
const scanLightRed = document.getElementById("scanLightRed");
const scanLightGreen = document.getElementById("scanLightGreen");
const scannerBeam = document.getElementById("scannerBeam");

let currentSection = null;
let isMoving = false; 
let isEmergencyStopped = false;
let currentScale = 1;
// You can tune the speed multiplier here (Lower = Faster!)
const CONVEYOR_SPEED_FACTOR = 0.8; 

// ================= INFINITE CONVEYOR LOGIC =================
let beltRollerTween = gsap.to(conveyorRollers, { backgroundPositionX: "-=210", duration: 3, repeat: -1, ease: "none" });
let beltEndTween = gsap.to(endRoller, { rotation: "-=360", duration: 3, repeat: -1, ease: "none" });
let conveyorLoop;

function startBelt() {
  beltRollerTween.play();
  beltEndTween.play();
  scannerBeam.classList.remove("off");
  
  if (conveyorLoop) conveyorLoop.kill(); 
  
  conveyorLoop = gsap.to(conveyor, {
      x: "-=1050",
      duration: 15,
      ease: "none",
      repeat: -1,
      modifiers: {
          x: gsap.utils.unitize(x => parseFloat(x) % 1050)
      }
  });
}

function stopBelt() {
  beltRollerTween.pause();
  beltEndTween.pause();
  scannerBeam.classList.add("off");
  if (conveyorLoop) conveyorLoop.pause();
}

startBelt();

// ================= DYNAMIC VIEWPORT SCALING =================
function resizeFactory() {
  const wrapper = document.getElementById("factoryWrapper");
  const cell = document.getElementById("factoryCell");
  if(wrapper && cell) {
    currentScale = wrapper.clientWidth / 1150; 
    cell.style.transform = `scale(${currentScale})`;
    wrapper.style.height = `${550 * currentScale}px`; 
  }
}
window.addEventListener("resize", resizeFactory);
setTimeout(resizeFactory, 100);

// ================= GANTRY SYSTEM LOGIC =================
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

function updateScanner(text, state) {
  scannerText.innerText = text;
  scanLightRed.classList.remove("active");
  scanLightGreen.classList.remove("active");
  if(state === 'red') scanLightRed.classList.add("active");
  if(state === 'green') scanLightGreen.classList.add("active");
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
  startBelt(); 
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
    if(conveyorLoop) conveyorLoop.kill();
    
    let targetBase = positions[section]; 
    let currentX = parseFloat(gsap.getProperty(conveyor, "x")) || 0;
    
    let targetX = targetBase;
    while (targetX > currentX) {
        targetX -= 1050; 
    }
    
    if (Math.abs(targetX - currentX) < 2) {
         gsap.set(conveyor, {x: positions[section]});
         updateScanner(`[ MATCH: ${section.toUpperCase()} ]`, "green");
         stopBelt();
         resolve();
         return;
    }

    let distance = Math.abs(targetX - currentX);
    
    // Custom Speed logic integration
    let duration = distance / (70 / CONVEYOR_SPEED_FACTOR); 
    
    // Sync rollers to faster speed
    gsap.to(conveyorRollers, { backgroundPositionX: `-=${distance}`, duration: duration, ease: "none" });
    gsap.to(endRoller, { rotation: `-=360`, duration: duration, repeat: -1, ease: "none" });

    let scanSim = setInterval(() => {
        let curr = (parseFloat(gsap.getProperty(conveyor, "x")) % 1050) || 0;
        if (curr > 0) curr -= 1050; 
        
        let closest = null;
        let minDist = 999;
        for(let key in positions) {
            let dist = Math.abs(curr - positions[key]);
            if(dist < minDist) { minDist = dist; closest = key; }
        }
        
        if(minDist < 60) {
            if (closest !== section) {
                 updateScanner(`[ PASS: ${closest.toUpperCase()} ]`, "red");
            }
        } else {
            updateScanner("[ SCANNING... ]", "red");
        }
    }, 100);

    gsap.to(conveyor, { 
        x: targetX, 
        duration: duration, 
        ease: "none", 
        onComplete: () => {
            clearInterval(scanSim);
            updateScanner(`[ MATCH: ${section.toUpperCase()} ]`, "green");
            stopBelt();
            gsap.set(conveyor, { x: positions[section] });
            resolve();
        }
    });
  });
}

function pickAndPlace(section) {
  return new Promise((resolve) => {
    const originalBox = document.getElementById(`${section}-box`);
    const sceneRect = document.getElementById("factoryScene").getBoundingClientRect();
    const boxRect = originalBox.getBoundingClientRect();
    
    const clone = originalBox.cloneNode(true);
    clone.id = "active-clone";
    clone.style.position = "absolute";
    clone.style.left = ((boxRect.left - sceneRect.left) / currentScale) + "px";
    clone.style.top = ((boxRect.top - sceneRect.top) / currentScale) + "px";
    clone.style.margin = "0";
    clone.style.zIndex = "15"; 
    document.getElementById("factoryScene").appendChild(clone);
    
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
      .to('#dragChain', { width: 145 + GANTRY_TRAVEL_X, duration: 1.5, ease: "power1.inOut" }, "gantryMove")
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
    updateScanner("[ SYS: RETURNING ]", "red");

    const tl = gsap.timeline({ onComplete: () => {
      clone.remove();
      originalBox.style.opacity = 1; 
      startBelt(); // restart conveyor belt line
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
      .to('#dragChain', { width: 145, duration: 1.5, ease: "power1.inOut" }, "gantryReturn")
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
  stopBelt();
  updateScanner("[ ! E-STOP ! ]", "red");
  updateStatus(`<span style="color:red">SYS FAULT - E-STOP<br>REFRESH TO RESET</span>`);
}

// ================= UNIVERSAL MODAL LOGIC =================
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
    summary: "Developed a bio-inspired snake robot with multiple rotary joints, driven by Dynamixel MX-64R motors, to achieve adaptive locomotion in straight and narrow channels. Designed and implemented a control algorithm based on traveling wave motion, enabling selective anchoring using current feedback for highly efficient propulsion.",
    bullets: ["Hardware fabricated using FDM and SLA.", "Implemented traveling wave motion algorithms.", "Terrain anchoring via current feedback."],
    pdf: "documents/snake-presentation.pdf", 
    presentation: [ "images/snake-img-1.jpg" ]
  },
  "knee": {
    title: "AI Knee Rehabilitation Mechanism",
    subtitle: "Diagnostic Healthcare Automation",
    summary: "The system is able to tell whether the patient is suffering from Osteoarthritis or not and if yes at what level of the same. In addition to this, it suggests the actuation parameters of the assistive mechanism such that rehabilitation process can be made faster with a good accuracy.",
    bullets: ["AI-based Osteoarthritis assessment.", "Dynamic assistive mechanism parameter suggestion."],
    pdf: "images/project_ai_knee_rehab/ai_knee.pdf"
    //presentation: [ "images/knee-img-1.jpg" ]
  },
  "swarm": {
    title: "Homogeneous Swarm of Cooperative Robots",
    subtitle: "Virtual Environment Simulation",
    summary: "Setting up communication between robots in a 3-D virtual simulator (WeBots).",
    bullets: ["Webots 3D Simulation.", "Multi-agent communication setup."],
    presentation: [ "images/swarm-img-1.jpg" ]
  },
  "disinfectant": {
    title: "Robotic Disinfectant System",
    subtitle: "Autonomous Path Planning & Sanitization",
    summary: "A robot which is capable of avoiding obstacles in the pathway and parallelly capable of disinfecting the near-by surfaces in range.",
    bullets: ["Autonomous path navigation.", "Simultaneous spatial sanitization logic."],
    presentation: [ "images/disinfectant-img-1.jpg" ]
  },
  "follower": {
    title: "Fastest Line Follower Robot",
    subtitle: "Sensor Integration & Control Logic",
    summary: "Made a fast running bot which follows black line, worked with multiple sensors and different controllers and obtained a ideal competition winning robot.",
    bullets: ["High-speed sensory response.", "Optimal controller calibration."],
    presentation: [ "images/follower-img-1.jpg" ]
  },
  "backpack": {
    title: "Next Generation Backpack",
    subtitle: "Programmable RGB LED Matrix",
    summary: "A smart backpack featuring a programmable pixel display built using a custom matrix of RGB LEDs.",
    bullets: ["Custom LED hardware assembly.", "Custom graphics mapping."],
    pdf: "images/project_smart_bag/bagpack.pdf"
  },
  
  // ================= NEW PROJECTS ADDED =================
  "desk-manipulator": {
    title: "3-DOF Desk Manipulator",
    subtitle: "Compact Robotic Arm for Desktop Environments",
    summary: "Designed and developed a 3 degrees-of-freedom robotic manipulator optimized for desktop use. The project encompassed complete mechanical fabrication, forward and inverse kinematics modeling, and integration of servo motors for precise, light pick-and-place tasks.",
    bullets: ["Custom mechanical design and 3D printing.", "Kinematic modeling and trajectory planning.", "Integrated motor control systems."],
    presentation: [ "images/desk-manipulator.jpg" ]
  },
  "knee-robot": {
    title: "Knee Rehabilitation Robot",
    subtitle: "Mechanical Assistive Device for Physical Therapy",
    summary: "Developed a physical knee rehabilitation robot focused on providing safe, controlled continuous passive motion (CPM) to assist patients recovering from knee injuries. This hardware implementation is designed with critical safety constraints in mind.",
    bullets: ["Ergonomic mechanical linkage design.", "Safety-first actuation limits.", "Torque and velocity control for patient comfort."],
    pdf: "images/project_knee_rehab/knee_rehab_robot.pdf"
  },
  "ambient-light": {
    title: "Ambient Screen Light",
    subtitle: "Responsive Background Illumination System",
    summary: "Created an immersive ambient background lighting system that dynamically extends screen colors to the surrounding environment. The system samples display pixels in real-time and maps them to an addressable RGB LED strip behind the monitor.",
    bullets: ["Real-time screen capture and color processing.", "Microcontroller integration with addressable LEDs.", "Low-latency visual synchronization."],
    pdf: "images/project_ambient_light/sample_al.pdf"
  },

  // ================= EXTRACURRICULAR DATA =================
  "product-design": {
    title: "Product Design",
    subtitle: "Beyond the Desk",
    summary: "Conceptualizing and drafting functional, ergonomic solutions that blend engineering constraints with aesthetic appeal.",
    bullets: [],
    presentation: ["images/pd1.jpg", "images/pd2.jpg", "images/pd3.jpg"]
  },
  "photography": {
    title: "Photography",
    subtitle: "Beyond the Desk",
    summary: "Capturing structural details, landscapes, and the subtle interplay of light and geometry in everyday environments.",
    bullets: [],
    presentation: ["images/photo1.jpg", "images/photo2.jpg", "images/photo3.jpg"]
  },
  "hiking": {
    title: "Hiking & Outdoors",
    subtitle: "Beyond the Desk",
    summary: "Exploring the outdoors and challenging physical limits on the trails to reset the mind after deep engineering work.",
    bullets: [],
    presentation: ["images/hike1.jpg", "images/hike2.jpg"]
  },
  "sketch": {
    title: "Sketch & Paint",
    subtitle: "Beyond the Desk",
    summary: "Translating mechanical ideas to paper and experimenting with freehand artistic expression and color theory.",
    bullets: [],
    presentation: ["images/sketch1.jpg", "images/sketch2.jpg"]
  }
};

let autoScrollInterval;

async function renderPDF(url, container) {
  container.innerHTML = '<p style="color:#a0a4ab; padding: 20px; text-align:center;">Loading Presentation...</p>';
  try {
    const pdf = await pdfjsLib.getDocument(url).promise;
    container.innerHTML = ''; 
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const viewportForWidth = page.getViewport({ scale: 1 });
      const scale = container.clientWidth / viewportForWidth.width;
      const viewport = page.getViewport({ scale: scale });
      const canvas = document.createElement('canvas');
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      container.appendChild(canvas);
      await page.render({ canvasContext: canvas.getContext('2d'), viewport }).promise;
    }
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

  document.getElementById('modalTitle').innerText = data.title;
  document.getElementById('modalSubtitle').innerText = data.subtitle || '';
  
  const summaryEl = document.getElementById('modalSummary');
  if(data.summary) {
    summaryEl.innerText = data.summary;
    summaryEl.style.display = "block";
  } else { summaryEl.style.display = "none"; }

  const bulletsContainer = document.getElementById('modalBullets');
  if (data.bullets && data.bullets.length > 0) {
    bulletsContainer.innerHTML = data.bullets.map(b => `<li>${b}</li>`).join('');
    document.getElementById('modalTextContent').style.display = 'block';
  } else { document.getElementById('modalTextContent').style.display = 'none'; }

  const presentationContainer = document.getElementById('presentationContainer');
  presentationContainer.innerHTML = ''; 
  presentationContainer.scrollTop = 0;

  if (data.pdf) {
    presentationContainer.style.display = 'block';
    renderPDF(data.pdf, presentationContainer);
  } else if (data.presentation && data.presentation.length > 0) {
    presentationContainer.innerHTML = data.presentation.map(img => `<img src="${img}" alt="Slide">`).join('');
    presentationContainer.style.display = 'block';
    startAutoScroll(); 
  } else {
    presentationContainer.style.display = 'none';
  }

  modal.style.display = 'flex';
  setTimeout(() => {
    modal.style.opacity = '1';
    modalContent.style.transform = 'scale(1)';
  }, 10);
}

function closeModal() {
  const modal = document.getElementById('universalModal');
  const modalContent = document.querySelector('.modal-content');
  clearInterval(autoScrollInterval); 
  modal.style.opacity = '0';
  modalContent.style.transform = 'scale(0.9)';
  setTimeout(() => {
    modal.style.display = 'none';
    document.getElementById('presentationContainer').innerHTML = ''; 
  }, 300);
}

window.onclick = function(event) {
  const modal = document.getElementById('universalModal');
  if (event.target === modal) { closeModal(); }
}

function startAutoScroll() {
  const container = document.getElementById('presentationContainer');
  clearInterval(autoScrollInterval); 
  autoScrollInterval = setInterval(() => {
    container.scrollTop += 1.5; 
    if (container.scrollTop + container.clientHeight >= container.scrollHeight) {
      clearInterval(autoScrollInterval);
    }
  }, 30); 
}
function pauseAutoScroll() { clearInterval(autoScrollInterval); }
function resumeAutoScroll() { startAutoScroll(); }

// ================= MULTILINGUAL FLIP GREETING =================
const greetings = ["HELLO!", "CIAO!", "NAMASTE!", "HOLA!", "BONJOUR!", "HALLO!"];
let greetIndex = 0;
const greetElement = document.getElementById("flip-greeting");

if (greetElement) {
  setInterval(() => {
    greetElement.classList.add("flip-out");
    setTimeout(() => {
      greetIndex = (greetIndex + 1) % greetings.length;
      greetElement.innerText = greetings[greetIndex];
      greetElement.classList.remove("flip-out");
    }, 400); 
  }, 1500); 
}


// ================= MINI CAROUSEL AUTO-SCROLL (BEYOND THE DESK) =================
setInterval(() => {
  const carousels = document.querySelectorAll('.mini-carousel');
  
  carousels.forEach(carousel => {
    const images = carousel.querySelectorAll('img');
    if (images.length <= 1) return; // Skip if there's only 1 image
    
    // Find the currently active image
    let activeIndex = Array.from(images).findIndex(img => img.classList.contains('active'));
    
    // Remove active class from current
    images[activeIndex].classList.remove('active');
    
    // Calculate next index (loop back to 0 if at the end)
    activeIndex = (activeIndex + 1) % images.length;
    
    // Add active class to next
    images[activeIndex].classList.add('active');
  });
}, 3000); // Changes image every 3 seconds (3000ms)
