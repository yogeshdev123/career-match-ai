from fastapi import Form
from services.resume_analyzer import analyze_resume
from services.job_matcher import match_resume_to_job
from services.job_matcher import evaluate_jobs
from services.ai_service import test_gemini_connection
from fastapi.middleware.cors import CORSMiddleware
import csv
from pathlib import Path
from io import BytesIO
import time
from fastapi import FastAPI, HTTPException, UploadFile, File
from pypdf import PdfReader
from docx import Document

app = FastAPI(
    title="CareerMatch AI",
    description="AI-powered Resume-to-Job Matching Agent",
    version="1.0.0"
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173","https://career-match-ai-gamma.vercel.app"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
JOBS_FILE = Path(__file__).parent / "data" / "jobs.csv"


@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "message": "CareerMatch AI backend is running!"
    }


@app.get("/jobs")
def get_jobs():
    if not JOBS_FILE.exists():
        raise HTTPException(
            status_code=404,
            detail="Job database not found."
        )

    try:
        with open(
            JOBS_FILE,
            mode="r",
            encoding="utf-8-sig",
            newline=""
        ) as file:
            reader = csv.DictReader(file)
            jobs = list(reader)
            columns = reader.fieldnames

        return {
            "total_jobs": len(jobs),
            "columns": columns,
            "jobs": jobs
        }

    except Exception as error:
        raise HTTPException(
            status_code=500,
            detail=f"Could not read job database: {str(error)}"
        )


@app.post("/upload-resume")
async def upload_resume(file: UploadFile = File(...)):

    filename = file.filename or ""
    extension = Path(filename).suffix.lower()

    if extension not in [".pdf", ".docx", ".txt"]:
        raise HTTPException(
            status_code=400,
            detail="Only PDF, DOCX, and TXT files are supported."
        )

    file_content = await file.read()

    if len(file_content) > 10 * 1024 * 1024:
        raise HTTPException(
            status_code=413,
            detail="File size must not exceed 10 MB."
        )

    try:
        if extension == ".pdf":
            pdf = PdfReader(BytesIO(file_content))
            resume_text = "\n".join(
                page.extract_text() or ""
                for page in pdf.pages
            )

        elif extension == ".docx":
            document = Document(BytesIO(file_content))
            resume_text = "\n".join(
                paragraph.text
                for paragraph in document.paragraphs
            )

        else:
            resume_text = file_content.decode("utf-8-sig")

        resume_text = resume_text.strip()

        if not resume_text:
            raise HTTPException(
                status_code=400,
                detail="No readable text found in the resume."
            )

        return {
            "filename": filename,
            "character_count": len(resume_text),
            "resume_text": resume_text
        }

    except HTTPException:
        raise

    except Exception as error:
        raise HTTPException(
            status_code=400,
            detail=f"Could not process resume: {str(error)}"
        )
    
@app.get("/ai-test")
def ai_test():

    try:
        result = test_gemini_connection()

        return {
            "status": "success",
            "response": result
        }

    except Exception as error:
        raise HTTPException(
            status_code=502,
            detail=f"Gemini API request failed: {type(error).__name__}: {error}"
        )
@app.post("/analyze-resume-test")
def analyze_resume_test():

    sample_resume = """
    Bachelor of Business Administration.

    Six months of experience as an RPA Developer Intern.

    Skills:
    UiPath, Power Automate, JavaScript, React.js,
    HTML, CSS, SQL, Excel VBA.

    Projects:
    React application with Firebase and API integration.
    """

    try:
        result = analyze_resume(sample_resume)

        return {
            "status": "success",
            "analysis": result
        }

    except Exception as error:
        raise HTTPException(
            status_code=502,
            detail=str(error)
        )

    
@app.post("/job-match-test")
def job_match_test(job_id: str = "J005"):

    sample_resume = """
    Bachelor of Business Administration.

    Six months of experience as an RPA Developer Intern.

    Skills:
    UiPath, Power Automate, JavaScript, React.js,
    HTML, CSS, SQL, Excel VBA.

    Projects:
    React application with Firebase and API integration.
    """

    try:
        # Step 1: Analyze the resume.
        resume_analysis = analyze_resume(sample_resume)

        # Step 2: Find the selected job in the CSV.
        csv_path = Path(__file__).parent / "data" / "jobs.csv"

        with open(csv_path, "r", encoding="utf-8-sig", newline="") as file:
            jobs = list(csv.DictReader(file))

        selected_job = next(
            (job for job in jobs if job["Job ID"] == job_id),
            None
        )

        if selected_job is None:
            raise HTTPException(
                status_code=404,
                detail=f"Job ID {job_id} was not found."
            )

        # Step 3: Compare the resume against the job.
        result = match_resume_to_job(
            resume_analysis,
            selected_job
        )

        return {
            "status": "success",
            "result": result
        }

    except HTTPException:
        raise

    except Exception as error:
        raise HTTPException(
            status_code=502,
            detail=str(error)
        )





@app.post("/evaluate-all-jobs")
async def evaluate_all_jobs(
    file: UploadFile = File(None),
    resume_text: str = Form(None),
    selected_job_id: str = Form(...)
):
    filename = file.filename if file else "Pasted Resume"

    try:
        # Step 1: Extract resume text.
        if file:
            extension = Path(filename).suffix.lower()

            if extension not in [".pdf", ".docx", ".txt"]:
                raise HTTPException(
                    status_code=400,
                    detail="Only PDF, DOCX, and TXT files are supported."
                )

            file_content = await file.read()

            if len(file_content) > 10 * 1024 * 1024:
                raise HTTPException(
                    status_code=413,
                    detail="File size must not exceed 10 MB."
                )

            if extension == ".pdf":
                pdf = PdfReader(BytesIO(file_content))
                resume_text = "\n".join(
                    page.extract_text() or ""
                    for page in pdf.pages
                )

            elif extension == ".docx":
                document = Document(BytesIO(file_content))
                resume_text = "\n".join(
                    paragraph.text
                    for paragraph in document.paragraphs
                )

            else:
                resume_text = file_content.decode("utf-8-sig")

        resume_text = (resume_text or "").strip()

        if not resume_text:
            raise HTTPException(
                status_code=400,
                detail="Please provide a readable resume."
            )

        # Step 2: Load jobs and find selected job.
        csv_path = Path(__file__).parent / "data" / "jobs.csv"

        with open(csv_path, "r", encoding="utf-8-sig", newline="") as csv_file:
            jobs = list(csv.DictReader(csv_file))

        selected_job = next(
            (job for job in jobs if job["Job ID"] == selected_job_id),
            None
        )

        if selected_job is None:
            raise HTTPException(
                status_code=404,
                detail="Selected job was not found."
            )

        # Step 3: Analyze resume once.

        start_time = time.perf_counter()

        print("Starting resume analysis...")
        resume_analysis = analyze_resume(resume_text)
        print(f"Resume analysis completed in {time.perf_counter() - start_time:.2f} seconds")

        start_time = time.perf_counter()

        print("Starting job matching...")
        results = evaluate_jobs(resume_analysis, [selected_job])
        print(f"Job matching completed in {time.perf_counter() - start_time:.2f} seconds")
        # Step 5: Return result.
        return {
            "status": "success",
            "filename": filename,
            "resume_analysis": resume_analysis,
            "selected_job": selected_job["Job Title"],
            **results
        }

    except HTTPException:
        raise

    except Exception as error:
        raise HTTPException(
            status_code=502,
            detail=f"Resume evaluation failed: {str(error)}"
        )
