import { CATEGORIES } from '../constants';

function ActivityFields({ form, errors, onChange }) {
  return (
    <>
      <div className="form-row">
        <label htmlFor="title">Title</label>
        <input id="title" name="title" value={form.title} onChange={onChange} placeholder="Dinner at Legume" />
        {errors.title && <span className="field-error">{errors.title}</span>}
      </div>

      <div className="form-row">
        <label htmlFor="description">Description <span className="optional-label">(optional)</span></label>
        <textarea id="description" name="description" value={form.description} onChange={onChange} placeholder="What's the plan?" rows={3} />
      </div>

      <div className="two-col">
        <div className="form-row">
          <label htmlFor="datetime">Date & time <span className="optional-label">(optional)</span></label>
          <input id="datetime" name="datetime" type="datetime-local" value={form.datetime} onChange={onChange} />
          {errors.datetime && <span className="field-error">{errors.datetime}</span>}
        </div>
        <div className="form-row">
          <label htmlFor="max_people">Max people <span className="optional-label">(optional)</span></label>
          <input id="max_people" name="max_people" type="number" min="1" value={form.max_people} onChange={onChange} placeholder="6" />
          {errors.max_people && <span className="field-error">{errors.max_people}</span>}
        </div>
      </div>

      <div className="form-row">
        <label htmlFor="location">Location <span className="optional-label">(optional)</span></label>
        <input id="location" name="location" value={form.location} onChange={onChange} placeholder="Squirrel Hill" />
      </div>

      <div className="two-col">
        <div className="form-row">
          <label htmlFor="category">Category <span className="optional-label">(optional)</span></label>
          <select id="category" name="category" value={form.category} onChange={onChange}>
            <option value="">Select a category</option>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
        <div className="form-row">
          <label htmlFor="gender_restriction">Who can join <span className="optional-label">(optional)</span></label>
          <select id="gender_restriction" name="gender_restriction" value={form.gender_restriction} onChange={onChange}>
            <option value="none">Everyone</option>
            <option value="male">Male only</option>
            <option value="female">Female only</option>
          </select>
        </div>
      </div>
    </>
  );
}

export default ActivityFields;