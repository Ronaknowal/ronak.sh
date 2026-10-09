import { Prose, H2, H3, Code, CodeBlock } from '../../components/content';
import { MathBlock as SharedMathBlock } from '../../components/content/Math.jsx';
import RemoteCodeBlock from '../../components/content/RemoteCodeBlock.jsx';
import { LessonIntro, LessonTable, Sources } from '../../components/lesson-labs/LessonElements.jsx';
import { InterfaceFigure, PatchProjectionLab, ConditioningFigure, QuantizationLab, GradientFigure, DigitReconstructionFigure, UtilizationFigure, ResidualLab, AudioOrderingLab, VideoVolumeFigure, VideoSamplingLab, NamespaceFigure, BudgetLab } from '../../components/lesson-labs/MultimodalTokenizationFlow.jsx';
import '../../components/lesson-labs/lesson-flow.css';

const MathBlock = ({ children }) => <div className="mm-math" tabIndex={0} role="region" aria-label="Mathematical relationship"><SharedMathBlock>{children}</SharedMathBlock></div>;
const codeRoot = '/learn-code/multimodal-tokenization/';
const Program = ({ file, title }) => <RemoteCodeBlock source={`${codeRoot}${file}`} filename={file} title={title} />;
const Exercise = ({ title, children, hint, solution }) => <div data-lesson-exercise className="lesson-exercise flow-check">
  <p><strong>{title}</strong> {children}</p>
  <details><summary>Hint</summary><div>{hint}</div></details>
  <details><summary>Worked solution</summary><div>{solution}</div></details>
</div>;

