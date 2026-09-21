import { useRef, useState } from "react";
import { BriefcaseBusiness, Loader2, Sparkles, UploadCloud } from "lucide-react";
import { Card, CardTitle, CardDescription } from "@/components/ui/Card";
import { UploadDropzone } from "@/components/resume/UploadDropzone";
import { Button } from "@/components/ui/Button";
import { jobDescriptionApi } from "@/api/resumes";

export default function JobDescriptions() {
  const fileInputRef = useRef(null);
  const [jobDescription, setJobDescription] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [resumeFile, setResumeFile] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [analysisResult, setAnalysisResult] = useState(null);

  function handleUploaded(_resume, file) {
    setResumeFile(file);
    setSubmitError("");
    setAnalysisResult(null);
  }

  function handleJobFile(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setJobDescription(String(reader.result || ""));
    reader.readAsText(file);
  }

  async function handleSubmit() {
    if (!resumeFile || !jobTitle.trim() || !jobDescription.trim()) return;

    setSubmitError("");
    setAnalysisResult(null);
    setIsSubmitting(true);
    try {
      const result = await jobDescriptionApi.analyze(
        resumeFile,
        jobDescription.trim(),
        jobTitle.trim()
      );
      setAnalysisResult(result.analysis);
    } catch (error) {
      setSubmitError(error.message || "Unable to analyze this resume.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* <PageHeader
        title="Build your match"
        description="Bring together a resume and a target role to get sharper, more relevant feedback."
      /> */}

      <Card padding="none" className="w-full overflow-hidden">
        <div className="border-b border-[var(--border)] p-4 sm:p-5">
          <div className="flex items-start gap-3 mb-4">
            <div className="h-10 w-10 shrink-0 rounded-2xl bg-[#f6ead8] text-[#946326] flex items-center justify-center">
              <BriefcaseBusiness size={18} />
            </div>
            <div>
              <CardTitle className="text-base">Target job description</CardTitle>
              <CardDescription className="mt-1">Add the role and paste the job posting below.</CardDescription>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-3">
            <input value={jobTitle} onChange={(event) => setJobTitle(event.target.value)} placeholder="Role title (e.g. Product Designer)" className="h-10 rounded-xl border border-[var(--border)] bg-[var(--surface-2)] px-3 text-sm outline-none transition focus:border-[var(--accent)]" />
            <button type="button" onClick={() => fileInputRef.current?.click()} className="h-10 rounded-xl border border-[var(--border)] px-3 text-sm font-medium flex items-center justify-center gap-2 hover:bg-[var(--surface-2)] transition">
              <UploadCloud size={15} /> Import .txt
            </button>
            <input ref={fileInputRef} type="file" accept=".txt,text/plain" onChange={handleJobFile} className="hidden" />
          </div>
          <textarea value={jobDescription} onChange={(event) => setJobDescription(event.target.value)} placeholder="Paste the responsibilities, requirements, and qualifications from the job posting here..." className="mt-3 h-26 w-full resize-none overflow-y-auto rounded-2xl border border-[var(--border)] bg-[var(--surface-2)] p-3.5 text-sm leading-6 outline-none transition placeholder:text-[var(--ink-muted)] focus:border-[var(--accent)]" />
          <div className="flex flex-wrap items-center justify-between gap-3 mt-2 text-xs text-[var(--ink-muted)]">
            {/* <span>{fileName || `${jobDescription.length} characters`}</span>
            <span className="flex items-center gap-1.5"><Link2 size={13} /> Saved for this session</span> */}
          </div>
        </div>

        <div className="p-4 sm:p-5 space-y-3">
          {/* <CardDescription>Upload the PDF version you want to improve.</CardDescription> */}
          <UploadDropzone onUploaded={handleUploaded} compact />
          <Button
            type="button"
            variant="accent"
            size="lg"
            onClick={handleSubmit}
            disabled={
              isSubmitting ||
              !resumeFile ||
              !jobTitle.trim() ||
              !jobDescription.trim()
            }
            className="w-full"
          >
            {isSubmitting ? (
              <><Loader2 size={15} className="animate-spin" /> Analyzing...</>
            ) : (
              <><Sparkles size={15} /> Analyze match</>
            )}
          </Button>
          {submitError && (
            <div className="text-xs text-[var(--danger)] bg-[rgba(196,97,97,0.10)] rounded-xl px-3 py-2">
              {submitError}
            </div>
          )}
          {analysisResult && (
            <div className="rounded-2xl border border-[var(--accent)]/30 bg-[var(--accent-soft)] p-4 space-y-2">
              <div className="flex items-center justify-between gap-3">
                <div className="font-display font-semibold text-sm">Match analyzed</div>
                <div className="text-lg font-display font-bold text-[var(--accent-strong)]">
                  {analysisResult.atsScore}/100
                </div>
              </div>
              <p className="text-xs leading-5 text-[var(--ink-muted)]">{analysisResult.summary}</p>
            </div>
          )}
        </div>
      </Card>

    </div>
  );
}
