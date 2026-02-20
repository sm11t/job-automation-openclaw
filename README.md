# Job Application Automation System

## 🚀 Quick Start

### 1. Launch Chrome with CDP
```bash
/Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome \
  --remote-debugging-port=9222 \
  --user-data-dir="/Users/sm1t/.chrome-jobhunter" &
```

### 2. Run Job Applications
```bash
# From main agent
subagent spawn jobhunter "Apply to 5 software engineer jobs"

# Or directly
python3 ~/workspace/job-automation/job-apply-orchestrator.py --max 5
```

## 📁 Project Structure

```
job-automation/
├── README.md                    # This file
├── user-profile.json           # Your profile data (resume info)
├── form-scanner.js             # Extracts form fields from any page
├── form-filler.js              # Fills forms with proper React/Vue handling  
├── field-matcher.js            # Maps form fields to profile data
├── job-apply-orchestrator.py   # Main automation script
├── applications.json           # Application history (auto-generated)
├── test-form-scanner.js        # Test the scanner on any job page
└── openclaw-integration.md     # Integration guide
```

## 🔄 How It Works

1. **Job Discovery** → Browse Jobright for recommendations
2. **Smart Filtering** → Haiku analyzes fit (~$0.001/job)
3. **Form Scanning** → Extract all fields from application page
4. **Answer Generation** → 
   - Simple fields: Direct mapping (Haiku)
   - Complex questions: Generated answers (Sonnet)
5. **Form Filling** → Fill with React/Vue compatibility
6. **Submit/Review** → Auto-submit or flag for review

## 💰 Cost Breakdown

- **Per Discovery Run**: ~$0.01 (scan 10 jobs with Haiku)
- **Per Application**: ~$0.05-0.10 (depending on complexity)
- **Daily Budget (15 apps)**: ~$1.50

## 🎯 Customization Points

### Profile Data (`user-profile.json`)
- Copy `user-profile.template.json` to `user-profile.json`
- Update with your latest experience
- Add custom answers for common questions
- Set target companies and roles

### Answer Templates (`field-matcher.js`)
- Customize templates in `PROMPT_TEMPLATES`
- Add company-specific responses
- Adjust tone and length

### Form Patterns (`form-scanner.js`)
- Add new ATS platform patterns
- Improve field detection
- Handle custom form structures

## 🐛 Debugging

### Test Form Scanner
```javascript
// On any job application page, open console:
fetch('https://raw.githubusercontent.com/[...]/form-scanner.js')
  .then(r => r.text())
  .then(eval)
```

### Check Application Log
```bash
cat ~/workspace/job-automation/applications.json | jq '.'
```

### Manual Form Fill Test
```python
python3 job-apply-orchestrator.py --test --url "https://jobs.lever.co/stripe/123"
```

## ⚡ Pro Tips

1. **Best Times**: Run during business hours for faster responses
2. **Rate Limits**: Keep 30s between applications
3. **Dream Companies**: Always flag for manual review
4. **Resume Updates**: Regenerate after profile changes
5. **A/B Testing**: Try different answer styles

## 🔮 Future Enhancements

- [ ] LinkedIn Easy Apply integration
- [ ] Indeed one-click support  
- [ ] AngelList startup jobs
- [ ] Email notification on dream company matches
- [ ] Weekly application analytics
- [ ] Auto-resume tailoring per job

## 📊 Success Metrics

Track in `applications.json`:
- Application success rate
- Response rate by company
- Most common rejection reasons
- Optimal answer patterns

---

**Remember**: This automates the tedious parts. For dream companies, always review before submitting!