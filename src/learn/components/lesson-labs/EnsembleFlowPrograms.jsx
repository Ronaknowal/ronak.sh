import { H3 } from '../content/Headings.jsx';
import { Prose } from '../content/Prose.jsx';
import { CodeBlock } from '../content/Code.jsx';
import RemoteCodeBlock from '../content/RemoteCodeBlock.jsx';
import catalog from '../../data/ensemble-program-flow-catalog.json';
import './ensemble-flow-programs.css';

const assetBase = '/learn-code/ensemble-methods-stacking/';

export function EnsembleCompleteProgram({ id }) {
  const program = catalog.find(entry => entry.id === id);
  if (!program) throw new Error(`Unknown Ensemble program: ${id}`);
  return <section data-ensemble-program={id} id={`ensemble-program-${id}`}>
    <H3>{program.title}</H3>
    <Prose>{program.question}</Prose>
    {id === 'ensemble-oof-state' && <Prose>
      The binary example below uses probability and signed-margin columns. The
      class-alignment helper rejects declared multiclass one-versus-one margins,
      including a pipeline whose final estimator uses that pairwise convention.
    </Prose>}
    {id === 'full-numpy-comparison' && <Prose>
      Locate finite-error clipping in this AdaBoost loop. The separate signed
      loop declares its zero-error stopping and no-edge policies explicitly.
    </Prose>}
    <RemoteCodeBlock source={`${assetBase}${program.filename}`}
      filename={program.filename} language="python" title="Complete program" />
    <Prose>Recorded output for this example</Prose>
    <CodeBlock language="output" kind="output" filename={`${id}.stdout.txt`}
      title="Recorded output">{program.output}</CodeBlock>
  </section>;
}

export function EnsembleNewtonDependency() {
  return <section data-ensemble-dependency="newton-logistic">
    <H3>The complete binary Newton dependency</H3>
    <Prose>
      Save this file beside ensemble-oof-state.py and ensemble-combination-core.py.
      Importing its functions leaves its separate main example unexecuted.
      The intercept is unpenalized; the slopes receive the declared positive
      ridge penalty. The gradient, Hessian, line search and stopping test are
      written explicitly.
    </Prose>
    <RemoteCodeBlock source={`${assetBase}newton-logistic.py`}
      filename="newton-logistic.py" language="python" title="Binary Newton functions" />
  </section>;
}

export function EnsembleProgramSetup() {
  return <section data-ensemble-setup="">
    <H3>Run the complete examples locally</H3>
    <Prose>
      Use Python 3.12.14 with NumPy 2.3.5, SciPy 1.18.1 and scikit-learn 1.9.1
      for the displayed conventions. Save the dependency files in the same
      directory as the programs that import them. The setup guide lists each
      program's dependencies; the requirements file pins these three packages.
    </Prose>
    <CodeBlock language="bash" filename="ensemble-environment.sh" title="Create the environment">
      {'python -m venv .venv\n# Activate .venv for your shell, then:\npython -m pip install -r requirements.txt'}
    </CodeBlock>
    <Prose>
      <a href={`${assetBase}SETUP.md`} download>Setup and dependency guide</a>{' · '}
      <a href={`${assetBase}requirements.txt`} download>Pinned requirements</a>
    </Prose>
  </section>;
}

export function EnsembleStudyFiles() {
  return <section data-ensemble-study-files="">
    <H3>Offline data and the complete saved study</H3>
    <Prose>
      The real-data program needs the offline 569 × 30 CSV, the declared split
      protocol and the same three local Python dependencies. DATA.md supplies
      the UCI attribution, CC BY 4.0 license and positive-class conversion.
      Its default command checks the supplied data and protocol without fitting.
      The explicit --run-study option starts a new experiment in a new output
      directory; it does not recreate the displayed measurements by downloading
      the serving bundle.
    </Prose>
    <ul>
      {[
        ['wdbc-sklearn-1.9.1.csv', 'Offline WDBC feature rows and original labels'],
        ['reading-flow-proposed-data.json', 'Declared data, split and selection protocol'],
        ['DATA.md', 'Data attribution, license and label conversion'],
        ['serving-bundle.json', 'Complete saved base, combination and schema state'],
        ['prediction-arrays.npz', 'Complete saved prediction arrays'],
        ['selection-frozen-before-test.json', 'Validation selection and threshold record']
      ].map(([filename, description]) => <li key={filename}>
        <a href={`${assetBase}${filename}`} download>{filename}</a>: {description}
      </li>)}
    </ul>
  </section>;
}
