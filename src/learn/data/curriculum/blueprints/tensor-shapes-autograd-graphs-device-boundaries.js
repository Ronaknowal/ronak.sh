export default {
  summary:
    "Preserve tensor meaning across broadcasting, differentiation, storage and device/type changes.",
  outcomes: [
    "Name axes and detect silent cross-pairing",
    "Derive shape-correct affine pullbacks with an explicit reduction",
    "Separate memory aliasing from gradient connectivity",
    "Diagnose None, zero and unretained gradients",
    "Compare scratch gradients with a matched ordinary training loop",
  ],
  prerequisites: [
    "NumPy: Arrays, Broadcasting & Vectorization",
    "Backpropagation & Automatic Differentiation",
    "PyTorch",
  ],
  sequence: [
    "Named axes",
    "Broadcasting and changed dependencies",
    "Manual pullbacks and library bridge",
    "Graph versus storage",
    "Missing gradients",
    "Dtype/device boundaries",
    "Diagnostics and practice",
  ],
  visual: {
    type: "Named-axis flow, residual matrices and forward/reverse dependency map",
    question:
      "Which target affects which prediction, and which parameter can the loss update?",
    interaction:
      "Edit paired values and compare residual/gradient matrices; change clone/detach routing while forward values remain comparable.",
  },
  practice: {
    task: "Extend matched affine scratch/library gradients to three outputs and test malformed shapes and finite differences.",
    success:
      "Axes, denominators, parameter orientation and gradients agree; disconnected paths are distinguished from numerical zeros.",
  },
  misconceptions: [
    "Compatible shapes guarantee correct pairing",
    "detach makes an independent copy",
    "clone breaks the graph",
    "A non-leaf without .grad is disconnected",
    "requires_grad restores discarded operations",
  ],
  sources: [
    "https://docs.pytorch.org/docs/stable/notes/broadcasting.html",
    "https://docs.pytorch.org/docs/stable/notes/autograd.html",
    "https://docs.pytorch.org/docs/stable/generated/torch.Tensor.to.html",
  ],
  depth: "core",
  reviewFocus:
    "Paired versus cross loss derivatives, reduction normalization, storage/graph separation, honest device limits.",
};
