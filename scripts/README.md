# Model Conversion Scripts

Utilities for converting trained radiology models to ONNX format for browser deployment.

## Prerequisites

```bash
# For PyTorch models
pip install torch onnx

# For TensorFlow models  
pip install tensorflow tf2onnx

# For model optimization
pip install onnxruntime onnx
```

## Usage

### Convert PyTorch Model

```bash
python convert_model.py \
  --framework pytorch \
  --checkpoint path/to/model.pth \
  --output triage-model.onnx \
  --input-size 1 3 224 224 \
  --optimize
```

**Note**: You must modify `convert_model.py` to import your model architecture before conversion.

### Convert TensorFlow Model

```bash
python convert_model.py \
  --framework tensorflow \
  --saved-model path/to/saved_model \
  --output triage-model.onnx \
  --optimize
```

### Verify ONNX Model

```bash
python -c "import onnx; onnx.checker.check_model(onnx.load('triage-model.onnx')); print('✓ Model valid')"
```

### Inspect Model with Netron

Visit https://netron.app and upload your `.onnx` file to visualize:
- Input/output names and shapes
- Layer architecture
- Model graph

## Model Requirements

Your model should output **4 class probabilities**:

1. CRITICAL (highest priority)
2. URGENT
3. STABLE  
4. NON-URGENT (lowest priority)

Output shape: `[batch_size, 4]` with softmax probabilities.

## Optimization

The `--optimize` flag applies INT8 quantization which:
- Reduces model size by ~4x
- Speeds up inference by ~2-3x
- Minimal accuracy loss (<1% typical)

## After Conversion

1. Copy `.onnx` file to `public/models/triage-model.onnx`
2. Update worker configuration to match your model's I/O
3. Test with sample images

## Troubleshooting

**Error: "No module named 'your_model'"**
- Solution: Add your model architecture to `convert_model.py`

**Error: "Input/output mismatch"**  
- Solution: Check input shape with Netron and update `preprocessImage()`

**Model too large (>50MB)**
- Solution: Use `--optimize` flag or apply model pruning before export

## Resources

- ONNX Tutorials: https://github.com/onnx/tutorials
- PyTorch ONNX Export: https://pytorch.org/docs/stable/onnx.html
- TF2ONNX Docs: https://github.com/onnx/tensorflow-onnx
