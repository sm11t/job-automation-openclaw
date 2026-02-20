#!/usr/bin/env python3
"""
Job Application Orchestrator
Main script that coordinates the entire job application process
"""

import json
import asyncio
import logging
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Optional, Any
import sys

# Set up logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

class JobApplicationOrchestrator:
    def __init__(self, openclaw_api_url: str = "http://localhost:8080"):
        self.api_url = openclaw_api_url
        self.workspace = Path.home() / ".openclaw" / "workspace"
        self.job_automation_dir = self.workspace / "job-automation"
        self.applications_log = self.job_automation_dir / "applications.json"
        self.profile_path = self.job_automation_dir / "user-profile.json"
        
        # Load user profile
        with open(self.profile_path) as f:
            self.user_profile = json.load(f)
        
        # Load application history
        self.applied_jobs = self._load_applied_jobs()
        
        # Scripts
        self.form_scanner_js = (self.job_automation_dir / "form-scanner.js").read_text()
        self.form_filler_js = (self.job_automation_dir / "form-filler.js").read_text()
        
    def _load_applied_jobs(self) -> Dict[str, Any]:
        """Load previously applied jobs to avoid duplicates"""
        if self.applications_log.exists():
            with open(self.applications_log) as f:
                return json.load(f)
        return {"applications": []}
    
    async def discover_jobs(self, page: int = 1, filters: Optional[Dict] = None) -> List[Dict]:
        """Discover jobs from Jobright using browser automation"""
        logger.info(f"Discovering jobs on page {page}")
        
        # Navigate to Jobright
        discover_script = """
        // Navigate to Jobright job recommendations
        const url = 'https://jobright.ai/jobs/recommend';
        const jobs = [];
        
        // Wait for job cards to load
        await new Promise(r => setTimeout(r, 3000));
        
        // Extract job listings
        const jobCards = document.querySelectorAll('[data-testid="job-card"], .job-card, [class*="JobCard"]');
        
        jobCards.forEach((card, index) => {
            if (index >= 10) return; // Limit to 10 jobs per page
            
            const titleEl = card.querySelector('h2, h3, [class*="title"]');
            const companyEl = card.querySelector('[class*="company"], [data-testid="company-name"]');
            const locationEl = card.querySelector('[class*="location"]');
            const matchEl = card.querySelector('[class*="match"], [class*="score"]');
            const linkEl = card.querySelector('a[href*="/jobs/"]');
            
            if (titleEl && companyEl) {
                jobs.push({
                    title: titleEl.textContent.trim(),
                    company: companyEl.textContent.trim(),
                    location: locationEl?.textContent.trim() || 'Remote',
                    matchScore: matchEl?.textContent.trim() || '0%',
                    jobId: linkEl?.href.split('/').pop() || '',
                    url: linkEl?.href || ''
                });
            }
        });
        
        return jobs;
        """
        
        # This would call OpenClaw browser API
        # For now, return mock data
        return [
            {
                "title": "Software Engineer - New Grad",
                "company": "Stripe",
                "location": "San Francisco, CA",
                "matchScore": "95%",
                "jobId": "stripe-123",
                "url": "https://jobright.ai/jobs/stripe-123"
            }
        ]
    
    async def analyze_job_fit(self, job: Dict) -> Dict:
        """Use Haiku to analyze if job is good fit"""
        prompt = f"""
        Analyze if this job is a good fit for the candidate:
        
        Job: {job['title']} at {job['company']}
        Location: {job['location']}
        Match Score: {job['matchScore']}
        
        Candidate Profile:
        - Education: {self.user_profile['education'][0]['degree']} in {self.user_profile['education'][0]['major']}
        - Experience Level: New Grad / Entry Level
        - Preferred Roles: {', '.join(self.user_profile['preferences']['targetRoles'])}
        - Dream Companies: {', '.join(self.user_profile['preferences']['targetCompanies']['dream'])}
        
        Return JSON:
        {{
            "shouldApply": true/false,
            "priority": "high/medium/low",
            "reasoning": "brief explanation",
            "requiredCustomization": ["cover letter", "additional questions"]
        }}
        """
        
        # This would call Haiku via OpenClaw API
        return {
            "shouldApply": True,
            "priority": "high" if job['company'] in self.user_profile['preferences']['targetCompanies']['dream'] else "medium",
            "reasoning": "Strong match with background and preferences",
            "requiredCustomization": ["cover letter"] if job['company'] in self.user_profile['preferences']['targetCompanies']['dream'] else []
        }
    
    async def extract_job_details(self, job_url: str) -> Dict:
        """Navigate to job page and extract full details"""
        logger.info(f"Extracting details from {job_url}")
        
        extract_script = """
        // Extract job description and application URL
        const jd = document.querySelector('[class*="description"], [data-testid="job-description"]');
        const applyBtn = document.querySelector('a[href*="greenhouse.io"], a[href*="lever.co"], a[href*="workday.com"], [class*="apply"]');
        
        return {
            description: jd?.textContent.trim() || '',
            externalUrl: applyBtn?.href || '',
            requirements: extractRequirements(jd?.textContent || ''),
            atsType: detectATS(applyBtn?.href || '')
        };
        
        function extractRequirements(text) {
            const reqSection = text.match(/requirements:?(.+?)(?=qualifications|responsibilities|$)/is);
            return reqSection ? reqSection[1].trim() : '';
        }
        
        function detectATS(url) {
            if (url.includes('greenhouse.io')) return 'greenhouse';
            if (url.includes('lever.co')) return 'lever';
            if (url.includes('workday.com')) return 'workday';
            return 'unknown';
        }
        """
        
        # This would execute via browser API
        return {
            "description": "We're looking for a talented engineer...",
            "externalUrl": "https://stripe.com/jobs/apply/123",
            "requirements": "BS in Computer Science, strong Python skills",
            "atsType": "greenhouse"
        }
    
    async def scan_application_form(self, url: str) -> Dict:
        """Navigate to application page and scan form structure"""
        logger.info(f"Scanning application form at {url}")
        
        # This would inject and execute form-scanner.js via browser API
        return {
            "url": url,
            "domain": "stripe.com",
            "fields": [
                {"label": "First Name", "type": "text", "selector": "#first_name"},
                {"label": "Email", "type": "email", "selector": "#email"},
                {"label": "Why do you want to work at Stripe?", "type": "textarea", "selector": "#why_stripe"}
            ],
            "sections": {
                "personal": [...],
                "questions": [...]
            }
        }
    
    async def generate_answers(self, form_data: Dict, job_context: Dict) -> Dict:
        """Generate answers for form fields using appropriate LLM"""
        from job_automation.field_matcher import matchFieldsToProfile
        
        # First, match fields to profile data
        matches = await matchFieldsToProfile(form_data, self.user_profile, job_context)
        
        # Generate complex answers with Sonnet
        for field_label, field_info in matches['complex'].items():
            if field_info['type'] == 'whyCompany':
                answer = await self._generate_why_company(
                    company=job_context['company'],
                    job_title=job_context['title'],
                    description=job_context['description']
                )
                matches['complex'][field_label] = answer
        
        return matches
    
    async def _generate_why_company(self, company: str, job_title: str, description: str) -> str:
        """Generate compelling 'Why Company' answer using Sonnet"""
        prompt = f"""
        Write a compelling answer for why I want to work at {company} as a {job_title}.
        
        My Background:
        - {self.user_profile['education'][0]['degree']} in {self.user_profile['education'][0]['major']} at ASU (graduating May 2026)
        - Internship experience in ML/AI and distributed systems
        - Strong skills in {', '.join(self.user_profile['skills']['languages'][:3])}
        
        Job Description excerpt:
        {description[:500]}
        
        Requirements:
        - Be specific about {company}'s work and culture
        - Connect my experience to their needs
        - Show genuine enthusiasm
        - Keep under 200 words
        - Use natural, conversational tone
        """
        
        # This would call Sonnet via OpenClaw
        return f"I'm excited about {company} because..."
    
    async def fill_and_submit(self, form_data: Dict, answers: Dict) -> Dict:
        """Fill form with answers and submit"""
        logger.info("Filling application form")
        
        # Prepare field matches for form filler
        field_matches = {}
        
        # Combine simple and complex answers
        all_answers = {**answers.get('simple', {}), **answers.get('complex', {})}
        
        for field in form_data['fields']:
            if field['label'] in all_answers:
                field_matches[field['label']] = {
                    'selector': field['selector'],
                    'value': all_answers[field['label']],
                    'type': field['type']
                }
        
        # This would inject and execute form-filler.js via browser API
        fill_script = f"""
        const fieldMatches = {json.dumps(field_matches)};
        const result = await fillApplicationForm(fieldMatches);
        return result;
        """
        
        result = {
            "success": True,
            "filledCount": len(field_matches),
            "totalFields": len(form_data['fields']),
            "errors": []
        }
        
        # Log application
        self._log_application(form_data['url'], form_data['domain'], answers, result)
        
        return result
    
    def _log_application(self, url: str, company: str, answers: Dict, result: Dict):
        """Log application details for tracking"""
        application = {
            "timestamp": datetime.now().isoformat(),
            "url": url,
            "company": company,
            "result": result,
            "answers_preview": {k: v[:100] + "..." if len(str(v)) > 100 else v 
                             for k, v in list(answers.get('complex', {}).items())[:3]}
        }
        
        self.applied_jobs['applications'].append(application)
        
        with open(self.applications_log, 'w') as f:
            json.dump(self.applied_jobs, f, indent=2)
    
    async def apply_to_job(self, job: Dict) -> Dict:
        """Complete end-to-end application process for a single job"""
        logger.info(f"Starting application for {job['title']} at {job['company']}")
        
        # Check if already applied
        if any(app['url'] == job['url'] for app in self.applied_jobs['applications']):
            logger.info("Already applied to this job, skipping")
            return {"status": "skipped", "reason": "duplicate"}
        
        # 1. Analyze fit
        fit_analysis = await self.analyze_job_fit(job)
        if not fit_analysis['shouldApply']:
            return {"status": "skipped", "reason": fit_analysis['reasoning']}
        
        # 2. Get job details
        job_details = await self.extract_job_details(job['url'])
        job_context = {
            "title": job['title'],
            "company": job['company'],
            "description": job_details['description']
        }
        
        # 3. Navigate to external application
        if not job_details['externalUrl']:
            return {"status": "error", "reason": "No external application URL found"}
        
        # 4. Scan form
        form_data = await self.scan_application_form(job_details['externalUrl'])
        
        # 5. Generate answers
        answers = await self.generate_answers(form_data, job_context)
        
        # 6. Fill and submit
        result = await self.fill_and_submit(form_data, answers)
        
        return {
            "status": "success" if result['success'] else "error",
            "details": result
        }
    
    async def run_batch(self, max_applications: int = 5):
        """Run batch of job applications"""
        logger.info(f"Starting batch run for up to {max_applications} applications")
        
        applied_count = 0
        page = 1
        
        while applied_count < max_applications and page <= 3:
            # Discover jobs
            jobs = await self.discover_jobs(page=page)
            
            for job in jobs:
                if applied_count >= max_applications:
                    break
                
                try:
                    result = await self.apply_to_job(job)
                    if result['status'] == 'success':
                        applied_count += 1
                        logger.info(f"Successfully applied to {job['company']} ({applied_count}/{max_applications})")
                    else:
                        logger.info(f"Skipped {job['company']}: {result.get('reason', 'unknown')}")
                    
                    # Rate limiting
                    await asyncio.sleep(30)  # 30 seconds between applications
                    
                except Exception as e:
                    logger.error(f"Error applying to {job['company']}: {str(e)}")
                    continue
            
            page += 1
        
        logger.info(f"Batch complete. Applied to {applied_count} jobs")
        return {"applied_count": applied_count}


# CLI interface
async def main():
    import argparse
    
    parser = argparse.ArgumentParser(description="Job Application Automation")
    parser.add_argument('--max', type=int, default=5, help='Maximum applications per run')
    parser.add_argument('--test', action='store_true', help='Test mode - scan only, no submit')
    
    args = parser.parse_args()
    
    orchestrator = JobApplicationOrchestrator()
    
    if args.test:
        # Test mode - just scan a form
        test_url = "https://jobs.lever.co/stripe/abc123"
        form_data = await orchestrator.scan_application_form(test_url)
        print(json.dumps(form_data, indent=2))
    else:
        # Run batch applications
        result = await orchestrator.run_batch(max_applications=args.max)
        print(f"Completed: {result}")


if __name__ == "__main__":
    asyncio.run(main())