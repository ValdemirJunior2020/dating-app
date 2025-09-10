import React from "react";
import "./ProfileSummaryCard.css";
import { useLightbox } from "./ImageLightbox";

// Map common interests/fields to emojis (extend anytime)
const EMOJI = {
  Female:"🚺", Male:"🚹", Heterosexual:"⚤", Single:"♡", Married:"💍",
  Graduate:"🎓", "Graduate degree":"🎓",
  Jazz:"🎷", Blues:"🎵", Drawing:"🎨", Tattoos:"🧿", Galleries:"🖼️",
  Gaming:"🎮", Movies:"🎬", Travel:"✈️", Coffee:"☕", Soccer:"⚽", Basketball:"🏀"
};
const ez = (t) => EMOJI[t] || "•";

export default function ProfileSummaryCard({ user = {} }) {
  const { open } = useLightbox();
  const name = user.displayName || user.name || "Someone";
  const photo =
    (Array.isArray(user.photos) && user.photos[0]) ||
    user.photoURL ||
    null;

  const interests = Array.isArray(user.interests) ? user.interests : [];

  return (
    <div className="ps-card">
      <div className="ps-header">
        <div
          className="ps-avatar"
          role="button"
          title="Tap to enlarge"
          onClick={() => photo && open(photo)}
        >
          {photo ? <img src={photo} alt={name} /> : <div className="ps-ph">No photo</div>}
        </div>
        <div className="ps-id">
          <div className="ps-name">{name}</div>
          {user.age ? <div className="ps-sub">{user.age}</div> : null}
        </div>
      </div>

      {/* BASICS (add your own fields here if you have them) */}
      <section className="ps-sec">
        <h6 className="ps-title">My basics</h6>
        <div className="ps-pills">
          {user.gender && <span className="pill pill--info">{ez(user.gender)} {user.gender}</span>}
          {user.orientation && <span className="pill pill--accent">{ez(user.orientation)} {user.orientation}</span>}
          {user.relationship && <span className="pill pill--accent">{ez(user.relationship)} {user.relationship}</span>}
          {user.education && <span className="pill pill--info">{ez(user.education)} {user.education}</span>}
        </div>
      </section>

      {/* INTERESTS */}
      <section className="ps-sec">
        <h6 className="ps-title">My interests</h6>
        <div className="ps-pills">
          {interests.length ? interests.map((tag) => (
            <span className="pill pill--info" key={tag}>{ez(tag)} {tag}</span>
          )) : <div className="ps-muted">No interests yet</div>}
        </div>
      </section>

      {/* LOCATION (if present) */}
      {user.city || user.country ? (
        <section className="ps-sec">
          <h6 className="ps-title">My location</h6>
          <div className="ps-pills">
            <span className="pill pill--accent">📍 {user.city ? `${user.city}, ` : ""}{user.country || ""}</span>
          </div>
        </section>
      ) : null}
    </div>
  );
}
