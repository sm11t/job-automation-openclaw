# 🧪 Test the Job Automation System RIGHT NOW

## Step 1: Verify Chrome CDP is Running

```bash
# First, check if Chrome is already running with CDP
curl http://127.0.0.1:9222/json/version
```

If it returns an error, start Chrome:
```bash
/Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome \
  --remote-debugging-port=9222 \
  --user-data-dir="/Users/sm1t/.chrome-jobhunter" &
```

## Step 2: Navigate to a Job Page

From this session (main agent):

```javascript
// List available tabs
browser({ action: "tabs", profile: "chrome" })

// Navigate to a Lever job page (common ATS)
browser({ 
  action: "open", 
  profile: "chrome",
  targetUrl: "https://jobs.lever.co/figma/24eb9d57-80e5-4449-bd7f-5a15d4919929"
})
```

## Step 3: Test Form Scanner

```javascript
// Read the scanner script
const scannerCode = Read("job-automation/form-scanner.js")

// Execute scanner on the page
const formData = browser({
  action: "act",
  profile: "chrome", 
  request: {
    kind: "evaluate",
    fn: scannerCode
  }
})

// Check results
console.log("Found", formData.totalFields, "fields")
console.log("Sections:", Object.keys(formData.sections))
```

## Step 4: Generate Test Answers

```javascript
// Create test context
const testContext = {
  company: "Figma",
  title: "Software Engineer",
  description: "Building the future of design tools..."
}

// For now, manually create answer mapping
const mockAnswers = {
  "First Name": "Asmit",
  "Last Name": "Datta", 
  "Email": "asmit77@icloud.com",
  "Phone": "480-857-9392",
  "Resume": "manual-upload-needed",
  "LinkedIn URL": "https://linkedin.com/in/asmitrajeet/",
  "How did you hear about this job?": "Jobright.ai job board"
}
```

## Step 5: Test Form Filling

```javascript
// Read filler script
const fillerCode = Read("job-automation/form-filler.js")

// Prepare field matches from scan + answers
const fieldMatches = {}
formData.fields.forEach(field => {
  if (mockAnswers[field.label]) {
    fieldMatches[field.label] = {
      selector: field.selector,
      value: mockAnswers[field.label],
      type: field.type
    }
  }
})

// Fill the form (but don't submit!)
const fillResult = browser({
  action: "act",
  profile: "chrome",
  request: {
    kind: "evaluate", 
    fn: `
      ${fillerCode}
      fillApplicationForm(${JSON.stringify(fieldMatches)})
    `
  }
})

console.log("Fill result:", fillResult)
```

## Step 6: Take Screenshot to Verify

```javascript
// Screenshot the filled form
browser({
  action: "screenshot",
  profile: "chrome",
  type: "png"
})
```

## Expected Results

You should see:
1. **Form Scanner**: Detects 10-20 fields including name, email, resume upload
2. **Field Matching**: Maps your profile data to form fields
3. **Form Filling**: Fills basic fields (not file uploads)
4. **Screenshot**: Shows partially completed form

## Common Issues & Fixes

### Issue: "Cannot read property 'querySelector' of null"
**Fix**: Make sure you're on an actual application form page, not job listing

### Issue: Forms not filling
**Fix**: The page might use React. Check if our `setNativeValue` is working:
```javascript
browser({
  action: "act",
  request: {
    kind: "evaluate",
    fn: `
      const input = document.querySelector('input[type="text"]');
      input.value = "Test";
      input.dispatchEvent(new Event('input', { bubbles: true }));
    `
  }
})
```

### Issue: CDP connection lost
**Fix**: Restart Chrome with the CDP flags

## Full Test Run

Once the above works, spawn jobhunter for a real test:

```bash
# From main agent
subagent spawn jobhunter "Test job automation on Figma Software Engineer role at https://jobs.lever.co/figma/24eb9d57-80e5-4449-bd7f-5a15d4919929"
```

## What Success Looks Like

1. ✅ Scanner finds all form fields
2. ✅ Basic fields (name, email) fill correctly
3. ✅ Complex fields identified for LLM generation
4. ✅ Form looks ready to submit (except uploads)
5. ✅ No console errors

## Next: Real Application

Once this works:
1. Navigate to Jobright.ai
2. Find a lower-priority job
3. Click through to external application  
4. Run the full automation
5. Review before submitting

---

**Remember**: Start with view-only tests. Don't submit until you've verified everything works!