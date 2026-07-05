export const CoordinatorAgent = {
  async init({ candidate, mission, queryLLM, settings }) {
    const plannerSystemPrompt = settings.prompts.planner;

    const plannerPrompt = `Analyze candidate: ${candidate.candidate_name}
    Key Competencies: [${(candidate.core_competencies || []).join(', ')}]
    Technical Score: ${candidate.technical_score}/10
    Leadership Score: ${candidate.leadership_score}/10
    Job Fit Alignment Score: ${candidate.job_alignment_score || 0}/10
    
    Recruiting Mission: "${mission}"
    
    Formulate a customized list of steps executing specialized subtasks to fulfill the mission. 
    Select which tools each step needs.
    Available Tools:
    - cudf-cleaner: NVIDIA cuDF parallel string preprocessor. Run this first if the mission requires screening or formatting the text.
    - github-search: Simulated search matching repositories and issues for code check.
    - linkedin-sync: Work history timeline and title checks.
    - bq-warehouse: Syncing assessment metrics to BigQuery warehouse.

    Output format:
    A JSON object containing:
    {
      "steps": [
        {
          "stepId": 1,
          "agentName": "ScreenerAgent" | "VerificationAgent" | "InterviewerAgent" | "OutreachAgent",
          "title": "Title of step...",
          "description": "Short description of what the agent will do...",
          "requiresApproval": true | false,
          "targetTools": ["tool-name", ...]
        },
        ...
      ]
    }
    Make sure each step has a logical progression (e.g. ScreenerAgent -> VerificationAgent -> InterviewerAgent -> OutreachAgent). RequiresApproval should be true for steps like OutreachAgent or InterviewerAgent that generate content sent to candidates.`;

    const schema = {
      type: 'object',
      properties: {
        steps: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              stepId: { type: 'integer' },
              agentName: { type: 'string' },
              title: { type: 'string' },
              description: { type: 'string' },
              requiresApproval: { type: 'boolean' },
              targetTools: { type: 'array', items: { type: 'string' } }
            },
            required: ['stepId', 'agentName', 'title', 'description', 'requiresApproval', 'targetTools']
          }
        }
      },
      required: ['steps']
    };

    let plan = null;
    try {
      plan = await queryLLM({
        prompt: plannerPrompt,
        systemInstruction: plannerSystemPrompt,
        responseSchema: schema
      });
    } catch (llmError) {
      console.warn(`[CoordinatorAgent] LLM planning failed: ${llmError.message}. Using dynamic rule-based planning fallback.`);
      
      const steps = [];
      let stepCounter = 1;
      
      steps.push({
        stepId: stepCounter++,
        agentName: 'ScreenerAgent',
        title: 'Resume Screening & Competency Mapping',
        description: `Verify tech core alignment for "${mission}" and extract strengths/gaps.`,
        requiresApproval: false,
        targetTools: ['cudf-cleaner']
      });

      if (mission.toLowerCase().includes('verify') || mission.toLowerCase().includes('github') || mission.toLowerCase().includes('check') || mission.toLowerCase().includes('outreach') || mission.toLowerCase().includes('challenge') || mission.toLowerCase().includes('prep')) {
        steps.push({
          stepId: stepCounter++,
          agentName: 'VerificationAgent',
          title: 'Code & Profile Verification Sync',
          description: `Scan repositories and employment history matching competencies.`,
          requiresApproval: false,
          targetTools: ['github-search', 'linkedin-sync']
        });
      }

      if (mission.toLowerCase().includes('challenge') || mission.toLowerCase().includes('question') || mission.toLowerCase().includes('interview') || mission.toLowerCase().includes('prep') || mission.toLowerCase().includes('assessment') || mission.toLowerCase().includes('check') || mission.toLowerCase().includes('screen')) {
        steps.push({
          stepId: stepCounter++,
          agentName: 'InterviewerAgent',
          title: 'Targeted Challenge Creator',
          description: `Formulate advanced technical assessment challenges targeting gaps.`,
          requiresApproval: true,
          targetTools: []
        });
      }

      if (mission.toLowerCase().includes('outreach') || mission.toLowerCase().includes('email') || mission.toLowerCase().includes('contact') || mission.toLowerCase().includes('prep') || mission.toLowerCase().includes('screen')) {
        steps.push({
          stepId: stepCounter++,
          agentName: 'OutreachAgent',
          title: 'Personalized Outreach Draft',
          description: `Generate tailored recruiter outreach drafts based on candidate profile.`,
          requiresApproval: true,
          targetTools: ['bq-warehouse']
        });
      }

      plan = { steps };
    }

    return plan;
  }
};
