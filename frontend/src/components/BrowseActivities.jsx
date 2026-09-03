function BrowseActivities({ onCreateClick }) {
  return (
    <div className="empty-state browse-placeholder">
      <p>Search and filters are coming soon.</p>
      <button type="button" className="submit-btn" onClick={onCreateClick}>
        + Create a plan
      </button>
    </div>
  );
}

export default BrowseActivities;