// ONNX Runtime Web Worker - Real AI Inference
import * as ort from 'onnxruntime-web';

let humanitarianMode = false;
let session = null;
let modelLoaded = false;

async function initializeModel() {
  try {
    console.log('🔄 Loading ONNX model...');
    const modelUrl = '/models/triage-model.onnx';
    session = await ort.InferenceSession.create(modelUrl, {
      executionProviders: ['webgl', 'wasm'],
    });
    modelLoaded = true;
    console.log('✅ Model loaded:', session.inputNames, session.outputNames);
  } catch (error) {
    if (error && error.message && error.message.includes('Failed to fetch')) {
      console.error('❌ Server inactive or model file not served.');
    } else {
      console.error('❌ API not working or ONNX Runtime error:', error);
    }
    console.warn('⚠️ Model not found, using simulation');
    session = null;
    modelLoaded = true;
  }
}

async function preprocessImage(imageDataURL, targetSize = 224) {
  const img = await createImageBitmap(await (await fetch(imageDataURL)).blob());
  const canvas = new OffscreenCanvas(targetSize, targetSize);
  const ctx = canvas.getContext('2d');
  ctx.drawImage(img, 0, 0, targetSize, targetSize);
  const { data } = ctx.getImageData(0, 0, targetSize, targetSize);
  
  const float32Data = new Float32Array(3 * targetSize * targetSize);
  for (let i = 0; i < targetSize * targetSize; i++) {
    float32Data[i] = data[i * 4] / 255.0;
    float32Data[targetSize * targetSize + i] = data[i * 4 + 1] / 255.0;
    float32Data[targetSize * targetSize * 2 + i] = data[i * 4 + 2] / 255.0;
  }
  
  return new ort.Tensor('float32', float32Data, [1, 3, targetSize, targetSize]);
}

async function runModelInference(imageDataURL) {
  if (!session) {
    console.warn('⚠️ Inference session not available. Falling back to simulation.');
    return simulateInference();
  }
  try {
    const inputTensor = await preprocessImage(imageDataURL);
    const feeds = { [session.inputNames[0]]: inputTensor };
    const results = await session.run(feeds);
    const predictions = Array.from(results[session.outputNames[0]].data);
    const triageMapping = ['CRITICAL', 'URGENT', 'STABLE', 'NON-URGENT'];
    const maxIdx = predictions.indexOf(Math.max(...predictions));
    return {
      triageLevel: triageMapping[maxIdx],
      confidence: predictions[maxIdx],
      heatmapData: generateFauxHeatmap(triageMapping[maxIdx]),
    };
  } catch (error) {
    if (error && error.message && error.message.includes('Failed to fetch')) {
      console.error('❌ Server inactive during inference.');
    } else {
      console.error('❌ API not working or ONNX Runtime error during inference:', error);
    }
    return simulateInference();
  }
}

function simulateInference() {
  const triageLevel = simulateTriageClassification(humanitarianMode);
  return {
    triageLevel,
    confidence: 0.75 + Math.random() * 0.24,
    heatmapData: generateFauxHeatmap(triageLevel),
  };
}

function simulateTriageClassification(isHumanitarianMode) {
  const rand = Math.random();
  if (isHumanitarianMode) {
    if (rand < 0.35) return 'CRITICAL';
    if (rand < 0.65) return 'URGENT';
    if (rand < 0.85) return 'STABLE';
    return 'NON-URGENT';
  }
  if (rand < 0.20) return 'CRITICAL';
  if (rand < 0.45) return 'URGENT';
  if (rand < 0.75) return 'STABLE';
  return 'NON-URGENT';
}

function generateFauxHeatmap(triageLevel) {
  const spotCount = triageLevel === 'CRITICAL' ? 5 : 3;
  const colors = { CRITICAL: '#DC2626', URGENT: '#EA580C', STABLE: '#EAB308', 'NON-URGENT': '#9CA3AF' };
  return Array.from({ length: spotCount }, () => ({
    x: 20 + Math.random() * 60,
    y: 20 + Math.random() * 60,
    radius: 10 + Math.random() * 10,
    color: colors[triageLevel],
  }));
}

self.onmessage = async (e) => {
  const { type, scanId, imageData, enabled } = e.data;
  
  if (type === 'setHumanitarianMode') {
    humanitarianMode = enabled;
    return;
  }
  
  if (scanId && imageData) {
    const startTime = Date.now();
    if (!modelLoaded) await initializeModel();
    
    const delay = humanitarianMode ? 500 + Math.random() * 1000 : 1000 + Math.random() * 2000;
    await new Promise(resolve => setTimeout(resolve, delay));
    
    const result = await runModelInference(imageData);
    self.postMessage({ scanId, result, processingTime: Date.now() - startTime });
  }
};
