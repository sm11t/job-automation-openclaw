# OpenClaw Job Automation Integration

## Architecture Overview

```
┌─────────────────────┐
│   Main Agent (Opus) │ ← You delegate to jobhunter
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ JobHunter (Sonnet)  │ ← Runs the automation
├─────────────────────┤
│ - Browser (CDP)     │
│ - Form Scanner      │
│ - Field Matcher     │
│ - Answer Generator  │
│ - Form Filler       │
└─────────────────────┘
           │
           ▼
┌─────────────────────┐
│   LLM Endpoints     │
├─────────────────────┤
│ Haiku: Simple fields│ ← First name, email, etc.
│ Sonnet: Complex Q's │ ← Why company, behavioral
└─────────────────────┘
```

## Setup Instructions

### 1. Chrome Profile Setup
```bash
# Launch Chrome with CDP enabled
/Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome \
  --remote-debugging-port=9222 \
  --user-data-dir="/Users/sm1t/.chrome-jobhunter" &

# Verify CDP is working
curl http://127.0.0.1:9222/json/version
```

### 2. OpenClaw Config Update
Add to `~/.openclaw/config/settings.json`:
```json
{
  "browser": {
    "profiles": {
      "chrome": {
        "cdpUrl": "http://127.0.0.1:9222"
      }
    }
  }
}
```

### 3. JobHunter Agent AGENTS.md
Add to `/Users/sm1t/.openclaw/workspace-jobhunter/AGENTS.md`:
```markdown
## Job Application Flow

1. **Discovery**: Browse jobright.ai/jobs/recommend
2. **Analysis**: Use Haiku to filter jobs (cost: ~$0.001 per job)
3. **Application**: For each selected job:
   - Navigate to external ATS
   - Scan form with `job-automation/form-scanner.js`
   - Generate answers (Haiku for simple, Sonnet for complex)
   - Fill form with `job-automation/form-filler.js`
   - Submit or flag for review

## Scripts Location
- Scanner: `~/workspace/job-automation/form-scanner.js`
- Filler: `~/workspace/job-automation/form-filler.js`
- Orchestrator: `~/workspace/job-automation/job-apply-orchestrator.py`

## Cost Optimization
- Discovery + filtering: Haiku (~$0.01 for 10 jobs)
- Application filling: Sonnet only for complex questions (~$0.05 per application)
- Total: ~$0.10 per successful application
```

## Usage Examples

### 1. Manual Trigger (from Main agent)
```python
# Spawn jobhunter for a batch run
spawn_jobhunter("Apply to 5 software engineer jobs")
```

### 2. Inside JobHunter Agent
```javascript
// Scan current form
const formData = await browser({
  action: "act",
  request: {
    kind: "evaluate",
    fn: read('job-automation/form-scanner.js')
  }
});

// Generate answers
const answers = await exec({
  command: `python3 job-automation/job-apply-orchestrator.py generate-answers`,
  env: {
    FORM_DATA: JSON.stringify(formData),
    JOB_CONTEXT: JSON.stringify({title, company, description})
  }
});

// Fill form
await browser({
  action: "act", 
  request: {
    kind: "evaluate",
    fn: `
      ${read('job-automation/form-filler.js')}
      fillApplicationForm(${JSON.stringify(answers)})
    `
  }
});
```

### 3. Cron Job Setup
Add to crontab:
```bash
# Run job applications 3x daily during weekdays
0 10,14,18 * * 1-5 openclaw run jobhunter --message "Apply to 5 jobs"
```

## Form Handling Patterns

### Simple Fields (Haiku)
```json
{
  "First Name": "Asmit",
  "Email": "asmit77@icloud.com",
  "Phone": "480-857-9392",
  "LinkedIn": "https://linkedin.com/in/asmitrajeet/",
  "Authorized to work in US?": "Yes"
}
```

### Complex Fields (Sonnet)
```json
{
  "Why do you want to work at {company}?": "Generate based on company research + JD",
  "Describe a challenging project": "Use STAR method with specific metrics",
  "What interests you about this role?": "Connect skills to job requirements"
}
```

### File Uploads
- Resume: Auto-upload from `/Users/sm1t/Code/keyword-analysis/output/optimized_resume.pdf`
- Cover Letter: Generate if required (especially for dream companies)
- Transcript: Flag for manual upload

## Error Handling

1. **Form Changes**: If form structure doesn't match expectations, log and continue
2. **Rate Limits**: 30-second delay between applications
3. **Manual Review**: Flag applications to dream companies for human review
4. **Duplicate Check**: Skip if already in `applications.json`

## Monitoring & Logs

- Applications log: `job-automation/applications.json`
- Error log: `job-automation/errors.log`
- Daily summary: Posted to Telegram

## Next Steps

1. Test form scanner on live Greenhouse/Lever sites
2. Fine-tune answer generation prompts
3. Add support for more ATS platforms
4. Build dashboard for application tracking