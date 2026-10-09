export default {
  summary: 'Trace pixels, channels, coordinates and annotation identity through a reproducible NumPy/Pillow/OpenCV/torchvision workflow.',
  outcomes: ['Inspect dtype, value range, channel order and HWC/CHW axes', 'Implement valid image correlation and compare a signed library result', 'Transform crop/flip boxes with the same geometry as pixels', 'Choose interpolation by image/mask semantics', 'Use weight-associated preprocessing and preserve training/evaluation contracts'],
  prerequisites: ['Data Annotation & Labeling', 'PyTorch', 'Convolution, Pooling & Receptive Fields'],
  sequence: ['Pixel and axis contract', 'Local filter products and borders', 'Crop/flip coordinate frames', 'Masks, keypoints and shared random events', 'Tool roles and complete scratch/library comparison', 'Pretrained inference and deployment checks', 'Changed-input practice'],
  visual: { type: 'Pixel neighborhood and synchronized annotation geometry', question: 'Which numerical values and target coordinates change under an image operation?', interaction: 'Edit pixels/select kernels and windows; crop/flip a boxed object and inspect retained or removed geometry.' },
  practice: { task: 'Extend the pipeline with a second object, a removing crop and a discrete mask.', success: 'Pixels and labels remain synchronized, class IDs survive, and a known pixel/box matches an independent reference.' },
  misconceptions: ['A legal shape implies correct image semantics', 'Casting to float rescales values', 'Image and mask should use identical interpolation', 'Independent random transforms preserve annotation alignment'],
  sources: ['https://docs.pytorch.org/vision/stable/transforms.html', 'https://docs.opencv.org/4.x/d4/d86/group__imgproc__filter.html', 'https://pillow.readthedocs.io/en/stable/handbook/concepts.html'],
  depth: 'core', reviewFocus: 'Channel/range conventions, image-edge coordinates, border semantics and typed target transforms.',
};
