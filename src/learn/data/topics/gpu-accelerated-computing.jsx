import { Prose, H2, H3, CodeBlock } from '../../components/content';
import { LessonIntro, LessonTable, Sources } from '../../components/lesson-labs/LessonElements.jsx';
import RemoteCodeBlock from '../../components/content/RemoteCodeBlock.jsx';
import { GpuResidencyFigure, GpuIndexLab, GpuTrafficLab } from '../../components/lesson-labs/GpuComputingLabs.jsx';

export default {
  title: 'GPU-Accelerated Computing',
  readTime: '~45 min read + kernel workflow and practice',
  content: () => <div className="neural-lesson neural-lesson-neutral gpu-computing-lesson">
    <LessonIntro prerequisites="NumPy arrays, indexing, bytes and the PyTorch/JAX distinction between host code and array operations. No CUDA experience is assumed." exampleKind="Python + CUDA C++">
      Begin with where work and data live, then assign array elements to threads. Build a complete elementwise kernel and compare it with an ordinary array expression. The live labs expose indexing and explicitly hypothetical traffic costs. CPU verification is available everywhere; the CUDA branch requires a configured NVIDIA GPU and is identified separately from the checks performed here.
    </LessonIntro>
    <Prose>A sensor records millions of values. For each value x, calibrate it with a × x + b, then replace a negative result by zero. Each output depends on only one input, so many outputs can be computed at the same time. This is a promising GPU workload. But copying a tiny array to the GPU, launching work, and copying it back can take more effort than calculating it on the CPU. “Runs on a GPU” describes a location, not a speed result.</Prose>
    <Prose>We will carry one precise operation through the lesson: z[i] = max(0, a × x[i] + b), for a contiguous vector of finite float32 values. Think of it as calibrated, nonnegative sensor intensity or the elementwise part of a neural activation. The numerical contract stays fixed while we change who computes each element, where arrays remain, how many intermediate arrays are written, and what our timer includes.</Prose>

    <H2>1. Start with the journey of one array</H2>
    <Prose>The CPU runs the host program. A device array occupies memory accessible to the GPU. A kernel is a function launched to run as many GPU threads; launching it schedules work rather than returning every result to Python immediately. Separate three events: move input to the device, compute there, and make a result available to the host. The same Python-looking arithmetic can hide very different journeys.</Prose>
    <GpuResidencyFigure />
    <Prose>If five transformations can run on the device, transfer the input once, keep intermediate arrays there, and bring back only the result you need. Returning each intermediate to NumPy repeatedly crosses the host/device boundary. Conversely, keeping an array on the GPU is not free: device capacity is limited, and a retained reference or memory pool can keep an allocation reserved. Inspect live tensors and reserved pool memory separately before concluding that a cache is a leak.</Prose>
    <Prose>The ordinary CuPy route is intentionally familiar: <code>device = cp.asarray(host)</code>, then <code>result = cp.maximum(a * device + b, 0)</code>, then <code>host_result = cp.asnumpy(result)</code>. The middle expression is array computation; the two conversions are boundaries. NumPy remains a useful CPU reference. For a PyTorch model, keep parameters, buffers and compatible inputs on the same device and use its tensor operations so the autograd graph stays intact. A raw CUDA function is not automatically a differentiable PyTorch operation.</Prose>

    <H2>2. Give every output exactly one writer</H2>
    <Prose>A serial loop owns indices 0 through N−1 in order. To distribute it, give each GPU thread a starting index. Threads are arranged in blocks; blocks form the launch grid. For a one-dimensional launch, <code>first = block_index × threads_per_block + thread_index</code>. Two blocks of four threads give starting indices 0–7. These are logical identities, not a promise that hardware executes block 0 before block 1.</Prose>
    <GpuIndexLab />
    <Prose>There may be more elements than launched threads. Let each thread return for another index separated by the total thread count: <code>i = first, first + stride, first + 2×stride, …</code>, with <code>stride = blocks × threads_per_block</code>. For N=19 and eight threads, thread 2 visits 2, 10 and 18. Thread 7 visits 7 and 15, then stops because 23 is outside the array. The loop condition handles both partially filled final groups and arrays larger than the launch.</Prose>
    <Prose>Why is this safe? Every nonnegative index has one quotient and remainder when divided by the stride. The remainder identifies exactly one starting thread; the quotient identifies that thread's loop iteration. No element is omitted, and no two threads write the same output. That proof depends on each output using only its own input. Replacing <code>out[i] = …</code> by <code>out[0] += …</code> creates competing updates and needs a reduction or synchronization strategy.</Prose>
    <H3>How the logical threads meet the hardware</H3>
    <Prose>On NVIDIA GPUs, threads are scheduled in groups called warps, conventionally 32 threads. Neighboring threads reading neighboring float32 elements make contiguous memory accesses that can be combined into efficient memory transactions. If neighboring threads instead jump to distant addresses, the same arithmetic may require more transactions. The lab uses tiny blocks to make ownership readable; those block sizes are a teaching fixture, not performance advice.</Prose>
    <Prose>A block can coordinate using shared memory and block barriers. A normal block barrier does not synchronize every block in the grid. Our elementwise kernel needs neither shared memory nor a barrier because there are no cross-thread dependencies. More threads, a larger block or a higher occupancy number is not automatically faster: register use, shared memory, latency, memory traffic and available parallel work interact. Profile the actual workload before tuning launch geometry.</Prose>

    <H2>3. Implement the kernel without hiding its contract</H2>
    <Prose>The complete program below includes the CUDA C++ source, a CPU traversal of exactly the same index rule, the ordinary NumPy/CuPy expression, tail-size checks and two different timing boundaries. The CPU path is runnable without CuPy. It verifies index coverage and numerical reference behavior; it cannot verify CUDA compilation, device races, driver compatibility or GPU timing.</Prose>
    <RemoteCodeBlock source="/learn-code/gpu-accelerated-computing/gpu_affine_relu.py" filename="gpu_affine_relu.py" title="Complete grid-stride kernel, reference comparison and explicit timing boundaries" />
    <Prose><code>__global__</code> marks the device entry point. Each thread computes a starting index and a grid stride, then writes its assigned elements. The cast to an unsigned 64-bit index happens before multiplying the launch dimensions. Input and output pointers refer to distinct contiguous float32 buffers, and a and b are passed as float32 scalars. <code>np.uint64(x.size)</code> matches the kernel's size argument. A mismatched scalar type or an arbitrary strided view is not repaired by a raw pointer API.</Prose>
    <Prose>The CUDA source keeps the intermediate multiplication/addition in the thread rather than writing temporary vectors to device memory. Its total element work is O(N), with one input read and one output write per element and constant per-thread state. Output storage is O(N). This is an efficient scoped kernel, not a replacement for tuned matrix multiplication, a general activation implementation or a proof of optimal performance on every GPU.</Prose>
    <Prose>The CPU traversal checks sizes including zero, one, partial blocks and repeated grid-stride visits. The CUDA branch tests positive sizes; it checks six sizes including 65,537, which requires grid-stride reuse with the selected grid cap. CuPy <code>RawKernel</code> compiles on the first invocation and caches compiled work. GPU floating-point contraction can fuse multiply-add and change rounding, so parity uses a stated tolerance rather than demanding bitwise equality with a two-operation NumPy expression. The example excludes nonfinite input semantics.</Prose>
    <CodeBlock language="bash" filename="run_gpu_affine_relu.sh">{[
      'python -m pip install numpy',
      'python gpu_affine_relu.py',
      '# After configuring a compatible CUDA driver and CuPy installation:',
      'python gpu_affine_relu.py --cuda --size 1000000 --repeats 20',
    ].join('\n')}</CodeBlock>
    <Prose>Use CuPy's current installation guide to choose a package matching your CUDA environment; avoid installing several competing CuPy distributions into the same environment. The checks retained for this lesson ran the CPU path. The CUDA branch is provided for execution on suitable hardware and has no claimed native GPU timing result here. Record the emitted device, runtime, CuPy version, dtype, size, repetitions and timing boundary when you run it.</Prose>

    <H2>4. Distinguish residency from fusion</H2>
    <Prose>Keeping arrays on the device removes repeated host transfers. Fusion removes intermediate device traffic and launches. They solve different problems. An unfused multiply, add and maximum can write three full result vectors and read three full input vectors per stage. A fused elementwise kernel reads x once and writes z once, keeping a × x + b inside the thread. Both still compute the same mathematical output.</Prose>
    <GpuTrafficLab />
    <Prose>For one million float32 elements, one vector occupies four million bytes. Across five stages, copying in and out after every stage moves 40 MB across the host/device boundary; keeping the stages resident moves 8 MB. Three unfused kernels per stage account for 120 MB of device reads/writes, while one fused kernel per stage accounts for 40 MB. These are logical traffic counts under the stated model, not measured bus transactions or a promise that every high-level expression has exactly this execution plan.</Prose>
    <Prose>The lab converts decimal bytes to microseconds using declared bandwidths, then adds a per-launch cost. At 16 GB/s host bandwidth, 400 GB/s device bandwidth and 10 μs per launch, the resident fused case is 500 + 100 + 50 = 650 μs. The copy-every-stage, unfused case is 2,500 + 300 + 150 = 2,950 μs. Those are invented modeling parameters, visibly labeled as such. They help locate a possible bottleneck; they are not a hardware benchmark, a strict performance bound, or a measured speedup.</Prose>
    <RemoteCodeBlock source="/learn-code/gpu-accelerated-computing/gpu_workload_accounting.py" filename="gpu_workload_accounting.py" title="Reproducible byte and launch accounting for the live model" />
    <Prose>Why can the model fail as a timer? Real execution includes compute, caches, context initialization, allocator behavior, contention, clocks and sometimes overlap. A compiler may fuse the high-level expression already. The repeated stages may admit further fusion or an algebraic reformulation. Conversely, one very large fused kernel can consume more registers or reduce parallelism. Count first, measure next, then inspect why the measurement differs.</Prose>
    <H3>Arithmetic intensity explains a different limit</H3>
    <Prose>Arithmetic intensity is useful work per byte moved at a chosen memory boundary. This elementwise operation does little arithmetic for each input/output pair, so memory movement can matter strongly. A tiled matrix product reuses values for many multiply-adds and can become compute-limited instead. A simplified roofline compares compute capacity with bandwidth × arithmetic intensity; the smaller ceiling constrains attainable throughput under that model. Specify which operations and memory level you count. The later GPU profiling lesson develops this analysis; our traffic lab deliberately does not pretend to simulate it.</Prose>

    <H2>5. Measure completion, not just submission</H2>
    <Prose>If a host clock stops immediately after a kernel call, it may mostly measure how quickly Python submitted work. The GPU can still be processing it. A CUDA event recorded before and after work in the same stream measures a device timeline interval once the end event has completed. A synchronized wall clock around transfers and computation answers the different question: how long until the host has the usable result?</Prose>
    <LessonTable caption="Name the boundary before comparing numbers" headers={['Measurement', 'Included here', 'Separate concern']} rows={[
      ['Resident raw-kernel events', 'Work enqueued between CUDA events; preallocated input/output', 'Host copies, first compilation and cold context are excluded.'],
      ['Resident CuPy expression events', 'The expression on device arrays, including its actual enqueued operations', 'Different allocation/launch behavior may affect this path.'],
      ['Synchronized end-to-end wall interval', 'Host-to-device copy, output allocation, kernel, device-to-host copy and host work inside interval', 'Warm context and allocator are used; this is not cold-start latency.'],
    ]} />
    <Prose>The program warms both paths, records repeated samples and reports median, minimum and maximum instead of one flattering result. Warm-up deliberately excludes compilation and initialization from steady-state timing; measure them separately when startup matters. Compare outputs before speed. Match input size, layout, dtype, stream and output requirements. For a deployment decision, also compare a competent CPU implementation with the same end-to-end contract rather than a slow Python scalar loop.</Prose>
    <Prose>Streams are ordered queues of device work. Independent queues can permit overlap, but correct overlap requires dependencies and buffer lifetimes to be explicit. Pinned host memory and asynchronous transfers can help in suitable pipelines; adding a nonblocking flag alone does not guarantee overlap. Reusing a host buffer before an asynchronous copy has consumed it, or reading a result before completion, can corrupt the interpretation. Start with the synchronized correct path, then use profiling and events to justify a more concurrent one.</Prose>

    <H2>6. Choose the right level of the ecosystem</H2>
    <Prose>Most research code should not begin by writing a raw kernel. Begin with a correct array or framework expression; inspect whether copying, layout, input loading or a small repeated operation is actually expensive. Use specialized libraries for established heavy operations. Write a custom kernel when the operation's contract is clear and the measured gap is worth the maintenance, portability and testing cost.</Prose>
    <LessonTable caption="Choose a tool by the work it owns" headers={['Level', 'Useful starting point', 'Control you still need']} rows={[
      ['Array computations', 'CuPy, or existing PyTorch/JAX tensor operations', 'Residency, dtype, layout, asynchronous timing and semantic parity.'],
      ['Standard dense/structured primitives', 'CUDA libraries such as cuBLAS, cuDNN and cuFFT', 'Shapes, algorithm/workspace choices and numerical modes through the calling API.'],
      ['Tabular pipelines', 'GPU dataframe/analytics tools where operations and data fit', 'Conversion cost, supported operations, memory capacity and CPU fallback boundaries.'],
      ['Custom elementwise operation', 'CuPy ElementwiseKernel/fusion, a compiler, or a scoped RawKernel', 'Indexing, tails, strides, output ownership and a verified fallback.'],
      ['Custom cooperative algorithm', 'CUDA C++ or a suitable kernel DSL such as Triton', 'Synchronization, memory hierarchy, resource use and hardware-specific review.'],
    ]} />
    <Prose>Two useful applications illustrate why this judgment matters. A camera pipeline can keep calibration, filtering and later inference on device, avoiding an intermediate image round trip. A scientific parameter sweep can batch many independent evaluations, exposing parallel work that a sequence of tiny Python calls hides. In both cases the application structure may matter more than changing one arithmetic instruction.</Prose>
    <Prose>Lower precision is another change of contract, not a free speed switch. Float16, bfloat16, float32 and tensor-core modes differ in representable range, precision and available operations. Reductions can also change with accumulation order. Check tolerances against the scientific quantity you care about, not just whether the program runs. Multiple GPUs add communication and synchronization; they do not automatically make a small single-device workload efficient.</Prose>

    <H2>7. Diagnose before optimizing</H2>
    <LessonTable caption="A symptom should lead to a discriminating check" headers={['Symptom', 'First check', 'Possible response']} rows={[
      ['GPU path loses on small arrays', 'Synchronized end-to-end timing versus resident timing', 'Batch useful work or retain the CPU route.'],
      ['Unexpected copies or stalls', 'Conversions, scalar reads, logging and profiler timeline', 'Keep work resident and move only needed summaries.'],
      ['Wrong tail values', 'Sizes just below/above a block multiple; writer coverage', 'Repair bounds or grid-stride indexing before tuning.'],
      ['Wrong values on transposed inputs', 'Actual strides and raw-kernel assumptions', 'Use an explicit contiguous copy or implement stride-aware indexing.'],
      ['Memory access error', 'CUDA error checks and Compute Sanitizer on the smallest failing case', 'Find invalid addresses; do not mask the failure with a CPU fallback.'],
      ['High device memory use', 'Live arrays, intermediates and allocator pool reservation', 'Reduce lifetimes/working set; distinguish reserved from live allocations.'],
    ]} />
    <Prose>Nsight Systems helps inspect the overall CPU/copy/kernel timeline; Nsight Compute examines selected kernel behavior in more detail. Instrument a stable, representative workload and preserve its inputs and correctness check. Instrumentation itself has overhead, so a profiler trace and a production latency benchmark are related evidence with different purposes.</Prose>

    <section className="lesson-ending lesson-ending--practice" data-lesson-ending="practice">
      <H2>8. Practice: explain the work and the boundary</H2>
      <div className="lesson-exercise" data-lesson-exercise="">
        <H3>1. Find the writer</H3><Prose>N=19 uses two blocks of four threads. Which block/thread writes index 18, and which indices does global thread 7 write?</Prose>
        <details><summary>Hint</summary><Prose>Divide an index by stride 8. Convert the remainder to block and within-block thread.</Prose></details>
        <details><summary>Solution</summary><Prose>18 = 2×8+2, so global thread 2, block 0/thread 2, writes it on its third visit. Global thread 7 is block 1/thread 3 and writes 7 and 15. Its next index 23 fails the bound.</Prose></details>
      </div>
      <div className="lesson-exercise" data-lesson-exercise="">
        <H3>2. Separate two optimizations</H3><Prose>Ten stages process two million float32 values. Compare host traffic and kernel count for copy-every-stage/unfused versus resident/fused under our model.</Prose>
        <details><summary>Hint</summary><Prose>One vector is 8 MB. A stage has three kernels when unfused.</Prose></details>
        <details><summary>Solution</summary><Prose>Copy-every-stage moves 2×10×8 = 160 MB and launches 30 kernels. Resident/fused moves 16 MB and launches 10 kernels. Device traffic changes from 480 MB to 160 MB. These are distinct reductions; none by itself proves a wall-clock speedup.</Prose></details>
      </div>
      <div className="lesson-exercise" data-lesson-exercise="">
        <H3>3. Repair a misleading benchmark</H3><Prose>A CPU timer surrounds a single first-ever kernel launch and reports a time without waiting. What must change before comparing it with NumPy?</Prose>
        <details><summary>Hint</summary><Prose>Separate startup, submission, completion and transfer boundaries.</Prose></details>
        <details><summary>Solution</summary><Prose>Check parity, warm or separately report context/compilation, and use CUDA events for resident work or synchronization for an end-to-end wall interval. Repeat samples; match dtype/layout/outputs. Include transfers if the application starts and ends with host data. State hardware and versions.</Prose></details>
      </div>
      <div className="lesson-exercise" data-lesson-exercise="">
        <H3>4. Extend the kernel responsibly</H3><Prose>Implement a finite float32 clamp z=min(upper,max(lower,a×x+b)). Add scalar validation, CPU reference checks and tail/large-size native comparisons. Keep lower and upper distinct from the input range.</Prose>
        <details><summary>Hint</summary><Prose>Require lower≤upper. Include values below, inside and above the bounds, and exact endpoints.</Prose></details>
        <details><summary>Acceptance criteria</summary><Prose>Every output has one writer, endpoints follow the declared rule, and CPU/native comparisons use justified tolerances. The report distinguishes CPU indexing checks from actual CUDA execution. A performance comparison uses the same clamp expression and synchronized boundary; no hardware means no claimed GPU speed result.</Prose></details>
      </div>
    </section>
    <section className="lesson-ending lesson-ending--next" data-lesson-ending="next">
      <H2>9. Keep the boundaries explicit</H2>
      <Prose>You can now distribute a scalar operation, inspect its indexing proof, compare a custom kernel with an ordinary array path, and distinguish data traffic from measured time. Next, <a href="/learn/path/full-curriculum/vector-databases?module=core-frameworks">Vector Databases</a> considers how to search large collections of representations. Later in this module, <a href="/learn/path/full-curriculum/tensor-shapes-autograd-graphs-device-boundaries?module=core-frameworks">Tensor Shapes, Autograd Graphs &amp; Device Boundaries</a> makes another set of invisible contracts visible: which axis means what, which values share memory, and which operations still connect a loss to its parameters. For deeper hardware work, continue later into the GPU Engineering module's CUDA programming, memory coalescing, profiling and kernel DSL topics.</Prose>
    </section>
    <Sources alternatives={<ul>
      <li><a href="https://developer.nvidia.com/blog/cuda-pro-tip-write-flexible-kernels-grid-stride-loops/">Mark Harris: grid-stride loops</a> — a NVIDIA teaching article with complete loop examples; compare its SAXPY loop with our fused activation after section 2. The indexing idea remains useful despite the article's older publication date.</li>
      <li><a href="https://docs.cupy.dev/en/stable/user_guide/kernel.html">CuPy user-defined kernels</a> — worked examples of elementwise, reduction and raw kernels; choose how much indexing/control your operation needs.</li>
      <li><a href="https://docs.pytorch.org/tutorials/intermediate/pinmem_nonblock.html">PyTorch pinned memory and nonblocking transfers tutorial</a> — detailed experiments on transfer behavior and correctness; useful after the synchronized baseline, not a reason to add flags blindly.</li>
    </ul>}>
      <li><a href="https://docs.nvidia.com/cuda/cuda-c-best-practices-guide/">CUDA C++ Best Practices Guide</a> — profiling, memory transfers, access patterns and performance tradeoffs.</li>
      <li><a href="https://docs.cupy.dev/en/stable/reference/generated/cupy.RawKernel.html">CuPy RawKernel contract</a> — launch arguments, compilation and responsibility for strides; <a href="https://docs.cupy.dev/en/stable/install.html">installation guide</a> — compatible package/runtime setup.</li>
      <li><a href="https://docs.cupy.dev/en/stable/user_guide/performance.html">CuPy performance guidance</a> — asynchronous timing, events, warm-up and caching.</li>
      <li><a href="https://docs.nvidia.com/compute-sanitizer/ComputeSanitizer/index.html">Compute Sanitizer</a> and <a href="https://docs.nvidia.com/nsight-compute/ProfilingGuide/index.html">Nsight Compute profiling guide</a> — native error diagnosis and performance evidence. Primary documentation checked 28 September 2026; CPU execution and unavailable CUDA execution are recorded separately.</li>
    </Sources>
  </div>,
};

