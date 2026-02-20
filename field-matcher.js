// Field Matcher - OpenClaw endpoint that uses LLMs to match form fields to profile data

const SIMPLE_FIELD_PATTERNS = {
  // Personal info - these can be matched with Haiku
  'first.?name|given.?name': 'personal.firstName',
  'last.?name|family.?name|surname': 'personal.lastName',
  'full.?name': 'personal.fullName',
  'e.?mail': 'personal.email',
  'phone|mobile|cell': 'personal.phone',
  'linkedin': 'personal.linkedIn',
  'github': 'personal.github',
  'portfolio|website|personal.?site': 'personal.portfolio',
  'city': 'personal.address.city',
  'state|province': 'personal.address.state',
  'zip|postal': 'personal.address.zip',
  'country': 'personal.address.country',
  
  // Authorization
  'work.?authorization|eligible.?to.?work|legally.?authorized': 'personal.authorization.usWorkAuthorization',
  'require.?sponsorship|need.?visa|visa.?sponsorship': 'personal.authorization.requiresVisa',
  'citizen|citizenship': 'personal.authorization.citizenship',
  
  // Education basics
  'school|university|college': 'education[0].school',
  'degree|education.?level': 'education[0].degree',
  'major|field.?of.?study': 'education[0].major',
  'gpa|grade.?point': 'education[0].gpa',
  'graduation.?year|expected.?graduation': 'education[0].graduationYear'
};

// Complex fields that need Sonnet
const COMPLEX_FIELD_PATTERNS = [
  'why.*interested.*position',
  'why.*company',
  'tell.*about.*yourself',
  'describe.*experience',
  'explain.*project',
  'challenging.*situation',
  'biggest.*achievement',
  'where.*see.*yourself',
  'diversity.*inclusion',
  'leadership.*example',
  'teamwork.*example',
  'technical.*challenge',
  'salary.*expectations',
  'additional.*information'
];

function isComplexField(label) {
  const lowerLabel = label.toLowerCase();
  return COMPLEX_FIELD_PATTERNS.some(pattern => new RegExp(pattern).test(lowerLabel));
}

function getSimpleMatch(label, profile) {
  const lowerLabel = label.toLowerCase();
  
  for (const [pattern, path] of Object.entries(SIMPLE_FIELD_PATTERNS)) {
    if (new RegExp(pattern, 'i').test(lowerLabel)) {
      // Navigate the path in profile object
      const value = path.split('.').reduce((obj, key) => {
        if (key.includes('[')) {
          const [arrName, index] = key.match(/(\w+)\[(\d+)\]/).slice(1);
          return obj[arrName]?.[parseInt(index)];
        }
        return obj?.[key];
      }, profile);
      
      return value;
    }
  }
  
  return null;
}

// Prompt templates for different field types
const PROMPT_TEMPLATES = {
  whyCompany: `Generate a compelling answer for why I want to work at {company}.
Context: {jobDescription}
My background: {relevantExperience}
Company info: {companyInfo}
Keep it under 200 words, authentic, and specific to the company.`,

  experience: `Describe my experience as {title} at {company}.
Focus on: {focusAreas}
Key achievements: {achievements}
Make it relevant to: {targetRole}
Keep it under 150 words.`,

  behavioral: `Answer this behavioral question: {question}
Use STAR method (Situation, Task, Action, Result).
Draw from my experience: {relevantExperience}
Make it specific and quantifiable.
Keep it under 200 words.`,

  technical: `Explain my technical skills relevant to: {requirement}
My skills: {relevantSkills}
Projects: {relevantProjects}
Be specific about technologies and impact.
Keep it under 150 words.`,

  diversity: `Write a diversity statement addressing: {prompt}
Background: First-generation college student, CS + Business minor
Focus on unique perspectives and inclusive practices.
Keep it authentic and under 150 words.`
};

// Main matching function
async function matchFieldsToProfile(formData, profile, jobContext = {}) {
  const matches = {
    simple: {},      // Haiku can handle these
    complex: {},     // Sonnet needed
    files: {},       // File uploads
    unmatched: []    // Fields we couldn't match
  };

  for (const field of formData.fields) {
    const { label, type, options, required } = field;

    // Handle file uploads
    if (type === 'file') {
      if (label.toLowerCase().includes('resume')) {
        matches.files[label] = profile.documents.resume;
      } else if (label.toLowerCase().includes('cover')) {
        matches.files[label] = profile.documents.coverLetter;
      } else if (label.toLowerCase().includes('transcript')) {
        matches.files[label] = profile.documents.transcripts;
      }
      continue;
    }

    // Try simple pattern matching first
    const simpleMatch = getSimpleMatch(label, profile);
    if (simpleMatch !== null) {
      // For select/radio, need to match to available options
      if (options && options.length > 0) {
        const matchedOption = matchToOptions(simpleMatch, options);
        matches.simple[label] = matchedOption || simpleMatch;
      } else {
        matches.simple[label] = simpleMatch;
      }
      continue;
    }

    // Check if it's a complex field needing LLM
    if (isComplexField(label) || type === 'textarea') {
      matches.complex[label] = {
        type: detectQuestionType(label),
        required: required,
        context: {
          jobTitle: jobContext.title || '',
          company: jobContext.company || '',
          description: jobContext.description || ''
        }
      };
      continue;
    }

    // Couldn't match - add to unmatched for manual review
    matches.unmatched.push({
      label: label,
      type: type,
      options: options,
      required: required
    });
  }

  return matches;
}

function matchToOptions(value, options) {
  // Convert value to string for comparison
  const valueStr = String(value).toLowerCase();
  
  // Try exact match first
  for (const opt of options) {
    if (opt.text.toLowerCase() === valueStr || opt.value.toLowerCase() === valueStr) {
      return opt.text;
    }
  }
  
  // Try partial match
  for (const opt of options) {
    if (opt.text.toLowerCase().includes(valueStr) || valueStr.includes(opt.text.toLowerCase())) {
      return opt.text;
    }
  }
  
  // Special cases
  if (valueStr === 'true' || valueStr === 'yes') {
    const yesOption = options.find(opt => /yes|true/i.test(opt.text));
    if (yesOption) return yesOption.text;
  }
  
  if (valueStr === 'false' || valueStr === 'no') {
    const noOption = options.find(opt => /no|false/i.test(opt.text));
    if (noOption) return noOption.text;
  }
  
  return null;
}

function detectQuestionType(label) {
  const lower = label.toLowerCase();
  
  if (/why.*company|why.*interested|why.*position/i.test(lower)) return 'whyCompany';
  if (/experience|background|qualification/i.test(lower)) return 'experience';
  if (/challenge|difficult|overcome|conflict|failure/i.test(lower)) return 'behavioral';
  if (/technical|project|implementation|design/i.test(lower)) return 'technical';
  if (/diversity|inclusion|unique|perspective/i.test(lower)) return 'diversity';
  
  return 'general';
}

// Export for use in OpenClaw
module.exports = {
  matchFieldsToProfile,
  isComplexField,
  PROMPT_TEMPLATES
};