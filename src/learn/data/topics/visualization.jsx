import { Prose, H2, H3, CodeBlock } from "../../components/content";
import {
  LessonIntro,
  LessonTable,
  Sources,
} from "../../components/lesson-labs/LessonElements.jsx";
import RemoteCodeBlock from "../../components/content/RemoteCodeBlock.jsx";
import {
  VisualizationPipelineFigure,
  HistogramMeaningLab,
  ScaleMeaningLab,
  WineDistributionFigure,
} from "../../components/lesson-labs/VisualizationLabs.jsx";

export default {
  title: "Visualization",
  readTime: "~40 min read + plotting workflow and practice",
  content: () => (
    <div className="neural-lesson neural-lesson-neutral">
      <LessonIntro
        prerequisites="Python arrays, a mean, proportions and units. The NumPy lesson supplies array operations; uncertainty is distinguished here and developed in the statistics lessons."
        exampleKind="Python + SVG"
      >
        Follow one question from observations to a figure somebody else can
        inspect. Sections 1–5 build the visual/statistical mechanism; sections
        6–7 run scratch and ordinary plotting routes on real Wine measurements.
        Section 8 explains export and scale. The two live investigations use
        declared small fixtures so every mark can be checked by hand.
      </LessonIntro>
      <Prose>
        You have the same measurements in two figures. One looks like two
        distinct populations; the other looks like a single mound. Nothing was
        added to the data. Only the histogram bins changed. A visualization is a
        sequence of decisions that turns data into visible evidence. Learning
        the plotting API is useful; learning what each decision preserves or
        hides is what makes the figure trustworthy.
      </Prose>
      <Prose>
        Our practical question is whether recorded alcohol measurements differ
        across three cultivar labels in the UCI Wine dataset. We will display
        observations and distribution summaries, not train a classifier or claim
        that cultivar alone causes a chemical difference. The final programs
        carry the data identity, the chosen bins, the normalization and the
        meaning of every interval alongside their output.
      </Prose>
      <H2>1. Decide which question a mark should answer</H2>
      <Prose>
        Start with the unit of observation: one row is one measured wine. “How
        much?”, “how does it vary?”, “which values occur together?” and “how
        does it change over ordered time?” are different questions. A chart
        chooses a representation for one of them. Connecting unrelated wines
        with a line invents an order; plotting only their average removes the
        variability we wanted to inspect.
      </Prose>
      <VisualizationPipelineFigure />
      <LessonTable
        caption="Choose the comparison before the chart"
        headers={["Question", "Useful mark", "Contract to preserve"]}
        rows={[
          [
            "Compare category amounts",
            "Bars or dots on a shared axis",
            "Bar lengths start at a meaningful zero; dots compare positions.",
          ],
          [
            "Inspect a distribution",
            "Histogram, ECDF, boxplot with points",
            "Bin/quantile conventions, sample sizes and outliers.",
          ],
          [
            "Inspect two measurements together",
            "Scatterplot",
            "One point per observation; units and overlap.",
          ],
          [
            "Track an ordered process",
            "Line plus observation markers",
            "Actual time/order, missing intervals and irregular spacing.",
          ],
          [
            "Inspect a matrix",
            "Heatmap plus a color key",
            "Cell semantics, common normalization and missing cells.",
          ],
        ]}
      />
      <Prose>
        Position on a common scale makes close differences easier to inspect
        than an arbitrary area or three-dimensional volume. A bubble whose
        radius doubles has four times the area, so an area encoding needs radius
        proportional to the square root of the quantity. A three-dimensional bar
        adds perspective without adding data. Use an extra visual dimension only
        when it carries a needed variable.
      </Prose>
      <Prose>
        Separate the original observations, the statistic computed from them and
        the mark that displays it. A library may aggregate repeated x values
        before drawing a line or show a confidence interval by default. That
        operation can be useful, but it is part of your analysis. Read the
        estimator and interval settings rather than treating the picture as a
        neutral view of raw rows.
      </Prose>
      <H2>2. Build a histogram from counts, widths and area</H2>
      <Prose>
        Take eight constructed measurements: [1,1,2,2,3,4,7,8]. With edges
        [0,2,4,8], the first bin contains the two 1s, the second contains 2,2,3,
        and the final bin contains 4,7,8. We use intervals closed on the left
        and open on the right, except that the final right edge is included.
        Every observation belongs to exactly one bin; a value of 2 belongs to
        the second, and 8 belongs to the last.
      </Prose>
      <HistogramMeaningLab />
      <Prose>
        The counts are [2,3,3], but the widths are [2,2,4]. If heights equal
        counts, rectangle areas become [4,6,12]: the widest bin looks twice as
        large as the middle bin despite containing the same number of
        observations. For unequal-width bins, use a density height: count
        divided by included sample count and bin width. Here the heights are
        [0.125,0.1875,0.09375], and areas [0.25,0.375,0.375] sum to one.
      </Prose>
      <Prose>
        A density height is not a probability. The probability mass represented
        by a bin is height × width. Its units are inverse measurement units, and
        a narrow bin can legitimately have density greater than one. A count
        histogram with equal widths answers how many observations fall in each
        interval; a density histogram makes areas comparable even when widths
        differ. Always name which quantity is on the y axis.
      </Prose>
      <H3>What a different binning actually changes</H3>
      <Prose>
        Changing edges reassigns observations. It can expose structure or create
        a misleading appearance from a small sample. Inspect more than one
        defensible width/origin and show sample size. A smooth density curve
        also makes a choice: its bandwidth controls how much neighboring
        observations blend. It can extend beyond physically meaningful values.
        When binning is the main concern, an empirical cumulative distribution
        offers another view: at x it reports the fraction of observations at or
        below x, with no bins to choose.
      </Prose>
      <Prose>
        If a display range excludes observations, record how many. The scratch
        function's density normalizes over included observations, matching the
        NumPy histogram contract. That conditional view differs from silently
        claiming to show the full sample. The supplied Wine edges include all
        178 rows; the small lab always includes its eight values.
      </Prose>
      <H2>3. A scale translates a number into a position</H2>
      <Prose>
        Suppose a horizontal plotting region begins at pixel 40 and ends at
        pixel 440. Data range [0,100] maps 25 to pixel 140: start at 40, then
        travel one quarter of the 400-pixel width. In general, position =
        pixel_start + (value−data_min)/(data_max−data_min) × pixel_width. SVG y
        coordinates increase downward, so its vertical pixel range is reversed
        when larger values should appear higher.
      </Prose>
      <ScaleMeaningLab />
      <Prose>
        A linear axis gives equal space to equal differences. A logarithmic axis
        gives equal space to equal ratios: 1→10 and 10→100 occupy the same
        distance. The tick labels can remain in original data units; you have
        changed the coordinate mapping, not secretly replaced the measurement by
        a logarithm. Ordinary logarithms require positive values. Zeros and
        negative residuals need another declared representation, not a tiny
        invented replacement.
      </Prose>
      <Prose>
        Bars encode length from their baseline. Counts 100 and 110 are a 10%
        increase, but bars starting at 99 have lengths 1 and 11. That turns a
        modest difference into an elevenfold length contrast. For a focused
        nonzero range, a labeled dot plot can compare positions without
        pretending those truncated lengths represent amounts. A line plot need
        not always start at zero, but its limits and scientific comparison still
        need to be clear.
      </Prose>
      <Prose>
        Aspect ratio changes the apparent steepness of a trend. For geometry
        where a circle must remain circular or distance in the same physical
        units matters, use equal axis scaling. For alcohol versus color
        intensity, the units differ; choose a readable layout and label both
        units. Two panels intended for direct comparison should share a scale
        unless their differing scales are conspicuous and justified.
      </Prose>
      <H2>4. Show what the summary leaves out</H2>
      <Prose>
        Two groups can have the same mean and very different observations.
        Values [4,4,4,4] and [1,1,7,7] both average 4; only the second is spread
        out. Draw the points or a distribution when that spread matters.
        Overplotting creates another failure: ten identical points can look like
        one. Transparency, a count-based two-dimensional bin, or explicitly
        labeled jitter can reveal multiplicity. Jitter changes the displayed
        position and must not be mistaken for a new measurement.
      </Prose>
      <LessonTable
        caption="Intervals answer different questions"
        headers={["Display", "Meaning", "What it does not establish"]}
        rows={[
          [
            "Mean ± one sample standard deviation",
            "Spread of the observed sample around its mean.",
            "A 95% interval or uncertainty in the mean.",
          ],
          [
            "Confidence interval for a mean",
            "An estimation procedure under stated sampling/model assumptions.",
            "Where 95% of individual future observations lie.",
          ],
          [
            "Prediction interval",
            "A stated model’s uncertainty for a future observation.",
            "The same width or assumptions as a mean interval.",
          ],
          [
            "Quantiles / percentile interval",
            "Positions enclosing a stated fraction of observed values.",
            "A confidence statement about a parameter.",
          ],
        ]}
      />
      <Prose>
        The Wine program shows mean ± one sample standard deviation and labels
        it as spread. It does not infer a population confidence interval from an
        unspecified sampling design. Repeated runs of one fixed dataset
        introduce another unit: an interval across random seeds measures run
        variability under that experiment, not automatically uncertainty across
        new people, instruments or sites. The{" "}
        <a href="/learn/topic/sampling-measurement-experimental-design">
          sampling lesson
        </a>{" "}
        and{" "}
        <a href="/learn/topic/hypothesis-testing-confidence-intervals">
          confidence interval lesson
        </a>{" "}
        own those inferential mechanisms.
      </Prose>
      <Prose>
        Use color for a reason. Unordered cultivar labels need distinguishable
        categories, not a rainbow suggesting rank. A nonnegative magnitude uses
        a sequential scale; a signed difference can use a diverging scale
        centered at its meaningful zero. Keep missingness distinct from a
        measured zero. Supplement color with symbols, line styles, direct labels
        or an exact table, so the interpretation survives grayscale and
        different color perception.
      </Prose>
      <H2>5. Own the transformation, then use the plotting engine</H2>
      <Prose>
        Our scratch route owns two operations: assign observations to explicit
        bins, then map data coordinates to drawing coordinates. It does not
        attempt to rebuild text layout, fonts and every interactive renderer.
        The same count/density arrays go into an SVG written from rectangles and
        into Matplotlib. Matching the numerical representation first is more
        informative than judging whether two screenshots look similar.
      </Prose>
      <RemoteCodeBlock
        source="/learn-code/visualization/visualization_pipeline.py"
        filename="visualization_pipeline.py"
        title="Complete histogram, coordinate mapping and real-data figure workflow"
      />
      <Prose>
        <code>bisect_right</code> finds the bin boundary in logarithmic time for
        arbitrary sorted edges. A special final-edge rule preserves the closed
        last interval. With n observations and k bins, this implementation uses
        O(n log k) time and O(k) additional count storage. For uniform bins, a
        careful arithmetic index or an optimized NumPy histogram can do the
        repeated assignment efficiently; use the tested library path for large
        arrays. The explicit reference remains useful for weights, boundary
        conventions and diagnostics.
      </Prose>
      <Prose>
        The SVG function applies the scale formula to each bin's left/right
        edges and density height. Rectangle width is the transformed interval
        width, not an arbitrary fixed number. Reversing the y pixel range puts
        zero at the bottom. It writes actual tick values and units. The
        Matplotlib route delegates rendering to <code>Axes.stairs</code>,
        preserving our exact edges and densities. This is the
        from-scratch/library bridge: the same statistic, two rendering routes.
      </Prose>
      <H2>6. Run a real question on an inspectable dataset</H2>
      <Prose>
        Download the existing{" "}
        <a
          href="/learn-assets/neural-training-diagnostics-reproducible-experiments/wine.csv"
          download
        >
          Wine CSV
        </a>
        : 178 samples, 13 chemical measurements and three cultivar labels. UCI
        attributes the dataset to Stefan Aeberhard and M. Forina and distributes
        it under CC BY 4.0. The local file uses labels 0, 1, 2. This
        observational collection supports exploratory comparisons within its
        source setting; it is not a wine-quality score or a representative
        survey of every wine.
      </Prose>
      <CodeBlock
        language="bash"
        filename="run_visualization.sh"
      >{`python -m pip install numpy matplotlib
python visualization_pipeline.py --data wine.csv --output figures`}</CodeBlock>
      <Prose>
        The first exported figure is the manually mapped full-sample histogram.
        The two-panel Matplotlib figure compares cultivar distributions on
        identical edges and then shows their means with sample-spread bars.
        Normalizing each cultivar to area 1 allows shape comparison despite
        group counts 59, 71 and 48. It removes absolute count information from
        height; the legend keeps n visible. The separate JSON retains counts,
        edges, group summaries, package versions and the CSV digest.
      </Prose>
      <WineDistributionFigure />
      <Prose>
        The on-page panels preserve the executed program's counts and
        normalization. Cultivar 0 has mean alcohol about 13.745, cultivar 1
        about 12.279 and cultivar 2 about 13.154, with substantial within-group
        spread. The shifted distributions show an association in this dataset;
        their overlap explains why one alcohol threshold is not a complete
        cultivar classifier. One-dimensional summaries cannot capture the
        relationships among thirteen measurements. The next program adds a
        second measurement without pretending to estimate a causal effect.
      </Prose>
      <H2>7. Matplotlib, seaborn and Plotly are different layers of control</H2>
      <Prose>
        Matplotlib's Figure is the complete canvas; an Axes is a plotting region
        with scales, labels and artists such as lines. An axis is one coordinate
        direction, so “Axes” does not mean only the x and y tick marks. Keep
        explicit <code>fig, ax</code> references when building multi-panel
        figures; it avoids accidentally drawing into whichever plot happens to
        be current.
      </Prose>
      <Prose>
        seaborn maps table columns to visual roles and supplies statistical
        plotting conventions. Its <code>histplot</code> example declares edges,
        density and <code>common_norm=False</code> so each cultivar is
        normalized independently. Otherwise a grouped density may represent each
        group's contribution to the combined sample. Inspect defaults for
        estimators and error bars on other plot types; an API call can include
        an analysis choice.
      </Prose>
      <Prose>
        Plotly provides interactive traces, hover and browser export. Here each
        trace retains a cultivar, row ID, alcohol value and color-intensity
        value. Hover adds inspection but does not replace visible axis labels or
        a static description. The complete program exports a self-contained HTML
        file with its JavaScript bundled; a CDN-backed file is smaller but needs
        network access. The example does not upload the data.
      </Prose>
      <RemoteCodeBlock
        source="/learn-code/visualization/visualization_library_views.py"
        filename="visualization_library_views.py"
        title="Explicit seaborn normalization and a local Plotly scatter export"
      />
      <CodeBlock
        language="bash"
        filename="run_visualization_libraries.sh"
      >{`python -m pip install pandas seaborn matplotlib plotly
python visualization_library_views.py --data wine.csv --output figures`}</CodeBlock>
      <H2>8. Make the exported figure a reproducible result</H2>
      <Prose>
        A figure's delivery format changes what remains usable. SVG/PDF preserve
        vector geometry and are useful for lines, labels and print; millions of
        points can make them enormous. PNG fixes a pixel resolution and is often
        efficient for dense raster content. A high-DPI file does not repair tiny
        text or a misleading axis. Export at the intended physical size, inspect
        that size, and check clipped labels before sharing.
      </Prose>
      <Prose>
        For very large scatterplots, rendering fewer points can hide rare
        events. Use aggregation with a declared count/density interpretation, or
        a representative sampling policy with rare-event inspection. Keep the
        full numerical analysis separate from any display reduction. In a
        microscope field, for example, a handful of rare objects may be the
        scientific result: replacing all pixels with a smooth average destroys
        precisely the evidence that matters.
      </Prose>
      <Prose>
        Keep the figure-generation code, input identity, transformations, seeds
        where used, scale/normalization settings and software versions with the
        result. Include a caption stating observation unit, sample sizes and
        interval meaning. Check a monochrome view and a narrow display. A
        beautiful figure becomes research evidence only when another person can
        recover what each mark represents and reproduce the important
        calculation.
      </Prose>
      <section
        className="lesson-ending lesson-ending--practice"
        data-lesson-ending="practice"
      >
        <H2>9. Practice: defend the figure, not just its style</H2>
        <div className="lesson-exercise" data-lesson-exercise="">
          <H3>1. Unequal bins</H3>
          <Prose>
            Four values [0,1,2,4] use edges [0,2,5]. Find counts, density
            heights and areas. Which bin owns 2?
          </Prose>
          <details>
            <summary>Hint</summary>
            <Prose>
              Divide by both n and width; use the declared half-open convention.
            </Prose>
          </details>
          <details>
            <summary>Solution</summary>
            <Prose>
              Counts [2,2], widths [2,3], densities [1/4,1/6], areas [1/2,1/2].
              Value 2 enters the second bin. Equal counts need unequal heights
              when the widths differ.
            </Prose>
          </details>
        </div>
        <div className="lesson-exercise" data-lesson-exercise="">
          <H3>2. Repair a compelling exaggeration</H3>
          <Prose>
            A plot of counts 100 and 110 starts its bars at 99. Explain what the
            lengths now encode and propose a better figure.
          </Prose>
          <details>
            <summary>Hint</summary>
            <Prose>Compare the visual length ratio with the data ratio.</Prose>
          </details>
          <details>
            <summary>Solution</summary>
            <Prose>
              Lengths 1 and 11 encode differences from 99, not amounts 100 and
              110. Use bars from 0 with direct values, or a labeled dot plot
              focused on the 100–110 region when the small position difference
              is the question. State the 10% relative increase.
            </Prose>
          </details>
        </div>
        <div className="lesson-exercise" data-lesson-exercise="">
          <H3>3. Choose the uncertainty</H3>
          <Prose>
            Twenty measurements have sample standard deviation 4. A colleague
            labels mean±4 “95% confidence”. What is missing, and what should the
            caption say for the displayed interval?
          </Prose>
          <details>
            <summary>Hint</summary>
            <Prose>
              Spread of observations and uncertainty in a mean are different.
            </Prose>
          </details>
          <details>
            <summary>Solution</summary>
            <Prose>
              The shown interval is mean±one sample SD. Label it that way. A
              confidence interval requires the sampling unit, assumptions and an
              estimation procedure; neither the SD nor 20 alone establishes a
              valid 95% confidence statement.
            </Prose>
          </details>
        </div>
        <div className="lesson-exercise" data-lesson-exercise="">
          <H3>4. Make a figure somebody else can reproduce</H3>
          <Prose>
            Change the Wine workflow to malic_acid. Compare an ECDF and a
            common-edge histogram by cultivar. Include row counts, a numerical
            table and one deliberate bin-width change. Explain which conclusion
            survives the change.
          </Prose>
          <details>
            <summary>Hint</summary>
            <Prose>
              An ECDF sorts observations and increments cumulative mass by 1/n.
              Repeated observations jump together.
            </Prose>
          </details>
          <details>
            <summary>Acceptance criteria</summary>
            <Prose>
              Each ECDF reaches 1, is nondecreasing and keeps duplicate-value
              mass; every histogram uses declared edges covering its data or
              reports exclusions. Group normalizations and labels agree between
              code and caption. Outputs include source identity and reproducible
              commands; conclusions remain descriptive rather than causal.
            </Prose>
          </details>
        </div>
      </section>
      <section
        className="lesson-ending lesson-ending--next"
        data-lesson-ending="next"
      >
        <H2>10. Carry the evidence contract into performance work</H2>
        <Prose>
          You can now trace a mark to observations, statistics and scales;
          implement binning and coordinate mapping; use plotting libraries
          deliberately; and defend an exported figure. Next,{" "}
          <a href="/learn/path/full-curriculum/gpu-accelerated-computing?module=core-frameworks">
            GPU-Accelerated Computing
          </a>{" "}
          applies the same discipline to work, memory traffic and measured
          timing. A convincing speed curve needs an explicit measurement
          boundary just as a histogram needs explicit bins.
        </Prose>
      </section>
      <Sources
        alternatives={
          <ul>
            <li>
              <a href="https://clauswilke.com/dataviz/histograms-density-plots.html">
                Claus Wilke, Fundamentals of Data Visualization: distributions
              </a>{" "}
              — illustrated book chapter for comparing binning, density and
              grouped distributions after section 2; combine its count-histogram
              discussion with our explicit unequal-width density convention.
            </li>
            <li>
              <a href="https://matplotlib.org/stable/users/explain/quick_start.html">
                Matplotlib quick start
              </a>{" "}
              — worked guide to Figures, Axes, artists, scales and labels after
              your first export.
            </li>
            <li>
              <a href="https://seaborn.pydata.org/tutorial/error_bars.html">
                seaborn: statistical estimation and error bars
              </a>{" "}
              — visual explanation distinguishing spread and uncertainty; use
              after section 4.
            </li>
          </ul>
        }
      >
        <li>
          <a href="https://numpy.org/doc/stable/reference/generated/numpy.histogram.html">
            NumPy histogram
          </a>{" "}
          — interval endpoints, exclusion and density conventions.
        </li>
        <li>
          <a href="https://clauswilke.com/dataviz/coordinate-systems-axes.html">
            Wilke: coordinate systems and axes
          </a>{" "}
          — linear/log mappings and aspect ratios;{" "}
          <a href="https://clauswilke.com/dataviz/visualizing-uncertainty.html">
            uncertainty chapter
          </a>{" "}
          — interval interpretations.
        </li>
        <li>
          <a href="https://plotly.com/python/interactive-html-export/">
            Plotly HTML export
          </a>{" "}
          — offline bundling versus CDN dependencies.
        </li>
        <li>
          <a href="https://archive.ics.uci.edu/dataset/109/wine">UCI Wine</a> —
          dataset provenance, task and license. Source bodies reviewed 28
          September 2026; no video viewing is claimed.
        </li>
      </Sources>
    </div>
  ),
};
