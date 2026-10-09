export default {
  summary:
    "Trace observations through statistics, visual marks and scales into reproducible scientific figures.",
  outcomes: [
    "Choose encodings by the scientific question",
    "Implement binning and density with explicit boundaries",
    "Map data to linear/log coordinates",
    "Distinguish spread from inferential uncertainty",
    "Export matched scratch/Matplotlib and seaborn/Plotly figures",
  ],
  prerequisites: [
    "NumPy: Arrays, Broadcasting & Vectorization",
    "Data Processing & Loading",
  ],
  sequence: [
    "Question and observation unit",
    "Counts, widths and density area",
    "Coordinate mapping and scale",
    "Distributions, uncertainty and color",
    "Scratch and library workflow",
    "Real Wine data",
    "Export and independent practice",
  ],
  visual: {
    type: "Editable histogram and paired-scale coordinate ruler",
    question:
      "Which visual change reflects data, aggregation or a scale choice?",
    interaction:
      "Edit one actual observation and bin policy; move one point and compare its linear/log positions.",
  },
  practice: {
    task: "Create reproducible ECDF/histogram views of a different Wine measurement.",
    success:
      "Statistics, units, normalization, uncertainty labels and source identity agree.",
  },
  misconceptions: [
    "Density height is a probability",
    "Any error bar is a confidence interval",
    "A plotting API never changes the statistic",
    "A legal axis can never mislead",
  ],
  sources: [
    "https://matplotlib.org/stable/users/explain/quick_start.html",
    "https://numpy.org/doc/stable/reference/generated/numpy.histogram.html",
    "https://clauswilke.com/dataviz/histograms-density-plots.html",
  ],
  depth: "core",
  reviewFocus:
    "Bin endpoints, area normalization, real-data provenance, scale legibility and library defaults.",
};
