# Offline Multi-Modal Radiology Triage MVP

An AI-powered medical imaging prioritization system designed for humanitarian crisis response. This front-end MVP demonstrates offline-capable triage of radiology scans using simulated AI inference.

**Built for Datathon Demo** | React + Tailwind CSS | Offline-First

---

## 🎯 Purpose

This application simulates an AI-powered triage system for medical imaging that can operate offline in resource-constrained environments. It demonstrates:

- **Automated Prioritization**: ONNX Runtime-powered classification of medical scans into triage levels
- **Real Model Integration**: Ready for production AI models with preprocessing pipeline
- **Offline Capability**: Works without internet using IndexedDB for persistence
- **Humanitarian Mode**: Optimized processing for crisis response scenarios
- **Visual Feedback**: Heatmap overlays showing AI attention regions (Grad-CAM ready)

---

## 🚀 Quick Start

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn

### Installation & Run

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Open browser to http://localhost:5173
```

### Build for Production

```bash
# Create optimized build
npm run build

# Preview production build
npm run preview
```

---

## 📁 Project Structure

```
├── public/
│   ├── models/                 # ONNX model files (add your triage-model.onnx here)
│   └── sample-images/          # 3 demo medical images for testing
├── scripts/
│   └── convert_model.py        # Model conversion utility (PyTorch/TF → ONNX)
├── src/
│   ├── components/
│   │   ├── Uploader.jsx        # Drag-and-drop file uploader
│   │   ├── Viewer.jsx          # Main image viewer with heatmap
│   │   ├── QueuePanel.jsx      # Patient queue sidebar
│   │   └── ThroughputCard.jsx  # Statistics widget
│   ├── workers/
│   │   └── inference.worker.js # Web Worker for simulated AI inference
│   ├── utils/
│   │   └── indexeddb.js        # IndexedDB persistence helper
│   ├── App.jsx                 # Main application component
│   ├── main.jsx                # Application entry point
│   └── index.css               # Tailwind CSS + custom styles
├── index.html
├── package.json
└── README.md
```

---

## ✅ Acceptance Criteria

### Functional Requirements

- [x] **Upload**: Drag-and-drop or file selector for PNG/JPG images
- [x] **Queue**: Sidebar showing all scans with status (queued → processing → done)
- [x] **Viewer**: Display selected scan with triage badge and confidence
- [x] **Heatmap**: Toggle overlay showing AI attention regions
- [x] **Humanitarian Mode**: Changes processing speed and urgency distribution
- [x] **Offline**: Queue persists via IndexedDB, offline indicator visible
- [x] **Export**: Download JSON report of triage results
- [x] **Keyboard Shortcuts**: U (upload), H (humanitarian toggle)
- [x] **Responsive**: Mobile/tablet/desktop layouts
- [x] **Accessibility**: Keyboard navigation, ARIA labels

### Demo Testing Steps

1. **Upload Images**: Drop files or click uploader → thumbnails appear in queue
2. **Processing**: Status changes queued → processing → done with triage label
3. **Viewer**: Click queue item → displays in main viewer
4. **Heatmap**: Toggle shows colored attention spots
5. **Humanitarian Mode**: Checkbox changes processing speed & urgency bias
6. **Offline**: Simulate offline in DevTools → banner appears, reload preserves queue
7. **Export**: Click "Export Triage Report" → downloads JSON summary

---

## 🧪 Tech Stack

- **React** (v18) - UI framework
- **Vite** - Build tool & dev server
- **Tailwind CSS** - Styling (no runtime dependencies)
- **Web Workers** - Background processing
- **IndexedDB API** - Offline persistence
- **No external runtime libraries** - Pure browser APIs only

---

## 🔧 Converting to Real Inference

### Current Implementation (v2.0)
The `src/workers/inference.worker.js` now includes **ONNX Runtime Web** integration with:
- Real model loading from `public/models/triage-model.onnx`
- Image preprocessing pipeline with tensor conversion
- Medical image normalization (adaptable for CT/X-ray/MRI)
- Fallback to simulation when no model is present

🟢 **Production Ready**: Just add your trained ONNX model!

### Quick Start: Add Your Trained Model

#### 1. **Export Your Model to ONNX**

**Option A: From PyTorch**
```python
import torch
import torch.onnx

# Load your trained radiology triage model
model = YourRadiologyModel()
model.load_state_dict(torch.load('triage_model.pth'))
model.eval()

# Create dummy input (adjust dimensions to match your model)
dummy_input = torch.randn(1, 3, 224, 224)  # [batch, channels, height, width]

# Export to ONNX
torch.onnx.export(
    model,
    dummy_input,
    "triage-model.onnx",
    export_params=True,
    opset_version=14,
    input_names=['input'],
    output_names=['output'],
    dynamic_axes={
        'input': {0: 'batch_size'},
        'output': {0: 'batch_size'}
    }
)
```

**Option B: From TensorFlow/Keras**
```python
import tf2onnx
import tensorflow as tf

