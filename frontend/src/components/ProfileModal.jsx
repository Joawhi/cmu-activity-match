import { useEffect, useState } from 'react';
import { GraduationCap, Languages as LanguagesIcon, Upload, X } from 'lucide-react';
import { useApp } from '../context/AppProvider';
import { Avatar } from './Avatar';
import { photoUrlFrom } from '../lib/helpers';
import { SCHOOL_YEARS, LANGUAGES, LANGUAGE_FLAGS } from '../constants';
import { api } from '../api';
import { cn } from '../lib/utils';

export function ProfileModal() {
  const { profileUserId, closeProfile, currentUser, updateProfile } = useApp();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);

  const isSelf = currentUser && profileUserId === currentUser.id;

  useEffect(() => {
    if (!profileUserId) {
      setEditing(false);
      return;
    }
    setLoading(true);
    api.getUser(profileUserId).then((data) => {
      setProfile(data);
      setLoading(false);
    });
  }, [profileUserId]);

  useEffect(() => {
    if (!profileUserId) return;
    const onKey = (e) => { if (e.key === 'Escape') closeProfile(); };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [profileUserId, closeProfile]);

  if (!profileUserId) return null;

  const languageList = profile?.languages ? profile.languages.split(',').filter(Boolean) : [];
  const displayName = profile ? (profile.display_name || profile.name) : '';

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <div className="absolute inset-0 bg-foreground/40 backdrop-blur-sm" onClick={closeProfile} aria-hidden="true" />
      <div
        role="dialog"
        aria-modal="true"
        className="relative z-10 max-h-[90dvh] w-full max-w-md overflow-y-auto rounded-t-3xl border border-border bg-card p-6 sm:rounded-3xl sm:p-8"
      >
        <button
          type="button"
          onClick={closeProfile}
          aria-label="Close"
          className="absolute top-4 right-4 inline-flex size-9 items-center justify-center rounded-full border border-border bg-background text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:outline-none"
        >
          <X className="size-4" strokeWidth={2} />
        </button>

        {loading || !profile ? (
          <p className="py-10 text-center text-sm text-muted-foreground">Loading profile…</p>
        ) : editing && isSelf ? (
          <EditProfileForm
            profile={profile}
            onSave={async (data) => {
              await updateProfile(data);
              const refreshed = await api.getUser(profileUserId);
              setProfile(refreshed);
              setEditing(false);
            }}
            onCancel={() => setEditing(false)}
          />
        ) : (
          <div className="flex flex-col items-center text-center">
            <Avatar name={displayName} photoUrl={photoUrlFrom(profile.profile_image)} size={96} />
            <h2 className="mt-4 font-serif text-2xl font-semibold tracking-tight app-heading">
              {displayName}
            </h2>
            <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
              {profile.school_year && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1 text-xs font-medium text-secondary-foreground">
                  <GraduationCap className="size-3.5" strokeWidth={2} />
                  {profile.school_year}
                </span>
              )}
              {profile.major && (
                <span className="inline-flex items-center rounded-full bg-secondary px-3 py-1 text-xs font-medium text-secondary-foreground">
                  {profile.major}
                </span>
              )}
            </div>

            {profile.bio ? (
              <p className="mt-4 text-sm leading-relaxed text-muted-foreground text-pretty">{profile.bio}</p>
            ) : isSelf ? (
              <p className="mt-4 text-sm text-muted-foreground">No introduction yet.</p>
            ) : null}

            {languageList.length > 0 && (
              <div className="mt-5 w-full border-t border-border pt-5">
                <p className="mb-2.5 flex items-center justify-center gap-1.5 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                  <LanguagesIcon className="size-3.5" strokeWidth={2} />
                  Speaks
                </p>
                <div className="flex flex-wrap justify-center gap-2">
                  {languageList.map((lang) => (
                    <span
                      key={lang}
                      className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-3 py-1 text-xs font-medium text-foreground"
                    >
                      {LANGUAGE_FLAGS[lang] || ''} {lang}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {isSelf ? (
              <button
                type="button"
                onClick={() => setEditing(true)}
                className="mt-6 inline-flex items-center justify-center rounded-full border border-border bg-background px-5 py-2.5 text-sm font-semibold text-foreground transition-colors hover:bg-secondary focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:outline-none active:translate-y-px"
              >
                Edit profile
              </button>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
}

const editInputClass =
  'w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30 focus-visible:outline-none';

function EditProfileForm({ profile, onSave, onCancel }) {
  const [displayName, setDisplayName] = useState(profile.display_name || '');
  const [bio, setBio] = useState(profile.bio || '');
  const [schoolYear, setSchoolYear] = useState(profile.school_year || '');
  const [major, setMajor] = useState(profile.major || '');
  const [languages, setLanguages] = useState(profile.languages ? profile.languages.split(',').filter(Boolean) : []);
  const [photoFile, setPhotoFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [saving, setSaving] = useState(false);

  const toggleLang = (lang) =>
    setLanguages((prev) => (prev.includes(lang) ? prev.filter((l) => l !== lang) : [...prev, lang]));

  const handlePhoto = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setPhotoFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    await onSave({
      display_name: displayName.trim(),
      bio: bio.trim(),
      school_year: schoolYear,
      major: major.trim(),
      languages: languages.join(','),
      photoFile,
    });
    setSaving(false);
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <h2 className="font-serif text-2xl font-semibold tracking-tight app-heading">
        Edit profile
      </h2>

      <div className="flex items-center gap-4">
        <Avatar name={displayName || profile.name} photoUrl={previewUrl || photoUrlFrom(profile.profile_image)} size={72} />
        <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-border bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-secondary">
          <Upload className="size-3.5" strokeWidth={2} />
          Upload photo
          <input type="file" accept="image/*" onChange={handlePhoto} className="sr-only" />
        </label>
      </div>

      <label className="flex flex-col gap-2">
        <span className="text-sm font-semibold text-foreground">Display name</span>
        <input value={displayName} onChange={(e) => setDisplayName(e.target.value)} className={editInputClass} placeholder={profile.name} />
      </label>

      <label className="flex flex-col gap-2">
        <span className="text-sm font-semibold text-foreground">Bio</span>
        <textarea value={bio} onChange={(e) => setBio(e.target.value)} rows={3} className={cn(editInputClass, 'resize-none leading-relaxed')} />
      </label>

      <label className="flex flex-col gap-2">
        <span className="text-sm font-semibold text-foreground">School year</span>
        <select value={schoolYear} onChange={(e) => setSchoolYear(e.target.value)} className={editInputClass}>
          <option value="">Select</option>
          {SCHOOL_YEARS.map((y) => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>
      </label>

      <label className="flex flex-col gap-2">
        <span className="text-sm font-semibold text-foreground">Major</span>
        <input value={major} onChange={(e) => setMajor(e.target.value)} className={editInputClass} />
      </label>

      <div className="flex flex-col gap-2">
        <span className="text-sm font-semibold text-foreground">Languages</span>
        <div className="flex flex-wrap gap-2">
          {LANGUAGES.map((lang) => {
            const active = languages.includes(lang);
            return (
              <button
                key={lang}
                type="button"
                onClick={() => toggleLang(lang)}
                aria-pressed={active}
                className={cn(
                  'rounded-full border px-3 py-1.5 text-xs font-medium transition-colors focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:outline-none',
                  active ? 'border-transparent bg-accent text-accent-foreground' : 'border-border bg-background text-foreground hover:bg-secondary'
                )}
              >
                {LANGUAGE_FLAGS[lang]} {lang}
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex items-center gap-3 pt-1">
        <button
          type="submit"
          disabled={saving}
          className="inline-flex flex-1 items-center justify-center rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:outline-none active:translate-y-px disabled:opacity-50"
        >
          {saving ? 'Saving…' : 'Save profile'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="inline-flex items-center justify-center rounded-full border border-border bg-background px-5 py-2.5 text-sm font-semibold text-foreground transition-colors hover:bg-secondary focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:outline-none"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}