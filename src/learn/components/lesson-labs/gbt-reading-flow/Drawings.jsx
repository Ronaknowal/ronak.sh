import * as Foundation from './FoundationDrawings.jsx';
import * as Training from './TrainingDrawings.jsx';
import * as Loss from './LossDrawings.jsx';
import * as Newton from './NewtonDrawings.jsx';
import * as Search from './SearchDrawings.jsx';
import * as Sampling from './SamplingDrawings.jsx';
import * as Category from './CategoryDrawings.jsx';
import * as Validation from './ValidationDrawings.jsx';
import * as Study from './StudyDrawings.jsx';
import * as Diagnostic from './DiagnosticDrawings.jsx';
const drawings=[Foundation.TreeAnatomy,Foundation.OneContribution,Foundation.EnsembleSum,Foundation.ResidualRows,Foundation.LeafProjection,Foundation.SplitScan,Training.CapacityAndSearch,Training.FittedLifecycle,Loss.FunctionalDirection,Loss.BinaryScore,Loss.RobustLeaf,Loss.QuantileInterval,Loss.MulticlassCurvature,Newton.Aggregation,Newton.Curvature,Newton.SoftThreshold,Newton.SplitBalance,Newton.Overshoot,Newton.WeightedQuadratic,Search.PrefixScan,Search.HistogramBins,Search.MissingTree,Search.WeightedCuts,Search.HistogramSubtraction,Search.SparseRepresentation,Search.GrowthFrontier,Search.SymmetricPath,Search.WorkAndMemory,Sampling.SampleContributions,Sampling.SamplingDistribution,Sampling.BundleDecode,Sampling.ConflictGraph,Category.CategorySubset,Category.OrderedStatistic,Category.InferenceStatistic,Category.OrderedHistories,Category.InformationLanes,Validation.DataRoles,Validation.SelectedLoss,Validation.SavedPredictor,Validation.SelectedStoredPrefix,Validation.SchemaShapes,Study.ConcreteRoles,Study.MeasuredComparison,Study.MeasuredError,Diagnostic.ImportanceOperations,Diagnostic.PdpIce,Diagnostic.Extrapolation,Diagnostic.WeightedProbabilities,Diagnostic.WorkerHistograms];
export default function GbtDrawing({id}){const index=Number(id.slice(1))-1,Drawing=drawings[index];if(!/^D\d{2}$/.test(id)||!Drawing)throw new Error('Unknown complete GBT drawing '+id);return <Drawing/>;}