# Load your trained model
model = tf.keras.models.load_model('triage_model.h5')

# Convert to ONNX
spec = (tf.TensorSpec((None, 224, 224, 3), tf.float32, name="input"),)
output_path = "triage-model.onnx"
model_proto, _ = tf2onnx.convert.from_keras(
    model, 
    input_signature=spec, 
    output_path=output_path
)
```

#### 2. **Place Model in Project**

```bash
# Copy your model to the public directory
cp triage-model.onnx public/models/triage-model.onnx
```

The worker will automatically detect and load your model on first inference!

#### 3. **Configure Model Settings**

Update `src/workers/inference.worker.js` based on your model:

```javascript
// Adjust preprocessing for your model's input size
const inputTensor = await preprocessImage(imageDataURL, 224); // Change 224 to your size

// Update input/output names (check with Netron: https://netron.app)
const feeds = { input: inputTensor };  // Match your model's input name
const output = results.output;         // Match your model's output name

// Map model outputs to triage levels
// Adjust based on your model's class order
const triageMapping = ['CRITICAL', 'URGENT', 'STABLE', 'NON-URGENT'];
```

### Advanced Integration

#### Medical Image Preprocessing

Medical images require specialized preprocessing:

```javascript
// For CT scans - apply HU windowing
function applyCTWindowing(pixelData, windowCenter, windowWidth) {
  const lower = windowCenter - (windowWidth / 2);
  const upper = windowCenter + (windowWidth / 2);
  
  return pixelData.map(pixel => {
    if (pixel <= lower) return 0;
    if (pixel >= upper) return 255;
    return ((pixel - lower) / windowWidth) * 255;
  });
}

// For X-rays - enhance contrast
function enhanceXRay(imageData) {
  // Apply CLAHE (Contrast Limited Adaptive Histogram Equalization)
  // or other domain-specific preprocessing
}
```

#### Implementing Grad-CAM Attention Maps

Replace the faux heatmap with real attention visualization:

```javascript
async function generateGradCAM(session, inputTensor, targetClass) {
  // 1. Run forward pass and get intermediate activations
  const activations = await getLayerActivations(session, inputTensor, 'last_conv_layer');
  
  // 2. Compute gradients of target class w.r.t. activations
  const gradients = await computeGradients(session, inputTensor, targetClass);
  
  // 3. Global average pooling of gradients
  const weights = globalAveragePooling(gradients);
  
  // 4. Weight activations by gradients
  let cam = weightedSum(activations, weights);
  
  // 5. Apply ReLU and normalize
  cam = cam.map(x => Math.max(0, x));
  cam = normalizeArray(cam);
  
  // 6. Resize to input dimensions and convert to overlay format
  return resizeAndConvertHeatmap(cam, 224, 224);
}
```

#### Performance Optimization

```javascript
// Enable WebAssembly threading
ort.env.wasm.numThreads = navigator.hardwareConcurrency || 4;

// Use WebGL backend for GPU acceleration
const session = await ort.InferenceSession.create(modelUrl, {
  executionProviders: ['webgl', 'wasm']
});

// Quantize model for faster inference (do this during export)
// INT8 quantization can reduce model size by 4x
```

### DICOM Support Integration

To handle medical DICOM files:

#### 1. Install DICOM Parser

```bash
npm install dicom-parser cornerstone-core cornerstone-wado-image-loader
```

#### 2. Add DICOM Preprocessing

```javascript
import dicomParser from 'dicom-parser';

