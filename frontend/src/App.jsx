
import { useState, useEffect } from "react";
import "./App.css";

const API = "http://127.0.0.1:8000";

function App() {
  const [jobs, setJobs] = useState([]);
  const [resume, setResume] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [selectedJob, setSelectedJob] = useState("");
  const [loadingJobs, setLoadingJobs] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState("");
  const [results, setResults] = useState(null);

  useEffect(() => {
    const fetchJobs = async () => {
      try {
        const response = await fetch(`${API}/jobs`);
        if (!response.ok) throw new Error("Could not load jobs.");
        const data = await response.json();
        setJobs(data.jobs || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoadingJobs(false);
      }
    };

    fetchJobs();
  }, []);

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const extension = file.name.substring(file.name.lastIndexOf(".")).toLowerCase();

    if (![".pdf", ".docx", ".txt"].includes(extension)) {
      setError("Please upload a PDF, DOCX, or TXT file.");
      event.target.value = "";
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setError("File size must not exceed 10 MB.");
      event.target.value = "";
      return;
    }

    setSelectedFile(file);
    setResume("");
    setResults(null);
    setError("");
  };

  const handleAnalyze = async () => {
    if (!selectedFile && !resume.trim()) {
      setError("Please upload or paste your resume.");
      return;
    }

    if (!selectedJob) {
      setError("Please select a target position.");
      return;
    }

    setAnalyzing(true);
    setError("");
    setResults(null);

    try {
      const formData = new FormData();

      if (selectedFile) {
        formData.append("file", selectedFile);
      } else {
        formData.append("resume_text", resume.trim());
      }

      formData.append("selected_job_id", selectedJob);

      const response = await fetch(`${API}/evaluate-all-jobs`, {
        method: "POST",
        body: formData
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Resume evaluation failed.");
      }

      setResults(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setAnalyzing(false);
    }
  };

  const jobResult = results?.ranked_jobs?.[0];
  const skills = jobResult?.skills || [];

  const getStatus = (classification = "") => {
    const value = classification.toLowerCase();

    if (
      value.includes("direct") ||
      value.includes("equivalent") ||
      value === "matched"
    ) return "matched";

    if (value.includes("transferable")) return "transferable";

    return "missing";
  };

  const matchedCount = skills.filter(
    skill => getStatus(skill.classification) === "matched"
  ).length;

  const transferableCount = skills.filter(
    skill => getStatus(skill.classification) === "transferable"
  ).length;

  const missingCount = skills.filter(
    skill => getStatus(skill.classification) === "missing"
  ).length;

  const score = Math.max(
    0,
    Math.min(100, Number(jobResult?.match_score) || 0)
  );

  return (
    <div className="app">

      <header className="navbar">
        <div className="nav-content">
          <div className="brand">
            <div className="brand-mark">C<span>.</span></div>
            <span>careermatch<span className="brand-ai">.ai</span></span>
          </div>

          <div className="nav-center">
            <span className="nav-indicator"></span>
            AI CAREER INTELLIGENCE
          </div>

          <div className="nav-right">
            <span className="nav-version">BETA</span>
          </div>
        </div>
      </header>

      <main className="main-content">

        {!results && (
          <>
            <section className="hero">
              <div className="hero-copy">
                <div className="hero-label">
                  <span className="hero-label-dot"></span>
                  YOUR CAREER, DECODED
                </div>

                <h1>
                  Your next role.
                  <br />
                  <span>Your next level.</span>
                </h1>

                <p className="hero-description">
                  Stop guessing where you stand. Discover how your
                  skills align with your dream role using AI-powered
                  resume intelligence.
                </p>

                <div className="hero-features">
                  <div><span>✳</span> AI-powered analysis</div>
                  <div><span>✳</span> Skill-level insights</div>
                  <div><span>✳</span> Instant compatibility</div>
                </div>
              </div>

              <div className="hero-art">
                <div className="art-orbit orbit-one"></div>
                <div className="art-orbit orbit-two"></div>

                <div className="art-center">
                  <div className="art-symbol">✳</div>
                </div>

                <div className="floating-card floating-top">
                  <span className="floating-icon">✦</span>
                  <div>
                    <strong>AI ANALYSIS</strong>
                    <small>Understanding your skills</small>
                  </div>
                  <span className="live-dot"></span>
                </div>

                <div className="floating-card floating-bottom">
                  <div className="mini-bars">
                    <i></i><i></i><i></i><i></i><i></i>
                  </div>
                  <div>
                    <strong>Skill intelligence</strong>
                    <small>Built around your profile</small>
                  </div>
                </div>

                <span className="art-caption">FIND YOUR FIT.</span>
              </div>
            </section>

            <section className="workspace">
              <div className="workspace-heading">
                <div>
                  <span className="section-kicker">THE MATCH STUDIO</span>
                  <h2>Let's find your fit.</h2>
                  <p>Two simple steps. One clearer career direction.</p>
                </div>

                <div className="step-counter">
                  <span>01</span> / 02
                </div>
              </div>

              <div className="workspace-grid">

                <div className="input-panel">
                  <div className="panel-heading">
                    <div className="panel-number">01</div>
                    <div>
                      <h3>Your resume</h3>
                      <p>Give us a snapshot of your experience.</p>
                    </div>
                  </div>

                  <div className="upload-zone">
                    <div className="upload-graphic">
                      <svg viewBox="0 0 24 24" fill="none">
                        <path d="M12 16V4m0 0L7.5 8.5M12 4l4.5 4.5M4 16.5v2A1.5 1.5 0 0 0 5.5 20h13a1.5 1.5 0 0 0 1.5-1.5v-2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>

                    <h4>Drop your resume here</h4>
                    <p>or browse files from your device</p>

                    <input
                      type="file"
                      accept=".pdf,.docx,.txt"
                      onChange={handleFileChange}
                    />

                    <div className="file-formats">
                      PDF <span>·</span> DOCX <span>·</span> TXT
                      <span className="format-limit">MAX 10 MB</span>
                    </div>

                    {selectedFile && (
                      <div className="selected-file">
                        <span className="file-symbol">▤</span>
                        <span>{selectedFile.name}</span>
                        <button
                          onClick={() => {
                            setSelectedFile(null);
                            setResults(null);
                          }}
                        >
                          Remove
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="or-divider">
                    <span>OR PASTE TEXT</span>
                  </div>

                  <textarea
                    className="resume-textarea"
                    placeholder="Paste your resume content here..."
                    value={resume}
                    onChange={(e) => {
                      setResume(e.target.value);
                      setSelectedFile(null);
                      setResults(null);
                      setError("");
                    }}
                  />

                  <div className="privacy-note">
                    <span>◈</span> Your resume is used to generate this analysis.
                  </div>
                </div>

                <div className="input-panel job-panel">
                  <div className="panel-heading">
                    <div className="panel-number">02</div>
                    <div>
                      <h3>Choose your direction</h3>
                      <p>Which role are you aiming for?</p>
                    </div>
                  </div>

                  <div className="job-visual">
                    <div className="job-visual-icon">⌘</div>
                    <span>YOUR TARGET ROLE</span>
                    <h3>One role.<br />A focused analysis.</h3>
                    <p>We'll compare your resume against the skills and requirements of your selected position.</p>
                    <div className="job-decoration">✳</div>
                  </div>

                  <label className="select-label">SELECT A POSITION</label>

                  <select
                    value={selectedJob}
                    onChange={(e) => {
                      setSelectedJob(e.target.value);
                      setResults(null);
                      setError("");
                    }}
                    disabled={loadingJobs}
                  >
                    <option value="">
                      {loadingJobs ? "Loading positions..." : "Choose your target job"}
                    </option>

                    {jobs.map(job => (
                      <option key={job["Job ID"]} value={job["Job ID"]}>
                        {job["Job Title"]}
                      </option>
                    ))}
                  </select>

                  <div className="job-hint">
                    <span>✦</span>
                    Your report will focus exclusively on this position.
                  </div>

                  <button
                    className="analyze-button"
                    onClick={handleAnalyze}
                    disabled={analyzing || loadingJobs}
                  >
                    {analyzing ? (
                      <>
                        <span className="button-spinner"></span>
                        ANALYZING YOUR PROFILE
                      </>
                    ) : (
                      <>
                        GENERATE MY MATCH REPORT
                        <span className="button-arrow">↗</span>
                      </>
                    )}
                  </button>

                  <div className="powered-note">
                    POWERED BY AI <span>·</span> CAREERMATCH ENGINE
                  </div>
                </div>

              </div>

              {analyzing && (
                <div className="processing-message">
                  <span className="processing-pulse"></span>
                  <div>
                    <strong>Your analysis is in progress</strong>
                    <p>Evaluating skills and matching job requirements...</p>
                  </div>
                </div>
              )}

              {error && <div className="error-message">{error}</div>}
            </section>
          </>
        )}

        {results && jobResult && (
          <section className="report-page">

            <div className="report-topline">
              <button
                className="back-button"
                onClick={() => setResults(null)}
              >
                ← BACK TO MATCH STUDIO
              </button>
              <span className="report-complete">
                <span></span> ANALYSIS COMPLETE
              </span>
            </div>

            <div className="report-title">
              <div>
                <span className="section-kicker">YOUR CAREER INTELLIGENCE REPORT</span>
                <h1>The results are in.</h1>
                <p>Here's how your profile aligns with the role.</p>
              </div>
              <div className="report-role">
                <span>TARGET POSITION</span>
                <strong>{results.selected_job || jobResult.job_title}</strong>
              </div>
            </div>

            <div className="report-score-layout">

              <div className="score-main">
                <div className="score-main-top">
                  <span>OVERALL COMPATIBILITY</span>
                  <span className="score-spark">✳</span>
                </div>

                <div className="score-display">
                  <div className="score-number">{score}<span>%</span></div>
                  <div className="score-ring-wrap">
                    <svg viewBox="0 0 100 100">
                      <circle cx="50" cy="50" r="42" className="ring-bg"/>
                      <circle
                        cx="50"
                        cy="50"
                        r="42"
                        className="ring-progress"
                        style={{
                          strokeDasharray: `${score * 2.639} 263.9`
                        }}
                      />
                    </svg>
                    <span>✳</span>
                  </div>
                </div>

                <h2>
                  {score >= 80 ? "Strong alignment."
                    : score >= 60 ? "Good potential."
                    : score >= 40 ? "Room to grow."
                    : "A new direction starts here."}
                </h2>

                <p>
                  Based on the skills demonstrated in your resume
                  and the requirements of this position.
                </p>
              </div>

              <div className="score-side">
                <div className="score-side-heading">
                  <span>SKILL OVERVIEW</span>
                  <span>{skills.length} TOTAL</span>
                </div>

                <div className="overview-row">
                  <div className="overview-label">
                    <span className="overview-dot matched-dot"></span>
                    <span>Matched</span>
                    <strong>{matchedCount}</strong>
                  </div>
                  <div className="overview-track">
                    <span
                      className="track-matched"
                      style={{ width: `${skills.length ? matchedCount / skills.length * 100 : 0}%` }}
                    ></span>
                  </div>
                </div>

                <div className="overview-row">
                  <div className="overview-label">
                    <span className="overview-dot transferable-dot"></span>
                    <span>Transferable</span>
                    <strong>{transferableCount}</strong>
                  </div>
                  <div className="overview-track">
                    <span
                      className="track-transferable"
                      style={{ width: `${skills.length ? transferableCount / skills.length * 100 : 0}%` }}
                    ></span>
                  </div>
                </div>

                <div className="overview-row">
                  <div className="overview-label">
                    <span className="overview-dot missing-dot"></span>
                    <span>Missing</span>
                    <strong>{missingCount}</strong>
                  </div>
                  <div className="overview-track">
                    <span
                      className="track-missing"
                      style={{ width: `${skills.length ? missingCount / skills.length * 100 : 0}%` }}
                    ></span>
                  </div>
                </div>

                <div className="score-side-footer">
                  <span>✦</span> Skill-level evaluation
                </div>
              </div>
            </div>

            <div className="skills-report">
              <div className="skills-report-heading">
                <div>
                  <span className="section-kicker">REQUIREMENT ANALYSIS</span>
                  <h2>Where you stand.</h2>
                  <p>Every required skill, evaluated individually.</p>
                </div>
                <span className="requirement-count">{skills.length} SKILLS</span>
              </div>

              <div className="skills-grid">
                {skills.map((skill, index) => {
                  const status = getStatus(skill.classification);

                  return (
                    <div className={`report-skill-card ${status}`} key={index}>
                      <div className="report-skill-top">
                        <span className="skill-index">
                          {String(index + 1).padStart(2, "0")}
                        </span>

                        <span className={`report-status-tag ${status}`}>
                          <span></span>
                          {status === "matched" ? "MATCHED"
                            : status === "transferable" ? "TRANSFERABLE"
                            : "MISSING"}
                        </span>
                      </div>

                      <h3>{skill.required_skill}</h3>

                      <p>
                        {skill.reason || skill.evidence ||
                          (status === "missing"
                            ? "No supporting evidence found in the resume."
                            : "Skill alignment identified.")}
                      </p>

                      {skill.evidence && skill.reason && (
                        <div className="evidence-line">
                          Evidence: {skill.evidence}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {jobResult.experience_assessment && (
              <div className="experience-report">
                <div className="experience-icon">✳</div>
                <div>
                  <span className="section-kicker">EXPERIENCE REVIEW</span>
                  <h3>Beyond the skill list.</h3>
                  <p>{jobResult.experience_assessment}</p>
                </div>
              </div>
            )}

            <div className="report-bottom">
              <div>
                <strong>Ready for another direction?</strong>
                <p>Compare your resume with a different role.</p>
              </div>
              <button
                onClick={() => {
                  setResults(null);
                  setError("");
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
              >
                ANALYZE ANOTHER ROLE ↗
              </button>
            </div>

          </section>
        )}

        {results && !jobResult && (
          <div className="error-message">
            The evaluation completed, but no job match result was returned.
          </div>
        )}

      </main>

      <footer className="site-footer">
        <div className="footer-brand">careermatch<span>.ai</span></div>
        <span>INTELLIGENCE FOR YOUR NEXT MOVE.</span>
        <span>© 2026 CAREERMATCH AI</span>
      </footer>
    </div>
  );
}

export default App;
