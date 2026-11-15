import { useEffect, useRef, useState } from "react";

export default function useResource(key, loader) {
  const load = useRef(loader);
  load.current = loader;
  const [attempt, setAttempt] = useState(0);
  const [state, setState] = useState({ key: null, status: "idle", data: null, error: null });
  useEffect(() => {
    if (key === null) return;
    let active = true;
    const controller = new AbortController();
    setState({ key, status: "loading", data: null, error: null });
    Promise.resolve().then(() => load.current(controller.signal))
      .then(data => { if (active) setState({ key, status: "ready", data, error: null }); })
      .catch(error => { if (active && error.name !== "AbortError") setState({ key, status: "error", data: null, error }); });
    return () => { active = false; controller.abort(); };
  }, [key, attempt]);
  const current = key === null ? { status: "idle", data: null, error: null } : state.key === key ? state : { status: "loading", data: null, error: null };
  return { ...current, reload: () => { setState({ key, status: "loading", data: null, error: null }); setAttempt(value => value + 1); } };
}
