// Test script to verify form scanner works on common ATS platforms
// Run this via browser console or OpenClaw browser tool

async function testFormScanner() {
  console.log('=== Form Scanner Test ===');
  
  // Test URLs for different ATS platforms
  const testUrls = {
    greenhouse: 'https://boards.greenhouse.io/demo/jobs/4008774002',
    lever: 'https://jobs.lever.co/leverdemo/5ac21346-8e0c-4494-8b46-0d3b2d6ecaac',
    workday: 'https://adobe.wd5.myworkdayjobs.com/en-US/external_experienced/job/San-Jose/Software-Engineer_R12345'
  };
  
  // Load form scanner
  const scannerScript = await fetch('/job-automation/form-scanner.js').then(r => r.text());
  
  // Test on current page
  console.log('Testing on:', window.location.href);
  
  try {
    // Execute scanner
    const formData = eval(scannerScript);
    
    console.log('Form scan results:');
    console.log('- Total fields:', formData.totalFields);
    console.log('- Personal fields:', formData.sections.personal.length);
    console.log('- Education fields:', formData.sections.education.length);
    console.log('- Experience fields:', formData.sections.experience.length);
    console.log('- Question fields:', formData.sections.questions.length);
    console.log('- Has file upload:', formData.hasFileUpload);
    
    // Show sample fields
    console.log('\nSample fields:');
    formData.fields.slice(0, 5).forEach(field => {
      console.log(`- ${field.label} (${field.type}${field.required ? ', required' : ''})`);
    });
    
    // Show complex questions
    if (formData.sections.questions.length > 0) {
      console.log('\nComplex questions found:');
      formData.sections.questions.forEach(q => {
        console.log(`- ${q.label} (${q.type})`);
      });
    }
    
    // Test field categorization
    console.log('\nField categorization test:');
    const testLabels = [
      'First Name',
      'Email Address',
      'Why do you want to work here?',
      'University Name',
      'Previous Company',
      'Years of Experience'
    ];
    
    testLabels.forEach(label => {
      const category = categorizeField(label, 'text');
      console.log(`- "${label}" → ${category}`);
    });
    
    return formData;
    
  } catch (error) {
    console.error('Scanner error:', error);
    return null;
  }
}

// Helper function from scanner (for testing categorization)
function categorizeField(label, type) {
  const lowerLabel = label.toLowerCase();
  
  if (/first.?name|given.?name/i.test(label)) return 'personal';
  if (/last.?name|family.?name|surname/i.test(label)) return 'personal';
  if (/email|e-mail/i.test(label)) return 'personal';
  if (/phone|mobile|cell/i.test(label)) return 'personal';
  
  if (/school|university|college|education|degree|major|gpa|graduation/i.test(label)) return 'education';
  
  if (/company|employer|position|title|experience|work|job/i.test(label)) return 'experience';
  
  if (/why|describe|explain|tell us|how would|what would/i.test(label)) return 'questions';
  if (type === 'textarea' && label.length > 30) return 'questions';
  
  return 'other';
}

// Auto-run if in browser
if (typeof window !== 'undefined') {
  testFormScanner().then(result => {
    if (result) {
      console.log('\n✅ Form scanner test complete!');
      console.log('Full results:', result);
    }
  });
}