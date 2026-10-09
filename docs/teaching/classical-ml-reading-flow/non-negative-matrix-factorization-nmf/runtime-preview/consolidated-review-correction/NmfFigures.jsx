import React from 'react';
import * as A from './ArrayFigures.jsx';
import * as G from './GeometryFigures.jsx';
import * as O from './OptimizationFigures.jsx';
import * as S from './SavedDataFigures.jsx';
import * as I from './IdentifiabilityFigures.jsx';
import * as T from './TransferFigures.jsx';
const figures = [A.Observation, A.Addends, A.Shapes, A.OuterProducts, A.AmountFraction, A.Compensation, G.Shear, A.ContributionRanking, A.Residual, A.SquaredCells, A.Missing, A.LossDomains, G.Cone, G.ClipFailure, () => <G.Cone id="D15" frozen />, G.CoordinateSlice, G.Caches, G.Cyclic, G.KKT, G.Alternation, G.Joint, G.Stationarity, G.Storage, O.Ratio, O.HistoricalMU, O.ZeroLock, O.Counts, O.Majorizer, O.PSD, O.BetaPower, O.Centering, O.SignedTriplet, O.PairedSigns, O.FilledZeros, O.PublicAnatomy, O.SameBlock, O.Publication, O.Penalty, O.ScalePenalty, O.MaskGram, O.NoInformation, S.Dictionary, S.SavedContribution, S.SavedRanking, S.Removal, S.Partitions, S.Candidates, S.MatchedComparison, S.PixelAddress, I.AlternativeCones, I.SupportRectangle, I.RankWitness, I.NormalizeMixture, I.ObservedAnchors, I.ProjectionTrace, I.Conditioning, T.WordCounts, T.FrozenIDF, T.SpectralConstraints, T.ExternalEvidence, T.OnlineStatistics, T.Retention, T.StaleStatistics, T.TensorAddress, T.TensorAnatomy, T.Phase];
export function NmfFigure({
  id
}) {
  const n = Number(id.slice(1)),
    Component = figures[n - 1];
  if (!Component || n < 1 || n > 66) throw Error(`Unknown NMF drawing ${id}`);
  return <Component />;
}
export { figures };
