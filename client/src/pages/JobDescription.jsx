import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { BriefcaseBusiness, FileText, Link2, Sparkles, UploadCloud } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardTitle, CardDescription, CardHeader, CardContent } from "@/components/ui/Card";
import { UploadDropzone } from "@/components/resume/UploadDropzone";

export default function JobDescriptions() {
  const nav = useNavigate();
  const fileInputRef = useRef(null);
  const [jobDescription, setJobDescription] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [fileName, setFileName] = useState("");

  function handleUploaded(resume) {
    nav(`/resumes/${resume._id}`);
  }

  function handleJobFile(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = () => setJobDescription(String(reader.result || ""));
    reader.readAsText(file);
  }

  return (
    <div className="space-y-7">
      <PageHeader
        title="Build your match"
        description="Bring together a resume and a target role to get sharper, more relevant feedback."
      />

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5 items-stretch">
        <div className="min-w-0">
          <Card className="h-full min-h-[430px] flex flex-col">
            <CardHeader>
              <div className="flex gap-3">
                <div className="h-10 w-10 shrink-0 rounded-2xl bg-[var(--accent-soft)] text-[var(--accent-strong)] flex items-center justify-center">
                  <FileText size={18} />
                </div>
                <div>
                  <CardTitle className="text-base">Your resume</CardTitle>
                  <CardDescription className="mt-1">
                    Start with the version you want to improve.
                  </CardDescription>
                </div>
              </div>
              <span className="text-[10px] uppercase tracking-[0.14em] text-[var(--ink-muted)]">01</span>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col justify-center">
              <UploadDropzone onUploaded={handleUploaded} />
            </CardContent>
          </Card>
        </div>

        <div className="min-w-0">
          <Card padding="none" className="h-full min-h-[430px]">
            <div className="p-5 pb-0 flex items-start justify-between gap-3">
              <div className="flex gap-3">
                <div className="h-10 w-10 shrink-0 rounded-2xl bg-[#f6ead8] text-[#946326] flex items-center justify-center">
                  <BriefcaseBusiness size={18} />
                </div>
                <div>
                  <CardTitle className="text-base">Target job description</CardTitle>
                  <CardDescription className="mt-1">Paste the role, or import a plain-text file.</CardDescription>
                </div>
              </div>
              <span className="text-[10px] uppercase tracking-[0.14em] text-[var(--ink-muted)]">02</span>
            </div>
            <div className="p-5 space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-3">
                <input value={jobTitle} onChange={(event) => setJobTitle(event.target.value)} placeholder="Role title (e.g. Product Designer)" className="h-10 rounded-xl border border-[var(--border)] bg-[var(--surface-2)] px-3 text-sm outline-none transition focus:border-[var(--accent)]" />
                <button type="button" onClick={() => fileInputRef.current?.click()} className="h-10 rounded-xl border border-[var(--border)] px-3 text-sm font-medium flex items-center justify-center gap-2 hover:bg-[var(--surface-2)] transition">
                  <UploadCloud size={15} /> Import .txt
                </button>
                <input ref={fileInputRef} type="file" accept=".txt,text/plain" onChange={handleJobFile} className="hidden" />
              </div>
              <textarea value={jobDescription} onChange={(event) => { setFileName(""); setJobDescription(event.target.value); }} placeholder="Paste the responsibilities, requirements, and qualifications from the job posting here..." className="min-h-[190px] w-full resize-y rounded-2xl border border-[var(--border)] bg-[var(--surface-2)] p-4 text-sm leading-6 outline-none transition placeholder:text-[var(--ink-muted)] focus:border-[var(--accent)]" />
              <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-[var(--ink-muted)]">
                <span>{fileName || `${jobDescription.length} characters`}</span>
                <span className="flex items-center gap-1.5"><Link2 size={13} /> Saved for this session</span>
              </div>
              <div className="rounded-2xl bg-[var(--accent-hero)] text-white p-4 flex items-center justify-between gap-4">
                <div><div className="font-display font-semibold text-sm">Ready to tailor your resume?</div><div className="text-xs text-white/65 mt-1">Upload both documents to unlock a focused comparison.</div></div>
                <Sparkles size={20} className="shrink-0 text-[#d7e8db]" />
              </div>
            </div>
          </Card>
        </div>
      </div>

    </div>
  );
}