async function preprocessDICOM(dicomFile) {
  const arrayBuffer = await dicomFile.arrayBuffer();
  const byteArray = new Uint8Array(arrayBuffer);
  const dataSet = dicomParser.parseDicom(byteArray);
  
  // Extract metadata
  const rows = dataSet.uint16('x00280010');
  const cols = dataSet.uint16('x00280011');
  const pixelData = dataSet.elements.x7fe00010.value;
  
  // Get windowing parameters (for CT)
  const windowCenter = dataSet.floatString('x00281050') || 40;
  const windowWidth = dataSet.floatString('x00281051') || 400;
  
  // Apply windowing and convert to tensor
  const processedPixels = applyCTWindowing(pixelData, windowCenter, windowWidth);
  return createTensorFromPixels(processedPixels, rows, cols);
}
```

#### 3. Update File Handler

```javascript
// In Uploader component
const handleFileSelect = (e) => {
  const files = Array.from(e.target.files).filter((file) =>
    file.type.match(/image\/(png|jpeg|jpg)/) || 
    file.name.endsWith('.dcm') // Support DICOM
  );
  // ...
};
```

### Model Sources

**Medical AI Models:**
- **MONAI Model Zoo**: https://github.com/Project-MONAI/model-zoo
- **ChestX-ray14**: https://github.com/arnoweng/CheXNet
- **RadImageNet**: https://www.radimagenet.com/
- **Grand Challenge**: https://grand-challenge.org/

**Pre-trained Backbones:**
- ResNet-50, EfficientNet, DenseNet (fine-tune for radiology)
- Vision Transformers (ViT) for medical imaging

### Validation & Testing

```javascript
// Test model predictions against ground truth
async function validateModel(testImages, groundTruth) {
  let correct = 0;
  
  for (let i = 0; i < testImages.length; i++) {
    const result = await runModelInference(testImages[i]);
    if (result.triageLevel === groundTruth[i]) correct++;
  }
  
  const accuracy = (correct / testImages.length) * 100;
  console.log(`Model accuracy: ${accuracy.toFixed(2)}%`);
}
```

### Production Checklist

- [ ] Model exported to ONNX format
- [ ] Model file placed in `public/models/triage-model.onnx`
- [ ] Preprocessing configured for your modality (CT/X-ray/MRI)
- [ ] Input/output names match your model
- [ ] Grad-CAM implemented for attention visualization
- [ ] DICOM support added (if needed)
- [ ] Model validated on test dataset
- [ ] Inference performance optimized (quantization, WebGL)
- [ ] Error handling for model loading failures
- [ ] Clinical validation completed (for production use)

---

## 🏥 DICOM Support (Future Enhancement)

To support medical DICOM files:

### 1. Install DICOM Parser

```bash
npm install cornerstone-core cornerstone-wado-image-loader dicom-parser
```

### 2. Configure Loader

```javascript
import * as cornerstone from 'cornerstone-core';
import * as cornerstoneWADOImageLoader from 'cornerstone-wado-image-loader';

cornerstoneWADOImageLoader.external.cornerstone = cornerstone;
cornerstoneWADOImageLoader.external.dicomParser = dicomParser;
```

### 3. Load DICOM Files

```javascript
async function loadDicomImage(file) {
  const imageId = cornerstoneWADOImageLoader.wadouri.fileManager.add(file);
  const image = await cornerstone.loadImage(imageId);
  
  // Extract pixel data
  const pixelData = image.getPixelData();
  
  // Extract metadata
  const metadata = {
    patientName: image.data.string('x00100010'),
    studyDate: image.data.string('x00080020'),
    modality: image.data.string('x00080060'),
  };
  
  return { pixelData, metadata };
}
```

---

## 🎨 Design System

### Brand Colors
- **Primary**: `#1e61ab` (Medical Blue)
- **Critical**: Red (`hsl(0, 84%, 60%)`)
- **Urgent**: Orange (`hsl(25, 95%, 53%)`)
- **Stable**: Yellow (`hsl(45, 93%, 58%)`)
- **Non-Urgent**: Gray (`hsl(210, 10%, 60%)`)

### Key Features
- Clean, minimal medical aesthetic
- High-contrast triage badges for readability
- Responsive layout (mobile → tablet → desktop)
- Keyboard accessible (U, H shortcuts)

---

## 📸 Demo Screenshots

### Upload & Processing
![Upload Demo](docs/screenshot-upload.png)

### Viewer with Heatmap
![Viewer Demo](docs/screenshot-viewer.png)

### Queue & Triage
![Queue Demo](docs/screenshot-queue.png)

---

## 🛠️ Development Notes

### No Runtime Dependencies
This project intentionally avoids runtime libraries to minimize bundle size:
- ❌ No React Router (single page)
- ❌ No Redux/state management (useState only)
- ❌ No chart libraries (custom CSS sparklines)
- ❌ No image processing libs (canvas API)

### Web Worker Bundling
Vite automatically bundles workers using:
```javascript
new Worker(new URL('./workers/inference.worker.js', import.meta.url))
```

### IndexedDB Persistence
Queue survives page reloads and offline scenarios using native IndexedDB API.

---

## ⚠️ Limitations & Disclaimers

- **Demo Only**: Not for clinical use
- **Simulated AI**: Uses random classification, not real model
- **First 50 Pages**: If DICOM multi-frame, only first 50 processed
- **Browser Support**: Modern browsers (Chrome, Firefox, Safari, Edge)

---

## 📝 License

MIT License - Built for educational/datathon purposes

---

## 🤝 Contributing

This is a demo project. For production use:
1. Replace simulated inference with trained model
2. Add DICOM support via Cornerstone
3. Implement backend API for model serving
4. Add authentication & audit logging
5. Conduct clinical validation

---

## 📞 Support

For questions or issues during the datathon, contact the development team.

**Demo Ready** ✅ | **Offline Capable** ✅ | **Humanitarian Optimized** ✅
