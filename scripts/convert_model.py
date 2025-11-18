#!/usr/bin/env python3
"""
Model Conversion Script for Radiology Triage

This script helps convert trained PyTorch or TensorFlow models to ONNX format
for use in the browser with ONNX Runtime Web.

Usage:
    python convert_model.py --framework pytorch --checkpoint model.pth --output triage-model.onnx
    python convert_model.py --framework tensorflow --saved-model ./saved_model --output triage-model.onnx
"""

import argparse
import sys
import os

def convert_pytorch_to_onnx(checkpoint_path, output_path, input_size=(1, 3, 224, 224)):
    """
    Convert PyTorch model to ONNX format.
    
    Args:
        checkpoint_path: Path to PyTorch checkpoint (.pth file)
        output_path: Output path for ONNX model
        input_size: Input tensor size (batch, channels, height, width)
    """
    try:
        import torch
        import torch.onnx
    except ImportError:
        print("Error: PyTorch not installed. Install with: pip install torch")
        sys.exit(1)
    
    print(f"Loading PyTorch model from {checkpoint_path}...")
    
    # TODO: Replace with your actual model architecture
    # This is a placeholder - you need to import your model class
    print("ERROR: You must define your model architecture in this script")
    print("Example:")
    print("  from models.triage_model import RadiologyTriageModel")
    print("  model = RadiologyTriageModel(num_classes=4)")
    print("  model.load_state_dict(torch.load(checkpoint_path))")
    sys.exit(1)
    
    # Example implementation (uncomment and modify):
    # model = YourModelClass()
    # model.load_state_dict(torch.load(checkpoint_path))
    # model.eval()
    
    # Create dummy input
    # dummy_input = torch.randn(*input_size)
    
    # Export to ONNX
    # torch.onnx.export(
    #     model,
    #     dummy_input,
    #     output_path,
    #     export_params=True,
    #     opset_version=14,
    #     do_constant_folding=True,
    #     input_names=['input'],
    #     output_names=['output'],
    #     dynamic_axes={
    #         'input': {0: 'batch_size'},
    #         'output': {0: 'batch_size'}
    #     }
    # )
    
    # print(f"✓ Model exported to {output_path}")
    # print(f"  Input shape: {input_size}")
    # print(f"  Opset version: 14")

def convert_tensorflow_to_onnx(saved_model_path, output_path):
    """
    Convert TensorFlow SavedModel to ONNX format.
    
    Args:
        saved_model_path: Path to TensorFlow SavedModel directory
        output_path: Output path for ONNX model
    """
    try:
        import tensorflow as tf
        import tf2onnx
    except ImportError:
        print("Error: TensorFlow or tf2onnx not installed")
        print("Install with: pip install tensorflow tf2onnx")
        sys.exit(1)
    
    print(f"Loading TensorFlow model from {saved_model_path}...")
    
    # Load model
    model = tf.keras.models.load_model(saved_model_path)
    
    # Get input shape from model
    input_shape = model.input_shape
    print(f"Model input shape: {input_shape}")
    
    # Convert to ONNX
    spec = (tf.TensorSpec(input_shape, tf.float32, name="input"),)
    model_proto, _ = tf2onnx.convert.from_keras(
        model,
        input_signature=spec,
        opset=14,
        output_path=output_path
    )
    
    print(f"✓ Model exported to {output_path}")

def optimize_onnx_model(model_path, output_path):
    """
    Optimize ONNX model for browser inference.
    
    Args:
        model_path: Path to ONNX model
        output_path: Output path for optimized model
    """
    try:
        import onnx
        from onnxruntime.quantization import quantize_dynamic, QuantType
    except ImportError:
        print("Error: ONNX tools not installed")
        print("Install with: pip install onnx onnxruntime")
        sys.exit(1)
    
    print(f"Optimizing model: {model_path}")
    
    # Load and check model
    model = onnx.load(model_path)
    onnx.checker.check_model(model)
    
    # Quantize to INT8 for smaller size and faster inference
    quantize_dynamic(
        model_path,
        output_path,
        weight_type=QuantType.QUInt8
    )
    
    original_size = os.path.getsize(model_path) / (1024 * 1024)
    optimized_size = os.path.getsize(output_path) / (1024 * 1024)
    
    print(f"✓ Model optimized")
    print(f"  Original size: {original_size:.2f} MB")
    print(f"  Optimized size: {optimized_size:.2f} MB")
    print(f"  Reduction: {((original_size - optimized_size) / original_size * 100):.1f}%")

def main():
    parser = argparse.ArgumentParser(
        description="Convert trained models to ONNX for browser deployment"
    )
    
    parser.add_argument(
        '--framework',
        choices=['pytorch', 'tensorflow'],
        required=True,
        help='Source framework (pytorch or tensorflow)'
    )
    
    parser.add_argument(
        '--checkpoint',
        help='Path to PyTorch checkpoint (.pth file)'
    )
    
    parser.add_argument(
        '--saved-model',
        help='Path to TensorFlow SavedModel directory'
    )
    
    parser.add_argument(
        '--output',
        default='triage-model.onnx',
        help='Output path for ONNX model (default: triage-model.onnx)'
    )
    
    parser.add_argument(
        '--optimize',
        action='store_true',
        help='Optimize model with quantization'
    )
    
    parser.add_argument(
        '--input-size',
        type=int,
        nargs=4,
        default=[1, 3, 224, 224],
        help='Input tensor size (batch channels height width)'
    )
    
    args = parser.parse_args()
    
    # Validate arguments
    if args.framework == 'pytorch' and not args.checkpoint:
        parser.error("--checkpoint required for PyTorch models")
    
    if args.framework == 'tensorflow' and not args.saved_model:
        parser.error("--saved-model required for TensorFlow models")
    
    # Convert model
    if args.framework == 'pytorch':
        convert_pytorch_to_onnx(
            args.checkpoint,
            args.output,
            tuple(args.input_size)
        )
    else:
        convert_tensorflow_to_onnx(args.saved_model, args.output)
    
    # Optimize if requested
    if args.optimize:
        optimized_path = args.output.replace('.onnx', '_optimized.onnx')
        optimize_onnx_model(args.output, optimized_path)
        print(f"\n✓ Use optimized model: {optimized_path}")
    
    print("\nNext steps:")
    print(f"1. Copy {args.output} to public/models/")
    print("2. Update src/workers/inference.worker.js with your model's input/output names")
    print("3. Test with sample medical images")

if __name__ == '__main__':
    main()
