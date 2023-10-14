const video = document.getElementById('video');

Promise.all([
  faceapi.nets.tinyFaceDetector.loadFromUri('../models'),
  faceapi.nets.faceLandmark68Net.loadFromUri('../models'),
]).then(startVideo);

function startVideo() {
  navigator.getUserMedia(
    { video: {} },
    stream => video.srcObject = stream,
    err => console.error(err)
  );
}

let scanning = false;
let startTime;
let orientation = 'Frente';

const startScanButton = document.getElementById('start-scan-button');
const scanResults = document.getElementById('scan-results');
const timerValue = document.getElementById('timer-value');

startScanButton.addEventListener('click', () => {
  if (scanning) {
    scanning = false;
    startScanButton.textContent = 'Iniciar Varredura';
  } else {
    scanning = true;
    startScanButton.textContent = 'Parar Varredura';
    startTime = Date.now();
  }
});

video.addEventListener('play', () => {
  const canvas = faceapi.createCanvasFromMedia(video);
  document.body.append(canvas);
  const displaySize = { width: video.width, height: video.height };
  faceapi.matchDimensions(canvas, displaySize);

  const startScanning = async () => {
    const detections = await faceapi.detectAllFaces(video, new faceapi.TinyFaceDetectorOptions()).withFaceLandmarks();
    const resizedDetections = faceapi.resizeResults(detections, displaySize);

    canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);
    faceapi.draw.drawDetections(canvas, resizedDetections);

    if (detections.length > 0) {
      const nose = detections[0].landmarks._positions[30];
      const chin = detections[0].landmarks._positions[8];

      if (nose.y < chin.y) {
        orientation = 'Para Baixo';
      } else if (nose.y > chin.y) {
        orientation = 'Para Cima';
      } else {
        orientation = 'Frente';
      }

      scanResults.textContent = 'Orientação: ' + orientation;
    }

    if (scanning) {
      requestAnimationFrame(startScanning);
    } else {
      const endTime = Date.now();
      const scanTime = (endTime - startTime) / 1000;
      timerValue.textContent = 'Tempo da Varredura: ' + scanTime.toFixed(1) + ' segundos';
    }
  };

  startScanning();
});
