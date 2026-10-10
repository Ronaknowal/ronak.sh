import { useCallback, useEffect, useState } from "react";

let request;
// One shared request. A failed load can be retried.
const loadIndex = () => (request ??= import("../learn/data/generated/home-index.js")
  .then(module => module.homeIndex)
  .catch(error => { request = undefined; throw error; }));

export function useHomeIndex() {
  const [state, setState] = useState({ status: "idle", index: null });

  const load = useCallback(() => {
    setState(current => current.status === "ready" ? current : { status: "loading", index: null });
    loadIndex().then(index => setState({ status: "ready", index }), () => setState({ status: "error", index: null }));
  }, []);

  useEffect(() => {
    const schedule = window.requestIdleCallback ?? (callback => setTimeout(callback, 2000));
    const cancel = window.cancelIdleCallback ?? clearTimeout;
    const handle = schedule(() => { loadIndex().catch(() => {}); });
    return () => cancel(handle);
  }, []);

  return { ...state, load };
}
