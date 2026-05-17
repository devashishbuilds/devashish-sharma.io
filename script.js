const conveyor = document.getElementById("conveyor");
const conveyorRollers = document.getElementById("conveyorRollers");
const statusText = document.getElementById("statusText");

const lightRed = document.getElementById("lightRed");
const lightYellow = document.getElementById("lightYellow");
const lightGreen = document.getElementById("lightGreen");

let currentSection = null;
let isMoving = false; 
let isEmergencyStopped = false;

// Box width (130) + Gap (80) = 210px steps. 
// Roller background size is 30px, so moving it 210px perfectly aligns the pattern.
const positions = {
  education: 0,
  projects: -210,
  experience: -420,
  skills: -630,
  contact: -840
};

// Precisely calculated arm angles for perfect contact.
// Gripper will lay flat on top of the box.
const armPos = {
  idle:  { shoulder: -20, elbow: 110, wrist: -20 },   // Folded out of the way
  reach: { shoulder: 62, elbow: 15, wrist: 13 },     // Gripper physically touches box top
  lift:  { shoulder: 28, elbow: 55, wrist: 7 }       // Gripper hovers right above platform
};

gsap.set('#jointShoulder', { rotation: armPos.idle.shoulder });
gsap.set('#jointElbow', { rotation: armPos.idle.elbow });
gsap.set('#jointWrist', { rotation: armPos.idle.wrist });

function setLights(state) {
  lightRed.className = "light red";
  lightYellow.className = "light yellow";
  lightGreen.className = "light green";

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

  updateStatus(`PICKING: ${section.toUpperCase()}`);
  await pickAndPlace(section);

  updateStatus(`READY`);
  setLights('idle');
  document.getElementById(section).scrollIntoView({ behavior: "smooth" });

  currentSection = section;
  isMoving = false;
}

function updateStatus(text) {
  statusText.innerHTML = text;
}

function moveConveyor(section) {
  return new Promise((resolve) => {
    const targetX = positions[section];
    const distanceToMove = Math.abs(gsap.getProperty(conveyor, "x") - targetX);
    
    // Animate Conveyor and Rollers together
    gsap.to(conveyorRollers, {
      backgroundPositionX: `+=${distanceToMove}`, // Spins the rollers visually
      duration: 1.5,
      ease: "power2.inOut"
    });

    gsap.to(conveyor, {
      x: targetX,
      duration: 1.5,
      ease: "power2.inOut",
      onComplete: resolve
    });
  });
}

function pickAndPlace(section) {
  return new Promise((resolve) => {
    const box = document.getElementById(`${section}-box`);
    const tl = gsap.timeline({ onComplete: resolve });

    // 1. Arm reaches down, precisely touching the box
    tl.to('#jointShoulder', { rotation: armPos.reach.shoulder, duration: 0.8, ease: "power1.inOut" }, "reach")
      .to('#jointElbow', { rotation: armPos.reach.elbow, duration: 0.8, ease: "power1.inOut" }, "reach")
      .to('#jointWrist', { rotation: armPos.reach.wrist, duration: 0.8, ease: "power1.inOut" }, "reach");

    // 2. Arm and Box lift perfectly onto the platform (Y = -150 to sit exactly flush on the platform)
    tl.to('#jointShoulder', { rotation: armPos.lift.shoulder, duration: 1, ease: "power1.inOut" }, "lift")
      .to('#jointElbow', { rotation: armPos.lift.elbow, duration: 1, ease: "power1.inOut" }, "lift")
      .to('#jointWrist', { rotation: armPos.lift.wrist, duration: 1, ease: "power1.inOut" }, "lift")
      .to(box, { y: -150, duration: 1, ease: "power1.inOut" }, "lift");

    // 3. Arm retracts, leaving box
    tl.to('#jointShoulder', { rotation: armPos.idle.shoulder, duration: 0.6, ease: "power1.inOut" }, "idle")
      .to('#jointElbow', { rotation: armPos.idle.elbow, duration: 0.6, ease: "power1.inOut" }, "idle")
      .to('#jointWrist', { rotation: armPos.idle.wrist, duration: 0.6, ease: "power1.inOut" }, "idle");
  });
}

function returnPreviousBox(section) {
  return new Promise((resolve) => {
    const box = document.getElementById(`${section}-box`);
    const tl = gsap.timeline({ onComplete: resolve });

    // 1. Arm reaches platform
    tl.to('#jointShoulder', { rotation: armPos.lift.shoulder, duration: 0.6, ease: "power1.inOut" }, "reach")
      .to('#jointElbow', { rotation: armPos.lift.elbow, duration: 0.6, ease: "power1.inOut" }, "reach")
      .to('#jointWrist', { rotation: armPos.lift.wrist, duration: 0.6, ease: "power1.inOut" }, "reach");

    // 2. Arm and Box lower back to conveyor exactly (Y = 0)
    tl.to('#jointShoulder', { rotation: armPos.reach.shoulder, duration: 1, ease: "power1.inOut" }, "lower")
      .to('#jointElbow', { rotation: armPos.reach.elbow, duration: 1, ease: "power1.inOut" }, "lower")
      .to('#jointWrist', { rotation: armPos.reach.wrist, duration: 1, ease: "power1.inOut" }, "lower")
      .to(box, { y: 0, duration: 1, ease: "power1.inOut" }, "lower");

    // 3. Arm idles safely
    tl.to('#jointShoulder', { rotation: armPos.idle.shoulder, duration: 0.8, ease: "power1.inOut" }, "idle")
      .to('#jointElbow', { rotation: armPos.idle.elbow, duration: 0.8, ease: "power1.inOut" }, "idle")
      .to('#jointWrist', { rotation: armPos.idle.wrist, duration: 0.8, ease: "power1.inOut" }, "idle");
  });
}

function triggerEmergencyStop() {
  gsap.killTweensOf("*"); 
  isEmergencyStopped = true;
  isMoving = false;
  
  setLights('error');
  updateStatus(`<span style="color:red">SYS FAULT - E-STOP<br>REFRESH TO RESET</span>`);
}
