import React from 'react';
import * as G from './GeometryFigures.jsx';
import * as L from './LloydFigures.jsx';
import * as H from './HierarchyFigures.jsx';
import * as D from './DiagnosticsFigures.jsx';
import * as A from './ApplicationsFigures.jsx';

export function KMeansStateProvider({children}) {
 return <L.KMeansStateProvider><A.ApplicationStateProvider>{children}</A.ApplicationStateProvider></L.KMeansStateProvider>;
}
const mechanisms={
 D01:G.Observation,D02:G.PartitionAndTree,D03:G.CoordinateLength,D04:G.SquaredTriangle,D05:G.FeatureUnits,D06:G.TrainingScale,
 D07:L.Assignment,D08:L.FitSetup,'D08-phase':L.FitPhase,D09:L.LocalSolutions,D10:L.ObjectiveTerms,D11:G.MeanMinimum,D12:G.RowMass,D13:G.PairScatter,
 D14:L.SeedDraw,D15:L.AcceptedSeeds,D16:L.GreedyTrials,D17:L.DrawFrequency,D18:L.Completion,D19:L.BudgetAndEmpty,D20:L.AssignmentChunks,D21:L.LengthBound,D22:L.RefreshBound,
 D23:H.SavedFits,D24:H.RoundedQuery,D25:H.PairMatrix,
 D26:()=> <H.CrossMembers id="D26" method="single"/>,D27:()=> <H.CrossMembers id="D27" method="complete"/>,D28:()=> <H.CrossMembers id="D28" method="average"/>,
 D29:H.WardBill,D30:H.WardHeights,D31:H.WardAndLloyd,D32:H.LinkageRow,D33:H.TiedCuts,D34:H.CondensedInterface,D35:H.SavedTree,D36:H.MinimumSpanning,D37:H.ReciprocalChain,D38:H.CentroidInversion,D39:H.PairStorage,
 D40:D.RecordedDiagnostics,D41:D.SilhouetteMembers,D42:D.PairRelations,D43:D.SharedProbes,D44:D.ReferenceGeometry,D45:D.GapNeighbor,D46:D.SelectionProtocol,D47:D.AvailableForecast,
 D48:A.PixelCoordinates,D49:A.PaletteApproximation,D50:A.PaletteCodec,D51:A.RunningMean,D52:A.CachedMiniBatch,D53:A.DriftingHistory,D54:A.CFSummary,D55:A.StableScatter,D56:A.CFCandidate,D57:A.CFSplit,D58:A.WholeEntryCost,D59:A.BisectingRoutes,D60:A.InvertedFiles,D61:A.RingCells,D62:A.SphericalCenters,D63:A.KernelMean,D64:A.SoftMembership,D65:A.CorrelatedFeatures,
};
export function Mechanism({id}) { const Component=mechanisms[id];if(!Component)throw Error(`Missing actual mechanism ${id}`);return <Component/>; }