const multimodalTokenization = {
  title: 'Multimodal Tokenization (Visual, Audio, Video)',
  readTime: '~65 min read + experiments and practice',
  content: () => <div className="lesson-flow multimodal-flow">
    <LessonIntro prerequisites="The preceding lessons explain text pieces, integer IDs and embedding-table rows. We reconnect those ideas here. Basic Python arrays and arithmetic are enough to follow the examples; gradients are explained where they first matter." exampleKind="Python + image, audio and video investigations">
      <p>How does an assistant read a drawing, hear a recording, or inspect a clip? Follow the representation from the original signal to the model, then back through a decoder. Begin with sections 1–5 and 7–11; section 6 is a visible deeper branch. Run the programs as you reach them, then use the changed cases in the practice.</p>
    </LessonIntro>

    <span id="1-why-it-exists" className="mm-anchor" aria-hidden="true" />
    <H2>1. What reaches the transformer?</H2>
    <Prose>Imagine asking “Which stroke moved?” with a drawing and a short recording attached. The model needs evidence from those attachments alongside the words. In the <a href="/learn/path/full-curriculum/vocabulary-design-multilingual-tokenization?module=large-language-models">vocabulary lesson</a>, a text piece's integer ID retrieves a row of numbers from an embedding table. That row is a <em>vector</em>: an ordered list of numbers. The transformer's computation starts with vectors.</Prose>
    <Prose>An image or sound can supply vectors in two ways. Follow the two branches from the same signal:</Prose>
    <InterfaceFigure />
    <Prose>The continuous route keeps a computed feature vector, then changes its width if necessary. These are <em>continuous features</em>: numbers can vary without being chosen from a finite dictionary. The discrete route replaces a feature with one of a finite set of vectors, records that vector's integer address, and looks it up again. This is <em>discrete tokenization</em>. Both routes eventually supply vectors.</Prose>
    <Prose>The word <em>token</em> has two common meanings here: a discrete vocabulary item, or one vector position in a sequence. A “visual token” may be a patch vector with no integer image ID. We will say <strong>ID</strong> when we mean a dictionary address and <strong>position</strong> when we count vectors processed by a model. Amber marks text, blue marks images, violet marks audio and rose marks video; each is also named.</Prose>
    <Prose>Reading an image and generating an image are separate capabilities. A model can condition text generation on continuous visual features. Image generation additionally needs a trained route back to pixels: for example, predicted discrete codes plus an image decoder, or a continuous generative decoder. An input's discreteness alone does not determine what the whole system can generate.</Prose>
    <Prose>The <a href="/learn/path/full-curriculum/byte-level-tokenization-token-free-models?module=large-language-models">byte lesson</a> showed that bytes can preserve a stored text. Image and audio files also have bytes, but a JPEG byte is part of a file format, not a local visual feature. Decoding the file into pixels or waveform samples gives the spatial or temporal structure our next operations use.</Prose>

    <span id="2-core-intuition" className="mm-anchor" aria-hidden="true" />
    <H2>2. Turn a pixel grid into patch vectors</H2>
    <Prose>Begin with a small grayscale drawing. A pixel is one intensity, from 0 for dark to 1 for bright. Divide the 4×4 image into 2×2 squares called <em>patches</em>. Follow patch A's four pixels into one row, and then into two output numbers:</Prose>
    <PatchProjectionLab />
    <Prose>Read each patch left to right, top to bottom. A is <Code>[0, 1, 0, 1]</Code>. Our illustrated projection adds entries 1 and 3 for its first output, and entries 2 and 4 for its second: <Code>[0+0, 1+1] = [0, 2]</Code>. Every patch uses the same rule. Its weights are supplied here so the arithmetic is visible; a real patch projection learns them during training.</Prose>
    <Prose>Gray fill means pixel intensity. The labelled patch borders use four colours to follow A–D into their rows; this is a local <em>patch identity</em> encoding rather than the modality encoding from section 1. The dashed selection outline changes which patch we inspect without changing its colour. Click a pixel or choose another patch: the copied row and projected numbers update immediately.</Prose>
    <Prose>Name the dimensions: height H, width W, channels C and patch side P. A grayscale image has C=1; an RGB image has three channels at each pixel. Assuming P divides H and W, there are N=(H/P)(W/P) patches, each containing P²C numbers. A shared matrix Wₚ maps each flattened row xᵢ into a vector of width d:</Prose>
    <MathBlock>{"\\begin{aligned}N&=\\frac{H}{P}\\frac{W}{P}\\\\x_i&\\in\\mathbb R^{P^2C}\\\\W_p&\\in\\mathbb R^{P^2C\\times d}\\\\h_i&=x_iW_p+b_p\\end{aligned}"}</MathBlock>
    <Prose>hᵢ is the output vector for patch i. The learned bias bₚ adds one offset per output component; our illustrated sums use zero bias. Patching alone is a rearrangement: knowing the grid shape and order lets us put every pixel back. Projection can discard information. In our example, <Code>[0,1,0,0]</Code> and <Code>[0,0,0,1]</Code> both project to <Code>[0,1]</Code>. A decoder cannot tell those patches apart from these outputs alone.</Prose>
    <H3>Position, resolution and the classifier's extra row</H3>
    <Prose>A list needs a way to tell where its rows came from. Without spatial information, rearranging patch rows only rearranges the same evidence. ViT adds learned <em>positional embeddings</em>, vectors associated with patch locations, to the projected rows. Its original classifier also prepends a learned <Code>[CLS]</Code> row whose final state feeds the classifier. This is a model choice, not another image patch.</Prose>
    <Prose>A 224×224 RGB image at P=16 gives 196 patches, each with 768 numbers before projection. The original ViT classifier has 197 input positions including CLS. A multimodal connector may select the 196 patch features, pool them or use another representation. Check what it actually returns.</Prose>
    <Prose>If dimensions are not divisible, choose cropping, resizing or padding explicitly. Cropping can remove the stroke you meant to inspect; padding needs valid-size metadata or masks. Raising resolution changes the positional grid too: the original ViT fine-tuning procedure interpolates learned position embeddings. Feeding a new grid is more than changing a reshape.</Prose>
    <H3>Scratch patching and the usual convolution route</H3>
    <Prose>The first program implements patchify and its inverse in NumPy. The reshape separates patch rows from within-patch rows; the transpose groups each square before flattening. Its second route uses PyTorch's <Code>Conv2d</Code> with kernel size and stride both P. Each kernel applies the same linear weights at non-overlapping locations, implementing the same projection.</Prose>
    <Program file="patch_projection.py" title="Patch, reconstruct, and compare NumPy projection with Conv2d" />
    <Prose>NumPy's example is height–width–channel ordered; PyTorch's image is channel–height–width ordered. The program permutes the kernel weights as well as the image before comparing the routes. Correct-looking shapes are insufficient if channels or within-patch order disagree. The real-data input is an 8×8 digit from the offline dataset used in section 5.</Prose>

    <span id="6-visual-walkthrough" className="mm-anchor" aria-hidden="true" />
    <H2>3. Connect continuous features to a language model</H2>
    <Prose>The patch vectors may first pass through a vision encoder, a network that combines image evidence into features. Those features can have a different width from the language model's vectors. Compare two ways to connect them:</Prose>
    <ConditioningFigure />
    <Prose>In the inline route, a <em>projector</em> maps visual width dᵥ to language-model width dₗₘ. Projected visual rows sit among text embedding rows in the language model's input sequence. Early LLaVA connects a CLIP vision encoder this way. The inserted rows are continuous vectors; a processor's placeholder image ID is bookkeeping for their insertion, not a codebook address for each visual row.</Prose>
    <Prose>In the visual-memory route, image features stay in a separate <em>visual memory</em>. At selected layers, language-model rows form queries that read it. This is <em>cross-attention</em>: the querying rows and the rows being read come from different sets. Flamingo resamples variable-size visual features into a fixed set, then uses gated cross-attention. Its visual rows do not all become positions in text self-attention.</Prose>
    <Prose>Matching widths makes matrix operations possible; it does not align meanings. A connector must be trained with a suitable objective and paired examples, such as predicting captions or answers from the image. Freezing a pretrained encoder keeps its weights fixed while other weights learn. Fine-tuning changes its features too, requiring care with the data, learning rates and downstream decoder.</Prose>
    <Prose>A pooled retrieval embedding also differs from a grid of local features. CLIP's image–text alignment does not guarantee its pooled vector retains every tiny character or position. For “Which stroke moved?”, preserve spatial evidence and evaluate that question. A continuous connector can condition text answers without a separate quantizer. Predicting discrete image IDs requires the next branch.</Prose>

    <span id="3-mathematical-foundation" className="mm-anchor" aria-hidden="true" />
    <H2>4. Give a feature a codebook address</H2>
    <Prose>Keep a table of representative vectors instead of storing every possible feature. This <em>codebook</em> has K rows. Quantization chooses the closest row and records its index. Here is a feature z=(.8,.6) and four simple entries:</Prose>
    <QuantizationLab />
    <Prose>Code k 3 is at (1,1). Its squared distance is <Code>(.8−1)²+(.6−1)²=.04+.16=.20</Code>, smallest of the four. Store ID 3, then decode that address back to (1,1). Features inside the same nearest-code region produce the same ID, losing some distinctions. Move x and y: within a region the code stays unchanged; crossing a boundary changes it abruptly.</Prose>
    <Prose>Here the colours identify k 0–k 3 and stay attached to those labelled entries; they do not encode distance. The white circle is the encoder feature and the dashed connector identifies its selected entry. At (0,0) all distances tie; our implementation chooses the first index, k 0, deterministically.</Prose>
    <Prose>An <em>encoder</em> computes features from pixels. A <em>decoder</em> tries to reconstruct pixels from quantized features. A vector-quantized variational autoencoder, or <em>VQ-VAE</em>, combines those networks with the codebook. “Code 3” need not mean a stroke or an English word: its meaning comes from the trained encoder/decoder and surrounding codes.</Prose>
    <MathBlock>{"\\begin{aligned}z_e&=\\operatorname{Encoder}(x)\\\\k_i&=\\underset{0\\leq k<K}{\\operatorname{argmin}}\\;\\|z_{e,i}-e_k\\|_2^2\\\\z_{q,i}&=e_{k_i}\\\\\\hat x&=\\operatorname{Decoder}(z_q)\\end{aligned}"}</MathBlock>
    <Prose>x is the original image, zₑ its grid of encoder features, eₖ codebook row k, zq the selected-vector grid and x̂ the reconstruction. Index i identifies a grid location. Nearest-code selection minimizes that feature's squared error among the entries. It need not minimize error in decoded pixels or yield the best answer to a visual question.</Prose>
    <H3>Store addresses, then use the matching dictionary</H3>
    <Prose>The decoder needs grid shape and order, not a bag of IDs. A 4×4 latent grid gives 16 addresses in row-major order; restoring them into 2×8 changes spatial neighbours. A model generating codes must also produce valid IDs and the required geometry. Keep quantizer and decoder checkpoints together: ID 3 in another learned dictionary may represent another vector.</Prose>
    <Prose>An image language model may use an additional embedding table to represent image IDs internally. That table is not automatically the quantizer's codebook, and neither is the pixel decoder. One maps addresses to transformer vectors; the other maps a reconstructed latent grid to pixels. Sampling valid IDs is only the first step toward a valid image.</Prose>
    <Prose>For N features of width d and K codes, direct nearest-code search takes work proportional to NKd. Using <Code>‖z−e‖²=‖z‖²+‖e‖²−2 z·e</Code> computes an N×K distance table without an N×K×d difference tensor. Chunking features bounds temporary memory. With very close distances, dtype and rounding can affect ties; the native checks compare against a direct small reference.</Prose>

    <span id="4-from-scratch-implementation" className="mm-anchor" aria-hidden="true" />
    <H2>5. Train through a discrete choice</H2>
    <Prose>Training should teach the decoder to reconstruct, the codebook to represent features, and the encoder to make features compatible with codes. A <em>gradient</em> is a derivative telling us how changing a learned number would change the loss. The hard choice creates a problem: inside a nearest-code region, a small encoder change leaves the selected vector unchanged, giving no useful reconstruction derivative through that choice.</Prose>
    <Prose>VQ-VAE uses a <em>straight-through estimator</em>: use the selected code forward, but pass the reconstruction gradient to the encoder as if this step were the identity. Follow solid arrows forward and dashed arrows backward:</Prose>
    <GradientFigure />
    <Prose>Reconstruction loss teaches the decoder and reaches the encoder through that substitute gradient. A separate <em>codebook loss</em> moves the selected row toward its encoder feature. A <em>commitment loss</em> moves the encoder feature toward the row; β controls its strength. Each comparison freezes its other side to update the intended parameters.</Prose>
    <Prose><Code>sg(v)</Code> means <em>stop gradient</em>: return v's value forward, but treat it as constant backward. PyTorch's <Code>v.detach()</Code> provides this behaviour. With a simple squared reconstruction objective:</Prose>
    <MathBlock>{"z_{st}=z_e+\\operatorname{sg}(z_q-z_e)"}</MathBlock>
    <MathBlock>{"\\begin{aligned}\\mathcal L&=\\mathcal L_{rec}+\\mathcal L_{code}+\\beta\\mathcal L_{commit}\\\\\\mathcal L_{rec}&=\\|x-\\operatorname{Decoder}(z_{st})\\|^2\\\\\\mathcal L_{code}&=\\|\\operatorname{sg}(z_e)-z_q\\|^2\\\\\\mathcal L_{commit}&=\\|z_e-\\operatorname{sg}(z_q)\\|^2\\end{aligned}"}</MathBlock>
    <Prose>The squared norms above sum component errors. The programs use mean squared error, dividing each term by its number of compared components; the scalar example below has one component, so its sum and mean coincide.</Prose>
    <Prose>zst's forward value is exactly zq: zₑ cancels. Its derivative to zₑ is the identity because the difference is stopped. Reconstruction contributes no gradient to the codebook through this route. This deliberately approximates a discontinuous mapping; it is not the true derivative of argmin. Other estimators change the training rule, not that distinction.</Prose>
    <H3>A scalar example exposes each update</H3>
    <Prose>Take z=.8, selected code e=1, an identity decoder and target 0. Reconstruction loss is 1, with encoder gradient 2 through the estimator. Codebook loss is (.8−1)²=.04, with code gradient 2(1−.8)=.4. At β=.25, commitment loss is .01, with encoder gradient 2×.25×(.8−1)=−.1. Total encoder gradient is 1.9; code gradient is .4. The last two terms compare the same values but train different numbers.</Prose>
    <Prose>Gradient descent subtracts learning rate times gradient. With rate .1, this one-step calculation moves z to .61 and e to .96. It is a local diagnostic, not a trained image tokenizer. Detaching all of zst would block reconstruction's encoder signal. Omitting a stop-gradient changes parameter ownership; it does not establish that every such run diverges.</Prose>
    <H3>Run a complete tokenizer on real images</H3>
    <Prose>The next program implements efficient NumPy lookup and independently checks those PyTorch gradient routes. It then trains a small VQ-VAE using ordinary PyTorch layers, an embedding codebook and an optimizer. This is the usual library route for a custom quantizer: PyTorch supplies differentiable layers and updates, while we define the objective explicitly.</Prose>
    <Prose>First inspect the result of that training route: a held-out handwritten digit, its actual 4×4 code grid, and the decoded 8×8 image. Grayscale means intensity from 0 to 1; code-grid colours distinguish labelled dictionary addresses, repeating hues where necessary.</Prose>
    <DigitReconstructionFigure />
    <Prose>Across the fixed 80 held-out images, 30 training epochs reduced mean squared pixel error from about .170926 to .034394 on the 0–1 scale. Look at the actual strokes and softened edges as well as that aggregate. This is evidence for this small reconstruction experiment, not for general-image understanding, readable scene text, or perceived image quality.</Prose>
    <Program file="vector_quantization.py" title="Nearest lookup, gradient ownership, and a complete tiny VQ-VAE" />
    <Prose>The accompanying <a href={`${codeRoot}digits_subset.csv`} download>digit data file</a> contains real 8×8 grayscale handwriting from scikit-learn's bundled optical-digits dataset, attributed in <a href={`${codeRoot}README.md`}>the program notes</a>. Divide original integer intensities by 16 for a 0–1 scale. The program fixes split and seed, fits training rows, and reports held-out reconstruction error and code usage. Compare reconstructed images with their own originals rather than equating lower training loss with generalization.</Prose>
    <Prose>Trace the loop: encode; find indices; gather vectors; substitute straight-through values; decode; compute three losses; clear old gradients; backpropagate; update. The decoder learns with quantized inputs, so decoding raw encoder features is a different experiment. Changing K or feature width requires another trained run; it does not change the browser's fixed dictionary.</Prose>
    <Prose>A reconstructing autoencoder is not automatically a generator of new images. VQ-VAE's original work trains a separate prior over its codes afterward. A language model over codes learns which grids are plausible; the trained decoder renders them. Joint training is another choice, not a consequence of placing IDs in one stream.</Prose>

    <H2>6. Deeper: keep the dictionary useful</H2>
    <Prose>Suppose eight features chose codes <Code>[0,0,0,0,1,1,3,3]</Code>. Count their assignments before diagnosing the dictionary. Beside those counts, compare a learned vector table with a fixed scalar grid:</Prose>
    <UtilizationFigure />
    <Prose>Counts are 4,2,0,2. Code 2 is unused in this batch, which does not make it dead across training. Inspect a longer window and distinguish training from validation coverage. Also inspect reconstructions and downstream tasks: equally used codes can still reconstruct badly. Usage diagnoses the representation, not its quality.</Prose>
    <Prose>Divide counts by their total for shares pₖ=.5,.25,0,.25. <em>Entropy</em> measures their spread in bits; <em>perplexity</em> converts the spread into an effective number of equally used choices:</Prose>
    <MathBlock>{"\\begin{aligned}H&=-\\sum_{k:p_k>0}p_k\\log_2p_k\\\\\\operatorname{perplexity}&=2^H\\end{aligned}"}</MathBlock>
    <Prose>H=1.5 bits and perplexity≈2.828, between one for a single used code and four for uniform use. Exclude zero shares from logarithms. Without assignments, the distribution is undefined.</Prose>
    <H3>Move codes using counts and sums</H3>
    <Prose>Instead of a codebook-loss gradient, an <em>exponential moving average</em>, or EMA, can update dictionary rows. Collect each code's assigned-feature count nₖ and vector sum sₖ. Blend with running count cₖ and sum mₖ using decay γ between 0 and 1:</Prose>
    <MathBlock>{"\\begin{aligned}c_k&\\leftarrow\\gamma c_k+(1-\\gamma)n_k\\\\m_k&\\leftarrow\\gamma m_k+(1-\\gamma)s_k\\\\e_k&\\leftarrow m_k/c_k\\end{aligned}"}</MathBlock>
    <Prose>The division gives a smoothed centroid. If c=2,m=(2,0), then n=2,s=(0,2) and γ=.5 give c=2,m=(1,1),e=(.5,.5). Initialize running state and handle zero or tiny counts with a specified smoothing rule and guarded update. EMA does not automatically revive a code receiving no assignments.</Prose>
    <Prose>For persistently unused codes, consider representative-feature initialization, reseeding low-use entries, capacity or data changes. First check scale, reconstruction gradients and encoder variation. Reseeding changes an address's meaning: do it in an explicit training procedure and save the resulting tokenizer/decoder together. Changing the dictionary under an already-trained language model breaks their agreement.</Prose>
    <H3>A fixed grid is another quantizer</H3>
    <Prose><em>Finite scalar quantization</em>, or FSQ, rounds a few bounded components to fixed levels. Two components with three levels each yield 3×3=9 vectors. With component indices 0..2, <Code>k=i₀+3 i₁</Code> gives a mixed-radix address: (2,1) maps to 5. A real FSQ network learns how to map features into its bounded space.</Prose>
    <Prose>FSQ removes learned nearest-vector dictionary updates; it is not “VQ-GAN plus RVQ.” Data can still use its fixed grid unevenly. RVQ instead adds successive corrections, as we will see next.</Prose>
    <Prose>Reconstruction objectives are independent choices too. Pixel mean squared error measures numerical differences; perceptual features and adversarial objectives, as in VQGAN, emphasize aspects of appearance. Sharp reconstructions may invent texture or letters. Judge fidelity to the original and the actual task, not just plausibility or code usage.</Prose>

    <H2>7. Audio: add small residual corrections</H2>
    <Prose>A digital waveform is a time-ordered sequence of amplitudes. At 24,000 Hz, one second contains 24,000 samples per channel. An encoder combines nearby samples into fewer feature frames. Each frame can use several small codebooks rather than one enormous dictionary.</Prose>
    <Prose>To see how, return temporarily to feature (.8,.6). The first codebook approximates it coarsely; the next represents what is left. Follow the arrows and exact component calculations:</Prose>
    <ResidualLab />
    <Prose>The first choice (1,1) leaves residual (−.2,−.4), squared length .2. From a second codebook with coordinates±.5, choose (−.5,−.5): sum (.5,.5), residual (.3,.1), squared length .1. A third book with coordinates±.25 chooses (.25,.25): residual (.05,−.15), squared length .025. Decode by adding the selected vectors to get (.75,.75).</Prose>
    <Prose>This is <em>residual vector quantization</em>, or RVQ. Stage ℓ has codebook e⁽ℓ⁾ and quantizes the previous residual rℓ₋₁. Initialize r₀=z, then repeat:</Prose>
    <MathBlock>{"\\begin{aligned}k_\\ell&=\\arg\\min_k\\|r_{\\ell-1}-e^{(\\ell)}_k\\|^2\\\\r_\\ell&=r_{\\ell-1}-e^{(\\ell)}_{k_\\ell}\\\\\\hat z&=\\sum_{\\ell=1}^{L}e^{(\\ell)}_{k_\\ell}\\end{aligned}"}</MathBlock>
    <Prose>L books with K entries offer up to Kᴸ combinations, although sums can coincide and data need not use them all. We perform L smaller searches rather than one Kᴸ-row search. A greedy stage choice is not generally the globally best combination.</Prose>
    <Prose>Extra stages do not guarantee a fixed error reduction. If residual (.1,0) meets a book containing only (1,0), squared error rises from .01 to .81. A zero candidate guarantees nearest-distance selection cannot do worse than leaving that residual unchanged; learned codecs need not include it. Our decreasing errors are computed toy results, not a halving law or a measure of perceived audio quality.</Prose>
    <Program file="residual_codec.py" title="Encode residuals, sum them back, and calculate rate and ordering" />
    <H3>Bits and positions are different budgets</H3>
    <Prose>The 24 kHz EnCodec design uses encoder stride 320, giving 24,000/320=75 latent frames/s. At K=1024, one index fits in 10 fixed-width bits. Eight levels use 75×8×10=6,000 bits/s before entropy coding and container, scale or chunk overhead. Flattening all frame/level indices into one LM sequence gives 75×8=600 ID positions/s.</Prose>
    <MathBlock>{"\\begin{aligned}f&=F_s/s\\\\R_{\\mathrm{fixed}}&=f\\sum_{\\ell=1}^{L}\\lceil\\log_2K_\\ell\\rceil\\\\N_{\\mathrm{flat}}&=\\lceil n_{\\mathrm{samples}}/s\\rceil L\\end{aligned}"}</MathBlock>
    <Prose>Fₛ is sample rate, s encoder stride, f latent rate, R fixed-width bit rate and n_samples input length. The final ceiling uses the 24 kHz library's full-clip padded convention; other padding/chunking can differ. Ten seconds gives 750 frames and 6,000 flattened IDs at eight levels. Changing K can change bits per index without changing index count; changing L changes both in this serialization.</Prose>
    <Prose>Entropy coding can reduce stored bits when codes are predictable; it does not itself reduce logical IDs processed by a language model. A parallel-stream model may process a level group without L successive self-attention positions. Name the serialization when quoting an audio “token rate.”</Prose>

    <span id="5-production-implementation" className="mm-anchor" aria-hidden="true" />
    <H2>8. Preserve what the audio task needs</H2>
    <Prose>Transcription needs linguistic evidence; reproducing a recording also needs speaker, timing, environment and acoustic detail. <em>Acoustic tokens</em> from a codec are trained to reconstruct sound. <em>Semantic tokens</em> usually quantize features from a representation model emphasizing learned content. These names describe objectives, not a perfect separation of meaning and sound.</Prose>
    <Prose>AudioLM combines semantic tokens from w2v-BERT features with acoustic tokens from SoundStream; it does not use the exact EnCodec setup above. Another route computes a <em>spectrogram</em>, a time–frequency grid, and supplies continuous features to a model. It can suit understanding without a discrete dictionary. Choose using reconstruction or task tests, not the representation's name.</Prose>
    <H3>A frame-by-level matrix needs an ordering</H3>
    <Prose>RVQ produces one index per level per frame. The same local number at different levels refers to different codebooks. Follow each labelled cell into the output strip:</Prose>
    <AudioOrderingLab />
    <Prose><em>Time-major</em> order visits all levels for frame 0 before frame 1. <em>Level-major</em> visits all frames of level 0 before level 1. Both are reversible with known dimensions and order, and contain the same number of indices. They expose different neighbours and conditional dependencies. Hierarchical models, parallel heads and delayed streams offer other designs; no ordering wins from this arithmetic alone.</Prose>
    <H3>Use the actual processor and checkpoint</H3>
    <Prose>The following program takes a local WAV, checks channels and sample rate, resamples if required, and uses the matching processor for <Code>facebook/encodec_24khz</Code>. It explicitly passes <Code>bandwidth=6.0</Code>. Decoding preserves scales and padding information, trims output to input duration, and reports actual code dimensions.</Prose>
    <Program file="encodec_library.py" title="A complete EnCodec library encode/decode route" />
    <Prose>Its axes are chunks, batch, codebook level and latent time. The 24 kHz full-clip route has one chunk; that first axis is not another level. A padding mask identifies real samples. A scale, when used, also belongs to reconstruction. Preserve these fields with the codes rather than saving only flattened integers.</Prose>
    <Prose>Sample rate specifies how much time each sample occupies. Tagging 48,000-Hz samples as 24,000 changes interpreted duration and pitch; resampling computes a new waveform on the intended grid. Downmixing stereo can remove information too, so the channel policy is explicit. Add <Code>--output decoded.wav</Code> to save the trimmed mono reconstruction and compare it with the original on data matching your application. A random-weight offline shape test verifies API geometry, not pretrained quality.</Prose>
    <Prose>Variable-bandwidth codecs train to handle selected RVQ depths. Dropping levels from an arbitrary tokenizer does not guarantee its decoder or LM accepts the shortened stream. The companion configuration and observed shapes govern that checkpoint.</Prose>

    <H2>9. Video needs space and time</H2>
    <Prose>Video adds a time axis to an image grid. Here are four 4×4 frames. One spatial location extends through time: tokenize each frame separately, or group two adjacent frames into one spacetime block:</Prose>
    <VideoVolumeFigure />
    <Prose>P=2 gives four patches per frame, so four frames give 16 frame-patch positions. A <em>tubelet</em> spanning two frames at one 2×2 location contains eight grayscale values projected together. Two temporal groups times four spatial locations give eight positions. Grouping these frames exposes their within-block changes; it is not the same operation as dropping every other frame.</Prose>
    <MathBlock>{"\\begin{aligned}N_{\\mathrm{tubelet}}&=\\frac{T}{\\tau}\\frac{H}{P}\\frac{W}{P}\\\\x_i&\\in\\mathbb R^{\\tau P^2C}\\end{aligned}"}</MathBlock>
    <Prose>T is supplied frame count and τ the temporal block length. This assumes exact divisibility. Floor counts drop incomplete blocks; ceiling counts require padding and valid-frame metadata. A 3D convolution with matching kernel/stride implements tubelet projection, as Conv2d does image patch projection. Learned video quantizers can also compress spacetime and emit discrete codes.</Prose>
    <H3>Sampling can lose an event before encoding</H3>
    <Prose>Someone chooses frames from a clip before they reach the encoder. In this constructed two-second clip, a flash appears between .45 and .55 seconds. Inspect which sampling instants retain it:</Prose>
    <VideoSamplingLab />
    <Prose>At 1 frame/s, the instants 0 and 1 on[0,2) miss the flash. At 4 frames/s, the sample at .5 catches it. An encoder cannot recover actual evidence never sampled. A model may infer a likely event from context, which differs from observing it.</Prose>
    <Prose>Frame number need not be elapsed time. Variable-rate recordings, skipped frames and different audio rates require timestamps or an equivalent timing convention. Preserve original times to synchronize a spoken word and visible gesture. Spatial and temporal positions have different jobs; a flat index only describes both when the model's encoding supplies that interpretation.</Prose>
    <Prose>More frames or smaller tubelets cost positions; fewer samples can hide short actions. Evaluate the clip question and sampling coverage, not a universal percentage of duplicate video tokens. Continuous understanding and discrete generation need different training/output routes, just as images do.</Prose>

    <H2>10. Pack the pieces without losing their meaning</H2>
    <Prose>Assemble text, image and audio. For a constructed single-embedding-table model, reserve separate ID ranges. Follow local ID 3 into each namespace, then examine next-token training targets:</Prose>
    <NamespaceFigure />
    <Prose>Text uses 0..7; image codes 8..11. Two audio levels with four codes each use 12..15 and 16..19. Markers 20..23 delimit image/audio blocks here. Text 3, image 3 and audio 3 therefore retrieve global 3,11,15 or 19. Stage identity matters as well as modality.</Prose>
    <Prose>These are toy offsets. Chameleon's paper reports a total vocabulary of 65,536 including 8,192 image codes, and 512×512 images mapped to 1,024 codes. The released configuration and processor determine the actual mapping. Do not add 8,192 to that reported total or copy these toy ranges into another checkpoint.</Prose>
    <Prose>A marker can be a trained special vocabulary entry or processor metadata. A visible string such as <Code>{'<image>'}</Code> is not automatically special: the <a href="/learn/path/full-curriculum/byte-pair-encoding-bpe-wordpiece-sentencepiece-unigram?module=large-language-models">subword lesson</a> shows how ordinary text can split. Use the model's existing processor/special-token contract; adding an unseen ID at inference does not teach its meaning.</Prose>
    <H3>Attention masks and prediction targets differ</H3>
    <Prose>A <em>causal mask</em> stops a next-token position reading later positions unavailable at generation time. A <em>loss mask</em> selects which predictions train the model. An input-only image block can condition a text answer while its own targets are ignored. In the drawing, the final image marker predicts first text ID 3, and that text position predicts 4.</Prose>
    <CodeBlock language="python" filename="target_alignment.py">{`# Image conditioning, followed by two text IDs. -100 ignores a target.
input_ids = [20, 11, 8, 21, 3, 4]
aligned_labels = [-100, -100, -100, -100, 3, 4]
# A standard causal-LM loss shifts aligned labels internally:
next_targets = aligned_labels[1:] + [-100]
print(next_targets)  # [-100, -100, -100, 3, 4, -100]`}</CodeBlock>
    <Prose>Passing shifted targets to a library that shifts again creates an off-by-one bug. A model trained to generate image codes can include their targets; a continuous inserted visual vector has no categorical image ID target unless the architecture defines one. Both mask conventions must match the training objective.</Prose>
    <Prose>Interleaving makes relationships available; training must learn to use them. Generation may constrain the allowed modality or enforce an image block's required length. Chameleon reports architecture and inference changes alongside early fusion. Shared vector shapes allow reuse of many transformer operations, but do not make every mask, cache and serving path identical to text-only inference.</Prose>
    <Prose>A prefix cache must identify actual preprocessed content, feature/code order, positions and masks. Changing tokenizer, encoder or projector versions can change vectors even with identical text. The same compatibility rule applies when loading saved codes.</Prose>
    <Prose>The complete program below implements those small namespaces and aligned labels. It also traces section 9's tubelet order in NumPy and matches its projection with PyTorch Conv3d. Follow the channel/time/spatial permutation when copying the weights; count agreement alone cannot catch a reordered block.</Prose>
    <Program file="sequence_geometry.py" title="Tubelet projection, typed IDs, and aligned text targets" />

    <span id="7-decision-matrix" className="mm-anchor" aria-hidden="true" />
    <span id="8-what-scales-and-what-doesn-t" className="mm-anchor" aria-hidden="true" />
    <H2>11. Spend positions on evidence that matters</H2>
    <Prose>Return to the request: compact input helps only if it retains the evidence needed to answer. Our constructed inline model reserves 20 text positions, four markers and 16 image positions. Flatten audio at 75 frames/s and L levels. Change duration and L within a 2,048-position input budget:</Prose>
    <BudgetLab />
    <Prose>Two seconds at eight levels uses 1,200 audio positions, totaling 1,240 and leaving 808. At zero audio duration only 40 input positions are used. A real prompt also needs any system/template positions; reserve output if it shares the model's context window. This lab isolates stated input arithmetic; separate visual-memory architectures need different accounting.</Prose>
    <H3>Positions, attention pairs and cache memory</H3>
    <Prose>At fixed image resolution, halving P quadruples patch positions. Dense self-attention has N² position pairs. At 224×224, P=32 gives 49 patches and P=16 gives 196. Pair counts change from 2,401 to 38,416, a factor 16. Projection, feed-forward layers, cross-attention and hardware also affect runtime; this ratio is not a measured latency ratio.</Prose>
    <Prose>A decoder's key/value cache stores previous attention keys and values. Let A be layer count, Hkv the number of KV heads, dh each head's width and b bytes per stored number. In a simple uncompressed layout:</Prose>
    <MathBlock>{"\\begin{aligned}M_{\\mathrm{per\\ position}}&=2A H_{kv}d_h b\\\\M_{\\mathrm{cache}}&=N\\,M_{\\mathrm{per\\ position}}\\end{aligned}"}</MathBlock>
    <Prose>The 2 counts keys and values. With 32 layers, eight KV heads, head width 128 and two-byte storage, each position takes 131,072 bytes or 128 KiB. Our 1,240 positions use 155 MiB. With 32 KV heads instead, it is 620 MiB. Grouped-query attention uses fewer KV heads than query heads; substituting full hidden width would assume full multi-head KV storage. Real caches add layout/paging overhead and may use other dtypes or compression.</Prose>
    <span id="9-failure-modes-gotchas" className="mm-anchor" aria-hidden="true" />
    <H3>Choose by task, then inspect the chain</H3>
    <LessonTable caption="Decide what must survive before choosing a representation" headers={['Question', 'Evidence to retain', 'Check']} rows={[
      ['Read small image text', 'Resolution, spatial features, readable characters', 'Inspect original/crop/reconstruction; answer exact unseen text.'],
      ['Transcribe audio', 'Linguistic content and timing', 'Held-out transcripts and difficult sound conditions.'],
      ['Reproduce sound', 'Acoustic detail, duration, channels and scales', 'Compare with reference using appropriate listening/objective tests.'],
      ['Locate a short event', 'Samples near the event, correct timestamps', 'Sampling coverage and event-time answers.'],
      ['Generate an image or clip', 'Trained output representation and decoder', 'Valid codes/geometry and content; plausibility differs from fidelity.'],
    ]} />
    <Prose>When a model ignores an attachment, inspect in order: sampling/cropping; expected ranges, channels and rates; matching shapes/IDs/checkpoint; permitted attention to the attachment; relevant trained targets. Then assess model capability. A tokenizer cannot uniquely recover distinctions it collapsed, even though a decoder may produce a plausible guess.</Prose>

    <section className="lesson-ending lesson-ending--practice" data-lesson-ending="practice">
      <span id="11-self-check-exercises" className="mm-anchor" aria-hidden="true" />
    <H2>Practice: trace, change and diagnose</H2>
      <Exercise title="1. Change the patch budget." hint={<p>Count both spatial axes, then square the position ratio for dense pairs.</p>} solution={<p>P=16 gives 20×12=240 patches; P=8 gives 40×24=960. Four times the positions gives 16 times dense image-to-image pairs at fixed width. One CLS row would give 241 versus 961; include it explicitly if applicable. None of these counts measures actual latency.</p>}>A 320×192 RGB image uses P=16 without CLS. Count positions at P=16 and P=8 and compare dense attention pairs. What does this not establish?</Exercise>
      <Exercise title="2. Reproduce a changed nearest-code case." hint={<p>Use section 4's±1 corners and sum squared component differences.</p>} solution={<p>For (−.8,.7), k 2=(−1,1) has minimum error .2²+(−.3)²=.13. For (−.7,.7), k 2 remains nearest but error becomes .18. Identical codes can have different quantization errors. Confirm both using the sliders.</p>}>Use features (−.8,.7) and (−.7,.7). Find the selected code and error for each.</Exercise>
      <Exercise title="3. Repair a detached route." hint={<p>Compare forward value and encoder derivative separately.</p>} solution={<p><Code>zq.detach()</Code> supplies the selected value but blocks reconstruction's encoder gradient. Use <Code>ze + (zq - ze).detach()</Code>. The codebook still needs its own update route; the decoder still learns. Verify reconstruction's scalar encoder gradient 2 and code gradient 0 before adding the other terms.</p>}>Someone substitutes <Code>zq.detach()</Code> for the straight-through expression, arguing that both have the same value. Explain the training difference and repair it.</Exercise>
      <Exercise title="4. Separate rate from duration." hint={<p>75 frames/s times levels gives IDs/s; multiply again by 10 for bits/s.</p>} solution={<p>Four levels give 300 flattened IDs/s and 3,000 fixed-width bits/s. Three seconds gives 225 frames and 900 IDs, plus markers. A 500-position audio budget cannot hold them under this serialization. Shrinking K alone cannot fix the position limit; change duration, levels, temporal compression or LM representation.</p>}>At 24 kHz, stride 320, K=1024 and four levels, calculate rates and IDs for three seconds. Does a 500-position audio budget fit?</Exercise>
      <Exercise title="5. Repair a namespace collision." hint={<p>Write which row each local address should retrieve.</p>} solution={<p>Text 3 maps to global 3, image 3 to 11, level 1 audio 3 to 19. Using global 3 for all loses the declared separate meanings. Apply modality/stage mapping before lookup and preserve it for decode. Integer offsets on token IDs do not modify UTF-8 bytes; encoding corruption is a separate investigation.</p>}>A packer stores text 3, image 3 and level 1 audio 3 as global 3. Repair it using section 10's layout. Why is this different from UTF-8 decoding?</Exercise>
      <Exercise title="6. Design an event-aware input." hint={<p>Specify which event and timestamp must survive before allocating positions.</p>} solution={<p>One valid plan samples densely around candidate events while retaining a coarse overview, uses spatial features preserving the warning light, and keeps original timestamps synchronized with audio. Evaluate unseen clips with brief and absent events; compare uniform sampling at matched budget. Reject a plan that fits by dropping every sample around the event. A plausible reconstruction alone does not test event-time accuracy.</p>}>A constrained assistant must locate a brief warning light in a long clip and identify the corresponding spoken word. Propose representation/sampling, a failure case and a discriminating evaluation.</Exercise>
    </section>

    <span id="10-primary-sources" className="mm-anchor" aria-hidden="true" />
    <Sources alternatives={<ul>
      <li><a href="https://keras.io/examples/generative/vq_vae/">Keras: Vector-Quantized Variational Autoencoders</a> — complete worked tutorial for following the quantizer, losses and training after section 5. Uses TensorFlow/Keras and MNIST; compare tensor order/reductions with our PyTorch program. The written tutorial/code was inspected.</li>
      <li><a href="https://arxiv.org/html/2010.11929v2#S3">Dosovitskiy et al.: ViT, section 3</a> — original model figure and patch/position equations, after section 2. Basic matrices help; CLS is specific to its classifier setup.</li>
      <li><a href="https://arxiv.org/html/1711.00937v2#S3">van den Oord et al.: VQ-VAE, section 3</a> — canonical quantization, loss routes and learned-prior explanation, after sections 4–6. Its probability treatment extends our squared-error example.</li>
      <li><a href="https://github.com/facebookresearch/encodec">Meta: EnCodec implementation</a> — explore an actual codec after section 8. Requires PyTorch/model downloads; preserve sample-rate and bandwidth contracts.</li>
    </ul>}>
      <li><a href="https://arxiv.org/abs/2010.11929">ViT (2020/ICLR 2021)</a>: patch projection, position and resolution.</li>
      <li><a href="https://arxiv.org/abs/1711.00937">VQ-VAE (2017)</a>: nearest-code bottleneck, gradient routes, prior.</li>
      <li><a href="https://arxiv.org/abs/2304.08485">LLaVA (2023)</a> and <a href="https://arxiv.org/abs/2204.14198">Flamingo (2022)</a>: continuous vision–language connectors.</li>
      <li><a href="https://arxiv.org/abs/2405.09818">Chameleon (2024), sections 2.1–2.4</a>: mixed-modal vocabulary, image counts, architecture/inference.</li>
      <li><a href="https://arxiv.org/abs/2210.13438">EnCodec (2022)</a> and <a href="https://huggingface.co/docs/transformers/model_doc/encodec">Transformers EnCodec docs</a>: residual codebooks, rate, encode/decode fields.</li>
      <li><a href="https://arxiv.org/abs/2209.03143">AudioLM (2022)</a>: semantic and SoundStream acoustic representations.</li>
      <li><a href="https://arxiv.org/abs/2103.15691">ViViT (2021)</a>: sampled frames and tubelets.</li>
      <li><a href="https://arxiv.org/abs/2309.15505">FSQ (2023)</a> and <a href="https://arxiv.org/abs/2012.09841">VQGAN (2020/CVPR 2021)</a>: quantizer geometry and perceptual objectives.</li>
      <li><a href="https://archive.ics.uci.edu/dataset/80/optical+recognition+of+handwritten+digits">UCI optical digits</a> and <a href="https://scikit-learn.org/stable/modules/generated/sklearn.datasets.load_digits.html">scikit-learn load_digits</a>: attribution/license and bundled 8×8 contract.</li>
    </Sources>
    <section className="lesson-ending lesson-ending--next" data-lesson-ending="readiness">
      <H2>Readiness and the next question</H2>
      <Prose>Explain why a visual vector need not have an ID. Trace one patch, nearest-code choice and residual correction. Reproduce the gradient check, calculate bits and positions separately, and diagnose a missed event or namespace collision. Then choose a representation using the evidence your task needs.</Prose>
      <Prose>A fixed grid spends as many positions on an empty region as a detailed one. Next, <a href="/learn/path/full-curriculum/dynamic-tokenization-adat-boundlessbpe-litetoken?module=large-language-models">Dynamic Tokenization</a> asks how allocation can adapt to an input. Keep the distinction between sequence length and retained information when judging that tradeoff.</Prose>
    </section>
  </div>,
};
export default multimodalTokenization;
