const canvas = document.getElementById('robotCanvas');
const ctx = canvas.getContext('2d');
const statusText = document.getElementById('statusText');
const coordText = document.getElementById('coordText');

// Robot Configuration
const robot = {
  baseX: 200,          // Ceiling mount X
  baseY: 0,            // Ceiling mount Y
  L1: 180,             // Length of Upper Arm
  L2: 160,             // Length of Forearm
  currentX: 200,       // Current End Effector X
  currentY: 100,       // Current End Effector Y
  targetX: 200,
  targetY: 100,
  speed: 0.05          // Speed of movement (interpolation)
};

let isEStop = false;

// Box coordinates on the grid
const boxTargets = {
  education:  { x: 100, y: 400 },
  projects:   { x: 250, y: 400 },
  experience: { x: 400, y: 400 },
  skills:     { x: 550, y: 400 },
  contact:    { x: 700, y: 400 },
  platform:   { x: 600, y: 250 }, // Drop off platform
  idle:       { x: 200, y: 80 }   // Folded near ceiling
};

// Start animation loop
requestAnimationFrame(update);

function setTarget(section) {
  if (isEStop) return;
  statusText.innerText = `MOVING TO: ${section.toUpperCase()}`;
  robot.targetX = boxTargets[section].x;
  robot.targetY = boxTargets[section].y;
}

function triggerEStop() {
  isEStop = true;
  statusText.innerHTML = `<span style="color:red">E-STOP ENGAGED</span>`;
}

// Inverse Kinematics Math (Law of Cosines)
function calculateIK(targetX, targetY) {
  // Distance from base to target
  let dx = targetX - robot.baseX;
  let dy = targetY - robot.baseY;
  let dist = Math.sqrt(dx * dx + dy * dy);

  // Constrain target to maximum reach
  if (dist > robot.L1 + robot.L2) {
    dist = robot.L1 + robot.L2 - 0.01;
    let angle = Math.atan2(dy, dx);
    targetX = robot.baseX + Math.cos(angle) * dist;
    targetY = robot.baseY + Math.sin(angle) * dist;
    dx = targetX - robot.baseX;
    dy = targetY - robot.baseY;
  }

  // Calculate angles
  let angle1 = Math.atan2(dy, dx) - Math.acos((robot.L1 * robot.L1 + dist * dist - robot.L2 * robot.L2) / (2 * robot.L1 * dist));
  let angle2 = Math.acos((robot.L1 * robot.L1 + robot.L2 * robot.L2 - dist * dist) / (2 * robot.L1 * robot.L2));

  return { a1: angle1, a2: angle2 };
}

// The Main Render Loop
function update() {
  if (!isEStop) {
    // Smoothly interpolate current position toward target (LERP)
    robot.currentX += (robot.targetX - robot.currentX) * robot.speed;
    robot.currentY += (robot.targetY - robot.currentY) * robot.speed;
  }

  // Calculate angles for the current interpolated position
  let angles = calculateIK(robot.currentX, robot.currentY);
  coordText.innerText = `X: ${Math.round(robot.currentX)} | Y: ${Math.round(robot.currentY)}`;

  // Calculate Joint Positions
  let elbowX = robot.baseX + Math.cos(angles.a1) * robot.L1;
  let elbowY = robot.baseY + Math.sin(angles.a1) * robot.L1;
  
  let wristX = elbowX + Math.cos(angles.a1 + angles.a2) * robot.L2;
  let wristY = elbowY + Math.sin(angles.a1 + angles.a2) * robot.L2;

  drawScene(elbowX, elbowY, wristX, wristY);
  requestAnimationFrame(update);
}

// Draw graphics to the Canvas
function drawScene(elbowX, elbowY, wristX, wristY) {
  ctx.clearRect(0, 0, canvas.width, canvas.height); // Clear screen

  // Draw Target Platform
  ctx.fillStyle = '#333';
  ctx.fillRect(boxTargets.platform.x - 70, boxTargets.platform.y, 140, 15);

  // Draw Boxes (Static for this example)
  ctx.fillStyle = '#ffd100';
  ctx.lineWidth = 4;
  ctx.strokeStyle = '#111';
  Object.keys(boxTargets).forEach(key => {
    if (key !== 'platform' && key !== 'idle') {
      ctx.fillRect(boxTargets[key].x - 50, boxTargets[key].y, 100, 60);
      ctx.strokeRect(boxTargets[key].x - 50, boxTargets[key].y, 100, 60);
      ctx.fillStyle = '#111';
      ctx.font = 'bold 14px Arial';
      ctx.fillText(key.toUpperCase(), boxTargets[key].x - 40, boxTargets[key].y + 35);
      ctx.fillStyle = '#ffd100';
    }
  });

  // Draw Upper Arm
  ctx.beginPath();
  ctx.moveTo(robot.baseX, robot.baseY);
  ctx.lineTo(elbowX, elbowY);
  ctx.lineWidth = 30;
  ctx.lineCap = 'round';
  ctx.strokeStyle = '#ffd100';
  ctx.stroke();

  // Draw Forearm
  ctx.beginPath();
  ctx.moveTo(elbowX, elbowY);
  ctx.lineTo(wristX, wristY);
  ctx.lineWidth = 20;
  ctx.stroke();

  // Draw Joints (Black circles)
  ctx.fillStyle = '#222';
  ctx.beginPath(); ctx.arc(robot.baseX, robot.baseY, 15, 0, Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.arc(elbowX, elbowY, 15, 0, Math.PI*2); ctx.fill();
  
  // Draw Gripper
  ctx.beginPath();
  ctx.arc(wristX, wristY, 15, 0, Math.PI*2);
  ctx.fill();
}
