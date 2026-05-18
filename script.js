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
const positions = { 
  experience: 0, 
  projects: -210, 
  publications: -420, 
  skills: -630, 
  contact: -840 
};

const GANTRY_TRAVEL_X = 535; 
const LIFT_HEIGHT_Y = -140;  

const armPos = {
  //idle:     { shoulder: 130, elbow: -85, wrist: 45 },
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

// ================= UNIVERSAL MODAL LOGIC (ROADMAP & PROJECTS) =================
const portfolioData = {
  // --- ROADMAP DATA ---
  "hindustan": {
    title: "B.Tech in Mechatronics Engineering",
    subtitle: "Hindustan Institute of Technology and Science | Chennai, India (Nov 2020 – Jun 2024)",
    bullets: [],
    slides: []
  },
  "atumx": {
    title: "Engineering Intern – Robotics, Simulation & Assembly",
    subtitle: "AtumX | Chennai, India (Jun 2022 – Nov 2022)",
    bullets: [
      "Designed mechanical components in SolidWorks, producing 2D drawings and 3D assemblies, and manufactured parts using both additive and subtractive processes.",
      "Managed and maintained component lists and assembly documentation, supporting accurate BOM tracking.",
      "Collaborated closely with cross-functional engineering teams to validate design assumptions.",
      "Assisted in mechanical assembly, functional testing, and structured troubleshooting of robotic subsystems.",
      "Used ROS for robot simulation and motion validation to support design verification prior to hardware build."
    ],
    slides: [] // Add {img: "img.jpg", desc: "desc"} here if you have job photos!
  },
  "cair": {
    title: "Research Intern – Robotics & Computer Vision",
    subtitle: "Centre for Artificial Intelligence & Robotics (CAIR), DRDO | Bangalore, India (Jun 2023 – Aug 2023)",
    bullets: [
      "Conducted an in depth literature survey on dual-arm serial manipulators (ABB- YuMi Robot) for vision-based grasp pose estimation.",
      "Analyzed grasp planning strategies integrating robotic kinematics and computer vision methods.",
      "Studied perception driven manipulation approaches for improving grasp reliability in robotic systems."
    ],
    slides: []
  },
  "iitb": {
    title: "Research Intern & Project Associate",
    subtitle: "Indian Institute of Technology (IIT) Bombay | Mumbai, India (Jan 2024 – Nov 2024)",
    bullets: [
      "Designed and fabricated mechanical hardware for a snake-like robot, creating part drawings and assemblies in SolidWorks and producing components via FDM and SLA 3D printing technologies.",
      "Developed and implemented mechanical test methods to evaluate link durability, motor coupling reliability, and structural performance.",
      "Designed experimental procedures to verify actuator specifications including torque behaviour, repeatability, and load response.",
      "Developed Python scripts for sensor and actuator data logging, performance evaluation, and visualization of experimental results.",
      "Conducted repeatability and robustness testing during prototype validation, performing structured troubleshooting and root-cause analysis."
    ],
    slides: []
  },
  "bologna-edu": {
    title: "Master’s in Automation Engineering",
    subtitle: "Alma Mater Studiorum – Università di Bologna | Bologna, Italy (Nov 2024 – Present)",
    bullets: [],
    slides: []
  },
  "bologna-exp": {
    title: "Automation & Manufacturing Intern",
    subtitle: "University of Bologna – Montecuccolino Laboratory | Bologna, Italy (Oct 2025 – Dec 2025)",
    bullets: [
      "Designed and conducted experiments for robotics test bench calibration, sensor validation and repeatability analysis, including 3D modelling and fabrication using FDM technologies.",
      "Characterized performance and reliability of electromechanical prototypes against defined specifications.",
      "Defined structured test procedures and validation workflows; documented results and failure modes for engineering review.",
      "Implemented control algorithms in TwinCAT for system verification."
    ],
    slides: []
  },

  // --- PROJECT DATA ---
  "snake": {
    title: "Serpenoid Robots for Exploration",
    subtitle: "Bio-Inspired Adaptive Locomotion",
    bullets: [],
    slides: [
      { img: "snake-img-1.jpg", desc: "Developed a bio-inspired snake robot with multiple rotary joints, driven by Dynamixel MX-64R motors, to achieve adaptive locomotion in straight and narrow channels." },
      { img: "snake-img-2.jpg", desc: "Designed and implemented a control algorithm based on traveling wave motion." },
      { img: "snake-img-3.jpg", desc: "Enabled selective anchoring using current feedback for highly efficient propulsion on uneven terrain." }
    ]
  },
  "knee": {
    title: "AI Knee Rehabilitation Mechanism",
    subtitle: "Smart Healthcare Automation",
    bullets: [],
    slides: [
      { img: "knee-img-1.jpg", desc: "The system identifies if the patient is suffering from Osteoarthritis and assesses the severity level using AI." },
      { img: "knee-img-2.jpg", desc: "Actuation parameters of the assistive mechanism are dynamically suggested to optimize the rehabilitation process." }
    ]
  },
  "swarm": {
    title: "Homogeneous Swarm of Cooperative Robots",
    subtitle: "Virtual Environment Simulation",
    bullets: [],
    slides: [
      { img: "swarm-img-1.jpg", desc: "Setting up robust communication protocols between homogeneous robots in a 3-D virtual simulator (WeBots)." }
    ]
  },
  "disinfectant": {
    title: "Robotic Disinfectant System",
    subtitle: "Autonomous Path Planning & Sanitization",
    bullets: [],
    slides: [
      { img: "disinfectant-img-1.jpg", desc: "A robot capable of autonomous obstacle avoidance in complex pathways." },
      { img: "disinfectant-img-2.jpg", desc: "Parallel processing allows it to simultaneously disinfect nearby surfaces within its operational range." }
    ]
  },
  "follower": {
    title: "Fastest Line Follower Robot",
    subtitle: "Sensor Integration & Control Logic",
    bullets: ["Made a fast-running bot which follows a black line.", "Worked with multiple sensors and different controllers to obtain an ideal, competition-winning robot."],
    slides: []
  },
  "backpack": {
    title: "Next Generation Backpack",
    subtitle: "Programmable RGB LED Matrix",
    bullets: ["Developed a smart backpack featuring a programmable pixel display built using a custom matrix of RGB LEDs."],
    slides: []
  }
};

let currentGallery = [];
let currentSlideIndex = 0;

function openModal(id) {
  const modal = document.getElementById('universalModal');
  const modalContent = document.querySelector('.modal-content');
  const data = portfolioData[id];
  
  if (!data) return;

  // 1. Populate Text
  document.getElementById('modalTitle').innerText = data.title;
  document.getElementById('modalSubtitle').innerText = data.subtitle || '';

  // 2. Populate Bullets
  const bulletsContainer = document.getElementById('modalBullets');
  const textContentWrapper = document.getElementById('modalTextContent');
  if (data.bullets && data.bullets.length > 0) {
    bulletsContainer.innerHTML = data.bullets.map(b => `<li>${b}</li>`).join('');
    textContentWrapper.style.display = 'block';
  } else {
    textContentWrapper.style.display = 'none';
  }

  // 3. Populate Carousel
  const carousel = document.getElementById('modalCarousel');
  const slideInfo = document.getElementById('modalSlideInfo');
  if (data.slides && data.slides.length > 0) {
    carousel.style.display = 'flex';
    slideInfo.style.display = 'block';
    currentGallery = data.slides;
    currentSlideIndex = 0;
    updateSlideDisplay();
  } else {
    carousel.style.display = 'none';
    slideInfo.style.display = 'none';
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
  
  modal.style.opacity = '0';
  modalContent.style.transform = 'scale(0.9)';
  
  setTimeout(() => {
    modal.style.display = 'none';
  }, 300);
}

function changeSlide(direction) {
  currentSlideIndex += direction;
  if (currentSlideIndex >= currentGallery.length) {
    currentSlideIndex = 0;
  } else if (currentSlideIndex < 0) {
    currentSlideIndex = currentGallery.length - 1;
  }
  updateSlideDisplay();
}

function updateSlideDisplay() {
  const slide = currentGallery[currentSlideIndex];
  const imgElement = document.getElementById('modalImage');
  imgElement.style.opacity = 0.5;
  
  setTimeout(() => {
    imgElement.src = slide.img;
    document.getElementById('modalDescription').innerText = slide.desc;
    document.getElementById('slideCounter').innerText = `${currentSlideIndex + 1} / ${currentGallery.length}`;
    imgElement.style.opacity = 1;
  }, 150);
}

window.onclick = function(event) {
  const modal = document.getElementById('universalModal');
  if (event.target === modal) {
    closeModal();
  }
}

// ================= MULTILINGUAL FLIP GREETING =================
const greetings = ["HELLO!", "CIAO!", "NAMASTE!", "HOLA!", "BONJOUR!", "HALLO!"];
let greetIndex = 0;
const greetElement = document.getElementById("flip-greeting");

if (greetElement) {
  setInterval(() => {
    // 1. Flip out and fade
    greetElement.classList.add("flip-out");
    
    // 2. Wait for the flip out to finish (400ms to match CSS), then swap text
    setTimeout(() => {
      greetIndex = (greetIndex + 1) % greetings.length;
      greetElement.innerText = greetings[greetIndex];
      
      // 3. Flip back in
      greetElement.classList.remove("flip-out");
    }, 400); 
    
  }, 1500); // Change language every 1.5 seconds
}
