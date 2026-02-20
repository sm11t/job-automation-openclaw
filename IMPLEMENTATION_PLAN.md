# Implementation Plan: Job Application Automation

## Phase 1: Foundation ✅ COMPLETE
- [x] Form scanner that detects all field types
- [x] User profile structure with all your data
- [x] Field matcher with simple/complex categorization  
- [x] Form filler with React/Vue compatibility
- [x] Basic orchestrator structure
- [x] Cost-optimized LLM routing (Haiku vs Sonnet)

## Phase 2: Browser Integration 🚧 NEXT
- [ ] Test form scanner on real job sites:
  - [ ] Greenhouse (Stripe, Datadog)
  - [ ] Lever (Netflix, Figma)
  - [ ] Workday (Adobe, Salesforce)
- [ ] Integrate with OpenClaw browser tool
- [ ] Handle multi-step applications
- [ ] Add "Add Education/Experience" button support

## Phase 3: Answer Quality 📝
- [ ] Test answer generation with real questions
- [ ] Build corpus of good answers from successful applications
- [ ] A/B test different answer styles
- [ ] Add company research integration (from web)
- [ ] Implement cover letter generation

## Phase 4: Robustness 🛡️
- [ ] Error recovery (form changes, timeouts)
- [ ] Screenshot on errors for debugging
- [ ] Retry logic for failed submissions
- [ ] Handle CAPTCHAs (flag for manual)
- [ ] Session management for login-required sites

## Phase 5: Scale & Analytics 📊
- [ ] Dashboard for tracking applications
- [ ] Success rate analytics
- [ ] Automated daily/weekly reports
- [ ] Integration with calendar for interviews
- [ ] Resume A/B testing per job type

## Immediate Next Steps (Do These First!)

### 1. Test Chrome CDP Connection
```bash
# Make sure Chrome is running with CDP
curl http://127.0.0.1:9222/json/version

# Should return version info
```

### 2. Test Form Scanner on Real Site
```javascript
// Go to a real job application page, then:
browser({
  action: "navigate",
  targetUrl: "https://jobs.lever.co/figma"
});

// Click on a job, then test scanner
browser({
  action: "act",
  request: {
    kind: "evaluate", 
    fn: Read("job-automation/form-scanner.js")
  }
});
```

### 3. Create JobHunter Test Command
Add to jobhunter's AGENTS.md:
```markdown
## Test Commands

### Scan Form Test
`test-scan [url]` - Scan a job application form

### Fill Form Test  
`test-fill [url]` - Scan and generate answers without submitting

### Full Test
`test-apply [url]` - Complete flow but don't submit
```

### 4. First Real Application
1. Find a low-stakes company (not dream company)
2. Run through full flow with manual review
3. Check all fields filled correctly
4. Submit manually first time
5. Once confident, enable auto-submit

## Success Criteria

### Phase 2 Complete When:
- Scanner works on 3+ major ATS platforms
- Can fill a complete application via OpenClaw
- Successfully submitted 1 real application

### Phase 3 Complete When:
- Complex answers consistently rated "good" 
- Cover letters getting positive responses
- 80%+ fields filled correctly first try

### Phase 4 Complete When:
- <5% failure rate on applications
- Graceful handling of all error cases
- Can run unattended for hours

### Phase 5 Complete When:
- Applying to 50+ jobs/day if needed
- Clear metrics on what's working
- Integrated with your full workflow

## Risk Mitigation

1. **Start Small**: Test on companies you're less interested in
2. **Manual Review**: Always review dream company applications
3. **Rate Limits**: Max 10 applications/hour to avoid detection
4. **Unique Answers**: Sonnet generates unique text each time
5. **Profile Updates**: Keep resume current in system

## Debugging Checklist

When something fails:
1. Screenshot the page state
2. Check browser console for errors
3. Verify CDP connection still active
4. Check form scanner output
5. Validate generated answers
6. Try manual fill to isolate issue

## Command Reference

```bash
# Test scanner
openclaw run jobhunter test-scan "https://jobs.lever.co/stripe/123"

# Test full flow
openclaw run jobhunter test-apply "https://jobs.lever.co/stripe/123"  

# Run batch
openclaw run jobhunter apply-batch --max 5 --priority medium

# Check status
openclaw run jobhunter status

# View today's applications
openclaw run jobhunter list-applications --today
```

---

**Start with Phase 2!** Everything else builds on getting the browser integration working.