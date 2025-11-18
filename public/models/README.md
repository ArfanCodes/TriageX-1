# Model Directory

This directory is where you should place your trained ONNX models for radiology triage.

## Quick Start

1. **Export your model to ONNX format** (see instructions in `src/workers/inference.worker.js`)
2. **Place your model file here**: `triage-model.onnx`
3. **Update preprocessing** in the worker to match your model's input requirements
4. **Test the integration** with sample medical images

## Model Requirements

Your ONNX model should:

- **Input**: Image tensor (e.g., `[1, 3, 224, 224]` for RGB or `[1, 1, 512, 512]` for grayscale)
- **Output**: Class probabilities for triage levels
  - 4 classes: `[CRITICAL, URGENT, STABLE, NON-URGENT]`
  - Or adjust the `triageMapping` array in the worker

## Supported Formats

- `.onnx` - ONNX Runtime format (recommended)
- Exported from PyTorch, TensorFlow, Keras, scikit-learn, etc.

## Example Models

For demonstration purposes, you can test with publicly available models:

### Medical Imaging Models
- **ChestX-ray14**: https://github.com/arnoweng/CheXNet
- **MONAI Model Zoo**: https://github.com/Project-MONAI/model-zoo
- **RadImageNet**: https://www.radimagenet.com/

### Converting Pre-trained Models

If you have a PyTorch checkpoint (`.pth`):

```bash
python convert_to_onnx.py --checkpoint triage_model.pth --output triage-model.onnx
```

If you have a TensorFlow SavedModel:

```bash
python -m tf2onnx.convert --saved-model ./saved_model --output triage-model.onnx
```

## File Size Considerations

Large models (>50MB) may take time to download on first use. Consider:

1. **Model quantization** to reduce size (INT8 instead of FP32)
2. **Model pruning** to remove unnecessary weights
3. **Using a CDN** for faster model delivery
4. **Caching in IndexedDB** to avoid re-downloading

## Security Note

⚠️ **Medical AI models should be clinically validated before deployment**

This demo is for educational purposes only. Production medical AI systems require:
- FDA/CE clearance (depending on jurisdiction)
- Clinical validation studies
- Ongoing monitoring and auditing
- Proper data privacy controls (HIPAA/GDPR compliance)

## Current Status

🟡 **Demo Mode**: Using simulated inference until you add a real model file

Once you add `triage-model.onnx` here, the worker will automatically load and use it.
