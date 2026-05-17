const conveyor = document.getElementById("conveyor");
const statusText = document.getElementById("statusText");

let currentSection = null;
let isMoving = false; // Prevents overlapping animations

// Conveyor slide positions (box width 120 + gap 80 = 200px steps)
const positions = {
  education: 0,
  projects: -200,
  experience: -400,
  skills: -600,
  contact: -800
};

// Robot Arm Kinematic Angles (Degrees)
// Robot Arm Kinematic Angles (Degrees)
const armPos = {
  idle:  { shoulder: -80, elbow: 70, wrist: 10 },   // Standing tall
  reach: { shoulder: 15,  elbow: 25, wrist: -40 },  // Bending down to conveyor
  lift:  { shoulder: -40, elbow: 60, wrist: -20 }   // Reaching up to platform
};

// Initialize Robot Arm to Idle State
gsap.set('#jointShoulder', { rotation: armPos.idle.shoulder });
gsap.set('#jointElbow', { rotation: armPos.idle.elbow });
gsap.set('#jointWrist', { rotation: armPos.idle.wrist });

async function selectSection(section) {
  if (isMoving || currentSection === section) return;
  isMoving = true;

  updateStatus(`SELECTED: ${section.toUpperCase()}`);

  // 1. Return previous box to conveyor if one exists
  if (currentSection) {
    updateStatus(`RETURNING: ${currentSection.toUpperCase()}`);
    await returnPreviousBox(currentSection);
  }

  // 2. Slide Conveyor to new box
  updateStatus(`MOVING CONVEYOR...`);
  await moveConveyor(section);

  // 3. Pick and Place new box onto platform
  updateStatus(`PICKING: ${section.toUpperCase()}`);
  await pickAndPlace(section);

  // 4. Scroll page
  updateStatus(`READY`);
  document.getElementById(section).scrollIntoView({ behavior: "smooth" });

  currentSection = section;
  isMoving = false;
}

function updateStatus(text) {
  statusText.innerHTML = text;
}

function moveConveyor(section) {
  return new Promise((resolve) => {
    gsap.to(conveyor, {
      x: positions[section],
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

    // Arm reaches down
    tl.to('#jointShoulder', { rotation: armPos.reach.shoulder, duration: 0.8, ease: "power1.inOut" }, "reach")
      .to('#jointElbow', { rotation: armPos.reach.elbow, duration: 0.8, ease: "power1.inOut" }, "reach")
      .to('#jointWrist', { rotation: armPos.reach.wrist, duration: 0.8, ease: "power1.inOut" }, "reach");

    // Arm and Box lift together up to the platform (Y: -190)
    tl.to('#jointShoulder', { rotation: armPos.lift.shoulder, duration: 1, ease: "power1.inOut" }, "lift")
      .to('#jointElbow', { rotation: armPos.lift.elbow, duration: 1, ease: "power1.inOut" }, "lift")
      .to('#jointWrist', { rotation: armPos.lift.wrist, duration: 1, ease: "power1.inOut" }, "lift")
      .to(box, { y: -190, duration: 1, ease: "power1.inOut" }, "lift");

    // Arm retracts to idle, leaving box on the platform
    tl.to('#jointShoulder', { rotation: armPos.idle.shoulder, duration: 0.6, ease: "power1.inOut" }, "idle")
      .to('#jointElbow', { rotation: armPos.idle.elbow, duration: 0.6, ease: "power1.inOut" }, "idle")
      .to('#jointWrist', { rotation: armPos.idle.wrist, duration: 0.6, ease: "power1.inOut" }, "idle");
  });
}

function returnPreviousBox(section) {
  return new Promise((resolve) => {
    const box = document.getElementById(`${section}-box`);
    const tl = gsap.timeline({ onComplete: resolve });

    // Arm moves to the platform to grab the current box
    tl.to('#jointShoulder', { rotation: armPos.lift.shoulder, duration: 0.6, ease: "power1.inOut" }, "reach")
      .to('#jointElbow', { rotation: armPos.lift.elbow, duration: 0.6, ease: "power1.inOut" }, "reach")
      .to('#jointWrist', { rotation: armPos.lift.wrist, duration: 0.6, ease: "power1.inOut" }, "reach");

    // Arm and Box lower together back to the conveyor (Y: 0)
    tl.to('#jointShoulder', { rotation: armPos.reach.shoulder, duration: 1, ease: "power1.inOut" }, "lower")
      .to('#jointElbow', { rotation: armPos.reach.elbow, duration: 1, ease: "power1.inOut" }, "lower")
      .to('#jointWrist', { rotation: armPos.reach.wrist, duration: 1, ease: "power1.inOut" }, "lower")
      .to(box, { y: 0, duration: 1, ease: "power1.inOut" }, "lower");

    // Arm retracts back to idle position out of the way
    tl.to('#jointShoulder', { rotation: armPos.idle.shoulder, duration: 0.8, ease: "power1.inOut" }, "idle")
      .to('#jointElbow', { rotation: armPos.idle.elbow, duration: 0.8, ease: "power1.inOut" }, "idle")
      .to('#jointWrist', { rotation: armPos.idle.wrist, duration: 0.8, ease: "power1.inOut" }, "idle");
  });
}
