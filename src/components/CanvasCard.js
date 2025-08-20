import React from "react";
export default function CanvasCard({title, value, setValue, placeholder}){
  return (
    <div className="col-md-6 col-lg-4 mb-3">
      <div className="card card-soft h-100">
        <div className="card-body">
          <div className="h6 text-uppercase text-muted mb-2 section-title">{title}</div>
          <textarea className="form-control" rows="5" placeholder={placeholder}
            value={value} onChange={(e)=>setValue(e.target.value)} />
        </div>
      </div>
    </div>
  );
}
