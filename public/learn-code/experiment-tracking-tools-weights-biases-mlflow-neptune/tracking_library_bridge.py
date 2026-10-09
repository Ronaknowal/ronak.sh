"""Run: python tracking_library_bridge.py OUTPUT_DIR. W&B is explicitly offline."""
import argparse
import hashlib
import json
import os
from pathlib import Path
import numpy as np
from portable_run_store import RunStore, canonical, digest


def run(root):
    root = Path(root).resolve()
    root.mkdir(parents=True, exist_ok=True)
    for variable, folder in [("WANDB_DATA_DIR", "wandb-data"), ("WANDB_CACHE_DIR", "wandb-cache"),
                             ("WANDB_CONFIG_DIR", "wandb-config")]:
        destination = root / folder
        destination.mkdir(exist_ok=True)
        os.environ[variable] = str(destination)
    os.environ["WANDB_MODE"] = "offline"
    import mlflow
    import wandb
    x = np.array([-2., -1., 1., 2.])
    y = np.array([-3., -1., 3., 5.])
    config = {"rate": .1, "objective": "half_mean_squared_error", "step_unit": "optimizer_update",
              "data_sha256": hashlib.sha256(canonical({"x": x.tolist(), "y": y.tolist()}).encode()).hexdigest(),
              "source_sha256": digest(__file__),
              "store_sha256": digest(Path(__file__).with_name("portable_run_store.py")),
              "numpy_version": np.__version__, "mlflow_version": mlflow.__version__,
              "wandb_version": wandb.__version__, "dtype": "float64", "randomness": "none"}
    store = RunStore(root / "portable")
    local_id = store.begin(config)
    mlflow.set_tracking_uri("sqlite:///" + (root / "mlflow.sqlite").as_posix())
    experiment = mlflow.get_experiment_by_name("calibration-contract")
    experiment_id = experiment.experiment_id if experiment else mlflow.create_experiment(
        "calibration-contract", artifact_location=(root / "mlflow-artifacts").as_uri())
    # Offline mode keeps this demonstration local; there is no login or sync.
    with mlflow.start_run(experiment_id=experiment_id) as mlrun, wandb.init(
            project="calibration-contract", mode="offline", dir=str(root), config=config) as wbrun:
        mlflow.log_params(config)
        mlflow.set_tag("portable_run_id", local_id)
        wbrun.define_metric("optimizer_step")
        wbrun.define_metric("train/*", step_metric="optimizer_step")
        w, b = 0., 0.
        for step in range(21):
            residual = w * x + b - y
            value = float(np.mean(residual ** 2) / 2)
            store.metric(local_id, "train/loss", step, value)
            mlflow.log_metric("train/loss", value, step=step)
            wbrun.log({"optimizer_step": step, "train/loss": value})
            if step < 20:
                w, b = w - .1 * np.mean(residual * x), b - .1 * np.mean(residual)
        checkpoint = root / f"{local_id}-checkpoint.json"
        checkpoint.write_text(canonical({"w": float(w), "b": float(b), "step": 20}), encoding="utf-8")
        identity = store.artifact(local_id, "checkpoint/step-20", checkpoint)
        mlflow.log_artifact(str(checkpoint), artifact_path="checkpoints")
        artifact = wandb.Artifact(f"calibration-{local_id}", type="model", metadata={"sha256": identity})
        artifact.add_file(str(checkpoint), name="checkpoint.json")
        wbrun.log_artifact(artifact)
        mlflow_id, wandb_id = mlrun.info.run_id, wbrun.id
        last_wandb_loss = float(wbrun.summary["train/loss"])
    store.finish(local_id)
    exported = store.export(local_id, root / f"{local_id}-manifest.json")
    expected = store.history(local_id, "train/loss")
    observed = sorted((point.step, point.value) for point in mlflow.MlflowClient().get_metric_history(mlflow_id, "train/loss"))
    np.testing.assert_allclose(observed, expected, atol=1e-12)
    np.testing.assert_allclose(last_wandb_loss, expected[-1][1], atol=1e-12)
    download_folder = root / "retrieved"
    download_folder.mkdir(exist_ok=True)
    retrieved = mlflow.MlflowClient().download_artifacts(
        mlflow_id, "checkpoints/" + checkpoint.name, str(download_folder))
    assert digest(retrieved) == identity
    store.close()
    report = {"mlflow": mlflow.__version__, "wandb": wandb.__version__, "numpy": np.__version__,
              "portable_run_id": local_id, "mlflow_run_id": mlflow_id, "wandb_offline_id": wandb_id,
              "events_per_run": len(expected), "initial_loss": expected[0][1], "final_loss": expected[-1][1],
              "mlflow_full_history_matches": True, "wandb_final_summary_matches": True,
              "mlflow_retrieved_artifact_matches": True,
              "artifact_sha256": identity, "all_sdk_work_local": True}
    (root / "bridge-results.json").write_text(json.dumps(report, indent=2), encoding="utf-8")
    print(json.dumps(report, indent=2))
    return report


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("output", type=Path)
    run(parser.parse_args().output)
