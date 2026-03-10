import { io } from "socket.io-client";

const SERVER = "http://localhost:5000";
const ROOM_PIN = "82kya3ya"; // create a room, paste the pin
const VIEWER_TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJfaWQiOiI2OWFmY2JjMDI3MDhhMTRiYWJhZjdjNjQiLCJlbWFpbCI6Im5pa2tpQGdtYWlsLmNvbSIsIm5hbWUiOiJuaWtraSIsImlhdCI6MTc3MzEyODY0MCwiZXhwIjoxNzczMjE1MDQwfQ.giWw7hefjXgVu4o2knytQERwG-uQqF1iUNJCuWcSY10"
const BROADCAST_INTERVAL_MS = 300;
const TEACHER_TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJfaWQiOiI2OWFmYTc3MGFkYjQ1NDE1YzVmZDJiMTIiLCJlbWFpbCI6Imthc2hpc2hAZ21haWwuY29tIiwibmFtZSI6Imthc2hpc2giLCJpYXQiOjE3NzMxMjA4MjQsImV4cCI6MTc3MzIwNzIyNH0.GGuhZMseEFQCD0LhWQXt5o_ezb1G03_oUrU-QWQbPd0"

function makeViewer(id) {
  const socket = io(SERVER, {
    extraHeaders: { cookie: `accessToken=${VIEWER_TOKEN}` }
  });

  const latencies = [];
  let received = 0;

  socket.on("connect", () => {
    socket.emit("join_room", { cc_pin: ROOM_PIN });
  });

  socket.on("code", (data) => {
    if (data._ts) {
      latencies.push(Date.now() - data._ts);
    }
    received++;
  });

  socket.on("user_error", (err) => {
    console.error(`Viewer ${id} error:`, err.message);
  });

  return { socket, getStats: () => ({ received, latencies }) };
}

function makeTeacher() {
  const socket = io(SERVER, {
    extraHeaders: { cookie: `accessToken=${TEACHER_TOKEN}` }
  });

  let sent = 0;

  socket.on("connect", () => {
    socket.emit("join_room", { cc_pin: ROOM_PIN });

    socket.on("role", (data) => {
      if (!data.isCreator) {
        console.error("Teacher token is not the room admin - use the correct token");
        process.exit(1);
      }

      console.log("Teacher joined, starting broadcast...");
      setInterval(() => {
        socket.emit("code_message", {
          cc_pin: ROOM_PIN,
          code: "x".repeat(500),
          _ts: Date.now()
        });
        sent++;
      }, BROADCAST_INTERVAL_MS);
    });
  });

  return { socket, getSent: () => sent };
}

function printStats(viewers, teacherRef, numViewers) {
  const allLatencies = viewers
    .flatMap(v => v.getStats().latencies)
    .sort((a, b) => a - b);

  if (allLatencies.length === 0) {
    console.log("No latency data yet...");
    return;
  }

  const p50 = allLatencies[Math.floor(allLatencies.length * 0.5)];
  const p95 = allLatencies[Math.floor(allLatencies.length * 0.95)];
  const p99 = allLatencies[Math.floor(allLatencies.length * 0.99)];
  const totalReceived = viewers.reduce((sum, v) => sum + v.getStats().received, 0);
  const sent = teacherRef.getSent();
  const dropRate = sent > 0 ? (((sent * numViewers) - totalReceived) / (sent * numViewers) * 100).toFixed(1) : 0;

  console.log(`\n--- Stats (${numViewers} viewers) ---`);
  console.log(`Messages sent by teacher: ${sent}`);
  console.log(`Total received across all viewers: ${totalReceived}`);
  console.log(`Drop rate: ${dropRate}%`);
  console.log(`Broadcast latency  p50: ${p50}ms | p95: ${p95}ms | p99: ${p99}ms`);
}

// Run test
async function runTest(numViewers) {
  console.log(`\nStarting test with ${numViewers} viewers...`);

  const viewers = Array.from({ length: numViewers }, (_, i) => makeViewer(i));

  // Give viewers time to connect before teacher starts
  await new Promise(r => setTimeout(r, 2000));

  const teacher = makeTeacher();

  // Print stats every 10s
  const statsInterval = setInterval(() => printStats(viewers, teacher, numViewers), 10000);

  // Stop after 60s
  await new Promise(r => setTimeout(r, 60000));
  clearInterval(statsInterval);
  printStats(viewers, teacher, numViewers);

  console.log(`\nTest complete. Closing connections...`);
  viewers.forEach(v => v.socket.disconnect());
  teacher.socket.disconnect();
}

// await runTest(50);   // run once at 50
// await runTest(100);  // then bump to 100
await runTest(200);  // then 200