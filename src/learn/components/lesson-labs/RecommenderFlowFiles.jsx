import index from '../../data/recommender-supporting-files.json';
const base = '/learn-code/recommender-systems-collaborative-filtering-matrix-factorization/';
export function RecSupportingFiles() {
  const data = index.commonDataAndReportFiles;
  const arrays = index.typedSavedArrayFiles;
  const filename = entry => entry.filename;
  return <section className="recommender-flow-files" aria-label="Complete Retail input bundle and saved supporting files">
    <p>The supported input route uses all four files below together in <code>retail-data</code>: the manifest and the three calendar-role CSVs. Keep the ten companion Python programs beside that directory. Downloads preserve the complete original files; reading the saved report and arrays does not require another study run.</p>
    <ul>{data.map(entry => <li key={entry.filename}><a href={`${base}${filename(entry)}`} download={filename(entry)}>{filename(entry)}</a> — {entry.role}</li>)}</ul>
    <details><summary>Complete typed saved arrays for the recorded study</summary>
      <p>These NPZ files contain the complete saved numerical arrays. Training P, final Q and request P_query remain separate roles; the four unchosen validation settings have no invented prefix-refitted test outcome.</p>
      <ul>{arrays.map(entry => <li key={entry.filename}><a href={`${base}${filename(entry)}`} download={filename(entry)}>{filename(entry)}</a></li>)}</ul>
    </details>
    <p>The optional workbook derivation uses the official UCI archive and a new directory, as explained above. The private original customer-ID map is not a study input or a learner download. The source/output and practice links also appear in the reader's common Code &amp; supporting files index.</p>
  </section>;
}
