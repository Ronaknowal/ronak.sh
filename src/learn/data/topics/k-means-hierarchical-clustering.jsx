import React from 'react';
import { H3 } from '../../components/content/Headings.jsx';
import { Prose } from '../../components/content/Prose.jsx';
import { NeuralTable } from '../../components/lesson-labs/NeuralLessonElements.jsx';
import { CodeBlock } from '../../components/content/Code.jsx';
import RemoteCodeBlock from '../../components/content/RemoteCodeBlock.jsx';
import { Math as InlineMath, MathBlock } from '../../components/content/Math.jsx';
import { useCodeDownload } from '../../components/content/LessonCodeDownloads.jsx';
import { Mechanism, KMeansStateProvider } from '../../components/lesson-labs/k-means-reading-flow/figures.jsx';
import '../../components/lesson-labs/k-means-reading-flow/figures.css';
const completeFiles = [{"id":"O1","path":"original-programs/clustering_lloyd.py","bytes":4572,"sha256":"18bfa86c8379ac235188886d26f6c4e6fabc0bb59f00504bb8ab40d78cb73a77","name":"clustering_lloyd.py","annotation":"Complete retained Lloyd loop, original constructed-data and duplicate/budget cases (§6).","dependencies":[],"proposedUrl":"/learn-code/k-means-hierarchical-clustering/clustering_lloyd.py","main":true,"packages":["NumPy","scikit-learn"],"url":"/learn-code/k-means-hierarchical-clustering/clustering_lloyd.py"},{"id":"O2","path":"original-programs/clustering_ward.py","bytes":3277,"sha256":"c4fd67f544b35e7af0ff6e003759e67e7f3f775b410bcf3a5e73154406d83935","name":"clustering_ward.py","annotation":"Complete retained Ward reference, heights, cuts and ARI (§12).","dependencies":[],"proposedUrl":"/learn-code/k-means-hierarchical-clustering/clustering_ward.py","main":true,"packages":["NumPy","SciPy","scikit-learn"],"url":"/learn-code/k-means-hierarchical-clustering/clustering_ward.py"},{"id":"O3","path":"original-programs/clustering_production.py","bytes":5289,"sha256":"704f20af562b2d6a0a9770723d77b0b9ddf625c115b4267117e0e87003b80165","name":"clustering_production.py","annotation":"Faithful fits/diagnostics plus MiniBatch/Ward comparison; complete after all operations (§15).","dependencies":[],"proposedUrl":"/learn-code/k-means-hierarchical-clustering/clustering_production.py","main":true,"packages":["NumPy","scikit-learn"],"url":"/learn-code/k-means-hierarchical-clustering/clustering_production.py"},{"id":"O4","path":"original-programs/clustering_scaling.py","bytes":1841,"sha256":"311f51c92f70e7d8da89036c913ca24190c4bb7d0401930cd5fc044114d99667","name":"clustering_scaling.py","annotation":"Coordinate conversion, compensation and training-only device pipeline; complete after ARI (§12).","dependencies":[],"proposedUrl":"/learn-code/k-means-hierarchical-clustering/clustering_scaling.py","main":true,"packages":["NumPy","scikit-learn"],"url":"/learn-code/k-means-hierarchical-clustering/clustering_scaling.py"},{"id":"O5","path":"original-programs/clustering_quantization.py","bytes":2228,"sha256":"e3be003d81862e0cb62e09361700d1352b835eacc0a4a582658c20f484f4ce99","name":"clustering_quantization.py","annotation":"Weighted palette fit and fixed-three-entry logical byte decoder (§14).","dependencies":[],"proposedUrl":"/learn-code/k-means-hierarchical-clustering/clustering_quantization.py","main":true,"packages":["NumPy","scikit-learn"],"url":"/learn-code/k-means-hierarchical-clustering/clustering_quantization.py"},{"id":"O6","path":"original-programs/clustering_capstone.py","bytes":4504,"sha256":"67e46ba9ed26d6a4d3d916312dd61806ab81c2662f0ca0dc6d82e32c6175d661","name":"clustering_capstone.py","annotation":"Complete separated synthetic candidate selection and one locked test assessment (§13).","dependencies":[],"proposedUrl":"/learn-code/k-means-hierarchical-clustering/clustering_capstone.py","main":true,"packages":["NumPy","scikit-learn"],"url":"/learn-code/k-means-hierarchical-clustering/clustering_capstone.py"},{"id":"N1","path":"programs/clustering_chunked_lloyd.py","bytes":4802,"sha256":"9dedb02a820e628376c4d55a9c471e7c18b8ca73bac5c3e2e898c03f8c414e4f","name":"clustering_chunked_lloyd.py","annotation":"Chunked weighted Lloyd with fresh returned labels and trace (§6).","dependencies":["clustering_core.py"],"proposedUrl":"/learn-code/k-means-hierarchical-clustering/clustering_chunked_lloyd.py","main":true,"packages":["NumPy","scikit-learn"],"url":"/learn-code/k-means-hierarchical-clustering/clustering_chunked_lloyd.py"},{"id":"N2","path":"programs/clustering_elkan.py","bytes":6811,"sha256":"c464a61d022eac1974565a0212f02a888bbba960e9cdb7f41ec684f81d11b9d7","name":"clustering_elkan.py","annotation":"Conservative length-bound Elkan assignment and complete updates (§6).","dependencies":["clustering_core.py"],"proposedUrl":"/learn-code/k-means-hierarchical-clustering/clustering_elkan.py","main":true,"packages":["NumPy","scikit-learn"],"url":"/learn-code/k-means-hierarchical-clustering/clustering_elkan.py"},{"id":"N3","path":"programs/clustering_single_mst.py","bytes":3662,"sha256":"9d59950a95becf428c85097d7a2c960e9ad5b9eb7fd7fa84c7b8278e994c817e","name":"clustering_single_mst.py","annotation":"Dense Prim MST, union-find hierarchy and inclusive cuts (§11).","dependencies":["clustering_core.py"],"proposedUrl":"/learn-code/k-means-hierarchical-clustering/clustering_single_mst.py","main":true,"packages":["NumPy","SciPy"],"url":"/learn-code/k-means-hierarchical-clustering/clustering_single_mst.py"},{"id":"N4","path":"programs/clustering_nn_chain.py","bytes":6579,"sha256":"65da37e52d5ed379eb34dd2a723ea900b68a68517d68a552c2e4a529c070b71d","name":"clustering_nn_chain.py","annotation":"Member definitions, coordinate/condensed input routes and reducible NN-chain (§11).","dependencies":["clustering_core.py"],"proposedUrl":"/learn-code/k-means-hierarchical-clustering/clustering_nn_chain.py","main":true,"packages":["NumPy","SciPy"],"url":"/learn-code/k-means-hierarchical-clustering/clustering_nn_chain.py"},{"id":"N5","path":"programs/clustering_diagnostics.py","bytes":6488,"sha256":"9e43d995ea56d4a0cb3596e3fd0a40ca1df3fe083f50eceb08dab02a4572f9b8","name":"clustering_diagnostics.py","annotation":"Chunked point silhouettes and paper-convention gap references (§12).","dependencies":["clustering_chunked_lloyd.py","clustering_core.py"],"proposedUrl":"/learn-code/k-means-hierarchical-clustering/clustering_diagnostics.py","main":true,"packages":["NumPy","scikit-learn"],"url":"/learn-code/k-means-hierarchical-clustering/clustering_diagnostics.py"},{"id":"N6","path":"programs/clustering_minibatch.py","bytes":4749,"sha256":"e56e7b7da86796167ed36542992683bd9b5e1bb7fd4774ddd45a2e701b54a9fb","name":"clustering_minibatch.py","annotation":"Cached weighted batch history, atomic update and JSON reload (§15).","dependencies":["clustering_core.py"],"proposedUrl":"/learn-code/k-means-hierarchical-clustering/clustering_minibatch.py","main":true,"packages":["NumPy","scikit-learn"],"url":"/learn-code/k-means-hierarchical-clustering/clustering_minibatch.py"},{"id":"N7","path":"programs/clustering_cf_tree.py","bytes":8356,"sha256":"7df84fe029754af99187e7af1b459be569cd34e926fa10f5c43228ff2231a81e","name":"clustering_cf_tree.py","annotation":"Stable summaries, bounded CF nodes/splits/links and explicit tree export (§16).","dependencies":["clustering_core.py"],"proposedUrl":"/learn-code/k-means-hierarchical-clustering/clustering_cf_tree.py","main":true,"packages":["NumPy","scikit-learn"],"url":"/learn-code/k-means-hierarchical-clustering/clustering_cf_tree.py"},{"id":"N8","path":"programs/clustering_bisecting.py","bytes":4650,"sha256":"0260e59b54c8ac5bc56a25fc851de98d35f2b9b724c7ce4fac346541a0f8fe79","name":"clustering_bisecting.py","annotation":"Recursive two-way center fits and stored-path prediction (§16).","dependencies":["clustering_chunked_lloyd.py","clustering_core.py"],"proposedUrl":"/learn-code/k-means-hierarchical-clustering/clustering_bisecting.py","main":true,"packages":["NumPy","scikit-learn"],"url":"/learn-code/k-means-hierarchical-clustering/clustering_bisecting.py"},{"id":"N9","path":"programs/clustering_ivf_routing.py","bytes":3982,"sha256":"e7fc526ec11b516e18e53b58ae1f71b9a56e08037e455ce38f9ed20ebc364b16","name":"clustering_ivf_routing.py","annotation":"Supplied coarse-list search and optional ordinary Faiss Flat/IVF route (§17).","dependencies":["clustering_core.py"],"proposedUrl":"/learn-code/k-means-hierarchical-clustering/clustering_ivf_routing.py","main":true,"packages":["optional Faiss","NumPy"],"url":"/learn-code/k-means-hierarchical-clustering/clustering_ivf_routing.py"},{"id":"N10","path":"programs/clustering_directional_kernel.py","bytes":7318,"sha256":"651428f0b54d02732be03acc99e764f3276683b768dcde3315a713d4c6bed2bd","name":"clustering_directional_kernel.py","annotation":"Normalized directional means and coefficient kernel training/query route (§17).","dependencies":["clustering_core.py"],"proposedUrl":"/learn-code/k-means-hierarchical-clustering/clustering_directional_kernel.py","main":true,"packages":["NumPy","scikit-learn"],"url":"/learn-code/k-means-hierarchical-clustering/clustering_directional_kernel.py"},{"id":"N11","path":"programs/clustering_soft_limit.py","bytes":2132,"sha256":"700753c374b657d7c9dd3ebeb25feacf1be9f7e8051f20f4d82f95203d0abfea","name":"clustering_soft_limit.py","annotation":"Stable fixed-model responsibilities and ordinary logsumexp comparison (§17).","dependencies":["clustering_core.py"],"proposedUrl":"/learn-code/k-means-hierarchical-clustering/clustering_soft_limit.py","main":true,"packages":["NumPy","SciPy"],"url":"/learn-code/k-means-hierarchical-clustering/clustering_soft_limit.py"},{"id":"N12","path":"programs/clustering_own_task.py","bytes":8938,"sha256":"24ba334b00ac541f99a775f7d18b0c9ac384a0f3905805219b47258dd38cfe81","name":"clustering_own_task.py","annotation":"CSV feature-role validation, train/validation selection and locked final assessment (§13).","dependencies":["clustering_core.py"],"proposedUrl":"/learn-code/k-means-hierarchical-clustering/clustering_own_task.py","main":true,"packages":["NumPy","scikit-learn"],"url":"/learn-code/k-means-hierarchical-clustering/clustering_own_task.py"},{"id":"CORE","path":"programs/clustering_core.py","bytes":7299,"sha256":"ccb2372ec251d7f947852a6f1c2b0ec1f573a60516f9bac7bc9538c7ab1ef693","name":"clustering_core.py","annotation":"Pure shared arithmetic dependency; import performs no demonstration (§6).","dependencies":[],"proposedUrl":"/learn-code/k-means-hierarchical-clustering/clustering_core.py","main":false,"packages":["NumPy"],"url":"/learn-code/k-means-hierarchical-clustering/clustering_core.py"},{"id":"CODEC","path":"programs/clustering_palette_codec.py","bytes":1764,"sha256":"64a829ff5e26fc7054968744d7e30d503ce36d09ad4e353b91c9df7361d7f0e5","name":"clustering_palette_codec.py","annotation":"Pure palette/index payload including k=1 zero-bit indices (§14).","dependencies":[],"proposedUrl":"/learn-code/k-means-hierarchical-clustering/clustering_palette_codec.py","main":false,"packages":["NumPy"],"url":"/learn-code/k-means-hierarchical-clustering/clustering_palette_codec.py"},{"id":"O1-OUT","path":"original-programs/clustering_lloyd.stdout.txt","bytes":550,"sha256":"c832d2386826a969f8c09ae2c7786d8ac0322bdaaf6111b9a3bb44e31489e9f3","name":"clustering_lloyd.stdout.txt","annotation":"Complete recorded output for the same-name worked program.","dependencies":[],"main":false,"proposedUrl":"/learn-code/k-means-hierarchical-clustering/clustering_lloyd.stdout.txt","packages":[],"url":"/learn-code/k-means-hierarchical-clustering/clustering_lloyd.stdout.txt"},{"id":"O2-OUT","path":"original-programs/clustering_ward.stdout.txt","bytes":514,"sha256":"c0460fffbc17646821de5b844ba3d1e4b5e6ee2053bf394d035ddd3fa98245cb","name":"clustering_ward.stdout.txt","annotation":"Complete recorded output for the same-name worked program.","dependencies":[],"main":false,"proposedUrl":"/learn-code/k-means-hierarchical-clustering/clustering_ward.stdout.txt","packages":[],"url":"/learn-code/k-means-hierarchical-clustering/clustering_ward.stdout.txt"},{"id":"O3-OUT","path":"original-programs/clustering_production.stdout.txt","bytes":792,"sha256":"3286c1f1ec15019fc084de046423a1cea3a80d8e6e2f335e385f230e31708e55","name":"clustering_production.stdout.txt","annotation":"Complete recorded output for the same-name worked program.","dependencies":[],"main":false,"proposedUrl":"/learn-code/k-means-hierarchical-clustering/clustering_production.stdout.txt","packages":[],"url":"/learn-code/k-means-hierarchical-clustering/clustering_production.stdout.txt"},{"id":"O4-OUT","path":"original-programs/clustering_scaling.stdout.txt","bytes":353,"sha256":"54f94c8f0a28e3426b881bdd1f05e9a964ca12140d0208cfc6aeac19e0960c6b","name":"clustering_scaling.stdout.txt","annotation":"Complete recorded output for the same-name worked program.","dependencies":[],"main":false,"proposedUrl":"/learn-code/k-means-hierarchical-clustering/clustering_scaling.stdout.txt","packages":[],"url":"/learn-code/k-means-hierarchical-clustering/clustering_scaling.stdout.txt"},{"id":"O5-OUT","path":"original-programs/clustering_quantization.stdout.txt","bytes":347,"sha256":"4af982726b211358c32e9887b2b1d736e90efd4b867ecb96b731fefe0a16542d","name":"clustering_quantization.stdout.txt","annotation":"Complete recorded output for the same-name worked program.","dependencies":[],"main":false,"proposedUrl":"/learn-code/k-means-hierarchical-clustering/clustering_quantization.stdout.txt","packages":[],"url":"/learn-code/k-means-hierarchical-clustering/clustering_quantization.stdout.txt"},{"id":"O6-OUT","path":"original-programs/clustering_capstone.stdout.txt","bytes":821,"sha256":"207ab4aa30ff972f380f943c4e4728a05064c7b063036445d5cc57b91f71bd19","name":"clustering_capstone.stdout.txt","annotation":"Complete recorded output for the same-name worked program.","dependencies":[],"main":false,"proposedUrl":"/learn-code/k-means-hierarchical-clustering/clustering_capstone.stdout.txt","packages":[],"url":"/learn-code/k-means-hierarchical-clustering/clustering_capstone.stdout.txt"},{"id":"N1-OUT","path":"programs/clustering_chunked_lloyd.stdout.txt","bytes":438,"sha256":"a55630977173695f639f333b1a2f37af4988348010ef743f8f4debbfc58b55e7","name":"clustering_chunked_lloyd.stdout.txt","annotation":"Complete recorded output for the same-name worked program.","dependencies":[],"main":false,"proposedUrl":"/learn-code/k-means-hierarchical-clustering/clustering_chunked_lloyd.stdout.txt","packages":[],"url":"/learn-code/k-means-hierarchical-clustering/clustering_chunked_lloyd.stdout.txt"},{"id":"N2-OUT","path":"programs/clustering_elkan.stdout.txt","bytes":274,"sha256":"3050eb0eaf3d8f59b774d431262d64bc2d4d25e65f93e9074a9ded2df2d19eb4","name":"clustering_elkan.stdout.txt","annotation":"Complete recorded output for the same-name worked program.","dependencies":[],"main":false,"proposedUrl":"/learn-code/k-means-hierarchical-clustering/clustering_elkan.stdout.txt","packages":[],"url":"/learn-code/k-means-hierarchical-clustering/clustering_elkan.stdout.txt"},{"id":"N3-OUT","path":"programs/clustering_single_mst.stdout.txt","bytes":438,"sha256":"24bfc7563b1d228272449412cbb1a1edf9e9935ebbc0f026b95e1f795184dcb4","name":"clustering_single_mst.stdout.txt","annotation":"Complete recorded output for the same-name worked program.","dependencies":[],"main":false,"proposedUrl":"/learn-code/k-means-hierarchical-clustering/clustering_single_mst.stdout.txt","packages":[],"url":"/learn-code/k-means-hierarchical-clustering/clustering_single_mst.stdout.txt"},{"id":"N4-OUT","path":"programs/clustering_nn_chain.stdout.txt","bytes":784,"sha256":"83b1be02feed3d147259a3f8aa638572a6c7e9c54ed6a6f98ca042861bd411b1","name":"clustering_nn_chain.stdout.txt","annotation":"Complete recorded output for the same-name worked program.","dependencies":[],"main":false,"proposedUrl":"/learn-code/k-means-hierarchical-clustering/clustering_nn_chain.stdout.txt","packages":[],"url":"/learn-code/k-means-hierarchical-clustering/clustering_nn_chain.stdout.txt"},{"id":"N5-OUT","path":"programs/clustering_diagnostics.stdout.txt","bytes":2662,"sha256":"cf88bd82402f8483969d475caaab4fc7423b5ed6ba65ad963dc3c387276525ec","name":"clustering_diagnostics.stdout.txt","annotation":"Complete recorded output from the preceding N5 version; current factor-storage successor unexecuted end to end.","dependencies":[],"main":false,"proposedUrl":"/learn-code/k-means-hierarchical-clustering/clustering_diagnostics.stdout.txt","packages":[],"url":"/learn-code/k-means-hierarchical-clustering/clustering_diagnostics.stdout.txt"},{"id":"N6-OUT","path":"programs/clustering_minibatch.stdout.txt","bytes":499,"sha256":"3f9f26b3663e7d37566cd7f54f78753a6f23c752d748e47e20ade5fb0a5dd56d","name":"clustering_minibatch.stdout.txt","annotation":"Complete recorded output for the same-name worked program.","dependencies":[],"main":false,"proposedUrl":"/learn-code/k-means-hierarchical-clustering/clustering_minibatch.stdout.txt","packages":[],"url":"/learn-code/k-means-hierarchical-clustering/clustering_minibatch.stdout.txt"},{"id":"N7-OUT","path":"programs/clustering_cf_tree.stdout.txt","bytes":2039,"sha256":"05bf7bf990ec3a05158fd71cc67d58674c33e6899879ece212ba6e6198d67e12","name":"clustering_cf_tree.stdout.txt","annotation":"Complete recorded output for the same-name worked program.","dependencies":[],"main":false,"proposedUrl":"/learn-code/k-means-hierarchical-clustering/clustering_cf_tree.stdout.txt","packages":[],"url":"/learn-code/k-means-hierarchical-clustering/clustering_cf_tree.stdout.txt"},{"id":"N8-OUT","path":"programs/clustering_bisecting.stdout.txt","bytes":753,"sha256":"057a0ceb124bbd4d849ca0e861c9c43be64d6bc631b65fb5b09d62b1b0c95817","name":"clustering_bisecting.stdout.txt","annotation":"Complete recorded output for the same-name worked program.","dependencies":[],"main":false,"proposedUrl":"/learn-code/k-means-hierarchical-clustering/clustering_bisecting.stdout.txt","packages":[],"url":"/learn-code/k-means-hierarchical-clustering/clustering_bisecting.stdout.txt"},{"id":"N9-OUT","path":"programs/clustering_ivf_routing.stdout.txt","bytes":505,"sha256":"43a25556b52424968985f24e826ae6ed5b2fd62b24639fb78b2d40a68e05f177","name":"clustering_ivf_routing.stdout.txt","annotation":"Complete recorded output for the same-name worked program.","dependencies":[],"main":false,"proposedUrl":"/learn-code/k-means-hierarchical-clustering/clustering_ivf_routing.stdout.txt","packages":[],"url":"/learn-code/k-means-hierarchical-clustering/clustering_ivf_routing.stdout.txt"},{"id":"N10-OUT","path":"programs/clustering_directional_kernel.stdout.txt","bytes":505,"sha256":"22a3b2469a652c5595e6c27494868787c10f9ecb360d18392d12bcdaaad23c8f","name":"clustering_directional_kernel.stdout.txt","annotation":"Complete recorded output for the same-name worked program.","dependencies":[],"main":false,"proposedUrl":"/learn-code/k-means-hierarchical-clustering/clustering_directional_kernel.stdout.txt","packages":[],"url":"/learn-code/k-means-hierarchical-clustering/clustering_directional_kernel.stdout.txt"},{"id":"N11-OUT","path":"programs/clustering_soft_limit.stdout.txt","bytes":496,"sha256":"917ca375970cacaba2a9656b93d8d07a6305d4d83802a9485c17564e59511841","name":"clustering_soft_limit.stdout.txt","annotation":"Complete recorded output for the same-name worked program.","dependencies":[],"main":false,"proposedUrl":"/learn-code/k-means-hierarchical-clustering/clustering_soft_limit.stdout.txt","packages":[],"url":"/learn-code/k-means-hierarchical-clustering/clustering_soft_limit.stdout.txt"},{"id":"N12-OUT","path":"programs/clustering_own_task.stdout.txt","bytes":888,"sha256":"70fe9ad3481655f52795da7f175b45a1ab6508aa581f24777f33e9334e45899c","name":"clustering_own_task.stdout.txt","annotation":"Complete recorded output for the same-name worked program.","dependencies":[],"main":false,"proposedUrl":"/learn-code/k-means-hierarchical-clustering/clustering_own_task.stdout.txt","packages":[],"url":"/learn-code/k-means-hierarchical-clustering/clustering_own_task.stdout.txt"},{"id":"N9-FAISS-OUT","path":"programs/clustering_ivf_routing.faiss.stdout.txt","bytes":508,"sha256":"7ac3f8993910dbca9a7a9256bd21b929e842bf8947047401ee7f5bf4c7f28b70","name":"clustering_ivf_routing.faiss.stdout.txt","annotation":"Recorded optional four-query CPU Faiss comparison (§17).","dependencies":[],"main":false,"proposedUrl":"/learn-code/k-means-hierarchical-clustering/clustering_ivf_routing.faiss.stdout.txt","packages":[],"url":"/learn-code/k-means-hierarchical-clustering/clustering_ivf_routing.faiss.stdout.txt"},{"id":"OWN-CSV","path":"programs/clustering_own_task_example.csv","bytes":682,"sha256":"1795acc2a4b80323918169996779b3a0804f0121c36804d1db453ac0ba5fdf20","name":"clustering_own_task_example.csv","annotation":"Thirty constructed rows with explicit train/validation/test roles.","dependencies":[],"main":false,"proposedUrl":"/learn-code/k-means-hierarchical-clustering/clustering_own_task_example.csv","packages":[],"url":"/learn-code/k-means-hierarchical-clustering/clustering_own_task_example.csv"},{"id":"OWN-DOCUMENTATION","path":"programs/clustering_own_task_example.DOCUMENTATION.md","bytes":2506,"sha256":"ad4b5813923cbbadbf03a4fdf1b41e814638d4910bcaba6aedac93700e49c016","name":"clustering_own_task_example.DOCUMENTATION.md","annotation":"Complete deterministic construction, feature roles and use.","dependencies":[],"main":false,"proposedUrl":"/learn-code/k-means-hierarchical-clustering/clustering_own_task_example.DOCUMENTATION.md","packages":[],"url":"/learn-code/k-means-hierarchical-clustering/clustering_own_task_example.DOCUMENTATION.md"},{"id":"REQUIREMENTS","path":"programs/clustering_requirements.txt","bytes":47,"sha256":"072bbb5a7684c8b44006d0f844d63951271aded28d1fd5ab1645e12f33d6d704","name":"clustering_requirements.txt","annotation":"Named tested NumPy/SciPy/scikit-learn snapshot.","dependencies":[],"main":false,"proposedUrl":"/learn-code/k-means-hierarchical-clustering/clustering_requirements.txt","packages":[],"url":"/learn-code/k-means-hierarchical-clustering/clustering_requirements.txt"},{"id":"FAITHFUL-CSV","path":"programs/faithful.csv","bytes":3533,"sha256":"9b5273a618bc0b6f486dac4f2f12759e8b900fd32503702d8e2640b3dd75758f","name":"faithful.csv","annotation":"Exact retained 272-record real-data CSV; record number is not a feature.","dependencies":[],"main":false,"proposedUrl":"/learn-code/k-means-hierarchical-clustering/faithful.csv","packages":[],"url":"/learn-code/k-means-hierarchical-clustering/faithful.csv"},{"id":"FAITHFUL-DOCUMENTATION","path":"programs/faithful.DOCUMENTATION.md","bytes":2114,"sha256":"e9a7a9b4da0eb2f2661dabba26ede89346fedd83aaf20315ded948e8dcb6ae0f","name":"faithful.DOCUMENTATION.md","annotation":"Measurement, version, upstream attribution and use.","dependencies":[],"main":false,"proposedUrl":"/learn-code/k-means-hierarchical-clustering/faithful.DOCUMENTATION.md","packages":[],"url":"/learn-code/k-means-hierarchical-clustering/faithful.DOCUMENTATION.md"},{"id":"OWN-RESULT","path":"programs/clustering_own_task_example.result.json","bytes":3031,"sha256":"d250cf108a135aa7bc7e23d52a0f0d29c672977e9dd07bf0a3b3d7c6bd9d7ed8","name":"clustering_own_task_example.result.json","annotation":"Complete recorded portable example result with candidate, scaler and center state.","dependencies":[],"main":false,"proposedUrl":"/learn-code/k-means-hierarchical-clustering/clustering_own_task_example.result.json","packages":[],"url":"/learn-code/k-means-hierarchical-clustering/clustering_own_task_example.result.json"},{"id":"O6-CURRENT","path":"programs/clustering_capstone_protocol.py","bytes":4383,"sha256":"776ff244416b386c99d89a89313f186e51d3fabfc03f3c575051307152e9cf5a","name":"clustering_capstone_protocol.py","annotation":"Complete capstone protocol counterpart; same computation, results-only prints (§13).","dependencies":[],"packages":["NumPy","scikit-learn"],"main":true,"proposedUrl":"/learn-code/k-means-hierarchical-clustering/clustering_capstone_protocol.py","url":"/learn-code/k-means-hierarchical-clustering/clustering_capstone_protocol.py"},{"id":"O6-PROJECTED-OUT","path":"programs/clustering_capstone_protocol.stdout.txt","bytes":728,"sha256":"eb990671e2df15a50a3b00d419a238d75e9216c2fd2de31b652f85e6f44be5f0","name":"clustering_capstone_protocol.stdout.txt","annotation":"Projection of the original recorded output with one caution line omitted; no new execution.","dependencies":[],"packages":[],"main":false,"proposedUrl":"/learn-code/k-means-hierarchical-clustering/clustering_capstone_protocol.stdout.txt","url":"/learn-code/k-means-hierarchical-clustering/clustering_capstone_protocol.stdout.txt"},{"path":"practice/clustering_transfer.py","bytes":5465,"sha256":"72f271e1e9c3d91668687e1fdffeb43331125e97e4772349333959d726b18ca0","proposedUrl":"/learn-code/k-means-hierarchical-clustering/clustering_transfer.py","dependencies":["clustering_cf_tree.py","clustering_core.py","clustering_diagnostics.py","clustering_ivf_routing.py","clustering_minibatch.py","clustering_nn_chain.py","clustering_single_mst.py"],"home":"§18 solutions11–18; complete file link after task18 case","name":"clustering_transfer.py","id":"TRANSFER","annotation":"Complete changed-input answer helper; use with the practice solutions.","url":"/learn-code/k-means-hierarchical-clustering/clustering_transfer.py"}];
function FileRegistration({file}) { useCodeDownload({ filename:file.name, language:'text',kind:'asset',downloadUrl:file.url,title:file.annotation }); return null; }
function CompleteFiles() { return <>{completeFiles.filter(file=>file.id!=='TRANSFER').map(file=><FileRegistration key={file.id} file={file}/>)}</>; }
function SectionHeading({id,children}) { return <h2 id={id}>{children}</h2>; }
function Content() { return <KMeansStateProvider><div className="lesson-flow km-lesson"><Prose opening="summary">{"A table of measurements does not arrive with its groups marked. We can ask for a small set of representative measurements, or for a tree that records how smaller groups join. The useful choice depends on what an observation is, what a difference means, and what we intend to do with the result. We will follow those decisions from a single geyser record to complete algorithms, ordinary library use and a separated evaluation."}</Prose>

<Prose opening="prerequisites">{"Begin with arrays, arithmetic means and squared lengths. The local geometry refresher connects to "}<a href={"/learn/path/full-curriculum/k-nearest-neighbors-knn?module=classical-ml#2-make-nearness-an-explicit-choice"}>{"KNN’s explicit distance choice"}</a>{"."}</Prose>

<Prose opening="route">{"The first thirteen sections establish the core: observations, geometry, complete center fitting, trees, diagnostics and evaluation. The stored-image application in section 14 makes the representatives useful. Sections 15–17 continue visibly into batch history, compressed trees, search routing and alternative objectives; return to those branches after the core if you need another sitting. Section 18 provides independent implementation and diagnosis practice. The Learning compass contains the single complete section index."}</Prose>

<Prose opening="exploration">{"The small investigations show their current results immediately. Change one quantity below its drawing, follow the corresponding operands and Reset when you want the original comparison. Complete programs have setup and Copy/Download; short contextual excerpts introduce only the operations explained at that point. The common file index also gives immediate access to every complete source and recorded output. Reading an advanced branch is optional; its explanation remains visible when you return."}</Prose>

<span id="1-decide-what-a-useful-group-means" /><SectionHeading id="1-define-the-observation-and-grouping-task">{"1. Define the observation and grouping task"}</SectionHeading>

<Prose>{"What does one dot represent? In the Old Faithful record, it represents one eruption, described by its duration and the waiting time to the next eruption. Those are two measurements about the same event, both in minutes."}</Prose>

<Mechanism id="D01" />

<Prose>{"Follow row 0: duration 3.6 minutes supplies the horizontal coordinate and waiting 79 minutes supplies the vertical coordinate. Its row ID stays 0 as the two cells become one plotted point. Select another row beneath the picture: both cells and the highlighted point change together. The remaining dots provide context; they are not other coordinates of the selected event. The collection has 272 rows, the "}<code>{"faithful"}</code>{" version distributed with R. Its measurement and version notes distinguish this record from a fuller 299-event record."}</Prose>

<Prose>{"An "}<strong>{"observation"}</strong>{" is the entity that supplies one row. A "}<strong>{"feature"}</strong>{" is one measurement used to describe it. Here an observation is an eruption and the two features are duration and later wait. In another task a row might be a patient, a document or one RGB pixel. State that identity first: grouping patients is a different operation from grouping genes, even if both begin with a matrix."}</Prose>

<Prose>{"The waiting measurement is known in the completed historical record. A visitor asking about the *next* wait cannot supply it before it happens. For now we are describing recorded events. Section 13’s duration-only example will ask the separate question of what can be assigned and assessed at query time."}</Prose>

<Prose>{"To make every operation visible, switch to six constructed rows. Their IDs remain P0 through P5: (1,0), (1.5,.5), (3,2), (3.5,2), (7,5) and (7.5,5.5). These coordinates are small hand-calculation units, not extra geyser measurements."}</Prose>

<Mechanism id="D02" />

<Prose>{"The left panel contains one "}<strong>{"partition"}</strong>{": every row belongs to exactly one of two disjoint groups. The first contains P0–P3 and is represented by the coordinate mean (2.25,1.125); the second contains P4/P5 and has mean (7.25,5.25). The crosses are representatives, named C0 and C1. A representative can lie between observed rows; it does not have to be an existing observation. A cluster ID is a name for a returned group, not a supplied geological or clinical category."}</Prose>

<Prose>{"The right panel is a "}<strong>{"hierarchy"}</strong>{", drawn as a merge tree. Each leaf is one P ID. A parent branch contains all members of its two children. Following a branch upward therefore gives nested groups, ending with the whole collection. The count control highlights a level containing that many active subgroups. At six, all leaves stand separately; at two, the displayed groups are P0–P3 and P4/P5. The flat partition remains beside it so that changing a tree cut does not appear to change the meaning of a representative. Section 9 will derive this particular tree’s scatter-based merge rule."}</Prose>

<Prose>{"A partition answers “which representative does each row use?” A hierarchy also records relationships among resolutions. Both methods return structures even for a cloud of noise. To decide whether a grouping is useful, we need a question beyond the presence of colors or branches: reconstruction, a compact image, search candidates, a reproducible description, or an independently assessed task. The later applications will keep those questions separate."}</Prose>

<Prose>{"The local drawing vocabulary carries identity. Observations have literal row IDs; representatives are crosses with C IDs. Partition membership adds distinct blue-circle, rose-square and violet-triangle marks where those groups exist. A white outline selects an object without changing its group. A new query is an amber outlined diamond. Lines of assignment and dashed residuals have different jobs. Read the labels as well as the hue, especially in views containing more groups than the small palette."}</Prose>

<Prose>{"Unlike KNN’s number of neighboring observations, "}<strong>{"k"}</strong>{" here counts representatives or groups in a declared center fit. We have identified the objects that will be grouped. The next decision is how to compare two of them."}</Prose>

<span id="3-make-the-geometry-match-the-question" /><SectionHeading id="2-make-the-geometry-explicit">{"2. Make the geometry explicit"}</SectionHeading>

<Prose>{"Two row vectors are comparable only after we decide what their coordinate differences mean. Begin with a familiar distance and inspect every contribution."}</Prose>

<Mechanism id="D03" />

<Prose>{"From (0,0) to (3,4), the horizontal difference is 3 and the vertical difference is 4. Squaring produces 9 and 16; their sum is 25. Taking the square root gives the length 5. Negative coordinate differences have the same squared contribution, and coincident points give zero. Move either coordinate below the drawing and watch the triangle, square contributions, total and root change together."}</Prose>

<Prose>{"For d coordinates, Euclidean length is"}</Prose>

<div className="neural-equation"><MathBlock>{"  d(x,z)=\\sqrt{\\sum_{r=1}^{d}(x_r-z_r)^2}."}</MathBlock></div>

<Prose>{"The subscript r selects a feature, not a row. The difference has the coordinate’s units; its square has squared units. When the coordinates have the same physical unit and the axes use the same scale, the right triangle represents that literal length. A plotted angle under stretched axes cannot certify a distance claim."}</Prose>

<Prose>{"Squared length is especially useful for accumulating an error, but it has a different mathematical property from ordinary length."}</Prose>

<Mechanism id="D04" />

<Prose>{"The three collinear locations 0,1,2 have lengths 1,1,2. Going directly from 0 to 2 is no longer than going through 1: 2≤1+1. Their squared contributions are 1,1,4, and 4>1+1. Move the middle location and compare the two rows of the picture. Ordinary Euclidean distance is a "}<strong>{"metric"}</strong>{": it is nonnegative, symmetric, zero only for identical vectors, and obeys the triangle inequality. Its square does not obey that last condition. Section 6’s distance-skipping argument will use ordinary lengths; the fitting objective will use their squares."}</Prose>

<Prose>{"Choosing a coordinate scale also chooses how much that feature contributes. Suppose one feature is measured in meters, then expressed in decimeters. Its coordinate differences grow tenfold and its squared differences grow a hundredfold. That can change which grouping has the smaller error even though no physical measurement changed."}</Prose>

<Mechanism id="D05" />

<Prose>{"This constructed rectangle has R0=(0,0), R1=(0,1), R2=(3,0), R3=(3,1). Grouping the left and right columns gives means (0,.5) and (3,.5), with four squared residuals of .25: total error 1. Grouping the top and bottom rows gives means (1.5,0) and (1.5,1), with four residuals of 2.25: total 9. The table lists all seven nonempty two-group splits, not merely whichever answer one initial fit finds."}</Prose>

<Prose>{"Change the second-coordinate unit multiplier u from 1 to 10 while its feature weight w remains 1. The transformed rectangle is 3 by 10. Left/right now costs 100 and top/bottom costs 9, so the better split changes. Set w=.01: multiplying the second coordinate by u√w=10√.01=1 restores the original geometry and error 1. The unit and weight controls preserve these two distinct decisions. Reset brings back (u,w)=(1,1)."}</Prose>

<Prose>{"For nonnegative feature weights v_r, the squared contribution is"}</Prose>

<div className="neural-equation"><MathBlock>{"  d_v(x,z)^2=\\sum_r v_r(x_r-z_r)^2\n             =\\|\\sqrt v\\odot x-\\sqrt v\\odot z\\|^2."}</MathBlock></div>

<Prose>{"Here ⊙ multiplies matching coordinates. If a coordinate is multiplied by a, divide its old weight by a² to preserve its contribution. Choosing a *different* weight changes the question instead. With a zero feature weight, distinct vectors can have zero distance in that geometry, so the ordinary root is a pseudometric rather than a metric on the original vectors. A feature weight is also different from an observation weight, which will change a row’s contribution in section 4."}</Prose>

<Prose>{"The complete unit-conversion program uses a separate rectangle, (0,0), (0,10), (2,0), (2,10), and converts its first coordinate by 100. These are its exact pure input and multiplication slices. They demonstrate the same squared-multiplier rule without introducing a fitting call before assignment is taught."}</Prose>

<H3>{"Run the examples locally"}</H3>

<Prose>{"Use Python 3.12 and place the chosen complete program, its named dependencies and "}<code>{"clustering_requirements.txt"}</code>{" in one directory. The common file index links those files even before their full teaching homes. Create an environment and install the named package snapshot:"}</Prose>

<CodeBlock language="shell">{"python -m venv .venv"}</CodeBlock>

<Prose>{"Activate it with "}<code>{".venv\\Scripts\\activate"}</code>{" on Windows, or "}<code>{"source .venv/bin/activate"}</code>{" in a Unix shell, then run:"}</Prose>

<CodeBlock language="shell">{"python -m pip install -r clustering_requirements.txt"}</CodeBlock>

<span id="full-program-requirements" />

<Prose>{"Complete file: "}<code>{"clustering_requirements.txt"}</code>{"."}</Prose>

<RemoteCodeBlock filename="clustering_requirements.txt" source="/learn-code/k-means-hierarchical-clustering/clustering_requirements.txt" language="text" title="Named tested NumPy/SciPy/scikit-learn snapshot." />

<Prose>{"Each complete main states its run command when its operations have been taught. The shared arithmetic and palette decoder are imported definitions. The CSV workflow in section 13 has a separate explicit command and supplied input. Faiss is optional only for the ordinary search route in section 17; the other examples do not import it."}</Prose>

<Prose>{"Contextual excerpt from "}<code>{"clustering_scaling.py"}</code>{"."}</Prose>

<CodeBlock language="python" filename="clustering_scaling.py">{"rectangle = np.array([[0.0, 0.0], [0.0, 10.0], [2.0, 0.0], [2.0, 10.0]])"}</CodeBlock>

<Prose>{"Contextual excerpt from "}<code>{"clustering_scaling.py"}</code>{"."}</Prose>

<CodeBlock language="python" filename="clustering_scaling.py">{"converted = rectangle * [100.0, 1.0]"}</CodeBlock>

<Prose>{"Numbers that encode categories need another check. Codes 0,1,2 for red, green, blue do not establish that blue is twice as far from red as green is. Choose a representation whose differences serve the task. For a numerical vector, equal variance scaling is one useful choice; it remains a choice about similarity."}</Prose>

<Mechanism id="D06" />

<Prose>{"The three constructed training rows (2,10), (4,20), (9,31) give means 5 and 61/3. The first-coordinate population variance is (9+1+16)/3=26/3. The second is [(−31/3)²+(−1/3)²+(32/3)²]/3=662/9. The reduction ports in the picture produce one mean and one positive standard deviation per column. Those cells are the learned transform’s state."}</Prose>

<Prose>{"A new query q receives those fixed cells:"}</Prose>

<div className="neural-equation"><MathBlock>{"  z_r(q)=\\frac{q_r-m_r}{s_r}."}</MathBlock></div>

<Prose>{"The query controls move q; they do not add q to the training reductions. With q=(5,20), the first standardized coordinate is 0 and the second is −1/√662. An off-range query is still transformed using the same m and s. In ordinary "}<code>{"StandardScaler"}</code>{", population variance uses divisor n. For a constant training column, the scale is 1: its training rows transform to zero, while a future different value can transform to a nonzero difference. Missing data is a separate input issue; it is not a zero-variance column."}</Prose>

<Prose>{"The original program’s temperature/vibration example has six training rows, not these three. Their means happen to agree, but their variances and fitted systems do not thereby agree. Section 7 will teach that program’s complete Pipeline operations on the actual six rows. For now the picture establishes the boundary: training learns the transform, and a query passes through it."}</Prose>

<Prose>{"We can now compare rows under a stated geometry. Next we give the representative selection and mean movement different, visible operations."}</Prose>

<span id="2-let-points-choose-representatives" /><SectionHeading id="3-assign-points-and-move-centers">{"3. Assign points and move centers"}</SectionHeading>

<Prose>{"We have a distance rule but no assignment rule yet. Start with two actual representative rows, P0=(1,0) and P4=(7,5), and let each observation compare both."}</Prose>

<Mechanism id="D07" />

<Prose>{"For P2=(3,2), the squared distances are (3−1)²+(2−0)²=8 and (3−7)²+(2−5)²=25. The smaller value selects C0. This "}<strong>{"assignment"}</strong>{" gives P0–P3 to C0 and P4/P5 to C1. Inspect another row and its two distance cells before reading its arrow. The complete contributions are 0,.5,8,10.25,0,.5, totaling 19.25. An exact tie goes to the lower center index; two coincident starting centers are permitted and can leave one unused."}</Prose>

<Prose>{"With centers μ_0,…,μ_(k−1), row i chooses"}</Prose>

<div className="neural-equation"><MathBlock>{"  a_i=\\operatorname*{argmin}_{0\\le j<k}\\|x_i-\\mu_j\\|^2."}</MathBlock></div>

<Prose>{"The expression "}<code>{"argmin"}</code>{" returns the index of the smallest entry, not the entry’s value. a_i names a returned group. Its distance is an error contribution in this geometry, not a calibrated probability that the row has a human category. The contextual source validates the matrix and constructs the direct differences:"}</Prose>

<Prose>{"Contextual excerpt from "}<code>{"clustering_lloyd.py"}</code>{"."}</Prose>

<CodeBlock language="python" filename="clustering_lloyd.py">{"def check_points(values):\n    # Accept a nonempty finite numeric row-by-feature matrix.\n    points = np.asarray(values, dtype=float)\n    if points.ndim != 2 or 0 in points.shape or not np.isfinite(points).all():\n        raise ValueError(\"Use a nonempty finite numeric row-by-feature matrix.\")\n    return points\n\n\ndef squared_distances(points, centers):\n    # Return the n × k matrix of squared Euclidean distances.\n    return ((points[:, None, :] - centers[None, :, :]) ** 2).sum(axis=2)"}</CodeBlock>

<Prose>{"We selected the first centers deliberately to inspect one route. Other choices can take another route through the same objective."}</Prose>

<Mechanism id="D08" />

<Prose>{"Use the two row selectors to choose initial crosses. Switching between the six points and the four-point rectangle changes the row domain and the displayed seed coordinates together. Selecting the same row twice leaves both crosses coincident. A selected starting state is not a probability sample; section 5 will introduce an actual sampling rule. The next drawing consumes exactly these fixture and seed IDs."}</Prose>

<Mechanism id="D08-phase" />

<Prose>{"Keep the assignment arrows fixed while moving the crosses. P0–P3 sum to (9,4.5), so their coordinate mean is (9/4,4.5/4)=(2.25,1.125). P4/P5 sum to (14.5,10.5), giving (7.25,5.25). The crosses move to those values; the colors still name the old groups at this phase. The first group’s fixed-label squared error becomes 7.4375 and the second’s .25, totaling 7.6875."}</Prose>

<Prose>{"Only the "}<strong>{"next assignment"}</strong>{" asks which of the *new* crosses each row chooses. Here it preserves all memberships, so another mean update leaves the crosses unchanged. The phase control moves through assignment, held-label mean movement and reassignment, with previous/next navigation and Reset. Read its live sentence: did an arrow change, did a cross move, or has the returned state become fixed? Moving centers and reassigning rows are two different operations even when the default labels happen to remain the same."}</Prose>

<Prose>{"Alternating these operations is "}<strong>{"Lloyd’s algorithm"}</strong>{", the usual iterative center-fitting route called "}<strong>{"k-means"}</strong>{". We still need to explain why those means are the appropriate updates and when a return is finished. Before deriving them, inspect a case where finishing does not select the best answer."}</Prose>

<Mechanism id="D09" />

<Prose>{"On the 3-by-1 rectangle, starting at R0/R1 reaches the top/bottom representatives (1.5,0),(1.5,1), error 9. Starting at R0/R2 reaches left/right representatives (0,.5),(3,.5), error 1. Both are fixed: each row remains nearest its assigned mean. We already saw all seven splits in the geometry table, so error 1 is the better solution for this particular example. “No assignment changed” establishes a state of the algorithm, not a universal optimality guarantee."}</Prose>

<Prose>{"A mean need not be an observed row. In one dimension, rows 1,2,9 have mean 4, which no row supplies. If the task requires returning an existing image or document as an exemplar, that constraint calls for a different representative. Section 17 returns to that choice. For the unrestricted mean, we will now open the squared-error objective and derive the update instead of trusting its name."}</Prose>

<span id="4-derive-the-updates-and-choose-the-seeds" /><SectionHeading id="4-derive-the-objective-and-weighted-means">{"4. Which representative minimizes the error?"}</SectionHeading>

<Prose>{"The assignment step asked each row to choose a center. The update step now asks one center to serve a fixed group. Keeping these two questions separate lets us prove what each operation improves. Begin with the six rows' moved centers, before changing any membership."}</Prose>

<Mechanism id="D10" />

<Prose>{"The six squared residuals are 2.828125, .953125, 1.328125, 2.328125, .125 and .125. The first four feed the C0 subtotal 7.4375; the last two feed C1's .25. Their sum is 7.6875. A selected row's line joins that row to its assigned center, and its square feeds exactly one subtotal. Across-group pair distances have no port in this sum. Moving back to the initial-center phase restores the earlier 19.25. The coordinates have length units; each contribution has squared units."}</Prose>

<Prose>{"Let xᵢ be row i, zᵢ its group ID and μⱼ center j. The "}<strong>{"within-group sum of squared errors"}</strong>{", abbreviated SSE, is"}</Prose>

<div className="neural-equation"><MathBlock>{"J(z,\\mu)=\\sum_{i=1}^{n}\\lVert x_i-\\mu_{z_i}\\rVert_2^2."}</MathBlock></div>

<Prose>{"This single objective connects the picture's row, line, square, subtotal and total. For fixed centers, choosing a nearest center minimizes each row's term independently. For fixed groups, each center appears only in its own subtotal. We can therefore solve its representative problem independently too."}</Prose>

<Mechanism id="D11" />

<Prose>{"Rows 0,2,4 have mean 2. At a proposed representative c=3, their squared residuals are 9,1,1: total 11. The deviations from the mean are −2,0,2: squared sum 8 and signed sum zero. Shifting the representative one unit from 2 to 3 adds three copies of that squared shift, so 8+3×1²=11. The center control moves c while preserving those three members. At c=2, the extra term disappears."}</Prose>

<Prose>{"For a fixed nonempty group S, write its mean as x̄ and expand each residual:"}</Prose>

<div className="neural-equation"><MathBlock>{"\\begin{aligned}\n\\sum_{i\\in S}\\|x_i-c\\|^2\n&=\\sum_{i\\in S}\\|(x_i-\\bar x)+(\\bar x-c)\\|^2\\\\\n&=\\sum_{i\\in S}\\|x_i-\\bar x\\|^2\n +2(\\bar x-c)^\\top\\sum_{i\\in S}(x_i-\\bar x)\n +|S|\\|\\bar x-c\\|^2\\\\\n&=\\sum_{i\\in S}\\|x_i-\\bar x\\|^2+|S|\\|\\bar x-c\\|^2.\n\\end{aligned}"}</MathBlock></div>

<Prose>{"The middle term vanishes because deviations from a mean sum to zero. The final term is nonnegative and becomes zero exactly at c=x̄. Thus the mean is the unique unconstrained minimizer for a nonempty group in ordinary Euclidean coordinates. This identity also explains how much a changed representative costs. In the three-row example it is 8+3(c−2)², not an unexplained black-box optimization."}</Prose>

<Prose>{"Deeper: differentiating the same fixed-group sum gives ∇c J=2|S|c−2∑ᵢ∈S xᵢ and Hessian 2|S|I. Setting the gradient to zero gives the mean; the positive-definite Hessian confirms uniqueness. The algebraic identity already proved the result without requiring calculus. If a representative must be an observed row, or if the objective uses unsquared length, this derivation changes. Section 17 opens those alternatives at the point where they matter."}</Prose>

<H3>{"Row weights express how much a row counts"}</H3>

<Prose>{"Repeated observations can be stored compactly. Their coordinates stay fixed; their multiplicities change the objective."}</Prose>

<Mechanism id="D12" />

<Prose>{"The row at 0 has mass 3 and the row at 6 has mass 2. They represent the literal five-row list 0,0,0,6,6. Total mass is 5, weighted coordinate sum is 12, and the mean is 12/5=2.4. Its weighted error is 3(0−2.4)² + 2(6−2.4)² = 17.28 + 25.92 = 43.2. Increasing the second row's mass moves the center toward 6; setting it to zero gives center 0 and error zero. The picture uses mass badges and repeated row slots, so a heavier row never acquires a different coordinate merely because it counts more."}</Prose>

<Prose>{"For nonnegative masses wᵢ with positive group total W, define"}</Prose>

<div className="neural-equation"><MathBlock>{"\\bar x_w=\\frac{\\sum_{i\\in S}w_ix_i}{W},\\qquad\n\\sum_{i\\in S}w_i\\|x_i-c\\|^2\n=\\sum_{i\\in S}w_i\\|x_i-\\bar x_w\\|^2+W\\|\\bar x_w-c\\|^2."}</MathBlock></div>

<Prose>{"The same vanished-cross-term proof works because ∑wᵢ(xᵢ−x̄w)=0. Integer masses therefore agree with literal replication when the initial centers and update/tie rules agree. Noninteger nonnegative masses extend that objective directly. A zero-total group has no mean specified by this formula: every center has zero weighted cost. Our scratch route retains its previous center for that state. Negative masses would remove the nonnegative objective argument and are rejected."}</Prose>

<Prose>{"The reusable "}<code>{"weighted_centers"}</code>{" function implements this update without making an n-by-k membership matrix. Its first pass accumulates mass and chooses an anchor from a positive-mass member. Its second pass adds normalized weighted deviations from that anchor in row blocks. This is the same mean, written as anchor+∑(wᵢ/W)(xᵢ−anchor) to reduce the risk of summing very large absolute coordinates. A group with no positive mass keeps the supplied previous center."}</Prose>

<Prose>{"Contextual excerpt from "}<code>{"clustering_core.py"}</code>{"."}</Prose>

<CodeBlock language="python" filename="clustering_core.py">{"def weighted_centers(points, labels, weights, previous, block_size=256):\n    \"\"\"Blockwise shifted means; zero-mass groups retain the previous center.\n\n    An anchor row avoids summing large absolute coordinates. Dividing each\n    contribution by total group mass avoids a potentially overflowing sum w*x.\n    \"\"\"\n    result = previous.copy()\n    masses = np.zeros(len(previous))\n    anchors = previous.copy()\n    initialized = np.zeros(len(previous), dtype=bool)\n    offsets = np.zeros_like(previous)\n    for start in range(0, len(points), block_size):\n        stop = min(start + block_size, len(points))\n        local_labels = labels[start:stop]\n        local_weights = weights[start:stop]\n        masses += np.bincount(local_labels, weights=local_weights, minlength=len(previous))\n        for group in np.unique(local_labels):\n            members = (local_labels == group) & (local_weights > 0)\n            if members.any() and not initialized[group]:\n                anchors[group] = points[start:stop][members][0]\n                initialized[group] = True\n    for start in range(0, len(points), block_size):\n        stop = min(start + block_size, len(points))\n        for group in np.unique(labels[start:stop]):\n            members = (labels[start:stop] == group) & (weights[start:stop] > 0)\n            if not members.any():\n                continue\n            with np.errstate(over=\"raise\", invalid=\"raise\"):\n                try:\n                    contribution = points[start:stop][members] - anchors[group]\n                    contribution *= (weights[start:stop][members] / masses[group])[:, None]\n                    offsets[group] += contribution.sum(axis=0)\n                except FloatingPointError as error:\n                    raise ValueError(\"Weighted mean exceeds float64 range; rescale input.\") from error\n    occupied = masses > 0\n    result[occupied] = anchors[occupied] + offsets[occupied]\n    if not np.isfinite(result).all():\n        raise ValueError(\"Weighted center is not representable; rescale input.\")\n    return result, masses"}</CodeBlock>

<Prose>{"Row weights and feature weights have separate roles. A row weight multiplies that row's contribution to every proposed center. A feature weight changes a coordinate ruler, as in section 2. With fixed nonnegative feature weights, positive-weight coordinates still use the weighted row mean; a zero feature weight makes that coordinate irrelevant to the objective, so its minimizing coordinate is not unique. The displayed general implementation uses ordinary coordinates; a feature-weighted route first transforms positive-weight coordinates by their square-root weights. In scikit-learn, "}<code>{"sample_weight"}</code>{" supplies row masses to "}<code>{"fit"}</code>{"; it is not a per-feature metric parameter."}</Prose>

<H3>{"Pair distances encode the same scatter only with the right divisor"}</H3>

<Prose>{"We can describe a group's spread using internal pairs instead of distances to the mean. This is useful when comparing formulations and later linkage costs. The denominator is part of the identity."}</Prose>

<Mechanism id="D13" />

<Prose>{"For 0,2,4, the three unordered squared pair distances are 4,16,4, summing to 24. Dividing by the three members gives the same SSE, 8. The full ordered matrix contains both directions of each pair, sums to 48, and requires division by 2×3. Diagonal pairs contribute zero. With only 0,2, the unordered pair sum is 4, the divisor is 2 and SSE is 2."}</Prose>

<Prose>{"For an unweighted nonempty group of size m,"}</Prose>

<div className="neural-equation"><MathBlock>{"\\sum_{i\\in S}\\|x_i-\\bar x\\|^2\n=\\frac{1}{m}\\sum_{i<j,\\ i,j\\in S}\\|x_i-x_j\\|^2\n=\\frac{1}{2m}\\sum_{i,j\\in S}\\|x_i-x_j\\|^2."}</MathBlock></div>

<Prose>{"Expanding the ordered sum gives 2m∑‖xᵢ‖²−2‖∑xᵢ‖²; dividing by 2m recovers ∑‖xᵢ‖²−m‖x̄‖². An unnormalized pair sum changes the relative contribution of groups of different sizes. Always identify whether the pairs are ordered, unordered, squared or unsquared before comparing an implementation's W or J."}</Prose>

<Prose>{"Deeper: the easy mean update solves a conditional problem, with memberships already chosen. Jointly choosing memberships is a different search problem. The global Euclidean SSE problem is NP-hard in documented settings including k=2 with growing dimension and points in the plane with growing k; neither says every fixed-dimensional, fixed-k instance has the same complexity. The number of candidate partitions makes exhaustive search impractical at scale, while Lloyd's two conditional operations provide a useful local procedure. Section 6 will distinguish finite stopping from a polynomial iteration guarantee. We first need to decide where that procedure starts."}</Prose>

<SectionHeading id="5-choose-seeds-with-a-declared-random-rule">{"5. Choose and interpret an initialization"}</SectionHeading>

<Prose>{"The rectangle gave two finished answers. Instead of always starting with nearby rows, we can deliberately spread the initial representatives. A random procedure needs a declared distribution, an actual draw and a rule for what happens after each accepted row. We will open those operations before asking a library to initialize for us."}</Prose>

<Mechanism id="D14" />

<Prose>{"Choose P0 as the first center. Each row's D² is its squared distance to its nearest already-chosen center. The entries for P0–P5 are 0,.5,8,10.25,61,72.5, totaling 152.25. Dividing each by the total gives candidate probabilities. Lay those probabilities end to end in a cumulative strip. A uniform draw u=.5 lands in P4's interval, so this draw selects P4 even though P5 is farther away. The row hue travels from the dot through its D² cell into its probability interval; selection adds an outline."}</Prose>

<Prose>{""}<strong>{"k-means++"}</strong>{" first chooses one input row uniformly, then repeatedly samples a row with probability proportional to its nearest-selected-center squared distance. For an unweighted collection, the conditional probability is"}</Prose>

<div className="neural-equation"><MathBlock>{"\\Pr(i\\mid C)=\\frac{D_i^2}{\\sum_r D_r^2},\\qquad\nD_i^2=\\min_{c\\in C}\\|x_i-c\\|^2."}</MathBlock></div>

<Prose>{"The first-row control lets us inspect a conditional distribution; it is not a claim that every run must start at P0. The draw control chooses a position in the same distribution. Half-open intervals give an exact boundary to the interval on its right. A zero-width interval cannot acquire probability by rounding its printed endpoints."}</Prose>

<Mechanism id="D15" />

<Prose>{"Accepting P4 changes every row's nearest-selected-center calculation. The total falls from 152.25 to 19.25: entries become 0,.5,8,10.25,0,.5. P4 now has distance zero to itself; P5 changes from 72.5 to .5 because it is near P4. Accept and Undo transport the seed sequence so that both the edges and the probability strip show the current seed set. We have not moved a center or performed a Lloyd update during this process."}</Prose>

<Prose>{"For identical rows, the first selected coordinate already represents every row and total D² is zero. No positive-probability next draw exists. The live picture shows that state directly. A complete program asked to return k seed indices still needs a convention: our implementation chooses the lowest unused row index when the remaining potential is zero. Several indices can therefore refer to the same coordinate, and the subsequent fit may have fewer occupied groups. That index-completion policy is separate from the positive D² sampling rule."}</Prose>

<Prose>{""}<code>{"weighted_d2"}</code>{" implements the procedure for the nonnegative row masses taught in section 4. Its first draw uses mass proportions; later draws use wᵢDᵢ². "}<code>{"assign_chunked"}</code>{" supplies nearest distances without a full row-by-center-by- feature array. The random generator is passed a seed so the complete program has a repeatable input stream. The retained unweighted initializer below shows the same nearest-distance update with uniform first-row sampling."}</Prose>

<Prose>{"Contextual excerpt from "}<code>{"clustering_lloyd.py"}</code>{"."}</Prose>

<CodeBlock language="python" filename="clustering_lloyd.py">{"def d2_seed(points, k, seed=0):\n    # Vanilla k-means++: a uniform first row, then D²-proportional draws.\n    points = check_points(points)\n    rng = np.random.default_rng(seed)\n    chosen = [int(rng.integers(len(points)))]\n    while len(chosen) < k:\n        nearest = squared_distances(points, points[chosen]).min(axis=1)\n        if nearest.max() == 0:  # every distinct location is already a center\n            chosen.append(next(i for i in range(len(points)) if i not in chosen))\n        else:\n            chosen.append(int(rng.choice(len(points), p=nearest / nearest.sum())))\n    return points[chosen].copy(), chosen"}</CodeBlock>

<Prose>{"Contextual excerpt from "}<code>{"clustering_core.py"}</code>{"."}</Prose>

<CodeBlock language="python" filename="clustering_core.py">{"def weighted_d2(points, weights, k, seed):\n    \"\"\"Vanilla mass-weighted first draw and mass-times-D² later draws.\n\n    A zero potential means all positive-mass rows are already represented. To\n    return exactly k centers, append the lowest unused row ID, even a zero-mass\n    row; this is a declared shape fallback, not a probability draw.\n    \"\"\"\n    if not isinstance(k, (int, np.integer)) or not 1 <= k <= len(points):\n        raise ValueError(\"k must be an integer between one and the row count.\")\n    rng = np.random.default_rng(seed)\n    first = int(rng.choice(len(points), p=weights / weights.sum()))\n    chosen = [first]\n    _, nearest = assign_chunked(points, points[[first]])\n    while len(chosen) < k:\n        potential = weights * nearest\n        total = potential.sum()\n        if not np.isfinite(total):\n            raise ValueError(\"Seeding potential exceeds float64 range.\")\n        if total == 0:\n            row_id = next(i for i in range(len(points)) if i not in chosen)\n        else:\n            row_id = int(rng.choice(len(points), p=potential / total))\n        chosen.append(row_id)\n        _, candidate = assign_chunked(points, points[[row_id]])\n        nearest = np.minimum(nearest, candidate)\n    return points[chosen].copy(), chosen"}</CodeBlock>

<H3>{"A greedy trial adds an operation"}</H3>

<Prose>{"An implementation can improve its starts by trying several candidate draws and choosing the one that reduces the current potential most. Open the extra work rather than treating all initializers named “++” as identical."}</Prose>

<Mechanism id="D16" />

<Prose>{"With P0 already selected, compare supplied trial candidates P2 and P4. For each candidate independently, replace every row's current D² with the minimum of that value and its squared distance to the candidate, then sum the new values. The P4 trial gives potential 19.25. P2 gives potential 58.25, shown row by row; the smaller trial wins. Trying the same candidate twice gives equal potentials, resolved here by first trial order. These are candidate trials over explicit coordinates, before any center fitting."}</Prose>

<Prose>{"The original vanilla k-means++ result bounds the "}<strong>{"expected initialization potential"}</strong>{" by 8(ln k+2) times the globally optimal k-center SSE, under its stated Euclidean setting. Expectation averages the random procedure; it is not the error guarantee of each draw or a promise that the returned local fit is globally optimal. Lloyd updates then cannot increase that starting potential under the conditional rules already derived. Scikit-learn's "}<code>{"k-means++"}</code>{" uses greedy local trials, so its practical initializer is not byte-for-byte the vanilla single-trial random algorithm. Declare "}<code>{"n_init"}</code>{" separately: it counts complete starts, not local candidate trials within one start."}</Prose>

<Prose>{"Deeper: k-means|| addresses initialization when repeated sequential scans are expensive. In one oversampling round, each row receives an independent inclusion probability min(1,ℓDᵢ²/φ), where φ is the current total potential. With ℓ=2, the six P rows use the same 152.25 denominator. Supplying thresholds [.2,.5,.05,.8,.9,.1] produces an inspectable operation witness: P2 and P5 pass, joining the retained P0. This is a drawn calculation, not a sampled benchmark."}</Prose>

<Prose>{"Assigning all six rows to their nearest member of this enlarged candidate set gives candidate masses [2,2,2]: P0 represents P0/P1, P2 represents P2/P3 and P5 represents P4/P5. Another round must recompute the D² values and φ from those candidates. Final weighted reclustering reduces the enlarged set to k representatives. Independent Bernoulli inclusions produce a random candidate count, whereas a fixed-count categorical draw chooses a fixed number of trials. The cap at one keeps an inclusion probability valid. The original paper's rounds and final weighted reduction are part of its approximation analysis; this local sketch establishes those operations, while a distributed execution belongs to a full distributed system."}</Prose>

<Mechanism id="D17" />

<Prose>{"The exact probability strip and the recorded 200-draw frequencies now appear side by side for the selected seed sequence. The count uses the displayed conditional seed set, draw count 200 and teaching generator seed 1. A row's frequency can differ from its exact probability because a finite sample is a random estimate. The uniform-over-unused-row marker is a third, different distribution. Selecting a row highlights all three meanings without turning the count into another initialization policy. With no positive D² total, the probability/frequency comparison is unavailable."}</Prose>

<Prose>{"Spread starts are useful, but we still need a complete fit with an honest return state and manageable arrays. The next section connects the initializer to the loop, its stopping rule and two efficient implementations."}</Prose>

<span id="5-implement-a-complete-fit-with-an-honest-stopping-rule" /><SectionHeading id="6-finish-and-accelerate-a-complete-fit">{"6. Finish the fit and account for its work"}</SectionHeading>

<Prose>{"A complete loop must return labels that belong to the returned centers, report why it stopped and handle a center with no members. An error curve alone cannot answer those questions. Start with the operation sequence we already traced."}</Prose>

<Mechanism id="D18" />

<Prose>{"Assignments feed group means; the moved means feed a fresh assignment pass. For our six rows, that pass preserves 000011, so the means and memberships agree at a fixed point. The diagram marks that state separately from an update budget and a movement tolerance. A decreasing numeric sequence such as 1,1/2,1/4,… approaches zero without ever reaching it in finitely many steps. Thus “nonincreasing and bounded below” explains convergence of objective values, but by itself does not prove finite completion of the algorithm."}</Prose>

<Prose>{"Under exact arithmetic, deterministic nearest-center ties and the stated empty-center policy, the loop has a stronger argument. Each occupied center is the mean of some subset of the finite input; an empty one retains a previous center, including possibly an initial center. There are finitely many such center states. A change to an occupied group's mean strictly reduces its fixed-membership error, by section 4's identity. Nearest-center reassignment cannot increase it. If no center changes, the deterministic assignment pass returns the same labels and the state is fixed. A strictly improving step cannot revisit a previous objective/state. This gives finite stopping in the exact model, without a small bound on how many steps are needed."}</Prose>

<Prose>{"Deeper: specially constructed inputs can make Lloyd's number of iterations exponential even in the plane. Smoothed analyses study a different question: how randomly perturbed inputs affect expected work, under declared perturbation assumptions. Neither result is a timing measurement of our small fixture. A floating-point program therefore also declares a maximum update count and may offer a tolerance. Those practical stops need their own names."}</Prose>

<Mechanism id="D19" />

<Prose>{"With four identical zeros and three identical initial centers, all rows choose C0 under the lower-index tie rule. C1 and C2 have no members and keep their old centers. The requested k is three, while the number of occupied groups is one. The distinct budget example has rows 0,2,3,9 and initial centers 0,3. Its initial labels are 0111; one mean update returns centers 0 and 14/3. A final nearest- center pass gives 0011. The second returned center is still 14/3, whereas its new members 3,9 have mean 6: this is a budget return, not a fixed point."}</Prose>

<Prose>{"Our return contract always supplies labels nearest to the returned centers. It separately reports "}<code>{"fixed_point"}</code>{" and "}<code>{"stop_reason"}</code>{". A trace's labels before reassignment are intermediate labels, not a promise about the final return. Scikit-learn's empty-cluster relocation is a different update policy from retention; duplicates can still prevent k distinct occupied groups. Match the policy when comparing mechanisms rather than assuming every empty-state path is identical."}</Prose>

<H3>{"Bound the temporary arrays"}</H3>

<Prose>{"Every assignment needs to compare n rows with k centers in d coordinates. We can perform those comparisons without storing every coordinate difference at once."}</Prose>

<Mechanism id="D20" />

<Prose>{"The row matrix is n-by-d and the centers are k-by-d. Taking B rows at a time, we subtract one center to make a B-by-d workspace, reduce it to B squared distances and update B best-distance and best-index cells. Center IDs are visited in order; a strict "}<code>{"<"}</code>{" replacement preserves the first ID on an exact tie. The next center reuses the workspace. Only after all centers are visited do we advance to the next row block."}</Prose>

<Prose>{"The assignment arithmetic remains O(nkd). Temporary storage is O(Bd+B), beyond the input, center and n-row output arrays. A fully broadcast n-by-k-by-d difference tensor instead stores O(nkd) values. Requesting an n-by-k matrix of all-center distances is another legitimate output, with its own storage cost. For 30,000 rows, an ordinary float64 n-by-n pair matrix alone occupies 30,000²×8 bytes, about 6.706 GiB; the center assignment route does not require that matrix. Array shapes explain resource requirements more reliably than an unmeasured speed label."}</Prose>

<Prose>{"The following pure dependency supplies validation, direct squared distances, chunked assignment, stable weighted means, D² initialization and same-partition comparison. "}<code>{"points_array"}</code>{" rejects nonfinite data; "}<code>{"weights_array"}</code>{" requires a positive finite total mass. Coordinate subtraction avoids the large cancellation possible in ‖x‖²+‖c‖²−2xᵀc. Differences and their squares must still fit float64. Centering and a common positive coordinate scale can reduce numerical range; an intentional unequal feature scale also changes the geometry and must be declared as such."}</Prose>

<span id="full-program-core" />

<Prose>{"Complete file: "}<code>{"clustering_core.py"}</code>{"."}</Prose>

<RemoteCodeBlock filename="clustering_core.py" source="/learn-code/k-means-hierarchical-clustering/clustering_core.py" language="python" title="Pure shared arithmetic dependency; import performs no demonstration (§6)." />

<Prose>{"The complete Lloyd program calls that dependency. "}<code>{"initial"}</code>{" means actual center coordinates; if omitted, "}<code>{"weighted_d2"}</code>{" produces them. Each update saves incoming labels, computes means for those labels, then assigns again to the new centers. The trace records error before moving, error with fixed labels after moving and error after reassignment. "}<code>{"fixed_point"}</code>{" compares the two label arrays. A budget or movement-tolerance stop still runs the fresh assignment pass before returning."}</Prose>

<span id="full-program-n1" />

<Prose>{"Complete file: "}<code>{"clustering_chunked_lloyd.py"}</code>{". Run with "}<code>{"python clustering_chunked_lloyd.py"}</code>{" after the shared setup in section 2."}</Prose>

<RemoteCodeBlock filename="clustering_chunked_lloyd.py" source="/learn-code/k-means-hierarchical-clustering/clustering_chunked_lloyd.py" language="python" title="Chunked weighted Lloyd with fresh returned labels and trace (§6)." />

<span id="recorded-output-n1" />

<Prose>{"Recorded output: "}<code>{"clustering_chunked_lloyd.stdout.txt"}</code>{"."}</Prose>

<RemoteCodeBlock filename="clustering_chunked_lloyd.stdout.txt" source="/learn-code/k-means-hierarchical-clustering/clustering_chunked_lloyd.stdout.txt" language="output" title="Complete recorded output for the same-name worked program." />

<Prose>{"The program's separate five-row weighted example has rows 0,1,3,8,9 with masses 1,2,1,1,3 and starts 0,9. It returns centers 1.25/8.75, labels 00011 and SSE 5.5 after one fixed-point update. The explicit ordinary KMeans route uses the same coordinates, masses and initial centers, with "}<code>{"n_init=1"}</code>{", "}<code>{"algorithm=\"lloyd\""}</code>{" and "}<code>{"tol=0"}</code>{". Literal integer replication gives the same weighted SSE. These are controlled checks of the update, alongside the distinct six-row picture."}</Prose>

<Prose>{"The retained original Lloyd source uses its original unweighted arrays and update convention. Its update excerpt is useful for seeing the loop without changing that program's experiment."}</Prose>

<Prose>{"Contextual excerpt from "}<code>{"clustering_lloyd.py"}</code>{"."}</Prose>

<CodeBlock language="python" filename="clustering_lloyd.py">{"def lloyd(points, k=3, seed=0, max_iter=100, initial=None):\n    points = check_points(points)\n    if type(max_iter) is not int or max_iter < 1:\n        raise ValueError(\"Use a positive integer iteration budget.\")\n    if type(k) is not int or not 1 <= k <= len(points):\n        raise ValueError(\"Choose an integer k between 1 and the number of rows.\")\n    if initial is None:\n        centers, seed_rows = d2_seed(points, k, seed)\n    else:\n        centers, seed_rows = check_points(initial).copy(), None\n        if centers.shape != (k, points.shape[1]):\n            raise ValueError(\"Initial centers must have shape (k, number of features).\")\n    history = []\n    for iteration in range(1, max_iter + 1):\n        distances = squared_distances(points, centers)\n        labels_for_means = distances.argmin(axis=1)  # lowest index wins an exact tie\n        before = float(distances[np.arange(len(points)), labels_for_means].sum())\n        updated = centers.copy()\n        for cluster in range(k):\n            members = points[labels_for_means == cluster]\n            if len(members):  # an empty slot keeps its previous center\n                updated[cluster] = members.mean(axis=0)\n        updated_distances = squared_distances(points, updated)\n        after_means = float(\n            updated_distances[np.arange(len(points)), labels_for_means].sum()\n        )\n        labels = updated_distances.argmin(axis=1)\n        inertia = float(updated_distances[np.arange(len(points)), labels].sum())\n        converged = bool(np.array_equal(labels, labels_for_means))\n        history.append(\n            (before, after_means, inertia, int(np.sum(labels != labels_for_means)))\n        )\n        centers = updated\n        if converged:\n            break\n    return {\n        \"centers\": centers,\n        \"labels\": labels,\n        \"inertia\": inertia,\n        \"converged\": converged,\n        \"iterations\": iteration,\n        \"history\": history,\n        \"seed_rows\": seed_rows,\n    }"}</CodeBlock>

<H3>{"Use length bounds to avoid unnecessary comparisons"}</H3>

<Prose>{"Chunking changes storage. A different improvement changes which point-center distances are evaluated. It uses the ordinary triangle inequality introduced in section 2, so its bounds are lengths rather than squared lengths."}</Prose>

<Mechanism id="D21" />

<Prose>{"Place x=2, its assigned C0=0 and candidate C1=6 on the same axis. The assigned distance is 2; center separation is 6, half-separation 3. Since 2<3, x lies on C0's side of the centers' midpoint. The triangle inequality also gives d(x,C1)≥6−2=4, greater than the assigned distance. A valid lower bound 4 and upper bound 2 can certify that this candidate cannot win, without evaluating its exact distance in that step. At x=3, equality cannot resolve the declared tie convention, so the strict skip fails and the candidate is measured."}</Prose>

<Prose>{"For assigned center a, upper bound u≥d(x,a), candidate j lower bound ℓⱼ≤d(x,j), and center separation d(a,j), either strict inequality u<ℓⱼ or u<d(a,j)/2 makes the candidate safely skippable. Taking the minimum half-separation over all other centers can skip every candidate at once. Coincident centers give half-separation zero and no global shortcut."}</Prose>

<Mechanism id="D22" />

<Prose>{"Now move C1 from 6 to 3 while keeping x=2 and C0=0. Its movement is 3, so an old lower bound 4 becomes max(0,4−3)=1. The assigned upper remains 2, and the new center half-separation is 1.5. Both skip tests fail. Evaluating the candidate gives distance 1, which beats C0's 2. A stale lower bound of 4 would have hidden that necessary reassignment. When an assigned center moves by mₐ, its upper bound grows by mₐ; a candidate moving by mⱼ decreases its lower bound by at most mⱼ. These conservative updates follow directly from the triangle inequality."}</Prose>

<Prose>{"The complete Elkan-style program stores n upper bounds, n-by-k lower bounds, k-by-k center separations and a flag saying whether each assigned upper is tight. It first tries strict conservative guards; when necessary, it refreshes the assigned distance and then the candidate distance. Center motion updates every affected bound. Floating-point margins and outward rounding make skips conservative near equality. Exact equal distances still obey lower-index ties."}</Prose>

<span id="full-program-n2" />

<Prose>{"Complete file: "}<code>{"clustering_elkan.py"}</code>{". Run with "}<code>{"python clustering_elkan.py"}</code>{" after the shared setup in section 2."}</Prose>

<RemoteCodeBlock filename="clustering_elkan.py" source="/learn-code/k-means-hierarchical-clustering/clustering_elkan.py" language="python" title="Conservative length-bound Elkan assignment and complete updates (§6)." />

<span id="recorded-output-n2" />

<Prose>{"Recorded output: "}<code>{"clustering_elkan.stdout.txt"}</code>{"."}</Prose>

<RemoteCodeBlock filename="clustering_elkan.stdout.txt" source="/learn-code/k-means-hierarchical-clustering/clustering_elkan.stdout.txt" language="output" title="Complete recorded output for the same-name worked program." />

<Prose>{"On the matched weighted five-row case, the returned centers and SSE agree with the Lloyd route. The reported evaluation count includes initial point-center distances, refreshed/candidate distances and the exact objective pass; it is not a hardware timing. Bounds cost O(nk+k²) storage and may save few distances for overlapping groups or large center motion. The library's "}<code>{"algorithm=\"elkan\""}</code>{" exposes this family of tradeoffs; use "}<code>{"lloyd"}</code>{" when the extra bound matrix is unsuitable. Both library paths accept the same explicit initial coordinates and row masses."}</Prose>

<Prose>{"Here is the complete retained original Lloyd program and its full recorded output. "}<code>{"make_blobs(n_samples=150, centers=3, cluster_std=0.8, random_state=42)"}</code>{" constructs 150 two-coordinate rows around three generated centers, with within-center scatter controlled by 0.8 and pseudorandom construction fixed by 42. The generator's returned category labels are discarded: this fit sees only the coordinates. Its initializer seed 127 is a separate choice from the data seed. The duplicate/budget and one-dimensional start cases use their own explicit arrays, distinct from both the blobs and the new weighted example."}</Prose>

<span id="full-program-o1" />

<Prose>{"Complete file: "}<code>{"clustering_lloyd.py"}</code>{". Run with "}<code>{"python clustering_lloyd.py"}</code>{" after the shared setup in section 2."}</Prose>

<RemoteCodeBlock filename="clustering_lloyd.py" source="/learn-code/k-means-hierarchical-clustering/clustering_lloyd.py" language="python" title="Complete retained Lloyd loop, original constructed-data and duplicate/budget cases (§6)." />

<span id="recorded-output-o1" />

<Prose>{"Recorded output: "}<code>{"clustering_lloyd.stdout.txt"}</code>{"."}</Prose>

<RemoteCodeBlock filename="clustering_lloyd.stdout.txt" source="/learn-code/k-means-hierarchical-clustering/clustering_lloyd.stdout.txt" language="output" title="Complete recorded output for the same-name worked program." />

<Prose>{"The retained fit begins with SSE 321.87553 and reaches 181.504432, with three groups of 50 rows. Its duplicate and finite-budget outputs expose the return limits described above. The two original one-dimensional starts finish at 21.166667 and 17, another concrete illustration that local completion and global selection differ. We can now use ordinary fitted state on the real geyser record without confusing the source of its geometry."}</Prose>

<span id="8-use-library-fits-without-losing-the-contract" /><SectionHeading id="7-read-the-real-fitted-state">{"7. Use and interpret a fitted library system"}</SectionHeading>

<Prose>{"Return to the 272 actual Old Faithful records. We know which two minute-valued measurements define a row and why their scale matters. Now compare the recorded raw-coordinate and standardized fits on the same axes."}</Prose>

<Mechanism id="D23" />

<Prose>{"The raw-coordinate fit has representatives about (2.094,54.750) and (4.298,80.285), with sizes 100/172. The standardized fit's centers, mapped back to minutes, are about (2.052,54.592) and (4.296,80.080), with sizes 98/174. Both panels plot the same observed rows. Standardized membership colors use the saved row labels. The raw panel shows neutral rows and its recorded crosses and size table: individual raw-fit row labels were not saved, so inspecting a row reports that label as unavailable rather than guessing from rounded centers. The same row outline appears in both panels when its ID changes."}</Prose>

<Prose>{"Raw squared error gives the numerically larger waiting-time differences more influence. Column standardization divides each feature difference by its training scale, changing the relative ruler. Back-transforming a center to minutes makes it interpretable without undoing the geometry used to learn it. These two fitted systems are descriptions of completed eruption records, not causal categories or a duration-only wait forecast."}</Prose>

<Prose>{"The ordinary source below embeds the complete R "}<code>{"faithful"}</code>{" data and creates the row matrix. "}<code>{"StandardScaler.fit"}</code>{" stores one training mean and population scale per feature. "}<code>{"transform"}</code>{" uses those stored values. KMeans then fits centers in the transformed coordinate system. Here both descriptive models use all 272 recorded rows: this is not the separated final evaluation introduced later."}</Prose>

<Prose>{"Contextual excerpt from "}<code>{"clustering_production.py"}</code>{"."}</Prose>

<CodeBlock language="python" filename="clustering_production.py">{"# Old Faithful geyser, Yellowstone: eruption duration and waiting time to the next\n# eruption, both in minutes. 272 rows, the R `faithful` version (Härdle 1991).\nFAITHFUL = (\n    \"3.6 79 1.8 54 3.333 74 2.283 62 4.533 85 2.883 55 4.7 88 3.6 85 1.95 51 4.35 85 \"\n    \"1.833 54 3.917 84 4.2 78 1.75 47 4.7 83 2.167 52 1.75 62 4.8 84 1.6 52 4.25 79 \"\n    \"1.8 51 1.75 47 3.45 78 3.067 69 4.533 74 3.6 83 1.967 55 4.083 76 3.85 78 4.433 79 \"\n    \"4.3 73 4.467 77 3.367 66 4.033 80 3.833 74 2.017 52 1.867 48 4.833 80 1.833 59 \"\n    \"4.783 90 4.35 80 1.883 58 4.567 84 1.75 58 4.533 73 3.317 83 3.833 64 2.1 53 \"\n    \"4.633 82 2 59 4.8 75 4.716 90 1.833 54 4.833 80 1.733 54 4.883 83 3.717 71 1.667 64 \"\n    \"4.567 77 4.317 81 2.233 59 4.5 84 1.75 48 4.8 82 1.817 60 4.4 92 4.167 78 4.7 78 \"\n    \"2.067 65 4.7 73 4.033 82 1.967 56 4.5 79 4 71 1.983 62 5.067 76 2.017 60 4.567 78 \"\n    \"3.883 76 3.6 83 4.133 75 4.333 82 4.1 70 2.633 65 4.067 73 4.933 88 3.95 76 4.517 80 \"\n    \"2.167 48 4 86 2.2 60 4.333 90 1.867 50 4.817 78 1.833 63 4.3 72 4.667 84 3.75 75 \"\n    \"1.867 51 4.9 82 2.483 62 4.367 88 2.1 49 4.5 83 4.05 81 1.867 47 4.7 84 1.783 52 \"\n    \"4.85 86 3.683 81 4.733 75 2.3 59 4.9 89 4.417 79 1.7 59 4.633 81 2.317 50 4.6 85 \"\n    \"1.817 59 4.417 87 2.617 53 4.067 69 4.25 77 1.967 56 4.6 88 3.767 81 1.917 45 4.5 82 \"\n    \"2.267 55 4.65 90 1.867 45 4.167 83 2.8 56 4.333 89 1.833 46 4.383 82 1.883 51 \"\n    \"4.933 86 2.033 53 3.733 79 4.233 81 2.233 60 4.533 82 4.817 77 4.333 76 1.983 59 \"\n    \"4.633 80 2.017 49 5.1 96 1.8 53 5.033 77 4 77 2.4 65 4.6 81 3.567 71 4 70 4.5 81 \"\n    \"4.083 93 1.8 53 3.967 89 2.2 45 4.15 86 2 58 3.833 78 3.5 66 4.583 76 2.367 63 5 88 \"\n    \"1.933 52 4.617 93 1.917 49 2.083 57 4.583 77 3.333 68 4.167 81 4.333 81 4.5 73 \"\n    \"2.417 50 4 85 4.167 74 1.883 55 4.583 77 4.25 83 3.767 83 2.033 51 4.433 78 4.083 84 \"\n    \"1.833 46 4.417 83 2.183 55 4.8 81 1.833 57 4.8 76 4.1 84 3.966 77 4.233 81 3.5 87 \"\n    \"4.366 77 2.25 51 4.667 78 2.1 60 4.35 82 4.133 91 1.867 53 4.6 78 1.783 46 4.367 77 \"\n    \"3.85 84 1.933 49 4.5 83 2.383 71 4.7 80 1.867 49 3.833 75 3.417 64 4.233 76 2.4 53 \"\n    \"4.8 94 2 55 4.15 76 1.867 50 4.267 82 1.75 54 4.483 75 4 78 4.117 79 4.083 78 \"\n    \"4.267 78 3.917 70 4.55 79 4.083 70 2.417 54 4.183 86 2.217 50 4.45 90 1.883 54 \"\n    \"1.85 54 4.283 77 3.95 79 2.333 64 4.15 75 2.35 47 4.933 86 2.9 63 4.583 85 3.833 82 \"\n    \"2.083 57 4.367 82 2.133 67 4.35 74 2.2 54 4.45 83 3.567 73 4.5 73 4.15 88 3.817 80 \"\n    \"3.917 71 4.45 83 2 56 4.283 79 4.767 78 4.533 84 1.85 58 4.25 83 1.983 43 2.25 60 \"\n    \"4.75 75 4.117 81 2.15 46 4.417 90 1.817 46 4.467 74 \"\n)\nfaithful = np.array(FAITHFUL.split(), dtype=float).reshape(-1, 2)\nprint(\"scikit-learn:\", sklearn.__version__, \"Old Faithful rows:\", faithful.shape)\nscaler = StandardScaler().fit(faithful)\nstandardized = scaler.transform(faithful)\ntwo = KMeans(n_clusters=2, n_init=10, random_state=0).fit(standardized)\nraw_two = KMeans(n_clusters=2, n_init=10, random_state=0).fit(faithful)\nprint(\n    \"standardized k=2 centers (minutes):\",\n    np.round(scaler.inverse_transform(two.cluster_centers_), 3).tolist(),\n    \"sizes:\",\n    np.bincount(two.labels_).tolist(),\n)\nprint(\n    \"raw-unit k=2 centers (minutes):\",\n    np.round(raw_two.cluster_centers_, 3).tolist(),\n    \"sizes:\",\n    np.bincount(raw_two.labels_).tolist(),\n)"}</CodeBlock>

<Prose>{"Recorded output excerpt from "}<code>{"clustering_production.stdout.txt"}</code>{", lines 1–3."}</Prose>

<CodeBlock language="text" filename="clustering_production.stdout.txt">{"scikit-learn: 1.9.1 Old Faithful rows: (272, 2)\nstandardized k=2 centers (minutes): [[2.052, 54.592], [4.296, 80.08]] sizes: [98, 174]\nraw-unit k=2 centers (minutes): [[2.094, 54.75], [4.298, 80.285]] sizes: [100, 172]"}</CodeBlock>

<Prose>{"The same observations are also supplied as a CSV with their measurement and version documentation. Read only "}<code>{"eruptions"}</code>{" and "}<code>{"waiting"}</code>{" as features; "}<code>{"rownames"}</code>{" identifies records rather than a third measurement."}</Prose>

<span id="full-program-faithful-csv" />

<Prose>{"Complete file: "}<code>{"faithful.csv"}</code>{"."}</Prose>

<RemoteCodeBlock filename="faithful.csv" source="/learn-code/k-means-hierarchical-clustering/faithful.csv" language="csv" title="Exact retained 272-record real-data CSV; record number is not a feature." />

<span id="full-program-faithful-documentation" />

<Prose>{"Complete file: "}<code>{"faithful.DOCUMENTATION.md"}</code>{"."}</Prose>

<RemoteCodeBlock filename="faithful.DOCUMENTATION.md" source="/learn-code/k-means-hierarchical-clustering/faithful.DOCUMENTATION.md" language="markdown" title="Measurement, version, upstream attribution and use." />

<Prose>{"The relevant KMeans settings have distinct jobs:"}</Prose>

<NeuralTable caption={"7. Use and interpret a fitted library system"} headers={[<>{"Setting or operation"}</>,<>{"Meaning in the center fit"}</>]} rows={[[<>{""}<code>{"n_clusters=2"}</code>{""}</>,<>{"Request two representatives."}</>],[<>{""}<code>{"init=\"k-means++\""}</code>{""}</>,<>{"Use the tool's greedy D²-based initializer."}</>],[<>{""}<code>{"n_init=10"}</code>{""}</>,<>{"Run ten complete starts and retain the best training inertia."}</>],[<>{""}<code>{"random_state=0"}</code>{""}</>,<>{"Fix this source's pseudorandom input."}</>],[<>{""}<code>{"algorithm=\"lloyd\""}</code>{""}</>,<>{"Use the ordinary loop rather than the extra Elkan bound matrix."}</>],[<>{""}<code>{"max_iter"}</code>{" and "}<code>{"tol"}</code>{""}</>,<>{"Bound iterations and define the tool's convergence tolerance."}</>],[<>{""}<code>{"cluster_centers_"}</code>{""}</>,<>{"Store representatives in fitted feature coordinates."}</>],[<>{""}<code>{"labels_"}</code>{""}</>,<>{"Store the fitted training-row assignments."}</>],[<>{""}<code>{"inertia_"}</code>{""}</>,<>{"Sum assigned squared distances, with row masses if supplied."}</>],[<>{""}<code>{"predict(query_rows)"}</code>{""}</>,<>{"Assign future rows using the already fitted centers."}</>],[<>{""}<code>{"transform(query_rows)"}</code>{""}</>,<>{"Return ordinary lengths to every center."}</>]]} />

<Prose>{"The retained program ran with scikit-learn 1.9.1 and its complete settings; the recorded output remains attached to that source. Explicit settings make a new comparison easier to interpret than relying on defaults that can vary by version. The later full source display sits after its sweep and MiniBatch operations have also been taught."}</Prose>

<H3>{"Carry a query through the stored geometry"}</H3>

<Prose>{"Fitting and prediction have different data rights. A new row can change its own transformed coordinates and output label; it must not rewrite the fitted scaler or centers merely by being inspected."}</Prose>

<Mechanism id="D24" />

<Prose>{"Follow the new query diamond into the saved training mean cells [3.4877830882352936, 70.8970588235294] and population scales [1.1392712102257678, 13.569960017586368]. For each coordinate r, the transformed query is (qᵣ−meanᵣ)/scaleᵣ. The two center sockets then compute squared distances in that same transformed geometry. The smaller value supplies a nearest-center group ID. Move duration or waiting time below the picture; the learned cells stay fixed."}</Prose>

<Prose>{"This particular live projection uses saved original-unit center coordinates [2.0522,54.5918] and [4.2963,80.0805], rounded to four decimals, transformed by the saved scaler. It is therefore a "}<strong>{"rounded-center projection"}</strong>{". The original unrounded fitted centers are unavailable, so a query sufficiently close to a boundary can differ from an exact call to the original model's "}<code>{"predict"}</code>{". The retained original training labels remain the labels of that original fit. This distinction keeps the source of both kinds of displayed state visible."}</Prose>

<Prose>{"An ordinary "}<code>{"Pipeline(StandardScaler(), KMeans(...))"}</code>{" retains the unrounded scaler and model together. Calling its "}<code>{"predict"}</code>{" transforms the query through the stored scaler, then assigns it. Calling its "}<code>{"transform"}</code>{" returns all-center lengths, so "}<code>{"min(axis=1)"}</code>{" gives the assigned length and squaring gives the assigned squared distance. A large distance can flag a query for inspection; it is not a calibrated probability of belonging to a true category."}</Prose>

<Prose>{"Before carrying a new query through a pipeline, recall the separate four-row rectangle from section 2. Its side lengths are 2 and 10; converting the first coordinate by 100 makes that numerical side length 200. Now that KMeans fitting is taught, the original helper can compare all three coordinate systems. "}<code>{"groups"}</code>{" converts arbitrary fitted label IDs into sorted lists of actual row positions, making the membership comparison readable."}</Prose>

<Prose>{"Contextual source excerpt from "}<code>{"clustering_scaling.py"}</code>{", lines 8–11."}</Prose>

<CodeBlock language="python" filename="clustering_scaling.py">{"def groups(labels):\n    return sorted(\n        [np.flatnonzero(labels == label).tolist() for label in np.unique(labels)]\n    )"}</CodeBlock>

<Prose>{"Contextual source excerpt from "}<code>{"clustering_scaling.py"}</code>{", lines 17–18."}</Prose>

<CodeBlock language="python" filename="clustering_scaling.py">{"def fit_labels(points):\n    return KMeans(n_clusters=2, n_init=20, random_state=7).fit_predict(points)"}</CodeBlock>

<Prose>{"Contextual source excerpt from "}<code>{"clustering_scaling.py"}</code>{", lines 21–27."}</Prose>

<CodeBlock language="python" filename="clustering_scaling.py">{"original = fit_labels(rectangle)\nconverted = rectangle * [100.0, 1.0]\nuncorrected = fit_labels(converted)\ncorrected = fit_labels(converted * np.sqrt([1 / 100**2, 1.0]))\nprint(\"original coordinate groups:\", groups(original))\nprint(\"first coordinate converted without metric correction:\", groups(uncorrected))\nprint(\"compensated squared-distance weights:\", groups(corrected))"}</CodeBlock>

<Prose>{"Recorded output excerpt from "}<code>{"clustering_scaling.stdout.txt"}</code>{", lines 1–3."}</Prose>

<CodeBlock language="text" filename="clustering_scaling.stdout.txt">{"original coordinate groups: [[0, 2], [1, 3]]\nfirst coordinate converted without metric correction: [[0, 1], [2, 3]]\ncompensated squared-distance weights: [[0, 2], [1, 3]]"}</CodeBlock>

<Prose>{"The original and compensated fits group positions {0,2}/{1,3}; the uncompensated unit conversion instead gives {0,1}/{2,3}. Multiplication by √(1/100²)=1/100 restores the original first-coordinate ruler before fitting. This comparison uses memberships, not a numeric distance between group IDs."}</Prose>

<Prose>{"The original scaling example gives a separate, complete prediction path on six constructed device rows. Features are temperature and vibration; the training rows and held-out rows are explicitly separated. The pipeline fits only the training rows before predicting the three held-out rows."}</Prose>

<Prose>{"Contextual excerpt from "}<code>{"clustering_scaling.py"}</code>{"."}</Prose>

<CodeBlock language="python" filename="clustering_scaling.py">{"# Rows are constructed devices: temperature (°C), vibration (mm/s).\ntraining = np.array(\n    [[1.0, 10.0], [2.0, 12.0], [1.5, 9.0], [8.0, 30.0], [9.0, 29.0], [8.5, 32.0]]\n)\nheld_out = np.array([[2.5, 11.0], [8.0, 31.0], [20.0, 100.0]])\npipeline = make_pipeline(\n    StandardScaler(), KMeans(n_clusters=2, n_init=10, random_state=7)\n)\npipeline.fit(training)\nmean_before = pipeline[0].mean_.copy()\ncenters_before = pipeline[1].cluster_centers_.copy()\nlabels = pipeline.predict(held_out)\ndistances = pipeline.transform(held_out).min(axis=1)\nprint(\"training-only coordinate means:\", np.round(mean_before, 6).tolist())\nprint(\"held-out nearest standardized distances:\", np.round(distances, 6).tolist())\nprint(\n    \"predict changed scaler or centers:\",\n    not (\n        np.array_equal(mean_before, pipeline[0].mean_)\n        and np.array_equal(centers_before, pipeline[1].cluster_centers_)\n    ),\n)"}</CodeBlock>

<Prose>{"Recorded output excerpt from "}<code>{"clustering_scaling.stdout.txt"}</code>{", lines 5–7."}</Prose>

<CodeBlock language="text" filename="clustering_scaling.stdout.txt">{"training-only coordinate means: [5.0, 20.333333]\nheld-out nearest standardized distances: [0.291399, 0.156559, 7.644739]\npredict changed scaler or centers: False"}</CodeBlock>

<Prose>{"Its stored coordinate means are [5,20.333333]. Held-out nearest standardized lengths are .291399, .156559 and 7.644739. The last query, [20,100], is far from the training region yet still receives a nearest-center assignment. The recorded state comparison confirms that prediction changed neither scaler means nor centers. A returned group ID is a decision of this fixed system; deciding whether that group is useful needs a task and evaluation."}</Prose>

<Prose>{"The later held-out capstone packages this same training-only operation into "}<code>{"fit_model"}</code>{": its argument contains training rows, and the returned pipeline retains the scaler and center model together. The helper itself does not choose k or inspect evaluation rows; those decisions arrive in section 13 after diagnostics have been explained."}</Prose>

<Prose>{"Contextual source excerpt from "}<code>{"clustering_capstone.py"}</code>{", lines 10–13."}</Prose>

<CodeBlock language="python" filename="clustering_capstone.py">{"def fit_model(training, k, seed):\n    return make_pipeline(\n        StandardScaler(), KMeans(n_clusters=k, n_init=10, random_state=seed)\n    ).fit(training)"}</CodeBlock>

<Prose>{"We have learned a flat representative system. Sometimes the desired output is instead a nested relation among observations: which rows join first and which larger groups form later? That requires distances "}<strong>{"between groups"}</strong>{", whose members we will expose before naming their merge rules."}</Prose>

<span id="6-build-a-hierarchy-one-merge-at-a-time" /><SectionHeading id="8-join-groups-under-a-linkage-rule">{"8. Measure the distance between groups"}</SectionHeading>

<Prose>{"A hierarchy begins with each observation as its own group. At each step it chooses two active groups, joins their members and replaces them with a parent. The question “which two?” requires a group dissimilarity. Begin before the first join, where groups are single rows and there is no ambiguity about their members."}</Prose>

<Mechanism id="D25" />

<Prose>{"The six row vectors supply six point markers, six singleton leaves and a six-by-six matrix of ordinary lengths. Selecting P2/P3 highlights their coordinates (3,2)/(3.5,2), both mirrored matrix cells and the two leaves. Their length is .5. Selecting one ID twice shows the zero diagonal, which is not a candidate self-merge. A matrix cell is a dissimilarity between the indicated rows; its row or column number is not itself a coordinate feature."}</Prose>

<Prose>{"After some joins, an active group contains several original rows. Its mean cannot stand in for those members under every rule. Keep A={P0,P1} and B={P2,P3} visible together, and inspect their four cross pairs."}</Prose>

<Mechanism id="D26" />

<Prose>{"Their lengths are √8, √10.25, √4.5 and 2.5. "}<strong>{"Single linkage"}</strong>{" selects the smallest cross-member length, √4.5≈2.121320, along P1→P2. One short edge can join two groups even when other cross pairs are far apart. In a chain of rows, successive short links can therefore make a long group. The active-prefix control shows which groups exist before a proposed join; the pair control inspects their real members, while the selected minimum over all active pairs identifies the actual next join. Changing a prefix changes the operands, not just a highlighted branch in an already completed tree."}</Prose>

<Prose>{"For nonempty disjoint member sets A and B,"}</Prose>

<div className="neural-equation"><MathBlock>{"d_{\\rm single}(A,B)=\\min_{i\\in A,j\\in B}\\|x_i-x_j\\|."}</MathBlock></div>

<Mechanism id="D27" />

<Prose>{""}<strong>{"Complete linkage"}</strong>{" instead uses the largest cross length. In the same A/B comparison, it is P0→P3's √10.25≈3.201562. All four edges remain visible so the minimum and maximum are different operations on the same operands. Building a complete-linkage tree starts again from singletons and repeatedly chooses its own smallest active-group dissimilarity. It cannot generally be produced by changing the heights of a single-linkage tree while preserving that tree's parents. The six-row fixture can give matching later partitions under several rules; the chain fixture exposes a changed result."}</Prose>

<div className="neural-equation"><MathBlock>{"d_{\\rm complete}(A,B)=\\max_{i\\in A,j\\in B}\\|x_i-x_j\\|."}</MathBlock></div>

<Prose>{"This greedy rule favors joins whose worst cross pair is relatively short. It does not solve a global partition-diameter minimization problem over every possible assignment. As with Lloyd's local step, state the operation that is actually optimized at each step."}</Prose>

<Mechanism id="D28" />

<Prose>{""}<strong>{"Average linkage"}</strong>{" takes the mean of all four cross-member lengths: (√8 + √10.25 + √4.5 + 2.5)/4 ≈ 2.662827. The group means, (1.25,.25) and (3.25,2), are different objects. Their separation √7.0625≈2.657536 is not that average. The four edge slots and count divisor make the difference visible even when the two numerical answers happen to be close."}</Prose>

<div className="neural-equation"><MathBlock>{"d_{\\rm average}(A,B)=\\frac{1}{|A||B|}\n \\sum_{i\\in A,j\\in B}\\|x_i-x_j\\|."}</MathBlock></div>

<Prose>{"If A and B merge, the average distance to a third group C is (|A|d(A,C)+|B|d(B,C))/(|A|+|B|). This weighting counts all cross pairs with C; an unweighted average of the two old scores would overcount the smaller group when |A| and |B| differ. Complete linkage updates with "}<code>{"max"}</code>{" and single with "}<code>{"min"}</code>{". Section 11 uses these updates to avoid recomputing every member pair after every join."}</Prose>

<Prose>{"The direct "}<code>{"member_distance"}</code>{" function first validates disjoint row-ID sets, then creates the cross lengths and performs exactly the min, max or mean reduction. It is an inspectable definition for a selected pair. Its |A|×|B| length work is not the efficient whole-tree algorithm."}</Prose>

<Prose>{"Contextual excerpt from "}<code>{"clustering_nn_chain.py"}</code>{"."}</Prose>

<CodeBlock language="python" filename="clustering_nn_chain.py">{"def member_distance(points, left, right, method=\"average\"):\n    \"\"\"Direct member definition for an inspectable pair, before cached updates.\n\n    This computes |A|*|B| lengths; the complete hierarchy below uses its\n    O(n²) stored matrix and reducible recurrence instead of repeating this.\n    \"\"\"\n    points = points_array(points)\n    left, right = np.asarray(left), np.asarray(right)\n    for members in [left, right]:\n        if (members.ndim != 1 or not len(members)\n                or not np.issubdtype(members.dtype, np.integer)\n                or (members < 0).any() or (members >= len(points)).any()\n                or len(np.unique(members)) != len(members)):\n            raise ValueError(\"Use nonempty groups of distinct valid row indices.\")\n    if np.intersect1d(left, right).size:\n        raise ValueError(\"Active groups must have disjoint members.\")\n    if method not in {\"single\", \"complete\", \"average\"}:\n        raise ValueError(\"Use single, complete or average for this cross-member definition.\")\n    lengths = np.concatenate([np.sqrt(squared_to_center(points[right], points[i])) for i in left])\n    return float(lengths.min() if method == \"single\" else lengths.max()\n                 if method == \"complete\" else lengths.mean())"}</CodeBlock>

<Prose>{"In SciPy, "}<code>{"linkage(points, method=\"single\")"}</code>{", "}<code>{"\"complete\""}</code>{" or "}<code>{"\"average\""}</code>{" takes an observation-by-feature coordinate matrix and uses ordinary Euclidean distance by default. In scikit-learn, "}<code>{"AgglomerativeClustering(n_clusters=k, linkage=..., metric=\"euclidean\")"}</code>{" returns a flat cut from the fitted hierarchy. An optional connectivity graph restricts which joins are allowed; that is a changed clustering problem, not merely a faster evaluation of every unrestricted join. These three rules can also operate on declared finite dissimilarities with suitable API input shapes, even if those dissimilarities are not Euclidean. The next rule requires Euclidean scatter and must not inherit that freedom silently."}</Prose>

<span id="7-calculate-ward-cost-and-read-the-height-correctly" /><SectionHeading id="9-derive-ward-scatter-and-height">{"9. Join the groups with the smallest added scatter"}</SectionHeading>

<Prose>{"The three member-distance rules describe cross edges. We can instead ask how much extra within-group squared error one join creates. That reconnects a hierarchy to the mean identity derived in section 4, without turning it into a globally optimal flat center fit."}</Prose>

<Mechanism id="D29" />

<Prose>{"For A={P0,P1} and B={P2,P3}, the two means are (1.25,.25) and (3.25,2), both with count 2. Their internal SSE values are .25 and .125. The combined mean is (2.25,1.125). Moving both old means to that new mean adds 7.0625, so combined SSE is .25+.125+7.0625=7.4375. Internal scatter and the movement bill occupy different cells: the join creates the latter while retaining the former."}</Prose>

<Prose>{"Let nA,nB be the group counts, μA,μB their means, and μ their combined mean. Apply the fixed-group identity to each old group using μ as its new center:"}</Prose>

<div className="neural-equation"><MathBlock>{"\\begin{aligned}\n\\operatorname{SSE}(A\\cup B)\n&=\\operatorname{SSE}(A)+\\operatorname{SSE}(B)\n +n_A\\|\\mu_A-\\mu\\|^2+n_B\\|\\mu_B-\\mu\\|^2,\\\\\n\\mu&=\\frac{n_A\\mu_A+n_B\\mu_B}{n_A+n_B},\\\\\n\\Delta(A,B)&=\\frac{n_A n_B}{n_A+n_B}\\|\\mu_A-\\mu_B\\|^2.\n\\end{aligned}"}</MathBlock></div>

<Prose>{""}<strong>{"Ward's method"}</strong>{" greedily joins the active pair with the smallest Δ. It uses counts and means because those sufficient operands give the added SSE, not because member scatter or geometry has vanished. Two singleton positions 0/2 with masses 1/1 give Δ=2. Giving each position mass 100 leaves their separation at 2 but gives Δ=200. The positive-mass controls inspect this size factor. The weighted summary identity is mathematically valid; ordinary "}<code>{"AgglomerativeClustering"}</code>{" does not thereby gain an arbitrary "}<code>{"sample_weight"}</code>{" argument."}</Prose>

<Mechanism id="D30" />

<Prose>{"The six-point Ward tree first joins P2/P3 with Δ=.125, then P0/P1 and P4/P5 with Δ=.25 each. Joining the first two two-row groups adds 7.0625. The final four-row/two-row join adds 56.020833… . Their new internal IDs are 6 through 10, retaining the actual children and descendant counts. Prefix 4 therefore has total scatter .125+.25+.25+7.0625=7.6875. At the root, all merge costs sum to the one-group SSE 63.708333… . Each increment adds to the scatter already present in its two children, which explains the telescoping total."}</Prose>

<Prose>{"The vertical branch height needs its own convention. SciPy's Euclidean Ward output reports h=√(2Δ), so the first heights are .5, √.5, √.5, √14.125 and √112.041666… . Squaring h and dividing by two recovers the added SSE. Branch height, center separation and cumulative SSE are three different numbers. The complete retained reference records both its merge costs and SciPy heights."}</Prose>

<Prose>{"Contextual excerpt from "}<code>{"clustering_ward.py"}</code>{"."}</Prose>

<CodeBlock language="python" filename="clustering_ward.py">{"def ward_merges(points):\n    # Agglomerate by the smallest increase in within-cluster squared error.\n    points = np.asarray(points, dtype=float)\n    if points.ndim != 2 or 0 in points.shape or not np.isfinite(points).all():\n        raise ValueError(\"Use a nonempty finite numeric row-by-feature matrix.\")\n    clusters = {\n        i: (1, row.copy(), [i]) for i, row in enumerate(points)\n    }  # size, mean, rows\n    rows, costs = [], []\n    for new_id in range(len(points), 2 * len(points) - 1):\n        candidates = []\n        active = sorted(clusters)\n        for position, left in enumerate(active):\n            for right in active[position + 1 :]:\n                na, ma, _ = clusters[left]\n                nb, mb, _ = clusters[right]\n                delta = na * nb / (na + nb) * float(((ma - mb) ** 2).sum())\n                candidates.append((delta, left, right))\n        delta, left, right = min(candidates)  # the lowest ID pair breaks an exact tie\n        na, ma, members_a = clusters.pop(left)\n        nb, mb, members_b = clusters.pop(right)\n        clusters[new_id] = (\n            na + nb,\n            (na * ma + nb * mb) / (na + nb),\n            members_a + members_b,\n        )\n        rows.append(\n            [left, right, np.sqrt(2 * delta), na + nb]\n        )  # SciPy's height convention\n        costs.append(delta)\n    return np.array(rows), np.array(costs)"}</CodeBlock>

<Prose>{"Contextual excerpt from "}<code>{"clustering_ward.py"}</code>{"."}</Prose>

<CodeBlock language="python" filename="clustering_ward.py">{"ours, delta = ward_merges(toy)\nreference = linkage(toy, method=\"ward\", metric=\"euclidean\")\nprint(\"left right delta_SSE scipy_height size\")\nfor own, cost, other in zip(ours, delta, reference):\n    print(int(own[0]), int(own[1]), f\"{cost:.6f}\", f\"{other[2]:.6f}\", int(own[3]))\nprint(\"all heights obey h² = 2Δ:\", bool(np.allclose(reference[:, 2] ** 2, 2 * delta)))\nprint(\n    \"sum of merge costs / one-cluster SSE:\",\n    round(float(delta.sum()), 6),\n    round(float(np.sum((toy - toy.mean(axis=0)) ** 2)), 6),\n)"}</CodeBlock>

<Prose>{"Recorded output excerpt from "}<code>{"clustering_ward.stdout.txt"}</code>{", lines 1–8."}</Prose>

<CodeBlock language="text" filename="clustering_ward.stdout.txt">{"left right delta_SSE scipy_height size\n2 3 0.125000 0.500000 2\n0 1 0.250000 0.707107 2\n4 5 0.250000 0.707107 2\n6 7 7.062500 3.758324 4\n8 9 56.020833 10.584974 6\nall heights obey h² = 2Δ: True\nsum of merge costs / one-cluster SSE: 63.708333 63.708333"}</CodeBlock>

<Prose>{"The reference scans all active pairs, explicitly computes Δ, breaks exact ties by the lowest ID pair, and builds each parent mean/count/member list. That makes the criterion inspectable. Section 11 replaces repeated global pair selection with a reducible nearest-neighbor-chain route."}</Prose>

<Prose>{"Deeper: software named Ward can use incompatible distance conventions. The ordinary Euclidean Ward2-style route squares the Euclidean dissimilarities inside its recurrence and takes the appropriate root for reported heights. A Ward1-style formulation uses squared dissimilarities with a matching update convention. Supplying squared Euclidean values to an interface that expects ordinary Euclidean lengths squares them again and changes the result. Use SciPy "}<code>{"linkage(points, method=\"ward\", metric=\"euclidean\")"}</code>{" or explicitly Euclidean condensed lengths. A symmetric nonnegative matrix alone cannot establish Euclidean embeddability; cosine or Manhattan dissimilarities are not generally valid operands for this SSE derivation. The Murtagh–Legendre reference in Further reading explains the competing conventions in detail."}</Prose>

<Mechanism id="D31" />

<Prose>{"At two groups, this Ward tree gives P0–P3 and P4/P5. The earlier fixed Lloyd state has exactly those members and means (2.25,1.125)/(7.25,5.25), so both show SSE 7.6875 here. Ward reached that state through irreversible joins; Lloyd allows rows to change their center assignment. Selecting another count shows how a Ward cut's group means can initialize Lloyd's local procedure. The subsequent assignment/mean steps must actually be checked before naming their result fixed. An unchanged two-group result is informative on this fixture; it does not identify the algorithms' objectives or histories as one and the same global optimizer. The rectangle's error-9 and error-1 fixed points remain our concrete reminder about local selection."}</Prose>

<Prose>{"We now have a criterion and actual merge history. The next step is to read its stored branch rows and decide exactly what a tree cut returns."}</Prose>

<SectionHeading id="10-read-and-cut-the-recorded-tree">{"10. Read branches, choose a cut and respect the interface"}</SectionHeading>

<Prose>{"The merge tree records actual children, heights and counts. Its left-to-right arrangement is a drawing choice. Begin with one stored row and trace where each field appears."}</Prose>

<Mechanism id="D32" />

<Prose>{"The first row [2,3,.5,2] means child IDs 2 and 3 join at height .5, producing a group containing two original observations. For n=6, merge row i creates node ID 6+i, so the first row creates ID 6. A later row can refer to ID 6 as a child. The descendant count includes original leaves, not the number of immediate branches. Rotating a branch exchanges its drawn left and right children while preserving every member, height and parent relation. Horizontal spacing is layout; the numeric vertical axis carries height."}</Prose>

<Prose>{"A SciPy linkage array has n−1 rows and four columns: left child, right child, height, descendant count. A valid child already exists before its parent: at row i its ID is below n+i. The root contains n leaves. Duplicate coordinates can join at height zero, which is a valid value. These identities let us inspect a tree without confusing an input row ID, an internal node ID and a flat-cut cluster label."}</Prose>

<Mechanism id="D33" />

<Prose>{"Two Ward joins in our tree occur at the same height √.5. An "}<strong>{"inclusive height cut"}</strong>{" includes every join with h≤t. Just below √.5 it leaves five groups; at √.5 it includes both tied joins and leaves three. There is no threshold between those equal heights that gives four. A "}<strong>{"merge-count cut"}</strong>{" can stop after exactly n−k rows and return four groups, but it then chooses one of the tied joins according to the stored merge order."}</Prose>

<Prose>{"The controls select the cut policy and its threshold or count. The active branch list remains beside the horizontal line, so a count cut never pretends to be an undisclosed height threshold. The full count range one through six and the threshold endpoints remain available. Software endpoint conventions matter at an exact tie:"}</Prose>

<NeuralTable caption={"10. Read branches, choose a cut and respect the interface"} headers={[<>{"Interface"}</>,<>{"Endpoint interpretation"}</>]} rows={[[<>{""}<code>{"fcluster(Z, t, criterion=\"distance\")"}</code>{""}</>,<>{"Includes heights at or below t."}</>],[<>{""}<code>{"cut_tree(Z, height=[t])"}</code>{""}</>,<>{"Uses the strict height boundary h<t."}</>],[<>{""}<code>{"AgglomerativeClustering(distance_threshold=t, n_clusters=None)"}</code>{""}</>,<>{"Joins below the threshold, with its full-tree requirement."}</>],[<>{""}<code>{"cut_tree(Z, n_clusters=[k])"}</code>{""}</>,<>{"Makes a merge-count slice."}</>],[<>{""}<code>{"fcluster(Z, k, criterion=\"maxclust\")"}</code>{""}</>,<>{"Chooses a threshold producing at most k groups; ties can produce fewer."}</>]]} />

<Prose>{"The original six-row output reports three groups for "}<code>{"maxclust=4"}</code>{". The exact count-cut helper below instead applies the first n−k merges to explicit active member sets and writes one label per original row. It exposes the policy rather than deriving it from a rounded height."}</Prose>

<Prose>{"Contextual excerpt from "}<code>{"clustering_ward.py"}</code>{"."}</Prose>

<CodeBlock language="python" filename="clustering_ward.py">{"def count_cut(tree, k):\n    # Apply exactly the first n − k merges.\n    n = len(tree) + 1\n    active = {index: [index] for index in range(n)}\n    for step, row in enumerate(tree[: n - k]):\n        left, right = map(int, row[:2])\n        active[n + step] = active.pop(left) + active.pop(right)\n    labels = np.empty(n, dtype=int)\n    for label, members in enumerate(active.values()):\n        labels[members] = label\n    return labels"}</CodeBlock>

<Prose>{"Contextual excerpt from "}<code>{"clustering_ward.py"}</code>{"."}</Prose>

<CodeBlock language="python" filename="clustering_ward.py">{"equal_height = reference[1, 2]\nbelow = fcluster(reference, np.nextafter(equal_height, -np.inf), criterion=\"distance\")\nthrough = fcluster(reference, equal_height, criterion=\"distance\")\nmax_four = fcluster(reference, 4, criterion=\"maxclust\")\nprint(\n    \"clusters from a height cut just below / at the tied height:\",\n    len(np.unique(below)),\n    len(np.unique(through)),\n)\nprint(\"fcluster maxclust=4 returns at most 4; actual:\", len(np.unique(max_four)))"}</CodeBlock>

<Prose>{"Recorded output excerpt from "}<code>{"clustering_ward.stdout.txt"}</code>{", lines 12–13."}</Prose>

<CodeBlock language="text" filename="clustering_ward.stdout.txt">{"clusters from a height cut just below / at the tied height: 5 3\nfcluster maxclust=4 returns at most 4; actual: 3"}</CodeBlock>

<H3>{"Coordinates and precomputed dissimilarities have different shapes"}</H3>

<Prose>{"The same numbers can answer the wrong question if an array is passed through the wrong interface. Establish the objects behind its rows before calling a library."}</Prose>

<Mechanism id="D34" />

<Prose>{"The three coordinate rows 0,1,4 have ordinary distances 1,4,3 for unordered pairs 01,02,12. Their square distance matrix is [[0,1,4],[1,0,3],[4,3,0]]. A condensed vector stores the upper triangle in the declared pair order: [1,4,3]. SciPy "}<code>{"linkage"}</code>{" treats a one-dimensional condensed vector as pair dissimilarities; a two-dimensional array is a collection of observation vectors. Passing that three-by-three square array therefore treats its rows as three observations in a new three-dimensional feature space. SciPy can warn that it resembles a distance matrix and still compute that different hierarchy; it does not simply reject it as an invalid input."}</Prose>

<Prose>{""}<code>{"pdist(coordinates, metric=\"euclidean\")"}</code>{" constructs condensed ordinary lengths. "}<code>{"squareform(square_matrix)"}</code>{" converts a validated symmetric zero-diagonal matrix to condensed order. Check finite nonnegative dissimilarities as well as the shape checks; a valid square form alone does not prove the Euclidean condition needed for Ward. On this coordinate example, "}<code>{"linkage(points, method=\"single\")"}</code>{" and the corresponding "}<code>{"linkage(pdist(points), method=\"single\")"}</code>{" describe the same distances. The square-as-observations call describes a different input. The ordinary input-route example keeps those three calls distinct."}</Prose>

<Prose>{"Contextual excerpt from "}<code>{"clustering_nn_chain.py"}</code>{"."}</Prose>

<CodeBlock language="python" filename="clustering_nn_chain.py">{"def input_routes(points):\n    \"\"\"Expose the three different ordinary linkage input interpretations.\"\"\"\n    points = points_array(points)\n    if len(points) < 2:\n        raise ValueError(\"At least two rows are needed for an ordinary linkage call.\")\n    condensed = pdist(points, metric=\"euclidean\")\n    square = squareform(condensed)\n    coordinate_tree = linkage(points, method=\"single\", metric=\"euclidean\")\n    condensed_tree = linkage(squareform(square), method=\"single\")\n    with warnings.catch_warnings(record=True) as observed:\n        warnings.simplefilter(\"always\", ClusterWarning)\n        square_as_rows = linkage(square, method=\"single\", metric=\"euclidean\")\n    return {\"coordinates\": points.tolist(), \"square_distances\": square.tolist(),\n            \"condensed_distances\": condensed.tolist(),\n            \"coordinate_tree\": coordinate_tree.tolist(),\n            \"condensed_tree\": condensed_tree.tolist(),\n            \"square_as_observations_tree\": square_as_rows.tolist(),\n            \"square_as_observations_warnings\": [str(item.message) for item in observed]}"}</CodeBlock>

<Prose>{"Scikit-learn's precomputed route instead accepts a square matrix through the explicit "}<code>{"metric=\"precomputed\""}</code>{" setting for supported linkages. Ward requires the Euclidean coordinate route. Choose an interface from its documented object contract rather than from a matrix's visual resemblance."}</Prose>

<H3>{"Keep subsample leaves attached to their source observations"}</H3>

<Prose>{"The six-row tree is fully inspectable. A saved smaller tree can also help us read a real collection, provided we preserve what each leaf actually stands for."}</Prose>

<Mechanism id="D35" />

<Prose>{"The saved Faithful hierarchy has forty leaves selected from the 272 original rows. Each leaf shows its local position and its original row ID. Selecting one highlights that exact point in the full scatter and traces its ancestors through the retained 39 linkage rows. An internal node has ID 40+i, separate from both its local leaf index and original source-row ID."}</Prose>

<Prose>{"The original construction used a sorted "}<code>{"default_rng(7)"}</code>{" forty-row subsample and standardized coordinates. The retained branch heights are rounded to six decimals, with root height about 13.0584. Its first two heights are zero because the selected observations include duplicate coordinate rows. The picture uses the saved values and names their rounding: thresholds arbitrarily close to a rounding boundary cannot reconstruct an unavailable unrounded tree. This is the forty-row view, not the full 272-row hierarchy. A narrow view keeps readable leaf labels and an explicit horizontal pan instead of shrinking forty labels into a texture."}</Prose>

<Prose>{"We can now interpret every stored field and cut. Building all those joins efficiently requires more than repeating a scan over every active pair; the next section opens two algorithms and the conditions that make them valid."}</Prose>

<SectionHeading id="11-build-hierarchies-with-efficient-operations">{"11. Build a hierarchy without repeated global rescanning"}</SectionHeading>

<Prose>{"Our direct Ward reference opens every active pair at every join. That is clear for six points but does unnecessary selection work for a large hierarchy. Two different properties lead to efficient algorithms: threshold connectivity for single linkage, and reducible distance updates for complete, average and Ward. Neither property applies to every method named “hierarchical.”"}</Prose>

<Mechanism id="D36" />

<Prose>{"For points 0,1,2,6, the minimum spanning tree has edges 0–1 and 1–2 of length 1, then 2–6 of length 4. At inclusive threshold 1, its first three points form one connected component although its endpoint distance is 2. At threshold 4 all four connect, with endpoint distance 6. Single linkage asks whether a path of eligible edges connects two rows, not whether every pair in the component is within the threshold."}</Prose>

<Prose>{"A "}<strong>{"minimum spanning tree"}</strong>{" connects every vertex with n−1 edges whose total length is minimal. In the complete Euclidean graph, cutting MST edges longer than t preserves the same connected components as keeping every graph edge of length at most t. One way to see this is the bottleneck property: if a path in the full graph connects two vertices using edges no longer than t, an MST path cannot require a strictly longer bottleneck without allowing an exchange for a cheaper connecting edge. Thus the tree compresses threshold connectivity; it does not preserve all original pair distances."}</Prose>

<Prose>{"The scratch code uses dense Prim selection with distances evaluated on demand. It stores a visited set, one candidate length and one parent ID per vertex. Commit the least candidate, then compare the newly visited row with each remaining vertex and refresh only improved candidate edges. Sorting the n−1 tree edges gives merge order; union-find joins their components and writes valid internal child IDs and descendant counts."}</Prose>

<span id="full-program-n3" />

<Prose>{"Complete file: "}<code>{"clustering_single_mst.py"}</code>{". Run with "}<code>{"python clustering_single_mst.py"}</code>{" after the shared setup in section 2."}</Prose>

<RemoteCodeBlock filename="clustering_single_mst.py" source="/learn-code/k-means-hierarchical-clustering/clustering_single_mst.py" language="python" title="Dense Prim MST, union-find hierarchy and inclusive cuts (§11)." />

<span id="recorded-output-n3" />

<Prose>{"Recorded output: "}<code>{"clustering_single_mst.stdout.txt"}</code>{"."}</Prose>

<RemoteCodeBlock filename="clustering_single_mst.stdout.txt" source="/learn-code/k-means-hierarchical-clustering/clustering_single_mst.stdout.txt" language="output" title="Complete recorded output for the same-name worked program." />

<Prose>{"Its actual chain output gives heights [1,1,4] and the same inclusive-threshold partitions as ordinary SciPy single linkage at 0,1 and 4. The duplicate and singleton cases expose zero-height and empty-tree states. Tied MSTs can have different edges while preserving these threshold components. This dense on-demand route performs O(n²d) coordinate arithmetic with O(n) candidate state beyond its input and output; removing a stored n-by-n graph does not make generic exact distances subquadratic."}</Prose>

<H3>{"Reciprocal nearest groups can be joined through a chain"}</H3>

<Prose>{"Single linkage has a connectivity shortcut. For the other three core methods, we need to inspect the updates of active-group distances themselves."}</Prose>

<Mechanism id="D37" />

<Prose>{"On 0,1,4,5, begin with singleton IDs and a dissimilarity matrix. Under Ward, 0's nearest group is 1, and 1's nearest is 0: the pointer chain 0→1→0 closes reciprocally. Joining them creates ID 4 with count 2. Another reciprocal chain joins 2/3. Their group means are .5 and 4.5; each group's internal SSE is .5. The final added cost is (2×2/4)×4²=16, final height √32, and total SSE 17."}</Prose>

<Prose>{"For complete and count-weighted average linkage, a merged group's distances to C update respectively by"}</Prose>

<div className="neural-equation"><MathBlock>{"d(A\\cup B,C)=\\max(d(A,C),d(B,C)),\\qquad\nd(A\\cup B,C)=\\frac{n_A d(A,C)+n_B d(B,C)}{n_A+n_B}."}</MathBlock></div>

<Prose>{"Ward uses squared reported heights q=h² as its stored recurrence operands:"}</Prose>

<div className="neural-equation"><MathBlock>{"q(A\\cup B,C)=\n\\frac{(n_A+n_C)q(A,C)+(n_B+n_C)q(B,C)-n_Cq(A,B)}\n     {n_A+n_B+n_C}."}</MathBlock></div>

<Prose>{"The drawing pulls the three old cells and counts into that update before writing the new matrix cell. A square root converts the new q to a reported height; average and complete operate on their ordinary length cells instead. Changing methods therefore changes the operation, not just the axis title."}</Prose>

<Prose>{"These linkages have the reducibility property needed by the nearest-neighbor chain algorithm: if A/B are reciprocal nearest neighbors, joining them does not create an inappropriately closer relationship that invalidates that local merge. The algorithm follows nearest pointers until a reciprocal pair appears, merges it, repairs the chain and updates its distances. A chain can discover an independent distant pair before another closer pair, so discovery order is not automatically the final height-sorted linkage order. Stable sorting and explicit old-node-to-output-node renaming preserve valid child IDs."}</Prose>

<span id="full-program-n4" />

<Prose>{"Complete file: "}<code>{"clustering_nn_chain.py"}</code>{". Run with "}<code>{"python clustering_nn_chain.py"}</code>{" after the shared setup in section 2."}</Prose>

<RemoteCodeBlock filename="clustering_nn_chain.py" source="/learn-code/k-means-hierarchical-clustering/clustering_nn_chain.py" language="python" title="Member definitions, coordinate/condensed input routes and reducible NN-chain (§11)." />

<span id="recorded-output-n4" />

<Prose>{"Recorded output: "}<code>{"clustering_nn_chain.stdout.txt"}</code>{"."}</Prose>

<RemoteCodeBlock filename="clustering_nn_chain.stdout.txt" source="/learn-code/k-means-hierarchical-clustering/clustering_nn_chain.stdout.txt" language="output" title="Complete recorded output for the same-name worked program." />

<Prose>{"The complete implementation stores the dissimilarity matrix and group sizes, chooses the preceding chain member first on a nearest tie, and otherwise uses the lowest ID. It implements complete, average and Euclidean Ward only. The five-row main shows their different later heights, with ordinary SciPy beside each route. Compare each reported height and descendant count with its actual member groups; unique-height cuts agree on these matched examples. Tied algorithms can legally choose different binary refinements, so equal numerical labels or a universally identical tied tree are not the comparison contract."}</Prose>

<Prose>{"For these reducible methods, matrix/chain work is O(n²) after O(n²d) coordinate distance construction, with O(n²) stored dissimilarities. A chain push extends the active pointer stack; reciprocal merges remove its last two entries, so the total pointer work can be charged to pushes and merges rather than restarting a full global scan at each join. Input geometry and the stored matrix remain substantial costs. The Müllner treatment explains the exact algorithmic assumptions and output-order repair in greater detail."}</Prose>

<H3>{"A centroid join can reverse the height order"}</H3>

<Prose>{"Methods outside those conditions need a different interpretation. “Use the group mean” may sound close to Ward, but a distance between two means omits Ward's size factor and added-scatter criterion."}</Prose>

<Mechanism id="D38" />

<Prose>{"Consider (−1,0),(1,0),(0,1.8). The base pair has distance 2; each slant has distance √4.24, slightly larger. Centroid linkage first joins the base, whose mean is (0,0). Its separation from the third point is now 1.8. The parent therefore appears below its child of height 2: an "}<strong>{"inversion"}</strong>{". The spatial mean beside the downward branch explains why the value decreased."}</Prose>

<Prose>{"Changing the apex coordinate also changes which pair joins first. For √3<y<2, the base wins first and the second height y is below 2. At y=2 the heights coincide; above 2 the inversion disappears. At y=1.5, a slant wins: under the stated tie rule choose pair (0,2), whose mean is (−.5,.75); its distance to the remaining point is √2.8125. We recompute from that actual pair instead of forcing the earlier topology. At the mathematical y=√3 all first pair lengths are equal. An entered floating-point approximation is assessed as its actual representable coordinate, with the symbolic boundary displayed separately."}</Prose>

<Prose>{"Centroid and median linkage can produce inversions. Single, complete, average and Euclidean Ward have monotone merge heights under their proper conditions. A horizontal cut through an inverted tree therefore cannot be read as the same ordinary nested-threshold connectivity without an additional policy. SciPy exposes a separate "}<code>{"method=\"centroid\""}</code>{"; our nearest-neighbor-chain implementation deliberately rejects that method rather than applying an unjustified recurrence or reordering a parent ahead of its child."}</Prose>

<Mechanism id="D39" />

<Prose>{"Count the storage before choosing an algorithm. For n observations, a condensed float64 pair buffer has n(n−1)/2 entries, occupying 8n(n−1)/2 bytes. At n=100,000 this is 39,999,600,000 bytes, about 37.253 GiB, before coordinates, output and workspace. A full square buffer uses 8n² bytes, about twice as much. The size and budget controls calculate capacity; they do not allocate those arrays or measure the current machine's free RAM. On-demand MST state avoids that pair buffer while retaining its quadratic distance work. Structured spatial algorithms or approximate methods need their own geometric and accuracy contracts."}</Prose>

<Prose>{"We can now fit centers or build and interpret a hierarchy. The next decision is which resolution to use and what evidence answers that question."}</Prose>

<span id="9-choose-a-resolution-and-evaluate-the-result" /><SectionHeading id="12-read-diagnostics-with-their-assumptions">{"12. Ask what each diagnostic actually compares"}</SectionHeading>

<Prose>{"More centers offer more reconstruction capacity. That alone is not evidence for more real populations. Diagnostics ask different questions about compactness, separation, repeatability or a particular reference distribution. Start with the exact values of the recorded starts, before choosing a curve or score."}</Prose>

<Mechanism id="D40" />

<Prose>{"The Faithful display has eight integer k values and five single-start errors per k: forty recorded outcomes, with their start IDs. Its log/linear axis control changes the display of those same positive values. At k=1, standardized SSE is 544. At k=2, it is about 79.575959; k=3's median error 56.828688 is a further decrease of about 28.59%. Seven separately recorded points show median run-level silhouette scores for k=2 through 8. There is no k=1 silhouette. The drawing does not interpolate unmeasured starts or invent per-run silhouette values from a saved median."}</Prose>

<Prose>{"The globally best attainable SSE cannot increase when one extra center is allowed: keep every old representative and add another, preserving a feasible solution with no larger error. Found local solutions from different starts need not follow that monotonic order. An “elbow” is therefore a judgement about diminishing reconstruction gain, initialization variability and the intended task, not a formal proof that nature has exactly that many categories."}</Prose>

<H3>{"A silhouette uses member lengths, not center SSE"}</H3>

<Prose>{"To ask whether one point is closer to its own group than to another group, we need different operands and denominators."}</Prose>

<Mechanism id="D41" />

<Prose>{"For rows 0,1 in A and 4,6 in B, select point 1. Its own-group average excludes itself, so a=|1−0|=1. The other-group average includes both members: b=(|1−4|+|1−6|)/2=(3+5)/2=4. Its silhouette is (b−a)/max(a,b)=.75. Changing the membership to A={0,4}, B={1,6} makes that selected point's own average 5 and other average (1+3)/2=2, so its score is −.6. The same coordinate now has a different relation to its declared group."}</Prose>

<Prose>{"For row i in a group containing another member, define aᵢ as its mean ordinary distance to those other members. For every other group, take the mean distance from i to all that group's members; bᵢ is the smallest such group mean. Then"}</Prose>

<div className="neural-equation"><MathBlock>{"s_i=\\frac{b_i-a_i}{\\max(a_i,b_i)}."}</MathBlock></div>

<Prose>{"Values near 1 indicate a well-separated point under this distance and partition; near 0 indicate comparable own/other average distances; negative values indicate an other-group mean closer than the own-group mean. A singleton uses the conventional score zero. A zero denominator also yields zero. A whole partition with one group or one group per row has no supported average silhouette under the ordinary API's 2≤number of groups<n contract."}</Prose>

<Prose>{""}<code>{"point_silhouettes"}</code>{" accumulates B-row-to-group distance sums in blocks. It divides the own sum by count−1 and other sums by their full counts. Self-distance is zero, so excluding it changes the divisor even though it changes no sum. It avoids storing a full n-by-n distance matrix while still doing O(n²d) distance work. "}<code>{"silhouette_samples"}</code>{" is the ordinary per-row tool; "}<code>{"silhouette_score"}</code>{" averages the row scores. A sample-based estimate has a declared sampled population. An overall mean can conceal a small poorly separated group, so inspect group sizes and individual scores alongside it."}</Prose>

<Prose>{"The retained Faithful sweep now has both its operands taught. For each k=1,…,8 it fits five single-start models with start IDs 0,…,4, records their inertias and reports the minimum/maximum. At k=1 it prints silhouette as undefined. Otherwise it computes one score per fitted partition and takes the median of those five scores. The source therefore reports the same five-start population introduced in D40, with no fabricated missing scores."}</Prose>

<Prose>{"Contextual source excerpt from "}<code>{"clustering_production.py"}</code>{", lines 62–75."}</Prose>

<CodeBlock language="python" filename="clustering_production.py">{"print(\"k / inertia over five single starts / median silhouette, standardized\")\nfor k in range(1, 9):\n    runs = [\n        KMeans(n_clusters=k, n_init=1, random_state=seed).fit(standardized)\n        for seed in range(5)\n    ]\n    inertias = [model.inertia_ for model in runs]\n    if k == 1:\n        print(k, f\"{min(inertias):.6f}..{max(inertias):.6f}\", \"silhouette undefined\")\n        continue\n    silhouettes = [silhouette_score(standardized, model.labels_) for model in runs]\n    print(\n        k, f\"{min(inertias):.6f}..{max(inertias):.6f}\", f\"{np.median(silhouettes):.6f}\"\n    )"}</CodeBlock>

<Prose>{"Recorded output excerpt from "}<code>{"clustering_production.stdout.txt"}</code>{", lines 5–13."}</Prose>

<CodeBlock language="text" filename="clustering_production.stdout.txt">{"k / inertia over five single starts / median silhouette, standardized\n1 544.000000..544.000000 silhouette undefined\n2 79.575959..79.575959 0.745177\n3 56.331983..64.129144 0.486277\n4 43.889324..49.624831 0.404820\n5 34.274379..39.154590 0.364631\n6 27.284262..31.281991 0.388939\n7 23.821930..24.895822 0.379598\n8 21.517550..23.437178 0.360078"}</CodeBlock>

<H3>{"Compare the same rows through their pair relations"}</H3>

<Prose>{"Cluster labels name groups; their integers have no meaningful numeric distance. Renaming a group must not destroy an otherwise identical comparison."}</Prose>

<Mechanism id="D42" />

<Prose>{"Four row IDs have labels A=[0,0,1,1] and B=[7,7,3,3]. Although no raw label integer matches, each of the six unordered row pairs has the same same-group/different-group relation in both columns. Their partitions agree completely. The comparison control also shows a split into four singleton groups, one moved member and an all-one-group result. The contingency grid counts shared source rows at intersections of group IDs; it does not subtract the two ID numbers."}</Prose>

<Prose>{"The adjusted Rand index, ARI, compares same-group pair counts and adjusts against a fixed-marginal reference. Locally, let nₐᵦ be the contingency counts, aₐ and bᵦ their row/column totals, and N=choose(n,2). Define T=∑ₐᵦ choose(nₐᵦ,2), A=∑ₐ choose(aₐ,2), B=∑ᵦ choose(bᵦ,2). The reference expected shared-pair count is AB/N, giving"}</Prose>

<div className="neural-equation"><MathBlock>{"\\operatorname{ARI}=\\frac{T-AB/N}{(A+B)/2-AB/N}."}</MathBlock></div>

<Prose>{"For the renamed four-row example, T=A=B=2 and N=6, yielding ARI 1. The library defines the degenerate identical-partition cases consistently as complete agreement. ARI is not classification accuracy, and it can be negative. The full reference-model and complementary metric derivations continue in Clustering Evaluation; this pair construction is enough to use the local comparison meaningfully. Call "}<code>{"adjusted_rand_score"}</code>{" only after aligning the same actual row IDs. Equal-length vectors alone do not establish that alignment."}</Prose>

<Prose>{"Now the ordinary comparisons have a taught meaning. Raw and standardized Faithful fits had ARI .941537, an aggregate saved comparison without saved raw per-row labels. The compensated rectangle had ARI 1; the retained Ward/SciPy count cuts for k=2/3/4 also had ARI 1. Each call and its output appear below; the aggregate Faithful ARI does not supply its unavailable per-row contingency grid."}</Prose>

<Prose>{"Contextual excerpt from "}<code>{"clustering_production.py"}</code>{"."}</Prose>

<CodeBlock language="python" filename="clustering_production.py">{"print(\n    \"agreement of the two geometries (ARI):\",\n    round(adjusted_rand_score(two.labels_, raw_two.labels_), 6),\n)"}</CodeBlock>

<Prose>{"Contextual excerpt from "}<code>{"clustering_scaling.py"}</code>{"."}</Prose>

<CodeBlock language="python" filename="clustering_scaling.py">{"print(\"compensated ARI:\", adjusted_rand_score(original, corrected))"}</CodeBlock>

<Prose>{"Contextual excerpt from "}<code>{"clustering_ward.py"}</code>{"."}</Prose>

<CodeBlock language="python" filename="clustering_ward.py">{"for k in [2, 3, 4]:\n    direct = count_cut(ours, k)\n    scipy_labels = cut_tree(reference, n_clusters=[k]).ravel()\n    print(\n        \"count cut\",\n        k,\n        \"agrees with SciPy cut_tree (ARI):\",\n        round(adjusted_rand_score(direct, scipy_labels), 6),\n    )"}</CodeBlock>

<Prose>{"Recorded output excerpt from "}<code>{"clustering_production.stdout.txt"}</code>{", lines 4–4."}</Prose>

<CodeBlock language="text" filename="clustering_production.stdout.txt">{"agreement of the two geometries (ARI): 0.941537"}</CodeBlock>

<Prose>{"The complete Ward program and its full output combine the merge, cut and ARI operations introduced above."}</Prose>

<span id="full-program-o2" />

<Prose>{"Complete file: "}<code>{"clustering_ward.py"}</code>{". Run with "}<code>{"python clustering_ward.py"}</code>{" after the shared setup in section 2."}</Prose>

<RemoteCodeBlock filename="clustering_ward.py" source="/learn-code/k-means-hierarchical-clustering/clustering_ward.py" language="python" title="Complete retained Ward reference, heights, cuts and ARI (§12)." />

<span id="recorded-output-o2" />

<Prose>{"Recorded output: "}<code>{"clustering_ward.stdout.txt"}</code>{"."}</Prose>

<RemoteCodeBlock filename="clustering_ward.stdout.txt" source="/learn-code/k-means-hierarchical-clustering/clustering_ward.stdout.txt" language="output" title="Complete recorded output for the same-name worked program." />

<Prose>{"Likewise, the complete original coordinate-scaling and device-pipeline program has its full source and output here, after its final comparison is understood."}</Prose>

<span id="full-program-o4" />

<Prose>{"Complete file: "}<code>{"clustering_scaling.py"}</code>{". Run with "}<code>{"python clustering_scaling.py"}</code>{" after the shared setup in section 2."}</Prose>

<RemoteCodeBlock filename="clustering_scaling.py" source="/learn-code/k-means-hierarchical-clustering/clustering_scaling.py" language="python" title="Coordinate conversion, compensation and training-only device pipeline; complete after ARI (§12)." />

<span id="recorded-output-o4" />

<Prose>{"Recorded output: "}<code>{"clustering_scaling.stdout.txt"}</code>{"."}</Prose>

<RemoteCodeBlock filename="clustering_scaling.stdout.txt" source="/learn-code/k-means-hierarchical-clustering/clustering_scaling.stdout.txt" language="output" title="Complete recorded output for the same-name worked program." />

<H3>{"Resampled systems must meet on common probes"}</H3>

<Prose>{"Repeated fitting asks whether the partition decisions are stable to a change in training evidence. Resampling duplicates some training observations and omits others, so positions in two bootstrap lists are not automatically the same objects."}</Prose>

<Mechanism id="D43" />

<Prose>{"One list contains [T0,T0,T2], while the other contains [T0,T1,T2]. Their position 1 refers to T0 and T1 respectively. Comparing those two positions' labels as if they described one observation is invalid. Instead, route the same Q0/Q1/Q2 probe IDs through the separately fitted systems. In the supplied label witness, A=[0,0,1] and B=[7,7,3] agree on all three pair relations, ARI 1. Changing B to [7,3,3] leaves one of three relations agreeing and yields ARI−.5. These explicit labels are a constructed witness, not fitted bootstrap state."}</Prose>

<Prose>{"Each resample owns its own scaler and centers; every system predicts the same probe coordinates without fitting them. Compare those probe partitions after aligning IDs. Stable partitions can still be useless for a task, and unstable small groups may be hidden by a summary median. Bootstrap duplicates also change effective row masses, connecting this operation to section 4."}</Prose>

<Prose>{"The original device protocol used eight bootstrap seeds 30–37, 240 resampled training positions and the same sixty validation probes. Its median ARIs are available, while its individual bootstrap indices, fitted parameters and probe labels were not retained. Those detailed sockets remain unavailable. The new N5 demonstration supplies its own tiny six-row inputs, two explicit resample lists and four fixed probe IDs, so it can show actual scaler/center state and predicted labels without inventing the old systems."}</Prose>

<H3>{"A gap is relative to a declared no-cluster reference"}</H3>

<Prose>{"Low dispersion can result from a geometry that forces everything close together. Compare the observed dispersion with a specific reference generator before interpreting how surprising it is."}</Prose>

<Mechanism id="D44" />

<Prose>{"For observed points (−2,0),(−1,1),(1,3),(2,4), the axis-aligned box spans x∈[−2,2], y∈[0,4]. Its principal-axis box uses mean (0,2), first basis vector (1,1)/√2 and second (−1,1)/√2. The first coordinate spans [−2√2,2√2]; the second has zero extent. Uniform reference construction in that rotated box remains on a line, rather than acquiring artificial spread. The inverse transform maps reference coordinates back into the original plane."}</Prose>

<Prose>{"The five selectable illustration tables are explicitly prescribed normalized coordinates, scaled into the chosen box:"}</Prose>

<NeuralTable caption={"A gap is relative to a declared no-cluster reference"} headers={[<>{"Realization"}</>,<>{"Four prescribed coordinate pairs"}</>]} rows={[[<>{"0"}</>,<>{"(.1,.2),(.3,.7),(.7,.4),(.9,.9)"}</>],[<>{"1"}</>,<>{"(.2,.1),(.4,.6),(.6,.8),(.8,.3)"}</>],[<>{"2"}</>,<>{"(.05,.8),(.35,.2),(.65,.9),(.95,.4)"}</>],[<>{"3"}</>,<>{"(.15,.35),(.45,.85),(.55,.15),(.85,.65)"}</>],[<>{"4"}</>,<>{"(.25,.25),(.3,.9),(.75,.1),(.9,.75)"}</>]]} />

<Prose>{"For this illustration, groups are prescribed as the first two and last two rows. Their ordinary SSE is traced through the pair identity, not a claimed clustering fit. The observed total is 2. The first axis-aligned reference gives 4.64; its rotated counterpart gives 1.28. Across all five prescribed tables, the two mean-log-reference differences from log(2) are about 1.016274 and −.354545. Changing the no-cluster geometry changes the question being answered. These deterministic tables teach the generator and arithmetic; they are not five claimed independent Monte Carlo samples or a Faithful study."}</Prose>

<Prose>{"For a complete gap computation at k, fit the declared clustering procedure to the observed collection and to B generated reference collections. Let Wₖ be each fit's within-group dispersion, defined here as ordinary SSE, equivalently the sum of each group's unordered squared pair sum divided by its member count. Then"}</Prose>

<div className="neural-equation"><MathBlock>{"\\operatorname{Gap}(k)=\\frac1B\\sum_{b=1}^{B}\\log W^*_{kb}-\\log W_k."}</MathBlock></div>

<Prose>{"The average is over "}<strong>{"log dispersions"}</strong>{". Taking the log of average dispersion is a different operation. Reference bounds/basis come from the declared observed collection for this descriptive calculation; they are not supplied true cluster labels. A zero W makes log W undefined, so the program stops that computation instead of substituting an arbitrary epsilon."}</Prose>

<Mechanism id="D45" />

<Prose>{"The original selection rule chooses the smallest qualifying k satisfying Gap(k)≥Gap(k+1)−sₖ₊₁. In the constructed cells, G1=.1, G2=.4, G3=.43, s2=.05 and s3=.08. The k=1 test fails because .1<.35; the k=2 test passes because .4≥.43−.08=.35. Raising G3 to .6 with the same error makes k=2 fail. The next-k comparison is a real operand, not an extra decorative error bar."}</Prose>

<Prose>{"With reference log values ℓᵦ, their mean ℓ̄ and B samples, the inspected paper uses"}</Prose>

<div className="neural-equation"><MathBlock>{"s_k=\\sqrt{1+1/B}\\,\n\\sqrt{\\frac1B\\sum_{b=1}^{B}(\\ell_b-\\bar\\ell)^2}."}</MathBlock></div>

<Prose>{"This is simulation uncertainty for the reference calculation, not a confidence interval for a center coordinate. The last computed k has no next-k comparison. Our route receives consecutive k values including that extra endpoint, checks all available neighboring inequalities and returns no qualifying k if none passes. Extend a predeclared computation or report that outcome; do not call the terminal k a successful inequality when its next cell is absent."}</Prose>

<Prose>{"Ordinary software conventions deserve explicit names. R "}<code>{"cluster::clusGap"}</code>{" defaults to "}<code>{"d.power=1"}</code>{"; comparing its squared-distance version requires "}<code>{"d.power=2"}</code>{". Its condensed pair formula then gives half ordinary SSE: dividing every observed/reference W by two shifts their logs by −log 2 and cancels from Gap. Its "}<code>{"SE.sim"}</code>{" uses sample variance, divisor B−1, increasing spread by √(B/(B−1)) relative to the paper's divisor-B expression for B>1. Its "}<code>{"Tibs2001SEmax"}</code>{" returns terminal K if no inequality passes, and its printed default uses another "}<code>{"firstSEmax"}</code>{" policy. Matching Gap alone therefore does not establish identical finite-B selection. The "}<a href={"https://svn.r-project.org/R-packages/trunk/cluster/R/clusGap.R"}>{"official R source"}</a>{" exposes those conventions directly."}</Prose>

<Prose>{"The complete N5 program supplies chunked point silhouettes, two ordinary KMeans shared-probe systems and gap-reference generation/fitting. Its ordinary gap route uses KMeans as the clustering callable inside the same paper-rule calculation; it is not an R clusGap execution. The six-row one-dimensional example gives identical aligned/rotated generators because a one-dimensional rotation only changes orientation."}</Prose>

<Prose>{"For n≥d, economy SVD returns a left factor n-by-d and the complete right factor d-by-d; asking for the full left factor would waste n-by-n storage. For n<d, the program requests full factors to retain every one of the d right-basis axes, including null directions. The left factor is then n-by-n, bounded by n-by-d storage because n<d. This supports tall, square, wide and rank-deficient coordinate tables without dropping a coordinate from the reference-box definition. Exactly equal lower/upper bounds keep zero-width axes. Numerical null directions may retain tiny floating-point extents; no padding, rank truncation or epsilon changes those bounds."}</Prose>

<Prose>{"Returned factor storage is O(nd+d²), excluding factorization workspace and the fitter's buffers. The familiar O(nd min(n,d)) estimate describes dense economy-factor or singular-value work; it does not bound this complete-factor call for every shape. For wide n<d tables, completing and materializing the full d-by-d right basis adds work: writing its d² entries alone requires Ω(d²), even with n fixed at 2. Numerical rank deficiency does not remove those requested axes. No universal exact solver-work or workspace bound is asserted here. Forming full-basis projections and inverse reference maps still costs O(nd²) per collection. The generator retains B complete n-by-d reference arrays, O(Bnd) storage, so every tested k sees the same reference populations and seed schedule. Each k invokes the chosen fitter B+1 times: once on observed rows and B times on references. It also keeps B scalar reference costs per result row. Fitter work can dominate; chunking the silhouette calculation does not remove these gap allocations or fits. A streaming generator would need an explicitly equivalent shared-reference and random-state contract rather than silently redrawing for each k."}</Prose>

<span id="full-program-n5" />

<Prose>{"Complete file: "}<code>{"clustering_diagnostics.py"}</code>{". Run with "}<code>{"python clustering_diagnostics.py"}</code>{" after the shared setup in section 2."}</Prose>

<RemoteCodeBlock filename="clustering_diagnostics.py" source="/learn-code/k-means-hierarchical-clustering/clustering_diagnostics.py" language="python" title="Chunked point silhouettes and paper-convention gap references (§12)." />

<span id="recorded-output-n5" />

<Prose>{"Recorded output from the preceding program version: "}<code>{"clustering_diagnostics.stdout.txt"}</code>{". The current factor-storage successor has not been run end to end; these complete recorded results are preserved rather than presented as a new execution."}</Prose>

<RemoteCodeBlock filename="clustering_diagnostics.stdout.txt" source="/learn-code/k-means-hierarchical-clustering/clustering_diagnostics.stdout.txt" language="output" title="Complete recorded output from the preceding N5 version; current factor-storage successor unexecuted end to end." />

<Prose>{"Its actual scratch gap values at k=1/2/3 are approximately −.756490/.696715/−.116747, selecting k=2. The ordinary callable also selects k=2, but its k=3 Gap is about −.347706: the scratch uses one declared D² start, whereas the ordinary callable uses five starts. Their k=3 reference fit costs therefore differ. The generator and statistic definitions agree; this does not turn unmatched optimization starts into an algorithm-parity claim. Both probe systems give [0,0,1,1] on the same four probe IDs, ARI 1, while retaining their different fitted scaler means and centers."}</Prose>

<Prose>{"These diagnostics provide evidence for a representation and resolution. To use them for selection, we must now separate the rows allowed to teach the system from the rows reserved for its final evaluation."}</Prose>

<span id="14-complete-a-reproducible-clustering-report" /><SectionHeading id="13-separate-learning-selection-and-evaluation">{"13. Separate learning, selection and evaluation"}</SectionHeading>

<Prose>{"An exploratory fit can describe the rows used to learn it. If the task asks whether its decisions transfer to future rows, some evidence must remain outside every representation and selection choice. Start with the recorded device protocol, whose row roles were declared before fitting."}</Prose>

<Mechanism id="D46" />

<Prose>{"The original constructed input used "}<code>{"make_blobs"}</code>{" with 360 rows and data seed 17, then scaled coordinates by [3,.5] and shifted them by [40,5]. A seed 23 permutation separated 240 training, sixty validation and sixty test positions. These are synthetic temperature/vibration-like coordinates, not measured sensor records. Only training rows fit StandardScaler and the k=2/3/4 KMeans systems, with ten starts and random_state 7."}</Prose>

<Prose>{"Each fixed training system predicts the common validation rows. The protocol also measures bootstrap partition agreement on those same validation probes, using the resample-specific scalers/fits explained in section 12. Its complete recorded selection table is:"}</Prose>

<NeuralTable caption={"13. Separate learning, selection and evaluation"} headers={[<>{"k"}</>,<>{"Validation silhouette"}</>,<>{"Validation mean squared distance"}</>,<>{"Median shared-probe ARI"}</>,<>{"Minimum training-group size"}</>,<>{"Eligible"}</>]} rows={[[<>{"2"}</>,<>{".571111"}</>,<>{".670333"}</>,<>{"1"}</>,<>{"74"}</>,<>{"yes"}</>],[<>{"3"}</>,<>{".661785"}</>,<>{".238760"}</>,<>{"1"}</>,<>{"73"}</>,<>{"yes"}</>],[<>{"4"}</>,<>{".560489"}</>,<>{".211009"}</>,<>{".935727"}</>,<>{"43"}</>,<>{"yes"}</>]]} />

<Prose>{"Eligibility required minimum training-group size 20 and median agreement at least .8, together with the silhouette's valid-label conditions. The largest eligible validation silhouette chose k=3; an exact tie would choose smaller k. k=4 had smaller validation distortion but a worse silhouette and lower recorded stability. Those criteria answer different questions, so the stated selection rule matters."}</Prose>

<Prose>{"The selected original training-fitted k=3 system then scored the sixty test rows once, with no training-plus-validation refit. Recorded test mean squared distance was .342295, versus 2.167591 for the training-centroid baseline in the same standardized geometry. Test group counts were 20/15/25. The complete source and projected recorded stdout expose every computational step and profile value:"}</Prose>

<Prose>{"The complete original "}<a href={"/learn-code/k-means-hierarchical-clustering/clustering_capstone.py"}>{"source"}</a>{" and "}<a href={"/learn-code/k-means-hierarchical-clustering/clustering_capstone.stdout.txt"}>{"recorded stdout"}</a>{" remain available. The displayed counterpart keeps the same data, fitting, selection and scoring; its only code difference removes a printed storage caution. The resource calculation is still returned as a numeric report."}</Prose>

<span id="full-program-o6" />

<Prose>{"Complete file: "}<code>{"clustering_capstone_protocol.py"}</code>{". Run with "}<code>{"python clustering_capstone_protocol.py"}</code>{" after the shared setup in section 2."}</Prose>

<RemoteCodeBlock filename="clustering_capstone_protocol.py" source="/learn-code/k-means-hierarchical-clustering/clustering_capstone_protocol.py" language="python" title="Complete capstone protocol counterpart; same computation, results-only prints (§13)." />

<span id="recorded-output-o6" />

<Prose>{"Projected recorded output: "}<code>{"clustering_capstone_protocol.stdout.txt"}</code>{". This is the original recorded execution with its single printed storage caution removed; the counterpart has not been rerun."}</Prose>

<RemoteCodeBlock filename="clustering_capstone_protocol.stdout.txt" source="/learn-code/k-means-hierarchical-clustering/clustering_capstone_protocol.stdout.txt" language="output" title="Projection of the original recorded output with one caution line omitted; no new execution." />

<Prose>{"The candidate control highlights a saved validation row; it cannot change the historical winner or create a test score for an unselected system. A separate record selector shows the already recorded changed-seed example 29/31, whose locked k=3 test distance was .253428, baseline 2.043875 and counts 18/17/25. It has a different input/split identity. Detailed old per-row center/bootstrap arrays that were not saved remain unavailable in either display."}</Prose>

<Prose>{"Group profiles summarize the rows assigned under this geometry. Giving a group a clinical, risk or operational action label requires its own evidence and decision costs; a compact description alone cannot establish that action. Training distortion, held-out reconstruction and useful task performance should remain named separately."}</Prose>

<H3>{"Apply the protocol to a supplied CSV"}</H3>

<Prose>{"The ordinary portable example turns the responsibilities into runnable code that a learner can use without a hidden workspace. Its thirty rows are newly constructed coordinates, with columns "}<code>{"row_id,split,x,y"}</code>{". The supplied documentation specifies three bases, all offsets and each row's role. IDs and split cells organize evidence; only x/y enter the geometry."}</Prose>

<Prose>{"The eighteen training rows fit every scaler and center. The six validation rows determine eligibility and selection. The six test rows are passed to a separate scoring function only after "}<code>{"selected_k"}</code>{" and its actual pipeline are fixed. Every candidate uses random_state 7, n_init 10, Lloyd, max_iter 300 and tol 1e−4. Eligibility here requires all requested training groups to have at least two members and 2≤distinct validation labels<6. The original 240-row capstone's minimum size 20 and bootstrap rule are not silently applied to this distinct eighteen-row example."}</Prose>

<span id="full-program-n12" />

<Prose>{"Complete file: "}<code>{"clustering_own_task.py"}</code>{"."}</Prose>

<RemoteCodeBlock filename="clustering_own_task.py" source="/learn-code/k-means-hierarchical-clustering/clustering_own_task.py" language="python" title="CSV feature-role validation, train/validation selection and locked final assessment (§13)." />

<span id="full-program-own-csv" />

<Prose>{"Complete file: "}<code>{"clustering_own_task_example.csv"}</code>{"."}</Prose>

<RemoteCodeBlock filename="clustering_own_task_example.csv" source="/learn-code/k-means-hierarchical-clustering/clustering_own_task_example.csv" language="csv" title="Thirty constructed rows with explicit train/validation/test roles." />

<span id="full-program-own-documentation" />

<Prose>{"Complete file: "}<code>{"clustering_own_task_example.DOCUMENTATION.md"}</code>{"."}</Prose>

<RemoteCodeBlock filename="clustering_own_task_example.DOCUMENTATION.md" source="/learn-code/k-means-hierarchical-clustering/clustering_own_task_example.DOCUMENTATION.md" language="markdown" title="Complete deterministic construction, feature roles and use." />

<Prose>{"With these complete files in one directory, run:"}</Prose>

<CodeBlock language="sh">{"python -m pip install -r clustering_requirements.txt\npython clustering_own_task.py clustering_own_task_example.csv --features x y --features-known-before-outcome --k 2 3 4 --output my_clustering_result.json"}</CodeBlock>

<span id="recorded-output-n12" />

<Prose>{"Recorded output: "}<code>{"clustering_own_task.stdout.txt"}</code>{"."}</Prose>

<RemoteCodeBlock filename="clustering_own_task.stdout.txt" source="/learn-code/k-means-hierarchical-clustering/clustering_own_task.stdout.txt" language="output" title="Complete recorded output for the same-name worked program." />

<Prose>{"The fixed example produced the complete validation evidence below:"}</Prose>

<NeuralTable caption={"Apply the protocol to a supplied CSV"} headers={[<>{"k"}</>,<>{"Training sizes"}</>,<>{"Validation sizes"}</>,<>{"Mean squared distance"}</>,<>{"Silhouette"}</>,<>{"Eligible"}</>]} rows={[[<>{"2"}</>,<>{"6/12"}</>,<>{"2/4"}</>,<>{".9938849294"}</>,<>{".5095431564"}</>,<>{"yes"}</>],[<>{"3"}</>,<>{"6/6/6"}</>,<>{"2/2/2"}</>,<>{".0110839466"}</>,<>{".9123704772"}</>,<>{"yes"}</>],[<>{"4"}</>,<>{"3/6/6/3"}</>,<>{"1/2/2/1"}</>,<>{".0086269441"}</>,<>{".6072608339"}</>,<>{"yes"}</>]]} />

<Prose>{"It locked k=3 by validation silhouette, then reported test mean squared distance .0037129392 and training-centroid baseline 1.9790697533, with test counts 2/2/2. Training centers in original units were (−4,0),(4,0),(approximately 0,4), with floating-point roundoff in that last horizontal coordinate. These are results of this small constructed input, not a measured superiority claim about a real collection or a rerun of the old capstone. The saved JSON contains the input hash, split IDs, settings, every candidate outcome and selected scaler and center state."}</Prose>

<Prose>{"The CSV reader rejects missing fields, duplicate IDs, unknown roles, nonnumeric or nonfinite features and missing splits. "}<code>{"--exclude target_column"}</code>{" forbids a known output column. The availability flag requires your declaration that the features exist when a query arrives; schema validation cannot infer that fact from their names. Choose a new output path unless you deliberately use "}<code>{"--overwrite"}</code>{". If no candidate is eligible, the program stops before test scoring. Repeatedly changing geometry or k after inspecting the final score turns that score into selection evidence and requires fresh final evidence."}</Prose>

<span id="d47-duration-only-forecast" />

<Prose>{"What could an Old Faithful visitor supply "}<strong>{"before"}</strong>{" the next wait? The recorded eruption duration is available; the future waiting time is not. Keep the descriptive two-coordinate fit, but route a forecast through a different, explicitly proposed system."}</Prose>

<Mechanism id="D47" />

<Prose>{"A duration-only query enters a one-dimensional training-owned assignment. That group's training waiting-time mean would supply a forecast. The actual future wait enters only the later scoring port. Moving the duration control changes its supplied query coordinate; trained center and forecast sockets remain “not evaluated,” because this forecast has not been executed. The two-coordinate assignment that asks for the future wait is crossed out at the query interface, rather than repurposed as a forecast score."}</Prose>

<Prose>{"A complete proposed protocol is: first verify acquisition order or timestamps instead of assuming CSV row IDs establish chronology; separate chronological development and final evaluation periods; within development, fit duration centers only on the allowed earlier training rows, estimate group waiting means from their observed outcomes, and evaluate candidate k values against a declared development holdout. Use RMSE in minutes and a training-mean-wait baseline. Lock representation, k, centers and group wait means before scoring the later final period once. Its equations are z(q)=argminⱼ|duration(q)−μⱼ|², prediction(q)=mean (training waits in group z(q)), and RMSE=√mean ((observed wait−prediction)²)."}</Prose>

<Prose>{"No duration-only fitted parameters, chosen k, RMSE or predictions are supplied by the existing descriptive experiment. A random split's descriptive similarity does not answer chronological forecast accuracy."}</Prose>

<Prose>{"We have a responsible path from fitting to evaluation. Another useful task requires no claim about discovered populations at all: encode an image with a small codebook and inspect the bytes that are actually stored."}</Prose>

<span id="10-turn-clusters-into-a-color-palette" /><SectionHeading id="14-reconstruct-pixels-with-a-stored-palette">{"14. Turn representatives into a stored image"}</SectionHeading>

<Prose>{"A codebook gives each input a representative value. For an image, each row can be one color vector and each representative a palette entry. Start with the pixel's two distinct identities: a spatial address and a color coordinate."}</Prose>

<Mechanism id="D48" />

<Prose>{"Selecting a pixel in the constructed mosaic highlights its raster row/column, three byte channels and point in the RGB color cube. Another pixel far away can occupy the same RGB location. The clustering coordinates are R/G/B; spatial adjacency is not a distance term in this model. Changing the image to the constructed sky or gradient changes the actual color rows and valid pixel indices, while the selected address remains visibly tied to the raster."}</Prose>

<Prose>{"Literal pixel colors show their byte RGB values. Group identity uses an additional outline/label, so a red input pixel does not automatically mean “group 0.” These images are generated teaching rasters, not photographs or an evaluated image-segmentation system."}</Prose>

<Mechanism id="D49" />

<Prose>{"Store each unique color once and attach its pixel count as row mass. At the same centers, counts×color squared error equals the error of the literal repeated pixel array, by section 4's identity. After fitting, round and clip floating centers into byte RGB palette entries. Reassign each original pixel to its nearest stored entry, because the representative that will actually be decoded is that byte value, not its earlier floating center. The original and decoded rasters remain side by side with their distinct error labels."}</Prose>

<Prose>{"The complete retained worked program has 128 pixels and eight distinct color rows, with three supplied initial colors. Weighted and repeated KMeans fits both give floating SSE 9804.927631 and the same floating palette. The byte palette is [[240,21,20],[21,230,21],[24,22,234]]. Floating error per pixel is 76.600997; after byte storage and reassignment it is 76.882812. These are the fixed source program's results. Each live mosaic/sky/gradient state computes its own current error, rather than borrowing these numbers for a different input."}</Prose>

<Prose>{"Contextual excerpt from "}<code>{"clustering_quantization.py"}</code>{"."}</Prose>

<CodeBlock language="python" filename="clustering_quantization.py">{"colors = np.array(\n    [\n        [240, 20, 20],\n        [250, 30, 15],\n        [230, 15, 25],\n        [20, 230, 20],\n        [30, 240, 15],\n        [15, 220, 30],\n        [20, 20, 230],\n        [30, 25, 240],\n    ],\n    dtype=float,\n)\ncounts = np.array([30, 12, 10, 25, 8, 10, 20, 13])\npixels = np.repeat(colors, counts, axis=0)\ninitial = colors[[0, 3, 6]].copy()  # Same starting centers in both representations.\nweighted = KMeans(\n    n_clusters=3, init=initial, n_init=1, tol=0, algorithm=\"lloyd\", random_state=0\n).fit(colors, sample_weight=counts)\nrepeated = KMeans(\n    n_clusters=3, init=initial, n_init=1, tol=0, algorithm=\"lloyd\", random_state=0\n).fit(pixels)\nprint(\"pixels / distinct rows:\", len(pixels), len(colors))\nprint(\n    \"weighted versus repeated SSE:\",\n    round(weighted.inertia_, 6),\n    round(repeated.inertia_, 6),\n)\nprint(\n    \"same floating palette:\",\n    bool(np.allclose(weighted.cluster_centers_, repeated.cluster_centers_)),\n)"}</CodeBlock>

<Prose>{"Recorded output excerpt from "}<code>{"clustering_quantization.stdout.txt"}</code>{", lines 1–3."}</Prose>

<CodeBlock language="text" filename="clustering_quantization.stdout.txt">{"pixels / distinct rows: 128 8\nweighted versus repeated SSE: 9804.927631 9804.927631\nsame floating palette: True"}</CodeBlock>

<Prose>{"The source's matched starts, "}<code>{"n_init=1"}</code>{", "}<code>{"tol=0"}</code>{", Lloyd and integer "}<code>{"sample_weight"}</code>{" isolate the representation equivalence. Its palette conversion uses "}<code>{"rint"}</code>{", clipping to [0,255] and "}<code>{"uint8"}</code>{". It casts those bytes back to floating point before subtraction: unsigned-byte subtraction could wrap and corrupt a distance. Byte-channel squared error is the declared reconstruction criterion; a human perceptual evaluation would be a separate measurement. The live palette count is capped at eight even if a gradient has more unique colors, so increasing to that cap need not reconstruct every original color."}</Prose>

<H3>{"Address the palette through an index stream"}</H3>

<Prose>{"An error score says how much changed. A storage format must explain what information lets a decoder reconstruct every changed pixel."}</Prose>

<Mechanism id="D50" />

<Prose>{"Each source pixel now has an integer palette index. Follow one index into its palette slot and then into three decoded byte channels. With N=128 pixels and k=3 entries, raw RGB uses 24N=3072 bits. The palette uses 24k=72 bits. Each index needs ceil(log₂3)=2 bits, so the logical index stream uses 256 bits and the total palette-plus-index payload is 328 bits. A two-bit code 11 is unused for a three-entry palette and is rejected by the decoder."}</Prose>

<Prose>{"In the declared logical format,"}</Prose>

<div className="neural-equation"><MathBlock>{"\\text{payload bits}=24k+N\\lceil\\log_2 k\\rceil."}</MathBlock></div>

<Prose>{"At k=1, every index is implicitly zero and the logical stream is empty: its width is zero. The decoder still needs the pixel count and image dimensions from outside this payload to repeat that one entry. Byte-oriented file formats also have headers, packing and alignment rules. This formula is not a measured PNG or JPEG file size or a universal compression ratio."}</Prose>

<Prose>{"The small reusable codec below implements this explicitly specified logical stream. "}<code>{"(k−1).bit_length()"}</code>{" gives its exact integer width without logarithm roundoff. Packing validates palette addresses; decoding validates bit symbols, the exact expected length and unused codewords. Its zero-width branch handles the single-entry case directly rather than iterating with a zero step. It returns both decoded RGB rows and their index array."}</Prose>

<span id="full-program-codec" />

<Prose>{"Complete file: "}<code>{"clustering_palette_codec.py"}</code>{"."}</Prose>

<RemoteCodeBlock filename="clustering_palette_codec.py" source="/learn-code/k-means-hierarchical-clustering/clustering_palette_codec.py" language="python" title="Pure palette/index payload including k=1 zero-bit indices (§14)." />

<Prose>{"The retained source below is the complete fixed k=3 fitting-and-bitstream example, including its actual decoded-output comparison. Its eight color rows and counts are supplied, so it runs offline."}</Prose>

<span id="full-program-o5" />

<Prose>{"Complete file: "}<code>{"clustering_quantization.py"}</code>{". Run with "}<code>{"python clustering_quantization.py"}</code>{" after the shared setup in section 2."}</Prose>

<RemoteCodeBlock filename="clustering_quantization.py" source="/learn-code/k-means-hierarchical-clustering/clustering_quantization.py" language="python" title="Weighted palette fit and fixed-three-entry logical byte decoder (§14)." />

<span id="recorded-output-o5" />

<Prose>{"Recorded output: "}<code>{"clustering_quantization.stdout.txt"}</code>{"."}</Prose>

<RemoteCodeBlock filename="clustering_quantization.stdout.txt" source="/learn-code/k-means-hierarchical-clustering/clustering_quantization.stdout.txt" language="output" title="Complete recorded output for the same-name worked program." />

<Prose>{"This application uses groups to reduce an encoding objective rather than to discover semantic populations. For a large arriving collection, a different constraint appears: the system may update representatives without revisiting all earlier rows. That requires remembered mass, not just a center location."}</Prose>

<span id="11-scale-the-computation-and-route-a-search" /><SectionHeading id="15-update-centers-with-batch-history">{"15. Maintain centers through mini-batches"}</SectionHeading>

<Prose>{"Lloyd revisits the full collection for each assignment/update cycle. A stream instead offers a small arriving batch and limited persistent state. Begin with one representative, where its remembered mass makes every update visible."}</Prose>

<Mechanism id="D51" />

<Prose>{"The first arrival 0 gives mass 1 and mean 0. Arrival 6 gives mass 2 and mean 3. Arrival 9 gives mass 3 and mean 5. The update combines the old weighted sum tμ with new contribution wx, then divides by t+w:"}</Prose>

<div className="neural-equation"><MathBlock>{"\\mu_{\\rm new}=\\frac{t\\mu+wx}{t+w}\n=\\mu+\\frac{w}{t+w}(x-\\mu)."}</MathBlock></div>

<Prose>{"The third arrival moves the mean less because it joins two units of remembered mass. Giving that arrival mass 4 yields (2×3+4×9)/6=7. Before any observation arrives, mass is zero and there is no learned mean; a supplied prototype is separate initialization state. The count and mean together encode assigned history. Keeping only the center would lose the next update's denominator."}</Prose>

<H3>{"Cache a batch's assignments before committing its means"}</H3>

<Prose>{"With multiple centers, an incoming row's assignment depends on which center state it sees. Define that moment explicitly."}</Prose>

<Mechanism id="D52" />

<Prose>{"Start with centers 0/10 and remembered masses 1/1, then receive rows 4/6. Assign both to the same incoming centers, caching labels 0/1. Grouped updates give centers 2/8 and masses 2/2. Reversing the batch row order keeps those cached group memberships and weighted totals."}</Prose>

<Prose>{"The separate online rule reassigns each arrival after preceding updates. If 4 arrives first, it moves C0 to 2; row 6 then ties between 2/10 and chooses C0, which moves to 10/3. C1 stays 10. If 6 arrives first, it moves C1 to 8; row 4 then ties between 0/8 and chooses C0, giving 2/8. Those results are different because the assignment histories differ, not because the weighted-mean identity failed. The operation-step control exposes cache, accumulation and commit as separate states."}</Prose>

<Prose>{""}<code>{"BatchMeans.update"}</code>{" stores one cached label array, accumulates each group's new mass and normalized displacement, and commits all finite updated centers and masses together. Empty positive-mass groups retain their state. A failed representability check leaves the old state intact. "}<code>{"update_online"}</code>{" is named separately; each next row sees the moved centers. Its "}<code>{"to_json"}</code>{"/"}<code>{"from_json"}</code>{" stores schema, feature dimension, centers and masses, so reloading can continue the actual history rather than pretending fresh counts."}</Prose>

<span id="full-program-n6" />

<Prose>{"Complete file: "}<code>{"clustering_minibatch.py"}</code>{". Run with "}<code>{"python clustering_minibatch.py"}</code>{" after the shared setup in section 2."}</Prose>

<RemoteCodeBlock filename="clustering_minibatch.py" source="/learn-code/k-means-hierarchical-clustering/clustering_minibatch.py" language="python" title="Cached weighted batch history, atomic update and JSON reload (§15)." />

<span id="recorded-output-n6" />

<Prose>{"Recorded output: "}<code>{"clustering_minibatch.stdout.txt"}</code>{"."}</Prose>

<RemoteCodeBlock filename="clustering_minibatch.stdout.txt" source="/learn-code/k-means-hierarchical-clustering/clustering_minibatch.stdout.txt" language="output" title="Complete recorded output for the same-name worked program." />

<Prose>{"In its separate four-row weighted comparison, rows 0/6/9/20 with masses 1/1/2/1 and initial centers 0/20 produce cached labels 0001, centers 6/20 and masses 4/1. Ordinary "}<code>{"MiniBatchKMeans.partial_fit"}</code>{" with the same supplied initialization, "}<code>{"n_init=1"}</code>{", "}<code>{"batch_size=4"}</code>{" and "}<code>{"reassignment_ratio=0"}</code>{" gives those same centers on this batch. The reloaded scratch state preserves both masses and centers; reversing the cached batch preserves the update. The mean squared distance over all four retained rows is 10.8."}</Prose>

<Prose>{"The ordinary estimator also has initialization sampling, optional relocation of underused centers, convergence and batch-size policies. Its first batch must support the requested number of clusters. Supplying an "}<code>{"init"}</code>{" array and disabling reassignment make the demonstrated update easier to compare; they do not assert that every general streaming path is identical to the scratch state machine. Persistent state costs O(kd+k), besides the incoming batch; assignment work costs O(batch×k×d). Past rows are not globally reassigned when their centers move."}</Prose>

<Mechanism id="D53" />

<Prose>{"Separate three meanings of error: exact error on the current incoming batch, a smoothed estimate accumulated from batch reports, and exact inertia on the full retained collection. Only an actual full pass over that collection can compute the last one. If old rows have been discarded, their current residuals are unavailable from centers/counts alone. "}<code>{"compute_labels"}</code>{" and the ordinary estimator's stopping/reporting settings determine which output was computed; check that contract before labeling a batch estimate “full inertia.”"}</Prose>

<Prose>{"The supplied histories 0/6/9 and 0/0/0/9/9/9 show another consequence. For the second history, old mass slows adaptation to the shift: after the first 9 the mean is 2.25, then 3.6, then 4.5. The arithmetic is correct for all remembered arrivals, while a current-arrival objective could want a different response. "}<code>{"forget(factor)"}</code>{" reduces remembered mass without moving centers, so future arrivals receive more relative influence. It is a deliberately different weighted-history policy, not silently ordinary MiniBatchKMeans."}</Prose>

<Prose>{"We can now read the complete retained production source, including its standardized Faithful fits and diagnostics followed by its distinct 150-row synthetic KMeans/MiniBatch/Ward comparison. That comparison uses the same "}<code>{"make_blobs"}</code>{" settings as section 6: three generated centers, scatter 0.8 and data seed 42. The full and mini-batch models each request three centers and ten initializations; MiniBatch's batch size is 64. The Ward route takes Euclidean coordinates. All three act on the same generated rows; this is separate from the 272 observed Faithful records."}</Prose>

<span id="full-program-o3" />

<Prose>{"Complete file: "}<code>{"clustering_production.py"}</code>{". Run with "}<code>{"python clustering_production.py"}</code>{" after the shared setup in section 2."}</Prose>

<RemoteCodeBlock filename="clustering_production.py" source="/learn-code/k-means-hierarchical-clustering/clustering_production.py" language="python" title="Faithful fits/diagnostics plus MiniBatch/Ward comparison; complete after all operations (§15)." />

<span id="recorded-output-o3" />

<Prose>{"Recorded output: "}<code>{"clustering_production.stdout.txt"}</code>{"."}</Prose>

<RemoteCodeBlock filename="clustering_production.stdout.txt" source="/learn-code/k-means-hierarchical-clustering/clustering_production.stdout.txt" language="output" title="Complete recorded output for the same-name worked program." />

<Prose>{"That comparison's full-data KMeans SSE 181.504432 and MiniBatch SSE 181.647280 come from its recorded complete dataset pass; both silhouette scores are .876025. It is separate from the fresh weighted-batch arithmetic. Mini-batches compress an assignment history into center/count state. Another streaming method compresses local scatter summaries into a branching tree, retaining more useful operands while still discarding individual rows."}</Prose>

<SectionHeading id="16-compress-summaries-and-split-recursively">{"16. Compress scatter or split a group recursively"}</SectionHeading>

<Prose>{"Remembered counts and means support a running representative. To preserve within-entry scatter too, add a second-moment quantity. We will open the summary, its stable arithmetic and the complete tree that stores it before using it as a shortcut for another fit."}</Prose>

<Mechanism id="D54" />

<Prose>{"For rows 0/2, a "}<strong>{"clustering feature"}</strong>{" can store count N=2, linear sum LS=2 and squared-norm sum SS=4. Mean is LS/N=1 and scatter is SS−LS²/N=2. Adding 6 gives N=3, LS=8, SS=40, mean 8/3 and scatter 56/3. In d dimensions, LS is a vector and SS is the scalar sum of squared row norms. Disjoint summaries merge by adding their counts, linear sums and squared sums. At N=0, the summary is an empty identity with no mean."}</Prose>

<Prose>{"Those fields recover the mean and total squared scatter of the summarized members. They do not recover individual rows, the full distribution or arbitrary point-level reassignment. Weighted total mass is a useful separate analogue of count; the complete tree implementation below uses unit arrivals and integer counts so its member-count semantics stay explicit."}</Prose>

<Mechanism id="D55" />

<Prose>{"Raw SS−‖LS‖²/N subtracts large nearly equal values for observations far from the origin. For offset±1 with offset 10¹², both raw terms are near 2×10²⁴, while true scatter is 2. Clamping a negative raw result to zero would not recover the lost precision. The display computes the actual float64 subtraction for the selected offset and places it beside centered deviations."}</Prose>

<Prose>{"Store (N,μ,M2) instead, with M2=∑‖xᵢ−μ‖². For disjoint summaries A/B, δ=μB−μA and N=NA+NB:"}</Prose>

<div className="neural-equation"><MathBlock>{"\\mu=\\mu_A+\\frac{N_B}{N}\\delta,\\qquad\nM2=M2_A+M2_B+\\frac{N_A N_B}{N}\\|\\delta\\|^2."}</MathBlock></div>

<Prose>{"This is the same mean-shift identity used for Ward, now used to maintain stable summary operands. Empty summaries return the other operand. A finite input can still exceed the representable squared-distance range; centered arithmetic reduces cancellation, not every possible floating-point failure. The raw CF representation used by ordinary Birch is a distinct numerical choice from this stable scratch summary."}</Prose>

<H3>{"Insert through child slots and a leaf radius"}</H3>

<Prose>{"Three summary fields are not a tree. A complete streaming structure must choose a path, decide whether to absorb an arrival, manage capacity and repair parents."}</Prose>

<Mechanism id="D56" />

<Prose>{"At a leaf, entry {0,2} has N=2, mean 1, scatter 2 and RMS radius √(M2/N)=1. Candidate 4 would give count 3, mean 2, scatter 8 and radius √(8/3)≈1.632993. Threshold 1 rejects absorption and creates a new entry; a threshold at least that merged radius accepts it. The arrival is retained in either case. This radius is a root-mean-square residual about the entry mean, not the largest member residual, a branch height or a global diameter."}</Prose>

<Prose>{"An internal node chooses its nearest child-entry mean and descends. A leaf chooses its nearest entry mean, constructs the hypothetical merged summary and tests the threshold. The leaf's threshold condition does not require every internal-node summary to have that radius: internal nodes summarize many distinct leaf entries."}</Prose>

<Mechanism id="D57" />

<Prose>{"With capacity 2, leaf entries {0,2} at mean 1 and {5} at mean 5 have no free slot for arrival 9. Their overflow uses farthest seed means 1/9. Whole entry 5 ties at length 4 from either seed and joins the earlier seed, yielding leaf entries [{0,2},{5}] and [{9}]. The new leaf receives a neighbor link, the old leaf's following link is repaired, and a parent gains or updates its child ports and aggregate summaries. Overflow can propagate through an internal node; splitting the root adds a new root with two children. The step control shows these actual slot operations, not a claim that the overflowing point was dropped."}</Prose>

<Prose>{"The complete CF-tree code owns nearest-child descent, threshold absorption, new entries, farthest-seed redistribution, recursive leaf/internal splitting, root growth, summary repair and doubly linked leaves. Entries move whole summaries during a split; they do not resplit discarded original observations. Its exported state gives count/mean/scatter, child structure and actual linked leaf IDs. IDs name tree paths in that snapshot and can change after insertion. The structure preserves summary information without promising row recovery."}</Prose>

<span id="full-program-n7" />

<Prose>{"Complete file: "}<code>{"clustering_cf_tree.py"}</code>{". Run with "}<code>{"python clustering_cf_tree.py"}</code>{" after the shared setup in section 2."}</Prose>

<RemoteCodeBlock filename="clustering_cf_tree.py" source="/learn-code/k-means-hierarchical-clustering/clustering_cf_tree.py" language="python" title="Stable summaries, bounded CF nodes/splits/links and explicit tree export (§16)." />

<span id="recorded-output-n7" />

<Prose>{"Recorded output: "}<code>{"clustering_cf_tree.stdout.txt"}</code>{"."}</Prose>

<RemoteCodeBlock filename="clustering_cf_tree.stdout.txt" source="/learn-code/k-means-hierarchical-clustering/clustering_cf_tree.stdout.txt" language="output" title="Complete recorded output for the same-name worked program." />

<Prose>{"The program's distinct stream 0,.2,2,4,6,8,10 uses threshold .15 and capacity 2. After seven arrivals it has total count 7 and three linked leaves with two entries each. The first two arrivals share a center .1; the others remain singleton entries. Ordinary "}<code>{"Birch(threshold=.15, branching_factor=2, n_clusters=None).partial_fit"}</code>{" produces the same displayed subcluster centers on that stream. The comparison checks summary and threshold invariants; undocumented tie or storage choices need not produce byte-identical trees. The three-point offset example's raw subtraction was −536870912 while the stable scatter was 2 on the tested float64 execution, a concrete demonstration of catastrophic cancellation rather than a universal constant failure value."}</Prose>

<Prose>{"For branch capacity c, dimension d and traversed depth H, ordinary insertion examines O(c d H) mean-distance/summary operands; a farthest-seed split examines O(c²d) candidates at an affected node. Tree size and depth depend on accepted entries, thresholds and arrival order. There is no universal logarithmic-time promise. Capacity and a smaller radius threshold trade compression against stored summary detail."}</Prose>

<Prose>{"Ordinary Birch's "}<code>{"threshold"}</code>{" controls leaf absorption and "}<code>{"branching_factor"}</code>{" controls node capacity. "}<code>{"subcluster_centers_"}</code>{" exposes the compressed centers; "}<code>{"subcluster_labels_"}</code>{" maps them to optional global groups. "}<code>{"n_clusters=None"}</code>{" keeps subclusters without the default second-stage agglomerative clustering. "}<code>{"predict"}</code>{" assigns queries to subcluster centers and maps their labels; it is not a reconstruction of discarded members. When using batches, distinguish labels for the processed batch from a fresh prediction pass over any full retained dataset."}</Prose>

<Mechanism id="D58" />

<Prose>{"For a whole entry {0,2}, count 2, mean 1 and scatter 2, assignment to center 4 has cost 2+2(1−4)²=20, equal to original residuals 16+4. The exact general identity is M2+N‖μ−c‖². It is exact for a "}<strong>{"whole-entry assignment"}</strong>{". Assigning the individual rows separately to centers 0/2 gives zero, but the summary has no individual assignment ports to express that resplit."}</Prose>

<Prose>{"Unequal entry masses matter in a later restricted center fit. Entries{0,0} and {6} have means 0/6 and masses 2/1, giving weighted representative 2. Treating the two entry means as equally weighted gives 3. Birch's default global clustering uses unweighted subcluster centers; that is not the same operation as a custom mass-weighted summary objective. The complete program's "}<code>{"restricted_cost"}</code>{" evaluates the scatter offset plus weighted displacement without claiming equivalence to arbitrary original-point reassignments."}</Prose>

<H3>{"Bisecting works downward through stored splits"}</H3>

<Prose>{"A second hierarchical route retains recursive partitions rather than an arrival-compression tree. Begin with all rows, split one group into two with the complete local Lloyd procedure, choose another eligible group, and repeat."}</Prose>

<Mechanism id="D59" />

<Prose>{"For rows 0,2,8,10, the first split has means 1/9. Both groups have SSE 2; the largest-SSE policy's lower-node-ID tie chooses the left group next. Its split gives final leaves 0,2,9. Query 3 first chooses the parent-side center 1, then chooses leaf 2; the intermediate comparisons stay visible beside the final leaf distances. At this default query, recursive and global nearest-leaf decisions agree. They need not agree for every query: the root boundary is 5, while leaf 2/9's global midpoint is 5.5. A query 5.1 follows the stored right branch to 9 even though its globally nearest leaf mean is 2."}</Prose>

<Prose>{"That path defines the learned recursive predictor. Replacing it with one global pass over final leaves changes the system. Largest-group-count and largest-SSE are different split policies; the controls expose the actual chosen group and earlier split state."}</Prose>

<Prose>{"The complete bisecting program calls N1 for each local two-center split, using declared first/farthest member starts. It keeps the actual intermediate center pairs and child nodes, records split trace and serializes the complete tree and feature dimension. It terminates early when duplicate-only groups cannot form two occupied children. Query traversal follows stored center pairs until a leaf supplies its label, including after JSON reload."}</Prose>

<span id="full-program-n8" />

<Prose>{"Complete file: "}<code>{"clustering_bisecting.py"}</code>{". Run with "}<code>{"python clustering_bisecting.py"}</code>{" after the shared setup in section 2."}</Prose>

<RemoteCodeBlock filename="clustering_bisecting.py" source="/learn-code/k-means-hierarchical-clustering/clustering_bisecting.py" language="python" title="Recursive two-way center fits and stored-path prediction (§16)." />

<span id="recorded-output-n8" />

<Prose>{"Recorded output: "}<code>{"clustering_bisecting.stdout.txt"}</code>{"."}</Prose>

<RemoteCodeBlock filename="clustering_bisecting.stdout.txt" source="/learn-code/k-means-hierarchical-clustering/clustering_bisecting.stdout.txt" language="output" title="Complete recorded output for the same-name worked program." />

<Prose>{"Its six-row main has the same final partition as ordinary BisectingKMeans on that supplied case, despite different numeric group IDs. The recorded query paths show the actual intermediate nodes. Ordinary "}<code>{"bisecting_strategy=\"biggest_inertia\""}</code>{" or "}<code>{"\"largest_cluster\""}</code>{" selects the split policy; "}<code>{"n_init"}</code>{", initialization, local tolerance and iteration budget control each two-way fit. Costs sum the work of actual local splits and queries traverse actual depth, so a balanced-tree guarantee is not assumed. This top-down split history is different from Ward's bottom-up irreversible joins. It offers another way to organize representatives, which also make useful coarse routers for searching a vector collection."}</Prose>

<span id="12-recognize-when-another-objective-is-needed" /><SectionHeading id="17-route-search-and-change-the-objective">{"17. Use representatives for search and change the objective deliberately"}</SectionHeading>

<Prose>{"A representative can route work instead of replacing a measurement. For nearest-neighbor search, coarse centers divide a database into posting lists; the query searches selected lists and then compares actual database vectors. Open those lists before attaching an approximation claim to their results."}</Prose>

<Mechanism id="D60" />

<Prose>{"Supplied coarse centers 0/10 have boundary 5. Database ID 0 at 4.9 belongs to list 0; ID 1 at 6 belongs to list 1. Query 5.1 chooses list 1 and returns database 6 at length .9. The true nearest database row 4.9 is only .2 away, but its ID was never searched. With "}<code>{"nprobe=2"}</code>{", both lists enter the exact candidate reranking and recover ID 0. The returned database ID is not a center ID or a cluster confidence. These coarse coordinates are an unfitted routing witness."}</Prose>

<Prose>{"The scratch index stores unique IDs, their coordinate rows and posting-list row positions. A search sorts coarse-center squared distances, selects "}<code>{"nprobe"}</code>{" lists, joins their actual candidates and reranks their exact distances. Stable row order resolves exact reranking ties. An empty selected list returns an explicitly empty neighbor result; it cannot fabricate database ID 0. With all lists probed, every stored database row is a candidate and the route becomes the full-scan reference under the same tie rule."}</Prose>

<Prose>{"For k coarse centers, d coordinates and m visited database rows, this reference computes O(kd+md) distance arithmetic and stable sorts in O(k log k+m log m). It stores database coordinates and one posting position per row, plus the centers; a query needs its selected candidate IDs and distances. Fewer visited rows can reduce comparisons while losing the true nearest row. That arithmetic tradeoff is separate from a measured latency or recall curve."}</Prose>

<span id="full-program-n9" />

<Prose>{"Complete file: "}<code>{"clustering_ivf_routing.py"}</code>{". Run with "}<code>{"python clustering_ivf_routing.py"}</code>{" after the shared setup in section 2."}</Prose>

<RemoteCodeBlock filename="clustering_ivf_routing.py" source="/learn-code/k-means-hierarchical-clustering/clustering_ivf_routing.py" language="python" title="Supplied coarse-list search and optional ordinary Faiss Flat/IVF route (§17)." />

<span id="recorded-output-n9" />

<Prose>{"Recorded output: "}<code>{"clustering_ivf_routing.stdout.txt"}</code>{"."}</Prose>

<RemoteCodeBlock filename="clustering_ivf_routing.stdout.txt" source="/learn-code/k-means-hierarchical-clustering/clustering_ivf_routing.stdout.txt" language="output" title="Complete recorded output for the same-name worked program." />

<Prose>{"The ordinary optional path uses Faiss 1.15.1 on float32 rows. "}<code>{"IndexFlatL2"}</code>{" stores a complete exact L2 search; "}<code>{"IndexIVFFlat"}</code>{" has a learned coarse quantizer, actual posting lists and exact within-list vector comparisons. "}<code>{"train"}</code>{" learns its coarse state from the supplied training vectors; "}<code>{"add"}</code>{" stores the database rows and assigns their implicit row IDs; "}<code>{"search"}</code>{" returns IDs and "}<strong>{"squared"}</strong>{" L2 distances. "}<code>{"nprobe"}</code>{" changes the candidate lists searched, not the number of final neighbors."}</Prose>

<Prose>{"Use the tested optional CPU package in a separate environment if needed:"}</Prose>

<CodeBlock language="sh">{"python -m pip install faiss-cpu==1.15.1\npython clustering_ivf_routing.py --faiss"}</CodeBlock>

<span id="recorded-output-n9-faiss" />

<Prose>{"Recorded output: "}<code>{"clustering_ivf_routing.faiss.stdout.txt"}</code>{"."}</Prose>

<RemoteCodeBlock filename="clustering_ivf_routing.faiss.stdout.txt" source="/learn-code/k-means-hierarchical-clustering/clustering_ivf_routing.faiss.stdout.txt" language="output" title="Recorded optional four-query CPU Faiss comparison (§17)." />

<Prose>{"The actual bounded ordinary example trained on 256 constructed two-dimensional vectors and added 64 database rows. Four queries returned IDs 63/62/31/33 with both "}<code>{"nprobe=1"}</code>{" and all four lists, matching FlatL2 on those queries. This unchanged result is useful evidence about that input, not a general recall or latency benchmark. The preceding explicit boundary witness explains how a miss can occur. Without the optional package, the NumPy scratch route is complete; requesting "}<code>{"--faiss"}</code>{" requires the package rather than substituting made-up ordinary-tool output. Faiss's ordinary installation and index documentation describe the supported platform/build choices."}</Prose>

<H3>{"A nearest-mean cell has a shape constraint"}</H3>

<Prose>{"Changing the number of centers cannot express every desired group with one nearest-mean cell. We can derive the boundary instead of inferring it from a color plot."}</Prose>

<Mechanism id="D61" />

<Prose>{"For supplied centers (−1,0)/(1,0), the assignment boundary is x=0: subtracting their squared distances cancels the shared xᵀx term. Points on two concentric rings with radii 1/3 are split into left/right groups, not into their externally specified inner/outer ring identities. The ring outline names that intended identity; fill names the actual nearest-center assignment. Moving the outer query around its ring exposes the same constraint at different angles."}</Prose>

<Prose>{"For centers a/b, choosing a means ‖x−a‖²≤‖x−b‖², equivalent to 2(b−a)ᵀx≤‖b‖²−‖a‖². Each comparison is a half-space. Intersecting these half-spaces over all other centers makes a Euclidean Voronoi cell convex. A single cell therefore cannot represent an entire ring surrounding another group. Multiple cells or a changed objective/representation may answer the desired question, but the number of colors alone does not remove that geometry."}</Prose>

<Prose>{"Earlier we noted that a mean may not be an actual row. A "}<strong>{"medoid"}</strong>{" restricts the representative to one observed object and minimizes a declared sum of dissimilarities to that object. A density-based method instead builds groups from local neighborhood density/connectivity, with its own radius/count and noise policies. A mixture model supplies component distributions and soft responsibilities. These are different entities and objectives; the named clustering and mixture lessons develop their complete algorithms. Choose them for the task's constraints rather than treating their APIs as interchangeable ways to fit the same SSE."}</Prose>

<H3>{"Normalize a direction and its center as separate operations"}</H3>

<Prose>{"For document or other directional vectors, magnitudes may be less relevant than angles. Unit-normalizing rows does not by itself make an ordinary mean a unit direction."}</Prose>

<Mechanism id="D62" />

<Prose>{"Fixed group A contains unit rows (1,0)/(0,1), so its ordinary mean is (.5,.5), whose norm is 1/√2. Its normalized direction is (1/√2,1/√2). Group B's unit row is (1,0). Query(12/13,5/13) is also unit length. Ordinary squared distances to the two unnormalized means are 5/26 and 2/13, choosing B. Dot products with the normalized centers are 17/(13√2) and 12/13, choosing A. These are supplied fixed member groups, not a claimed fitted partition of the duplicated input coordinate."}</Prose>

<Prose>{"For unit rows and centers, maximizing the cosine dot product is equivalent to minimizing squared Euclidean distance, since ‖x−c‖²=2−2xᵀc. The "}<strong>{"spherical"}</strong>{" update maximizes within-group dot products under ‖c‖=1: form the member mean and normalize its direction. The constraint changes the update; ordinary KMeans on normalized input rows still uses ordinary unconstrained means."}</Prose>

<Prose>{"At exactly opposite members(1,0)/(−1,0), the mean cancels and no unique normalized direction is determined. The supplied previous unit center(1,0) is retained by our declared policy. Near-zero means use norm tolerance 1e−12 and that same retention rule. The antipodal coordinates are explicit, avoiding a spurious nonzero "}<code>{"sin(pi)"}</code>{" residue. Zero-norm input is rejected because it has no direction. Scikit-learn "}<code>{"normalize"}</code>{" and "}<code>{"cosine_similarity"}</code>{" are the ordinary primitives for this route. A complete spherical fit alternates maximum-dot-product assignment, normalized member-mean updates and a fresh assignment. "}<code>{"spherical"}</code>{" implements that loop: exact score ties keep the lower center index, empty or canceled groups retain their previous unit directions, and a budget return remains separate from unchanged-label completion. Its array comparison work is O(nkd) per iteration, with a visible n-by-k score array; normalization costs O(nd+kd). A direct "}<code>{"normalize"}</code>{" followed by matrix dot products gives the ordinary primitive route, rather than an invented SphericalKMeans estimator that conceals these operations."}</Prose>

<H3>{"Store an implicit mean as training-row coefficients"}</H3>

<Prose>{"A transformed feature space can make different shapes separable. A kernel lets us compute its inner products without explicitly storing every mapped coordinate, but its centers and queries need a precise representation."}</Prose>

<Mechanism id="D63" />

<Prose>{"Take scalar rows 1/2 with map φ(x)=(x,x²), giving points (1,1)/(2,4). Their mean is (1.5,2.5). The kernel K(x,y)=xy+x²y² gives Gram matrix [[2,6],[6,20]]. A mean uses coefficients α=[.5,.5], naming those training rows in their stored order. Query 0 gives kernel row[0,0] and self-kernel 0. Its squared distance is 0−0+αᵀKα=8.5, matching its explicit mapped distance to (1.5,2.5)."}</Prose>

<Prose>{"For a center μ=∑ᵢαᵢφ(xᵢ), the query distance is"}</Prose>

<div className="neural-equation"><MathBlock>{"\\|\\phi(q)-\\mu\\|^2\n=K(q,q)-2k(q,X)\\alpha+\\alpha^\\top K(X,X)\\alpha."}</MathBlock></div>

<Prose>{"The query self-kernel, its n-value row and the center's n coefficients are separate sockets. After assignment, an occupied group's coefficients are 1/count for its members and zero elsewhere; an empty group retains its previous coefficients. New queries must use the same kernel and training-row order. Training Gram validation checks finite values, symmetry and positive semidefiniteness within the stated tolerance. Materially negative squared query distances are rejected; only bounded roundoff-level negatives are clamped to zero. Arbitrary query rows do not become a valid kernel merely because one distance happened to be positive."}</Prose>

<Prose>{"The complete directional/kernel program supplies both loops. Its kernel route stores a dense n-by-n Gram matrix, checks its eigenvalues and uses coefficient updates. This is a bounded inspectable input route, not a scaling improvement: Gram storage is O(n²), generic eigenspectrum validation O(n³), and one direct iteration computes Kα in O(n²k), followed by O(nk) distance and coefficient work. The n-by-k coefficient/distance arrays add O(nk) storage. Approximate features would change that representation and need a separate approximation contract."}</Prose>

<span id="full-program-n10" />

<Prose>{"Complete file: "}<code>{"clustering_directional_kernel.py"}</code>{". Run with "}<code>{"python clustering_directional_kernel.py"}</code>{" after the shared setup in section 2."}</Prose>

<RemoteCodeBlock filename="clustering_directional_kernel.py" source="/learn-code/k-means-hierarchical-clustering/clustering_directional_kernel.py" language="python" title="Normalized directional means and coefficient kernel training/query route (§17)." />

<span id="recorded-output-n10" />

<Prose>{"Recorded output: "}<code>{"clustering_directional_kernel.stdout.txt"}</code>{"."}</Prose>

<RemoteCodeBlock filename="clustering_directional_kernel.stdout.txt" source="/learn-code/k-means-hierarchical-clustering/clustering_directional_kernel.stdout.txt" language="output" title="Complete recorded output for the same-name worked program." />

<Prose>{"For its four scalar rows−2,−1,1,2, the explicit φ route with ordinary KMeans and matching initial mapped rows has the same partition as the coefficient route. Centers are (−1.5,2.5)/(1.5,2.5), and the zero-query distances are 8.5 to both. Its kernel is xy+x²y², not the default polynomial(xy+1)². The two routes agree because their actual feature inner products and initialization agree. Spectral clustering optimizes a different construction; a kernel matrix's presence alone does not identify its objective with kernel SSE."}</Prose>

<H3>{"Take a small-variance limit under explicit mixture assumptions"}</H3>

<Prose>{"Soft membership can approach the nearest-center rule under particular conditions. Open one fixed inference operation before relating the models."}</Prose>

<Mechanism id="D64" />

<Prose>{"With means 0/2, query .5, equal priors and common σ=.5, squared distances are .25/2.25. Gaussian factors are proportional to exp(−distance²/(2σ²)). After stable shifting and normalization, responsibilities are 1/(1+e⁻⁴)≈.982014 and .017986. Changing the query, common σ or prior ratio changes those explicit operands; no fitted mixture is claimed."}</Prose>

<Prose>{"For positive fixed priors πⱼ and common isotropic variance σ²,"}</Prose>

<div className="neural-equation"><MathBlock>{"r_j(q)=\\frac{\\pi_j e^{-\\|q-\\mu_j\\|^2/(2\\sigma^2)}}\n {\\sum_a\\pi_a e^{-\\|q-\\mu_a\\|^2/(2\\sigma^2)}}."}</MathBlock></div>

<Prose>{"Logits are logπⱼ−distance²/(2σ²). Subtracting their maximum before exponentiating preserves normalized ratios and avoids overflow. The code also subtracts the row's minimum distance before dividing by a very small positive σ, a common shift that leaves at least one finite candidate logit. "}<code>{"scipy.special.logsumexp"}</code>{" supplies the ordinary stable normalization for the same scores."}</Prose>

<span id="full-program-n11" />

<Prose>{"Complete file: "}<code>{"clustering_soft_limit.py"}</code>{". Run with "}<code>{"python clustering_soft_limit.py"}</code>{" after the shared setup in section 2."}</Prose>

<RemoteCodeBlock filename="clustering_soft_limit.py" source="/learn-code/k-means-hierarchical-clustering/clustering_soft_limit.py" language="python" title="Stable fixed-model responsibilities and ordinary logsumexp comparison (§17)." />

<span id="recorded-output-n11" />

<Prose>{"Recorded output: "}<code>{"clustering_soft_limit.stdout.txt"}</code>{"."}</Prose>

<RemoteCodeBlock filename="clustering_soft_limit.stdout.txt" source="/learn-code/k-means-hierarchical-clustering/clustering_soft_limit.stdout.txt" language="output" title="Complete recorded output for the same-name worked program." />

<Prose>{"As σ→0 with a unique nearest mean and fixed positive priors, all other factors vanish relatively and its responsibility tends to 1. At an exact nearest-distance tie, the tied priors determine the limiting ratio; for priors 3/1 at query 1, the result remains .75/.25. σ=0 itself is outside the formula's domain. Unequal covariances or changing priors need not have this same limit."}</Prose>

<Prose>{"Deeper: for fixed means and equal priors, the mixture's negative log likelihood multiplied by 2σ² approaches the sum of nearest-center squared distances, up to constants that vanish or are independent of those assignments. The log-sum-exp becomes a minimum at small common variance. That explains a connection to SSE; it does not supply the full mixture EM training algorithm. The Gaussian Mixture Models lesson owns parameter estimation and broader covariance models, while this program implements a complete fixed-parameter responsibility calculation."}</Prose>

<H3>{"Decide which feature differences deserve to survive"}</H3>

<Prose>{"All these objectives still begin with a representation. Duplicating a measurement or discarding a direction can change the question before any fit starts. End with the actual feature rows rather than another unlabeled island plot."}</Prose>

<Mechanism id="D65" />

<Prose>{"The supplied sample rows are (−2,−2,−.1),(−1,−1,.1),(1,1,−.1),(2,2,.1). The first two columns repeat the same feature profile. For two rows, their distance contribution is (Δx)²+(Δx)²+w(Δz)², so the repeated coordinate counts twice. The transpose makes those profiles visible. The third-feature weight control changes its contribution without changing the sample IDs."}</Prose>

<Prose>{"Projecting onto the supplied unit ruler(1,1,0)/√2 preserves a diagonal component and discards the third coordinate. This ruler is an explicit projection witness, not a claimed fitted leading PCA direction: the four-row table has a nonzero cross-product with its third coordinate. PCA will learn its basis from the actual data; its variance-optimal direction need not be this supplied ruler."}</Prose>

<Prose>{"Low variance also does not guarantee irrelevance to a task. A separate paired witness (−1,−1,−.1)/(−1,−1,.1) has external targets 0/1 defined by the sign of its third coordinate. Projecting away that coordinate makes their representations identical, so that target distinction becomes unavailable. The original four rows have distinct projected x values and alone would not establish this target-loss claim. Target outline and partition fill remain separate encodings."}</Prose>

<Prose>{"An expression-profile teaching proposal raises the same representation questions: are observations patients or genes, what normalization and batch effects matter, and which clinically meaningful evidence is available? Five hundred rows have 124,750 unordered pairs, but that count alone does not establish feasibility or validity for 20,000 genes. A visualization's islands are not independent clinical validation. The next lesson, "}<a href={"/learn/path/full-curriculum/pca-dimensionality-reduction?module=classical-ml"}>{"PCA & Dimensionality Reduction"}</a>{", opens learned variance-preserving directions and their reconstruction objective. Carry the row/feature/geometry distinctions with you when deciding whether a lower-dimensional representation serves your actual task."}</Prose>

<span id="13-practise-diagnose-and-transfer" /><SectionHeading id="18-practise-and-transfer-with-a-complete-report">{"18. Practise the decisions and carry the representations forward"}</SectionHeading>

<Prose>{"Use changed inputs to check that you can reconstruct the operation, not only recognize a favorable result. Each prompt stays visible; open a hint or complete solution when you need feedback. The first ten tasks retain their full worked examples. The later eight add implementation and diagnosis transfer using the complete programs taught above."}</Prose>

<section className="lesson-exercise" data-lesson-exercise=""><H3>{"1. Move means on a new dataset"}</H3>

<Prose>{"In one dimension, use rows 0,2,3,9 with k=2 and initial centers 0,3. Assign ties to the lower-index center. Calculate the first assignment, its error, the mean update and the next assignment. Is the first mean update already a fixed point?"}</Prose>

<details>

<summary>Hint</summary>

<Prose>{"Compare squared distances for each row. Keep the assignments fixed while computing each new mean."}</Prose>

</details>

<details>

<summary>Complete solution</summary>

<Prose>{"The first groups are [0] and [2,3,9], with error 0+1+0+36=37. Their new means are 0 and 14/3. With these memberships the error is 86/3≈28.6667. The new midpoint is 7/3, so row 2 now chooses the first center. The first mean update was not a fixed point. The next groups [0,2] and [3,9] have means 1 and 6 and error 20. Another assignment moves row 3 left; eventually [0,2,3] has mean 5/3 and [9] has mean 9, with error 14/3. An apparently improved intermediate answer need not be finished."}</Prose>

</details>

</section><section className="lesson-exercise" data-lesson-exercise=""><H3>{"2. Prove why an extra center is not evidence"}</H3>

<Prose>{"A colleague gets training inertia 2,500 for k=3 and 2,490 for k=4 and declares four real populations. What can you conclude? What if the fitted inertia for k=4 had been 2,510?"}</Prose>

<details>

<summary>Hint</summary>

<Prose>{"Separate the globally best objective allowed by k, the result of this optimizer and the usefulness of a partition."}</Prose>

</details>

<details>

<summary>Complete solution</summary>

<Prose>{"The observed reduction is 10/2,500=.4%, but its practical meaning depends on units and the task. Lower error by itself cannot identify real populations. Inspect the range of k, fit stability, group profiles, the selected metric and an independent decision criterion. If a k=4 run returns 2,510, it is a worse local fit or a changed setup; the globally optimal k=4 objective still cannot exceed the k=3 optimum. Do not infer a violation of that property from two imperfect optimization runs."}</Prose>

</details>

</section><section className="lesson-exercise" data-lesson-exercise=""><H3>{"3. Predict a seeding draw"}</H3>

<Prose>{"Rows are 0,1,4, and the first center is 0. What are the vanilla D² probabilities? Which row is selected by a uniform draw u=.05 if intervals follow row order? What changes if all rows are 0?"}</Prose>

<details>

<summary>Hint</summary>

<Prose>{"The cumulative interval for row 1 has length 1/17. Division by a zero total is not a probability rule."}</Prose>

</details>

<details>

<summary>Complete solution</summary>

<Prose>{"The probabilities are 0, 1/17, 16/17. Since .05<1/17≈.0588, row 1 is selected even though 4 is farther away. With all rows at zero, every row is already represented exactly. Stop with zero error or use a declared duplicate-center fallback if an API must return k centers. Neither option justifies silently generating NaNs."}</Prose>

</details>

</section><section className="lesson-exercise" data-lesson-exercise=""><H3>{"4. Change the units without changing the question"}</H3>

<Prose>{"A distance uses spend in dollars and a squared-distance weight of 1/1,000,000 on that column. You convert spend to thousands of dollars. What should the new weight be? Would independently standardizing every column preserve the same question?"}</Prose>

<details>

<summary>Hint</summary>

<Prose>{"A coordinate multiplier a requires dividing its old weight by a²."}</Prose>

</details>

<details>

<summary>Complete solution</summary>

<Prose>{"The coordinate multiplier is .001, so the new weight is (1/1,000,000)/(.001²)=1. This preserves that column’s distance contribution. Standardization instead uses data-dependent inverse-variance weights. It might be appropriate, but it need not preserve the original distance or objective. Explain why its relative weights serve the application."}</Prose>

</details>

</section><section className="lesson-exercise" data-lesson-exercise=""><H3>{"5. Derive a changed Ward merge"}</H3>

<Prose>{"Group A has 3 observations with mean 1; group B has 2 with mean 6. Their internal squared errors are 2 and .5. Find the merged mean, the extra error, the new total error and the SciPy-style Ward height."}</Prose>

<details>

<summary>Hint</summary>

<Prose>{"The means are five units apart. Keep the old scatter separate from the penalty for moving representatives."}</Prose>

</details>

<details>

<summary>Complete solution</summary>

<Prose>{"The mean is (3·1+2·6)/5=3. The increment is (3·2/5)·25=30. The merged error is 2+.5+30=32.5. The Ward height is √60≈7.74597, not 30 and not the centroid separation 5. Checking directly gives movement penalties 3·(1−3)²+2·(6−3)²=12+18=30."}</Prose>

</details>

</section><section className="lesson-exercise" data-lesson-exercise=""><H3>{"6. Read a tree with tied heights"}</H3>

<Prose>{"A six-leaf tree has successive monotone merge heights .5,.7,.7,3,8. Under a cut that includes all merges at or below t, can any horizontal threshold produce exactly four groups? What do the two .7 operations imply for a four-group merge-count prefix?"}</Prose>

<details>

<summary>Hint</summary>

<Prose>{"Start with six groups and count how many joins enter together at each distinct height."}</Prose>

</details>

<details>

<summary>Complete solution</summary>

<Prose>{"No. Below .5 there are six groups; from .5 to below .7 there are five; at .7 there are three. A merge-count prefix can stop after two merges and leave four groups, but it must choose which tied .7 merge was second. That is a tie-order decision, not a height difference represented in the data. Rotating the drawing does not resolve it."}</Prose>

</details>

</section><section className="lesson-exercise" data-lesson-exercise=""><H3>{"7. Diagnose a persuasive but misleading dashboard"}</H3>

<Prose>{"A dashboard plots two UMAP islands, reports silhouette .82, names them low-risk and high-risk, and compares [0,0,1,1] with [1,1,0,0] as 0% agreement. Identify at least four separate issues."}</Prose>

<details>

<summary>Hint</summary>

<Prose>{"Inspect geometry, the meaning of a metric, external labels and label permutation before looking at formatting."}</Prose>

</details>

<details>

<summary>Complete solution</summary>

<Prose>{"The projection can alter distances and create apparent separation; state whether silhouette uses original or projected coordinates and why. A favorable score does not validate a risk label; such names need independent outcome evidence and an evaluation protocol. The two label vectors describe the same partition, so raw label accuracy is wrong. Also ask whether preprocessing and model selection used held-out information and whether the result is stable across justified representations and populations."}</Prose>

</details>

</section><section className="lesson-exercise" data-lesson-exercise=""><H3>{"8. Count colors, not just distinct color names"}</H3>

<Prose>{"A grayscale image has nine pixels of value 0 and one of value 100. For a single unconstrained representative, compare the correct mean/error with clustering the two distinct values without weights. Why can the better floating-point mean still require a separate stored-palette check?"}</Prose>

<details>

<summary>Hint</summary>

<Prose>{"The original image has ten observations. A repeated value must contribute repeatedly to the objective."}</Prose>

</details>

<details>

<summary>Complete solution</summary>

<Prose>{"The correct mean is 10 and error is 9·10²+90²=9,000. Treating 0 and 100 equally gives mean 50, whose error on the original ten pixels is 10·50²=25,000. Counts preserve the intended objective. In another example the learned mean may not be an integer channel value, so rounding the stored palette changes the reconstruction and should be scored separately. Here 10 is already integral."}</Prose>

</details>

</section><section className="lesson-exercise" data-lesson-exercise=""><H3>{"9. Change the geyser’s units"}</H3>

<Prose>{"Suppose Old Faithful waiting times are expressed in seconds while eruption durations stay in minutes. Predict how this changes raw squared distances. Must it change the fitted partition? Compare the raw-seconds, raw-minutes and standardized two-center fits, and explain which measurements would be available for a future-wait recommendation."}</Prose>

<details>

<summary>Hint</summary>

<Prose>{"Multiplying one column by 60 multiplies its squared differences by 3,600. A changed objective need not move any observation across the final assignment boundary. Standardization cancels a positive unit conversion when the fitted scales are converted consistently."}</Prose>

</details>

<details>

<summary>Complete solution</summary>

<Prose>{"The raw objective puts 3,600 times as much weight on a given waiting-time difference, relative to an unchanged duration difference. Yet a changed objective need not change the best candidate found. In the checked fit with the lesson’s settings, raw seconds and raw minutes give exactly the same memberships; both differ from the standardized fit on 4 of 272 observations after matching group labels. The raw-seconds centers are approximately (2.09433 minutes, 3,285 seconds) and (4.29793 minutes, 4,817.093 seconds). Divide the second coordinate by 60 to recover the raw-minute centers (2.09433, 54.75) and (4.29793, 80.28488). There is no further drift in the duration coordinates in this case."}</Prose>

<Prose>{"Standardizing each column with consistently converted training means and standard deviations makes this positive unit change cancel. Equal variance is a defensible exploratory choice, not the only geometry. Clustering on waiting time alone can describe historical waits, but a visitor asking about a future wait cannot supply that outcome. A recommendation needs an assignment rule based on already observed information, such as eruption duration, and the separate held-out check described in "}<a href={"#d47-duration-only-forecast"}>{"section 13’s duration-only example"}</a>{"."}</Prose>

</details>

</section><section className="lesson-exercise" data-lesson-exercise=""><H3>{"10. Design a scientifically defensible grouping"}</H3>

<Prose>{"You receive expression measurements for 500 patients across 20,000 genes and are asked for patient subgroups. Propose an analysis plan, then give one reason a technically correct Ward tree could still mislead."}</Prose>

<details>

<summary>Hint</summary>

<Prose>{"Specify the observation and measurement model before choosing a normalization, feature reduction or clinical name."}</Prose>

</details>

<details>

<summary>Complete solution</summary>

<Prose>{"An acceptable plan states patient-level sampling, measurement and batch provenance, missingness and the intended use; chooses and justifies normalization and the meaning of similarity; checks sensitivity to feature selection and representation; explores suitable linkages and resolutions; and evaluates stability and external associations on separated evidence. Dense pair storage for 500 rows is only 124,750 values, about 1 MB of float64 distances, but the feature matrix and validation costs remain. A tree may primarily recover batch effects or irrelevant variation. There is no universal “use Ward, standardize everything and reduce to 50 dimensions” answer."}</Prose>

</details>

</section><section className="lesson-exercise" data-lesson-exercise=""><H3>{"11. Replace the large assignment tensor"}</H3>

<Prose>{"An assignment implementation allocates a float64 difference tensor for n=10,000,k=20,d=10. Replace it with B=256 row blocks and one center at a time. Preserve lower-index exact ties and return labels plus nearest squared distances. What memory changes, and what work remains?"}</Prose>

<details>

<summary>Hint</summary>

<Prose>{"Keep only each active row's running best value and index. The next center competes with those cells; it does not require a permanent new dimension."}</Prose>

</details>

<details>

<summary>Complete solution</summary>

<Prose>{"The broadcast difference tensor uses 10,000×20×10×8=16,000,000 bytes, about 15.259 MiB. A 256×10 difference block uses 20,480 bytes; B float64 best values and B int64 indices add 2,048 bytes each, about 24 KiB in this accounted workspace. Input, centers, output arrays and additional ufunc temporaries are outside that subtotal. Work remains O(nkd); chunking changes storage, not the set of necessary declared comparisons."}</Prose>

<Prose>{"Reuse the exact "}<code>{"assign_chunked"}</code>{" implementation rather than creating another tie rule. It visits centers in ascending ID order and replaces on strict improvement. The changed five-row case has a remainder block and a midpoint tie at row 1 between centers 0/2, which chooses index 0. Its complete case follows the implementation below."}</Prose>

<Prose>{"Contextual excerpt from "}<code>{"clustering_core.py"}</code>{"."}</Prose>

<CodeBlock language="python" filename="clustering_core.py">{"def assign_chunked(points, centers, block_size=256):\n    \"\"\"Nearest labels and squared lengths; exact ties keep the lower center ID.\n\n    Process B rows and one center at a time. No n-by-k distance matrix is stored.\n    Persistent outputs are n labels and n minima. Temporary array size is O(Bd+B).\n    \"\"\"\n    points = points_array(points)\n    centers = points_array(centers)\n    if points.shape[1] != centers.shape[1]:\n        raise ValueError(\"Rows and centers must have the same feature dimension.\")\n    if not isinstance(block_size, (int, np.integer)) or block_size <= 0:\n        raise ValueError(\"block_size must be a positive integer.\")\n    labels = np.empty(len(points), dtype=np.int64)\n    distances = np.empty(len(points), dtype=float)\n    for start in range(0, len(points), block_size):\n        stop = min(start + block_size, len(points))\n        block = points[start:stop]\n        best = squared_to_center(block, centers[0])\n        chosen = np.zeros(len(block), dtype=np.int64)\n        for center_id in range(1, len(centers)):\n            candidate = squared_to_center(block, centers[center_id])\n            improve = candidate < best\n            best[improve] = candidate[improve]\n            chosen[improve] = center_id\n        labels[start:stop] = chosen\n        distances[start:stop] = best\n    return labels, distances"}</CodeBlock>

<Prose>{"Contextual excerpt from "}<code>{"clustering_transfer.py"}</code>{"."}</Prose>

<CodeBlock language="python" filename="clustering_transfer.py">{"def memory_assignment():\n    points = np.array([[0.0], [1.0], [2.0], [3.0], [4.0]])\n    labels, distances = assign_chunked(points, [[0.0], [2.0]], block_size=2)\n    assert labels[1] == 0 and labels[3] == 1\n    return {\"labels\": labels.tolist(), \"squared_distances\": distances.tolist(),\n            \"broadcast_bytes\": 10000 * 20 * 10 * 8,\n            \"difference_bytes\": 256 * 10 * 8,\n            \"best_distance_bytes\": 256 * 8, \"best_index_bytes\": 256 * 8}"}</CodeBlock>

<Prose>{"The n-by-k matrix of all-center distances would be a different requested output, requiring that storage even when the n-by-k-by-d difference tensor is avoided. This task asks only for labels/minima, so it needs neither."}</Prose>

</details>

</section><section className="lesson-exercise" data-lesson-exercise=""><H3>{"12. Refresh the bound after a center moves"}</H3>

<Prose>{"x=2 is assigned to C0=0, with upper bound 2. Candidate C1 was 6 with lower bound 4, then moves to 3. Can the old lower bound still justify skipping it? How does the exact tie change when the candidate is 4 instead?"}</Prose>

<details>

<summary>Hint</summary>

<Prose>{"Bounds are ordinary lengths. Subtract the candidate's movement before testing the lower bound; recompute the center half-separation too."}</Prose>

</details>

<details>

<summary>Complete solution</summary>

<Prose>{"Candidate movement is 3. Updated lower=max(0,4−3)=1, upper=2 and new half-separation=1.5. Neither strict skip inequality holds. Its exact distance is 1, less than assigned distance 2, so it must win. At candidate 4, the exact distance is 2; lower-index ties keep C0. A strict guard cannot suppress a possible lower-index tied winner in a different assignment state."}</Prose>

<Prose>{"This runnable refresh case exposes both comparisons and asserts that its lower bound is below the actual distance. The complete Elkan program in section 6 handles the corresponding per-row arrays, outward rounding, assigned-distance refresh and candidate checks. Replacing lengths with squared values would invalidate the triangle-based update."}</Prose>

<Prose>{"Contextual excerpt from "}<code>{"clustering_transfer.py"}</code>{"."}</Prose>

<CodeBlock language="python" filename="clustering_transfer.py">{"def refresh_bound(candidate=3.0):\n    x, assigned, old_candidate = 2.0, 0.0, 6.0\n    upper, old_lower = 2.0, 4.0\n    movement = abs(candidate - old_candidate)\n    lower = max(0.0, old_lower - movement)\n    half_separation = abs(candidate - assigned) / 2\n    skip = upper < lower or upper < half_separation\n    exact = abs(x - candidate)\n    assert lower <= exact\n    winner = 1 if exact < abs(x - assigned) else 0\n    return {\"upper\": upper, \"lower\": lower, \"half_separation\": half_separation,\n            \"skip\": skip, \"exact_candidate\": exact, \"winner\": winner}"}</CodeBlock>

</details>

</section><section className="lesson-exercise" data-lesson-exercise=""><H3>{"13. Build the changed single-linkage tree"}</H3>

<Prose>{"Use rows 0,2,3,9. Derive its MST, linkage rows and inclusive cuts at 1/2/6 without storing a dense pair matrix. A colleague instead passes a square distance matrix to "}<code>{"linkage"}</code>{". Repair that interface too."}</Prose>

<details>

<summary>Hint</summary>

<Prose>{"In one dimension, adjacent sorted gaps give a spanning tree. Keep source row IDs separate from their coordinate values when writing its child fields."}</Prose>

</details>

<details>

<summary>Complete solution</summary>

<Prose>{"The relevant edges are coordinate 2–3 of length 1,0–2 of length 2 and 3–9 of length 6. Their row-index pairs are 1–2,0–1,2–3. Dense Prim starts at row 0; its candidate to row 1 has length 2, then row 2's candidate improves to 1 when row 1 is visited, and the final edge to row 3 has length 6. Sorting these commits the row-index linkage [1,2,1,2], [0,4,2,3], [3,5,6,4]."}</Prose>

<Prose>{"Threshold 1 gives {0},{2,3},{9}; threshold 2 gives {0,2,3},{9}; threshold 6 gives one group. The three-point component at threshold 2 has endpoint diameter 3: connection through a path is not a diameter bound. The changed case below calls the complete MST/union-find implementations and compares ordinary single-linkage heights on the actual coordinate matrix."}</Prose>

<Prose>{"Contextual excerpt from "}<code>{"clustering_transfer.py"}</code>{"."}</Prose>

<CodeBlock language="python" filename="clustering_transfer.py">{"def changed_single_tree():\n    points = np.array([[0.0], [2.0], [3.0], [9.0]])\n    edges = minimum_spanning_edges(points)\n    tree = edges_to_linkage(edges, len(points))\n    ordinary = linkage(points, method=\"single\", metric=\"euclidean\")\n    assert np.allclose(tree[:, 2], ordinary[:, 2])\n    return {\"edges\": sorted(edges), \"tree\": tree.tolist(),\n            \"cuts\": {str(t): cut_edges(edges, len(points), t).tolist() for t in [1, 2, 6]}}"}</CodeBlock>

<Prose>{"Repair the colleague's call by passing the coordinate matrix, or by validating the dissimilarity matrix and converting it with "}<code>{"squareform"}</code>{" to the actual condensed pair order. For four rows, that order is 01,02,03,12,13,23. The unconverted square rows would instead become new coordinate observations. Tied valid MSTs need not use the same binary child order to preserve threshold components."}</Prose>

</details>

</section><section className="lesson-exercise" data-lesson-exercise=""><H3>{"14. Fix the unequal-size average update"}</H3>

<Prose>{"|A|=2, |B|=1, d(A,C)=2 and d(B,C)=8. A programmer sets d(A∪B,C)=5."}</Prose>

<Prose>{"Give the correct update and explain why the same formula cannot simply be called Ward or complete linkage."}</Prose>

<details>

<summary>Hint</summary>

<Prose>{"Count the member contributions: two copies of the A-to-C average and one copy of the B-to-C average."}</Prose>

</details>

<details>

<summary>Complete solution</summary>

<Prose>{"The correct result is (2×2+1×8)/3=4. Unweighted (2+8)/2=5 gives the smaller group disproportionate influence. A concrete cross-member case has A at −2/2, B at 8 and C at 0. Its three lengths are 2,2,8, whose mean is 4. The runnable feedback uses the exact direct member-definition function, then checks child IDs in a separate valid NN-chain hierarchy."}</Prose>

<Prose>{"Contextual excerpt from "}<code>{"clustering_transfer.py"}</code>{"."}</Prose>

<CodeBlock language="python" filename="clustering_transfer.py">{"def unequal_average():\n    points = np.array([[-2.0], [2.0], [8.0], [0.0]])\n    direct = member_distance(points, [0, 1, 2], [3], \"average\")\n    updated = (2 * 2 + 1 * 8) / 3\n    assert direct == updated == 4\n    # A separate complete hierarchy exercises the actual NN-chain output IDs.\n    tree = nn_chain([[0.0], [.2], [4.0], [8.0]], \"average\")\n    assert all(max(row[:2]) < 4 + i for i, row in enumerate(tree))\n    return {\"member_contributions\": [2, 2, 8], \"correct_average\": direct,\n            \"unweighted_wrong\": (2 + 8) / 2, \"valid_tree\": tree.tolist()}"}</CodeBlock>

<Prose>{"Complete linkage would update this cell with max(2,8)=8. Ward instead updates squared reported heights q using the group-count recurrence in section 11, including the subtractive qAB term. The array element's meaning is part of the algorithm. Stable reciprocal ties and output ID reconstruction remain necessary; correcting this mean does not justify the chain algorithm for centroid linkage with inversions."}</Prose>

</details>

</section><section className="lesson-exercise" data-lesson-exercise=""><H3>{"15. Diagnose a negative silhouette and an undefined logarithm"}</H3>

<Prose>{"Point 1 belongs to {1,6}, while the other group is {0,4}. Find its silhouette. Then a gap computation reaches all singleton groups, W=0. What is a correct response? Apply the rule to gaps .1/.4/.43 and next uncertainties .05/.08."}</Prose>

<details>

<summary>Hint</summary>

<Prose>{"The point score uses group-member lengths. The gap uses a logarithm with its own domain; neither uses distance to an assigned center as a substitute."}</Prose>

</details>

<details>

<summary>Complete solution</summary>

<Prose>{"a=5, b=(1+3)/2=2, so s=(2−5)/5=−.6. The negative score says another group's average member distance is shorter under this declared partition. Singleton rows use score 0 in an otherwise valid partition; one group or one group per row makes the whole silhouette undefined."}</Prose>

<Prose>{"log 0 is undefined. Stop/report an unavailable gap or use another predeclared k range with positive dispersions. An undocumented epsilon creates a new statistic and can manufacture a selection. In the supplied gap cells, k=1 fails .1≥.4−.05 and k=2 passes .4≥.43−.08. The smallest qualifier is 2; k=3 has no next cell and is not another tested success. The changed code evaluates every point score and checks the zero-dispersion rejection without performing a clustering fit for that rejection witness."}</Prose>

<Prose>{"Contextual excerpt from "}<code>{"clustering_transfer.py"}</code>{"."}</Prose>

<CodeBlock language="python" filename="clustering_transfer.py">{"def diagnose_scores():\n    points = np.array([[0.0], [1.0], [4.0], [6.0]])\n    scores = point_silhouettes(points, [0, 1, 0, 1], block_size=2)\n    stopped = False\n    try:\n        gap_reference(points, [1, 2], fitter=lambda rows, k, seed: 0.0)\n    except ValueError:\n        stopped = True\n    assert stopped and np.isclose(scores[1], -.6)\n    gaps, spread = [.1, .4, .43], [0, .05, .08]\n    tests = [gaps[i] >= gaps[i + 1] - spread[i + 1] for i in range(2)]\n    selected = next((i + 1 for i, passed in enumerate(tests) if passed), None)\n    return {\"point_silhouettes\": scores.tolist(), \"zero_log_stopped\": stopped,\n            \"neighbor_tests\": tests, \"selected_k\": selected}"}</CodeBlock>

</details>

</section><section className="lesson-exercise" data-lesson-exercise=""><H3>{"16. Restore the entire mini-batch history"}</H3>

<Prose>{"Arrivals 0/6 produced center 3 and remembered mass 2. Someone saves only the center, restores mass 1 and resumes with 9. Find the correct and wrong results, then repair the saved state and demonstrate a cached two-row batch update."}</Prose>

<details>

<summary>Hint</summary>

<Prose>{"Mass counts how much assigned evidence is remembered, not how many calls the update function has made."}</Prose>

</details>

<details>

<summary>Complete solution</summary>

<Prose>{"Correct continuation gives (2×3+9)/3=5; restoring mass 1 gives (3+9)/2=6. Giving the new arrival mass 4 instead gives (2×3+4×9)/6=7. Save schema, feature dimension, centers and masses, together with the update/tie policy and supplied initialization when those identify the resumed system."}</Prose>

<Prose>{"The full case wraps N6's validated JSON state in explicit algorithm and tie metadata, restores it through "}<code>{"BatchMeans.from_json"}</code>{" and continues the same history. It also caches the rows 4/6 against incoming centers 0/10 and masses 1/1 before committing centers 2/8 and masses 2/2."}</Prose>

<Prose>{"Contextual excerpt from "}<code>{"clustering_transfer.py"}</code>{"."}</Prose>

<CodeBlock language="python" filename="clustering_transfer.py">{"def restore_history():\n    history = BatchMeans([[3.0]], [2.0])\n    envelope = {\"algorithm\": \"cached-weighted-batch-mean-v1\", \"tie_policy\": \"lowest-index\",\n                \"initial_centers\": [[0.0]], \"state\": json.loads(history.to_json())}\n    saved = json.dumps(envelope)\n    loaded = json.loads(saved)\n    if loaded[\"algorithm\"] != \"cached-weighted-batch-mean-v1\" or loaded[\"tie_policy\"] != \"lowest-index\":\n        raise ValueError(\"Stored update or tie policy is unsupported.\")\n    restored = BatchMeans.from_json(json.dumps(loaded[\"state\"]))\n    restored.update([[9.0]])\n    wrong = BatchMeans([[3.0]], [1.0])\n    wrong.update([[9.0]])\n    heavy = BatchMeans([[3.0]], [2.0])\n    heavy.update([[9.0]], [4.0])\n    cached = BatchMeans([[0.0], [10.0]], [1.0, 1.0])\n    cached.update([[4.0], [6.0]])\n    return {\"saved\": envelope, \"restored_mean\": restored.centers.tolist(),\n            \"wrong_mean\": wrong.centers.tolist(), \"heavy_mean\": heavy.centers.tolist(),\n            \"cached_centers\": cached.centers.tolist(), \"cached_masses\": cached.masses.tolist()}"}</CodeBlock>

<Prose>{"Counts are neither confidence scores nor iteration counters. Resuming that state cannot recover discarded past rows or reassign them to the moved centers; those operations require actual data and another pass."}</Prose>

</details>

</section><section className="lesson-exercise" data-lesson-exercise=""><H3>{"17. Test the limits of a compressed summary"}</H3>

<Prose>{"Entry {0,2} has count 2, mean 1 and scatter 2. Compute its cost at center 4, then compare a resplit to centers 0/2. Diagnose raw scatter for 10¹²±1, and trace arrivals 0,2,5,9 through capacity 2/threshold 1 CF-tree insertion."}</Prose>

<details>

<summary>Hint</summary>

<Prose>{"The summary preserves the whole-entry displacement identity. Ask where individual-row reassignment would enter, then follow the actual overflow slots."}</Prose>

</details>

<details>

<summary>Complete solution</summary>

<Prose>{"Whole-entry cost is 2+2(1−4)²=20, equal to 16+4. Splitting the original points onto 0/2 gives zero, which is unavailable from a whole-entry assignment. For the offset pair, stable merged M2 is 2. Raw SS and LS²/N are nearly equal large quantities; a rounded zero or negative result cannot be repaired by merely clamping it."}</Prose>

<Prose>{"At threshold 1,0/2 share an entry with radius 1. Arrival 5 cannot be absorbed and uses the second slot. Arrival 9 creates a third entry; farthest seeds 1/9 split the overflow. Entry 5 ties and follows the earlier seed 1. The new root has two leaf children, whole count 4 and repaired neighbor links. The full changed case checks the restricted cost, stable scatter, counts, slot capacity and actual links using the complete summary/tree implementation."}</Prose>

<Prose>{"Contextual excerpt from "}<code>{"clustering_transfer.py"}</code>{"."}</Prose>

<CodeBlock language="python" filename="clustering_transfer.py">{"def summary_limits():\n    summary = Summary.point([0.0]).merge(Summary.point([2.0]))\n    cost = summary.restricted_cost([4.0])\n    offset = Summary.point([1e12 - 1]).merge(Summary.point([1e12 + 1]))\n    tree = CFTree(1, threshold=1, capacity=2).partial_fit([[0.0], [2.0], [5.0], [9.0]])\n    leaves = tree.leaves()\n    assert sum(entry.summary.count for node in leaves for entry in node.entries) == 4\n    assert all(len(node.entries) <= 2 for node in leaves)\n    assert leaves[1].previous is leaves[0] and leaves[0].following is leaves[1]\n    assert cost == 20 and offset.scatter == 2\n    return {\"whole_entry_cost\": cost, \"separate_point_resplit_cost\": 0,\n            \"stable_offset_scatter\": offset.scatter, \"tree\": tree.state()}"}</CodeBlock>

<Prose>{"Default unweighted global clustering of subcluster means treats their masses differently from a custom restricted weighted objective. No summary check establishes arbitrary point-level resplitting equivalence."}</Prose>

</details>

</section><section className="lesson-exercise" data-lesson-exercise=""><H3>{"18. Reject a search miss and complete an independent task"}</H3>

<Prose>{"First use supplied coarse centers 0/10, database rows 4.9/6 and query 5.1. Trace nprobe 1, then nprobe 2, including actual searched IDs and distances. Then use the complete portable CSV route on a responsibly chosen input: declare the observation, feature availability, units, row IDs, split roles, candidate/eligibility rule and intended task before fitting."}</Prose>

<details>

<summary>Hint</summary>

<Prose>{"A candidate list can exclude the best database row. In the independent task, freeze selection responsibilities before the final test becomes available."}</Prose>

</details>

<details>

<summary>Complete solution and success criteria</summary>

<Prose>{"nprobe 1 selects list 1 and returns 6 at length .9, excluding true nearest 4.9 at .2. nprobe 2 searches both lists and recovers it. The complete changed case exposes IDs, squared distances and their ordinary-length interpretation. It is inference over supplied coarse state, not a claimed trained index or performance measurement."}</Prose>

<Prose>{"Contextual excerpt from "}<code>{"clustering_transfer.py"}</code>{"."}</Prose>

<CodeBlock language="python" filename="clustering_transfer.py">{"def routing_error():\n    index = build_lists([[4.9], [6.0]], [[0.0], [10.0]], [0, 1])\n    narrow, full = search(index, [5.1], 1), search(index, [5.1], 2)\n    assert narrow[\"ids\"] == [1] and full[\"ids\"] == [0]\n    return {\"one_list\": narrow, \"all_lists\": full,\n            \"lengths\": [float(np.sqrt(narrow[\"squared_distances\"][0])),\n                        float(np.sqrt(full[\"squared_distances\"][0]))]}"}</CodeBlock>

<Prose>{"The complete answer helper, including its imports, is "}<a href={"/learn-code/k-means-hierarchical-clustering/clustering_transfer.py"}>{"clustering_transfer.py"}</a>{". Put it beside "}<code>{"clustering_core.py"}</code>{", "}<code>{"clustering_single_mst.py"}</code>{", "}<code>{"clustering_nn_chain.py"}</code>{", "}<code>{"clustering_diagnostics.py"}</code>{", "}<code>{"clustering_chunked_lloyd.py"}</code>{", "}<code>{"clustering_minibatch.py"}</code>{", "}<code>{"clustering_cf_tree.py"}</code>{" and "}<code>{"clustering_ivf_routing.py"}</code>{". Import its definitions and call the changed case:"}</Prose>

<CodeBlock language="shell">{"python -c \"import clustering_transfer as cases; print(cases.routing_error())\""}</CodeBlock>

<Prose>{"For an immediately runnable open-task example, use "}<code>{"clustering_own_task_example.csv"}</code>{", its construction documentation, requirements, N12 and the core dependency. Keep the declared x/y features, 18/6/6 roles, k=2/3/4 candidates and eligibility rule; run the complete command in section 13. The supplied result reports all three validation rows, selects 3 by silhouette, keeps the original training state, then reports test distance .0037129392, baseline 1.9790697533 and counts 2/2/2. Identify those as constructed-input results and save the complete JSON instead of only the winner's number."}</Prose>

<Prose>{"For a different real task, a complete report states measurement/sampling provenance and missingness, justifies units and feature availability, preserves the actual split IDs and all candidate outcomes, names the selection rule, and supplies fixed-state final distance/baseline/group profiles. Include a counterexample or alternative representation: an unseen range, unavailable feature, small unstable group or shape that a mean cell cannot express. Explain which claims need external labels or decision evidence. If an old test result inspired a new representation or threshold, obtain fresh final evidence rather than reuse it as an untouched evaluation."}</Prose>

<Prose>{"The retained capstone variation 29/31 is another already recorded input: selected 3, test .253428, baseline 2.043875 and counts 18/17/25. Its exact selection/profile values remain in the recorded-example comparison; they are not a new execution of this portable thirty-row route. Successful transfer means a reproducible question and honest conclusion, not the smallest number among unrelated tests."}</Prose>

</details>

<section className="lesson-ending lesson-ending--next" data-lesson-ending="next"><H3>{"Check your readiness"}</H3>

<Prose>{"Before continuing, explain and carry out these operations on changed inputs:"}</Prose>

<ul><li>{"Define the observation and features available when a query arrives, then"}</li></ul>

<Prose>{"  defend the units and distance rather than choosing colors first."}</Prose>

<ul><li>{"Trace assignment, a weighted mean update and a fresh assignment pass;"}</li></ul>

<Prose>{"  distinguish a fixed point from a tolerance/budget return."}</Prose>

<ul><li>{"Derive a Ward increment and map it to a documented branch-height convention;"}</li></ul>

<Prose>{"  explain why tied height cuts and exact count cuts can differ."}</Prose>

<ul><li>{"Change a complete program while preserving its state, ties and dependencies,"}</li></ul>

<Prose>{"  then interpret its actual output against an ordinary tool or direct calculation."}</Prose>

<ul><li>{"Identify what a compressed summary, restricted posting list or projection"}</li></ul>

<Prose>{"  discarded, and reject a result requiring unavailable information."}</Prose>

<ul><li>{"Declare learning/selection/evaluation roles before a new independent task,"}</li></ul>

<Prose>{"  retaining all candidate outcomes and the fixed final state."}</Prose>

<Prose>{"The next representation question is "}<a href={"/learn/path/full-curriculum/pca-dimensionality-reduction?module=classical-ml"}>{"PCA & Dimensionality Reduction"}</a>{". Its learned directions use variance and reconstruction, while your task determines which lost differences matter."}</Prose></section>

<section className="lesson-ending lesson-ending--further-learning" data-lesson-ending="further-learning" data-lesson-resource-list=""><H3>{"Further learning"}</H3>

<ul><li>{""}<a href={"https://www.statlearning.com/"}>{"James et al.: An Introduction to Statistical Learning with Applications in Python"}</a>{","}</li></ul>

<Prose>{"  §12.4, is a free book treatment for a second pass through standardizing,   KMeans, hierarchy and dendrograms. Read after sections 7–10, retaining the   distance and cut conventions when adapting its package examples."}</Prose>

<ul><li>{""}<a href={"https://hastie.su.domains/ElemStatLearn/"}>{"Hastie, Tibshirani and Friedman: The Elements of Statistical Learning"}</a>{","}</li></ul>

<Prose>{"  §14.3 in the free author-hosted corrected book, connects scatter, pair   dissimilarity and geometric extensions. Read after the local derivations;   probability and matrix notation help with its deeper branches."}</Prose>

<ul><li>{""}<a href={"https://ocw.mit.edu/courses/15-071-the-analytics-edge-spring-2017/resources/video-5-hierarchical-clustering-0/"}>{"MIT OpenCourseWare: The Analytics Edge, Video 5—Hierarchical Clustering"}</a>{""}</li></ul>

<Prose>{"  is a short guided video with an official transcript. Use it after branch   fields and cuts. Its centroid example needs the inversion interpretation   from section 11; a visually large gap is a cut heuristic."}</Prose>

<ul><li>{""}<a href={"https://scikit-learn.org/stable/auto_examples/cluster/plot_kmeans_assumptions.html"}>{"Scikit-learn: Demonstration of KMeans assumptions"}</a>{""}</li></ul>

<Prose>{"  is an executable geometry tutorial about groups with different shapes,   spreads and sizes after section 17. Declare its setup and inputs when   running it; visual separation still needs a task-specific interpretation."}</Prose>

<ul><li>{""}<a href={"https://scikit-learn.org/stable/auto_examples/cluster/plot_agglomerative_dendrogram.html"}>{"Scikit-learn: Plot Hierarchical Clustering Dendrogram"}</a>{""}</li></ul>

<Prose>{"  maps "}<code>{"children_"}</code>{", "}<code>{"distances_"}</code>{" and descendant counts to a linkage array.   Use it after section 10 with the full-tree setting and height convention explicit."}</Prose></section>

<section className="lesson-ending lesson-ending--references" data-lesson-ending="references" data-lesson-resource-list=""><H3>{"Technical references"}</H3>

<ul><li>{""}<a href={"https://search.r-project.org/R/refmans/datasets/html/faithful.html"}>{"R datasets: Old Faithful Geyser Data"}</a>{""}</li></ul>

<Prose>{"  documents the 272-row Härdle/R version, units and measurement rounding,   and distinguishes the fuller 299-row Azzalini–Bowman record. The values   used here came from the Rdatasets mirror on 21 September 2026; that mirror   is a distribution route, not the original scientific collector."}</Prose>

<ul><li>{""}<a href={"https://web.stanford.edu/class/ee398a/handouts/papers/Lloyd%20-%20Least%20Squares%20Q%20in%20PCM.pdf"}>{"Lloyd: Least Squares Quantization in PCM"}</a>{","}</li></ul>

<Prose>{"  IEEE Transactions on Information Theory 28 (1982), develops the representative   and quantization connection from the earlier Bell Labs note. Read its   conditional update under the original setting and assumptions."}</Prose>

<ul><li>{""}<a href={"https://theory.stanford.edu/~sergei/papers/kMeansPP-soda.pdf"}>{"Arthur and Vassilvitskii: k-means++"}</a>{","}</li></ul>

<Prose>{"  SODA 2007, gives vanilla D² initialization and its expected approximation   argument; a single draw and greedy local trials remain distinct."}</Prose>

<ul><li>{""}<a href={"https://arxiv.org/abs/1203.6402"}>{"Bahmani et al.: Scalable K-Means++"}</a>{""}</li></ul>

<Prose>{"  gives oversampling rounds, candidate reweighting and final reduction behind   the visible k-means|| sketch, with separate distributed cost assumptions."}</Prose>

<ul><li>{""}<a href={"https://cdn.aaai.org/ICML/2003/ICML03-022.pdf"}>{"Elkan: Using the Triangle Inequality to Accelerate k-Means"}</a>{""}</li></ul>

<Prose>{"  develops length bounds and their repair after center motion. Read after   section 6's strict guards and bound-matrix tradeoff."}</Prose>

<ul><li>{""}<a href={"https://link.springer.com/article/10.1007/s10994-009-5103-0"}>{"Aloise et al.: NP-hardness of Euclidean sum-of-squares clustering"}</a>{""}</li></ul>

<Prose>{"  and "}<a href={"https://www.sciencedirect.com/science/article/pii/S0304397510003269"}>{"Mahajan et al.: The planar k-means problem is NP-hard"}</a>{"   give separate growing-dimension/fixed-k and planar/growing-k regimes.   These advanced statements concern joint global optimization."}</Prose>

<ul><li>{""}<a href={"https://cseweb.ucsd.edu/~avattani/papers/kmeans.pdf"}>{"Vattani: k-means requires exponentially many iterations even in the plane"}</a>{""}</li></ul>

<Prose>{"  and "}<a href={"https://arxiv.org/abs/0904.1113"}>{"Arthur, Manthey and Röglin: Smoothed Analysis of the k-Means Method"}</a>{"   distinguish adversarial iteration behavior from perturbation-based expected   analysis, after the finite-stopping argument."}</Prose>

<ul><li>{""}<a href={"https://www.tandfonline.com/doi/abs/10.1080/01621459.1963.10500845"}>{"Ward: Hierarchical Grouping to Optimize an Objective Function"}</a>{""}</li></ul>

<Prose>{"  is the original criterion paper; full text may require publisher access.   "}<a href={"https://www.numericalecology.com/Reprints/Murtagh_Legendre_J_Class_2014.pdf"}>{"Murtagh and Legendre: Which Algorithms Implement Ward's Criterion?"}</a>{"   explains the incompatible squared/ordinary-input and height conventions."}</Prose>

<ul><li>{""}<a href={"https://arxiv.org/abs/1109.2378"}>{"Müllner: Modern Hierarchical, Agglomerative Clustering Algorithms"}</a>{""}</li></ul>

<Prose>{"  develops MST/chain algorithms, reducible updates and valid output schedules.   Read after section 11's actual arrays and pointer operations."}</Prose>

<ul><li>{""}<a href={"https://doi.org/10.1016/0377-0427(87)90125-7"}>{"Rousseeuw: Silhouettes"}</a>{""}</li></ul>

<Prose>{"  gives the original member-distance score and interpretation; its denominators   and singleton convention matter in an implementation."}</Prose>

<ul><li>{""}<a href={"https://hastie.su.domains/Papers/gap.pdf"}>{"Tibshirani, Walther and Hastie: The gap statistic"}</a>{""}</li></ul>

<Prose>{"  gives reference-distribution comparison, simulation spread and the next-k   rule. The "}<a href={"https://svn.r-project.org/R-packages/trunk/cluster/R/clusGap.R"}>{"official R clusGap source"}</a>{"   exposes its distance power, finite-B variance and fallback conventions."}</Prose>

<ul><li>{""}<a href={"https://www.ra.ethz.ch/cdstore/www2010/www/p1177.pdf"}>{"Sculley: Web-Scale K-Means Clustering"}</a>{""}</li></ul>

<Prose>{"  develops mini-batch updates. Its projected sparse variant and experiments   are distinct from ordinary estimator defaults and this machine's performance."}</Prose>

<ul><li>{""}<a href={"https://www2.cs.sfu.ca/CourseCentral/459/han/papers/zhang96.pdf"}>{"Zhang, Ramakrishnan and Livny: BIRCH"}</a>{""}</li></ul>

<Prose>{"  develops CF summaries, tree insertion/splitting and the wider multi-phase   method. Read after the stable tree, retaining its information-loss limits."}</Prose>

<ul><li>{""}<a href={"https://scikit-learn.org/stable/modules/generated/sklearn.cluster.KMeans.html"}>{"KMeans"}</a>{","}</li></ul>

<Prose>{"  "}<a href={"https://scikit-learn.org/stable/modules/generated/sklearn.cluster.MiniBatchKMeans.html"}>{"MiniBatchKMeans"}</a>{",   "}<a href={"https://scikit-learn.org/stable/modules/generated/sklearn.cluster.Birch.html"}>{"Birch"}</a>{",   "}<a href={"https://scikit-learn.org/stable/modules/generated/sklearn.cluster.BisectingKMeans.html"}>{"BisectingKMeans"}</a>{"   and "}<a href={"https://scikit-learn.org/stable/modules/generated/sklearn.cluster.AgglomerativeClustering.html"}>{"AgglomerativeClustering"}</a>{"   are the ordinary parameter/state contracts. The new examples use the   recorded scikit-learn 1.9.1 snapshot; check future defaults explicitly."}</Prose>

<ul><li>{""}<a href={"https://docs.scipy.org/doc/scipy/reference/generated/scipy.cluster.hierarchy.linkage.html"}>{"SciPy linkage"}</a>{","}</li></ul>

<Prose>{"  "}<a href={"https://docs.scipy.org/doc/scipy/reference/generated/scipy.cluster.hierarchy.fcluster.html"}>{"fcluster"}</a>{",   "}<a href={"https://docs.scipy.org/doc/scipy/reference/generated/scipy.cluster.hierarchy.cut_tree.html"}>{"cut_tree"}</a>{"   and "}<a href={"https://docs.scipy.org/doc/scipy/reference/generated/scipy.cluster.hierarchy.dendrogram.html"}>{"dendrogram"}</a>{"   specify shapes, methods, endpoint policies and branch fields. New examples   were checked with SciPy 1.18.1 and NumPy 2.3.5; each earlier stdout keeps   its own source/settings attribution."}</Prose>

<ul><li>{""}<a href={"https://github.com/facebookresearch/faiss/wiki/Faiss-indexes"}>{"Faiss index descriptions"}</a>{","}</li></ul>

<Prose>{"  "}<a href={"https://github.com/facebookresearch/faiss/wiki/FAQ"}>{"FAQ"}</a>{" and   "}<a href={"https://github.com/facebookresearch/faiss/blob/main/INSTALL.md"}>{"installation guide"}</a>{"   specify Flat/IVF contracts and supported installation routes. The optional   CPU example uses its named 1.15.1 wheel and float32 rows."}</Prose></section>

</section><H3>{"Complete files"}</H3>

<Prose>{"The common file index gives each complete source its actual name, annotation and Copy/Download. The six retained source/output pairs, twelve new main programs, pure arithmetic/codec dependencies and supplied data/setup have complete files. Contextual excerpts link to those same sources. The changed-input practice helper stays with its solutions. Put a program and its stated dependencies in one directory before running it; requirements fix the tested snapshot. Recorded stdout belongs to its named source/input, not another slider state."}</Prose>

<CompleteFiles /></div></KMeansStateProvider>; }
export default { title:'K-Means & Hierarchical Clustering', readTime:'Estimate: several hours of reading and practice', hasIntegratedGuide:true, content:Content };
