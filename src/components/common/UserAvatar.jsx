import { useState } from "react";
import { avatarUrl } from "../../services/apiClient";
import "./UserAvatar.css";

export default function UserAvatar({ user, className = "", label }) {
  const url = avatarUrl(user?.avatarUrl), [failed, setFailed] = useState("");
  return <span className={`user-avatar ${className}`} {...(label ? { role: "img", "aria-label": label } : { "aria-hidden": true })}>{url && failed !== url ? <img src={url} alt="" onError={() => setFailed(url)} /> : (user?.name || "?").slice(0, 1).toUpperCase()}</span>;
}
